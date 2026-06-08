/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order, Product, Customer } from '../types';

// Format currency
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Format date short
export const formatDateString = (isoString: string) => {
  const d = new Date(isoString);
  return d.toLocaleDateString('pt-BR');
};

// Format date detailed
export const formatDateTimeString = (isoString: string) => {
  const d = new Date(isoString);
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }) + ' - ' + d.toLocaleDateString('pt-BR');
};

// Parse date to YYYY-MM-DD
export const toLocalDateInputString = (isoString: string) => {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get name of status
export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'aguardando_aprovacao':
      return 'Em Análise';
    case 'planejado':
      return 'Aceito';
    case 'em_producao':
      return 'Em Preparo';
    case 'em_entrega':
      return 'Saiu para Entrega';
    case 'concluido':
      return 'Entregue';
    case 'cancelado':
      return 'Cancelado';
    default:
      return status;
  }
};

// Get status styling classes for Tailwind
export const getStatusBadgeStyles = (status: string) => {
  switch (status) {
    case 'aguardando_aprovacao':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'planejado':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'em_producao':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'em_entrega':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'concluido':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'cancelado':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Main Stats engine
export interface AppStats {
  orders: {
    total: number;
    pending: number; // awaiting approval
    approved: number; // planned + in production + in delivery
    completed: number;
    canceled: number;
  };
  billing: {
    planned: number; // planejado + em_producao + em_entrega
    realized: number; // concluido
    monthly: number; // current month (June 2026 in seeded timeline)
    annual: number; // 2026 total realized
  };
  products: {
    bestSeller: { name: string; quantity: number } | null;
    mostRequested: { name: string; count: number } | null;
    ranking: { id: string; name: string; quantity: number; revenue: number; orderCount: number }[];
  };
  customers: {
    activeCount: number;
    topBuyers: { id: string; name: string; email: string; orderCount: number; totalSpent: number }[];
  };
}

export const calculateDashboardStats = (orders: Order[], customers: Customer[], products: Product[]): AppStats => {
  const currentYear = 2026;
  const currentMonth = 5; // June (0-indexed represents June in our target dates)

  // 1. Order Counts
  const total = orders.length;
  const pending = orders.filter(o => o.status === 'aguardando_aprovacao').length;
  const approved = orders.filter(o => ['planejado', 'em_producao', 'em_entrega'].includes(o.status)).length;
  const completed = orders.filter(o => o.status === 'concluido').length;
  const canceled = orders.filter(o => o.status === 'cancelado').length;

  // 2. Billing calculations
  let planned = 0;
  let realized = 0;
  let monthly = 0;
  let annual = 0;

  orders.forEach(o => {
    const oDate = new Date(o.createdAt);
    const orderYear = oDate.getUTCFullYear();
    const orderMonth = oDate.getUTCMonth();

    if (['planejado', 'em_producao', 'em_entrega'].includes(o.status)) {
      planned += o.total;
    } else if (o.status === 'concluido') {
      realized += o.total;
      
      // Annual (2026)
      if (orderYear === currentYear) {
        annual += o.total;
      }
      
      // Monthly (June 2026)
      if (orderYear === currentYear && orderMonth === currentMonth) {
        monthly += o.total;
      }
    }
  });

  // 3. Products metrics
  const productStatsMap: Record<string, { name: string; quantity: number; revenue: number; orderCount: number }> = {};
  
  // Seed with all known products to keep list complete
  products.forEach(p => {
    productStatsMap[p.id] = { name: p.name, quantity: 0, revenue: 0, orderCount: 0 };
  });

  orders.forEach(o => {
    // Only compile stats from non-cancelled orders for accurate sales demand,
    // and finalized stats specifically if looking at realized stats.
    // The requirement says:
    // "Produto mais vendido (volume), mais solicitado (frequencia de pedidos), quantidade vendida, ranking."
    // Let's include all non-cancelled orders to showcase full microgreens demand
    if (o.status !== 'cancelado') {
      o.items.forEach(item => {
        if (!productStatsMap[item.productId]) {
          productStatsMap[item.productId] = { name: item.productName, quantity: 0, revenue: 0, orderCount: 0 };
        }
        productStatsMap[item.productId].quantity += item.quantity;
        // if completed, add to physical faturamento realized
        productStatsMap[item.productId].revenue += item.subtotal;
        productStatsMap[item.productId].orderCount += 1;
      });
    }
  });

  const productRanking = Object.entries(productStatsMap).map(([id, data]) => ({
    id,
    ...data
  })).sort((a, b) => b.quantity - a.quantity);

  const bestSeller = productRanking.length > 0 && productRanking[0].quantity > 0 
    ? { name: productRanking[0].name, quantity: productRanking[0].quantity } 
    : null;

  const productRankedByRequest = [...productRanking].sort((a, b) => b.orderCount - a.orderCount);
  const mostRequested = productRankedByRequest.length > 0 && productRankedByRequest[0].orderCount > 0
    ? { name: productRankedByRequest[0].name, count: productRankedByRequest[0].orderCount }
    : null;

  // 4. Customers metrics
  const customerStatsMap: Record<string, { name: string; email: string; orderCount: number; totalSpent: number }> = {};
  
  customers.forEach(c => {
    customerStatsMap[c.id] = { name: c.name, email: c.email, orderCount: 0, totalSpent: 0 };
  });

  orders.forEach(o => {
    if (o.status === 'concluido') {
      if (!customerStatsMap[o.customerId]) {
        customerStatsMap[o.customerId] = { name: o.customerName, email: o.customerEmail, orderCount: 0, totalSpent: 0 };
      }
      customerStatsMap[o.customerId].orderCount += 1;
      customerStatsMap[o.customerId].totalSpent += o.total;
    }
  });

  const activeCustIds = new Set(orders.map(o => o.customerId));
  const activeCount = activeCustIds.size;

  const topBuyers = Object.entries(customerStatsMap).map(([id, data]) => ({
    id,
    ...data
  })).sort((a, b) => b.totalSpent - a.totalSpent);

  return {
    orders: { total, pending, approved, completed, canceled },
    billing: { planned, realized, monthly, annual },
    products: { bestSeller, mostRequested, ranking: productRanking },
    customers: { activeCount, topBuyers }
  };
};

// Filter engine for Relatórios Gerenciais
export interface ReportFilter {
  startDate: string;
  endDate: string;
  productId: string;
  customerId: string;
}

export const generateReportData = (
  orders: Order[],
  products: Product[],
  customers: Customer[],
  filter: ReportFilter
) => {
  // Filter core orders
  const filteredOrders = orders.filter(o => {
    const orderDateStr = toLocalDateInputString(o.createdAt);
    
    // Date filter
    if (filter.startDate && orderDateStr < filter.startDate) return false;
    if (filter.endDate && orderDateStr > filter.endDate) return false;
    
    // Customer filter
    if (filter.customerId && o.customerId !== filter.customerId) return false;
    
    // Product filter
    if (filter.productId) {
      const hasProduct = o.items.some(item => item.productId === filter.productId);
      if (!hasProduct) return false;
    }

    return true;
  });

  // 1. Relatório de Vendas
  // Total qty of units sold (within non-cancelled)
  let totalQtySold = 0;
  let totalValueSold = 0;
  const completedOrders = filteredOrders.filter(o => o.status === 'concluido');
  
  // Non-cancelled for demand, completed for invoicing
  filteredOrders.forEach(o => {
    if (o.status !== 'cancelado') {
      o.items.forEach(itm => {
        // If product filter is set, only sum that specific product
        if (!filter.productId || itm.productId === filter.productId) {
          totalQtySold += itm.quantity || 0;
        }
      });
    }
  });

  completedOrders.forEach(o => {
    if (filter.productId) {
      // Sum only the subtotal of that product
      o.items.forEach(itm => {
        if (itm.productId === filter.productId) {
          const itemSubtotal = typeof itm.subtotal === 'number' ? itm.subtotal : (itm.pricePerWeight * itm.quantity) || 0;
          totalValueSold += itemSubtotal;
        }
      });
    } else {
      totalValueSold += o.total || 0;
    }
  });

  const ticketMedio = completedOrders.length > 0 ? (totalValueSold / completedOrders.length) : 0;

  // 2. Relatório de Produtos
  const productSalesMap: Record<string, { id: string; name: string; quantity: number; revenue: number; totalGrams: number }> = {};
  products.forEach(p => {
    productSalesMap[p.id] = { id: p.id, name: p.name, quantity: 0, revenue: 0, totalGrams: 0 };
  });

  filteredOrders.forEach(o => {
    if (o.status !== 'cancelado') {
      o.items.forEach(itm => {
        if (!productSalesMap[itm.productId]) {
          productSalesMap[itm.productId] = { id: Math.random().toString(), name: itm.productName, quantity: 0, revenue: 0, totalGrams: 0 };
          // If the product is found in original products, use its actual ID
          const matchedProd = products.find(p => p.name === itm.productName || p.id === itm.productId);
          if (matchedProd) {
            productSalesMap[itm.productId].id = matchedProd.id;
          }
        }
        productSalesMap[itm.productId].quantity += itm.quantity || 0;
        const itmWeight = Number(itm.weight || 20);
        const itmUnit = itm.unit || 'g';
        const weightInGrams = itmUnit === 'kg' ? itmWeight * 1000 : itmWeight;
        productSalesMap[itm.productId].totalGrams += (weightInGrams || 0) * (itm.quantity || 0);

        if (o.status === 'concluido') {
          const itemSubtotal = typeof itm.subtotal === 'number' ? itm.subtotal : (itm.pricePerWeight * itm.quantity) || 0;
          productSalesMap[itm.productId].revenue += itemSubtotal;
        }
      });
    }
  });

  const rankedProducts = Object.values(productSalesMap).sort((a, b) => b.quantity - a.quantity);
  const mostSoldProducts = rankedProducts.filter(p => p.quantity > 0 || p.totalGrams > 0);
  const leastSoldProducts = [...rankedProducts].reverse();

  // 3. Relatório de Clientes
  const customerSalesMap: Record<string, { name: string; orderCount: number; spend: number }> = {};
  customers.forEach(c => {
    customerSalesMap[c.id] = { name: c.name, orderCount: 0, spend: 0 };
  });

  filteredOrders.forEach(o => {
    if (!customerSalesMap[o.customerId]) {
      customerSalesMap[o.customerId] = { name: o.customerName, orderCount: 0, spend: 0 };
    }
    customerSalesMap[o.customerId].orderCount += 1;
    if (o.status === 'concluido') {
      customerSalesMap[o.customerId].spend += o.total;
    }
  });

  const rankedCustomers = Object.entries(customerSalesMap).map(([id, data]) => ({
    id,
    ...data
  })).sort((a, b) => b.spend - a.spend);

  // 4. Relatório Temporal
  const dayStats: Record<string, { dateStr: string; orderCount: number; totalRevenue: number }> = {};
  const weekStats: Record<string, { weekLabel: string; orderCount: number; totalRevenue: number }> = {};
  const monthStats: Record<string, { monthLabel: string; orderCount: number; totalRevenue: number }> = {};

  filteredOrders.forEach(o => {
    const oDate = new Date(o.createdAt);
    
    // Day
    const dayStr = toLocalDateInputString(o.createdAt);
    if (!dayStats[dayStr]) {
      dayStats[dayStr] = { dateStr: formatDateString(o.createdAt), orderCount: 0, totalRevenue: 0 };
    }
    dayStats[dayStr].orderCount += 1;
    if (o.status === 'concluido') {
      dayStats[dayStr].totalRevenue += o.total;
    }

    // Month
    const monthIndex = oDate.getUTCMonth();
    const year = oDate.getUTCFullYear();
    const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const monthLabel = `${monthsNames[monthIndex]}/${String(year).slice(-2)}`;
    
    if (!monthStats[monthKey]) {
      monthStats[monthKey] = { monthLabel, orderCount: 0, totalRevenue: 0 };
    }
    monthStats[monthKey].orderCount += 1;
    if (o.status === 'concluido') {
      monthStats[monthKey].totalRevenue += o.total;
    }

    // Week (Custom grouped using start of week)
    const startOfWeek = new Date(oDate);
    const dayNum = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayNum); // Sunday
    const weekKey = toLocalDateInputString(startOfWeek.toISOString());
    const weekLabel = `Semana ${formatDateString(startOfWeek.toISOString())}`;

    if (!weekStats[weekKey]) {
      weekStats[weekKey] = { weekLabel, orderCount: 0, totalRevenue: 0 };
    }
    weekStats[weekKey].orderCount += 1;
    if (o.status === 'concluido') {
      weekStats[weekKey].totalRevenue += o.total;
    }
  });

  const dailyRanking = Object.values(dayStats).sort((a, b) => b.totalRevenue - a.totalRevenue);
  const weeklyRanking = Object.values(weekStats).sort((a, b) => b.totalRevenue - a.totalRevenue);
  const monthlyRanking = Object.values(monthStats).sort((a, b) => a.monthLabel.localeCompare(b.monthLabel)); // sorted chronologically

  return {
    filteredOrders,
    summary: {
      totalQtySold,
      totalValueSold,
      ticketMedio,
      ordersCount: filteredOrders.length,
      completedCount: completedOrders.length
    },
    products: {
      mostSold: mostSoldProducts,
      leastSold: leastSoldProducts
    },
    customers: {
      ranked: rankedCustomers
    },
    temporal: {
      daily: Object.values(dayStats).sort((a, b) => a.dateStr.localeCompare(b.dateStr)),
      weekly: Object.values(weekStats),
      monthly: monthlyRanking,
      bestDay: dailyRanking.length > 0 ? dailyRanking[0] : null,
      worstDay: dailyRanking.length > 0 ? dailyRanking[dailyRanking.length - 1] : null
    }
  };
};

// Hardcoded default image generation to keep layout fully complete and modern
export const getMicrogreensPlaceholder = (productId: string) => {
  switch (productId) {
    case 'prod_1':
      return 'https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&q=80&w=400';
    case 'prod_2':
      return 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400';
    case 'prod_3':
      return 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&q=80&w=400';
    case 'prod_4':
      return 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&q=80&w=400';
    case 'prod_5':
      return 'https://images.unsplash.com/photo-1588691535490-6ecf56a64b97?auto=format&fit=crop&q=80&w=400';
    case 'prod_6':
      return 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?auto=format&fit=crop&q=80&w=400';
    default:
      return 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?auto=format&fit=crop&q=80&w=400';
  }
};
