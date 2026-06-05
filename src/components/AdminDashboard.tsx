/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, Order, Product } from '../types';
import { calculateDashboardStats, formatCurrency, getStatusLabel, getStatusBadgeStyles } from '../utils/helpers';
import { TrendingUp, BarChart3, ShoppingBag, DollarSign, Award, Users, AlertCircle, ArrowUpRight, ChevronRight, Calendar } from 'lucide-react';

interface AdminDashboardProps {
  orders: Order[];
  customers: Customer[];
  products: Product[];
  onNavigateTo: (tab: string) => void;
}

export default function AdminDashboard({ orders, customers, products, onNavigateTo }: AdminDashboardProps) {
  const stats = calculateDashboardStats(orders, customers, products);
  const [activeChartTab, setActiveChartTab] = useState<'daily' | 'weekly' | 'monthly' | 'products'>('monthly');

  // Chart Generation Helpers based on mock historical limits
  // Group orders chronologically
  const sortedCompletedOrders = [...orders]
    .filter(o => o.status === 'concluido')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // 1. Group by Month (March, April, May, June 2026)
  const monthLabels = ['Março', 'Abril', 'Maio', 'Junho'];
  const monthRevenue = [0, 0, 0, 0]; // March=0, April=1, May=2, June=3
  const monthOrderCounts = [0, 0, 0, 0];

  orders.forEach(o => {
    if (o.status === 'concluido') {
      const date = new Date(o.createdAt);
      const m = date.getUTCMonth(); // 2=March, 3=April, 4=May, 5=June
      if (m >= 2 && m <= 5) {
        monthRevenue[m - 2] += Number(o.total || 0);
        monthOrderCounts[m - 2] += 1;
      }
    }
  });

  const maxMonthRev = Math.max(...monthRevenue, 1);

  // 2. Group by Day (Dynamic last 7 days leading to June 05)
  const dayLabels: string[] = [];
  const dayRevenue: number[] = [0, 0, 0, 0, 0, 0, 0];
  const dayOrders: number[] = [0, 0, 0, 0, 0, 0, 0];

  const baseDate = new Date('2026-06-05T20:00:00Z');
  for (let i = 6; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}${i === 0 ? ' (Hoje)' : ''}`;
    dayLabels.push(label);
  }

  orders.forEach(o => {
    const oDate = new Date(o.createdAt);
    const diffMs = baseDate.getTime() - oDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) {
      const idx = 6 - diffDays;
      if (idx >= 0 && idx < 7) {
        dayOrders[idx] += 1;
        if (o.status === 'concluido') {
          dayRevenue[idx] += Number(o.total || 0);
        }
      }
    }
  });
  const maxDayRev = Math.max(...dayRevenue, 1);

  // 3. Group by Week (Dynamically compute trailing 5 weeks from June 05)
  const weekLabels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5 (Atu)'];
  const weekRevenue = [0, 0, 0, 0, 0];
  orders.forEach(o => {
    if (o.status === 'concluido') {
      const date = new Date(o.createdAt);
      const diffMs = baseDate.getTime() - date.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays < 35) {
        const weekIdx = 4 - Math.floor(diffDays / 7);
        if (weekIdx >= 0 && weekIdx <= 4) {
          weekRevenue[weekIdx] += Number(o.total || 0);
        }
      }
    }
  });
  const maxWeekRev = Math.max(...weekRevenue, 1);

  // 4. Products selling ranking
  const productRanking = stats.products.ranking;
  const maxProductQty = Math.max(...productRanking.map(r => r.quantity), 1);

  // Recent order list limits
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div id="admin-dashboard-root" className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-900 tracking-tight flex items-center gap-2">
            Olá, Administrador 👋
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Aqui está o panorama de vendas e produção dos seus microverdes em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg shrink-0">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Baseline: 05 de Junho de 2026</span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div id="kpi-grid-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billing Realized */}
        <div id="kpi-faturamento-realizado" className="bento-card border-l-4 border-l-emerald-500 relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/85 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider">
              Faturamento Realizado
            </span>
            <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-100/50">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatCurrency(stats.billing.realized)}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-50 pt-2 text-[11px] text-slate-500 font-medium">
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">✓ Concluído</span>
            <span className="text-slate-400">Total recebido</span>
          </div>
        </div>

        {/* Faturamento Planejado */}
        <div id="kpi-faturamento-planejado" className="bento-card border-l-4 border-l-blue-500 relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/85 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider">
              Faturamento Planejado
            </span>
            <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-105">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatCurrency(stats.billing.planned)}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-50 pt-2 text-[11px] text-slate-500 font-medium">
            <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">⎙ Em carteira</span>
            <span className="text-slate-400">Total em produção</span>
          </div>
        </div>

        {/* Faturamento Mensal */}
        <div id="kpi-faturamento-mensal" className="bento-card border-l-4 border-l-teal-500 relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/85 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider">
              Mês de Junho
            </span>
            <div className="bg-teal-50/70 p-1.5 rounded-lg border border-teal-100">
              <BarChart3 className="w-4 h-4 text-teal-600" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatCurrency(stats.billing.monthly)}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-50 pt-2 text-[11px] text-slate-500 font-medium">
            <span className="text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded">📈 Mês Atual</span>
            <span className="text-slate-400">Caixa de Junho</span>
          </div>
        </div>

        {/* Clientes Ativos */}
        <div id="kpi-clientes-ativos" className="bento-card border-l-4 border-l-purple-500 relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/85 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider">
              Clientes Ativos
            </span>
            <div className="bg-purple-50 p-1.5 rounded-lg border border-purple-100">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {stats.customers.activeCount}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-50 pt-2 text-[11px] text-slate-500 font-medium">
            <span className="text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded">👥 Compras</span>
            <span className="text-slate-400">Total: {customers.length}</span>
          </div>
        </div>
      </div>

      {/* Orders pipeline counts */}
      <div id="orders-pipeline-widget" className="bento-card shadow-sm">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">
          Fluxo Corrente de Pedidos
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl text-center">
            <p className="text-[10px] font-bold text-amber-800">Em Análise</p>
            <p className="text-2xl font-bold text-amber-900 mt-1 font-mono">{stats.orders.pending}</p>
          </div>
          <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl text-center">
            <p className="text-[10px] font-bold text-blue-800">Aceitos</p>
            <p className="text-2xl font-bold text-blue-900 mt-1 font-mono">
              {orders.filter(o => o.status === 'planejado').length}
            </p>
          </div>
          <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-xl text-center">
            <p className="text-[10px] font-bold text-indigo-800">Em Preparo</p>
            <p className="text-2xl font-bold text-indigo-900 mt-1 font-mono">
              {orders.filter(o => o.status === 'em_producao').length}
            </p>
          </div>
          <div className="bg-purple-50/50 border border-purple-100 p-3.5 rounded-xl text-center">
            <p className="text-[10px] font-bold text-purple-800">Saiu para Entrega</p>
            <p className="text-2xl font-bold text-purple-900 mt-1 font-mono">
              {orders.filter(o => o.status === 'em_entrega').length}
            </p>
          </div>
          <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl text-center col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold text-emerald-800">Entregues</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1 font-mono">{stats.orders.completed}</p>
          </div>
        </div>
      </div>

      {/* Main Visual Graphs Panel & Product Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Graphs (Left - Cols 1 & 2) */}
        <div id="dashboard-charts-box" className="bento-card lg:col-span-2 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
              <div>
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-1.5">
                  <BarChart3 className="w-5 h-5 text-emerald-600" /> Gráficos de Performance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Clique nas abas para alterar a granularidade visual</p>
              </div>
              
              <div className="flex bg-slate-100 p-1 rounded-lg self-start">
                <button
                  onClick={() => setActiveChartTab('monthly')}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition ${
                    activeChartTab === 'monthly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setActiveChartTab('weekly')}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition ${
                    activeChartTab === 'weekly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Semanal
                </button>
                <button
                  onClick={() => setActiveChartTab('daily')}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition ${
                    activeChartTab === 'daily' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Diário (Junho)
                </button>
                <button
                  onClick={() => setActiveChartTab('products')}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition ${
                    activeChartTab === 'products' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Ranking Prod.
                </button>
              </div>
            </div>

            {/* Dynamic Custom Chart Content */}
            <div className="h-64 flex items-end justify-between relative mt-4 pt-10 px-4">
              {/* Chart Grid Lines */}
              <div className="absolute inset-0 pt-10 pb-2 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-dashed border-slate-100 w-full" />
                <div className="border-t border-dashed border-slate-100 w-full" />
                <div className="border-t border-dashed border-slate-100 w-full" />
                <div className="border-t border-dashed border-slate-100 w-full animate-pulse" />
              </div>

              {/* MONTHLY CHART */}
              {activeChartTab === 'monthly' && (
                monthLabels.map((lbl, idx) => {
                  const rev = monthRevenue[idx];
                  const heightPercent = maxMonthRev > 0 ? (rev / maxMonthRev) * 100 : 0;
                  return (
                    <div key={lbl} className="flex-1 h-full flex flex-col justify-end items-center group relative z-10">
                      <div className="absolute top-0 bg-slate-900 text-white text-[10px] font-mono py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition shadow pointer-events-none">
                        {formatCurrency(rev)} ({monthOrderCounts[idx]} ped)
                      </div>
                      <div
                        className="w-12 bg-gradient-to-t from-emerald-600 to-emerald-400 hover:to-emerald-300 rounded-t-lg transition-all duration-500 relative animate-pulse"
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      >
                        {/* Interactive overlay */}
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition rounded-t-lg" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 mt-2 font-sans tracking-tight">
                        {lbl}
                      </span>
                    </div>
                  );
                })
              )}

              {/* WEEKLY CHART */}
              {activeChartTab === 'weekly' && (
                weekLabels.map((lbl, idx) => {
                  const rev = weekRevenue[idx];
                  const heightPercent = maxWeekRev > 0 ? (rev / maxWeekRev) * 100 : 0;
                  return (
                    <div key={lbl} className="flex-1 h-full flex flex-col justify-end items-center group relative z-10">
                      <div className="absolute top-0 bg-slate-900 text-white text-[10px] font-mono py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition shadow pointer-events-none">
                        {formatCurrency(rev)}
                      </div>
                      <div
                        className="w-8 bg-gradient-to-t from-indigo-600 to-indigo-400 hover:to-indigo-300 rounded-t-md transition-all duration-500 relative animate-pulse"
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition rounded-t-md" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 mt-2">
                        {lbl}
                      </span>
                    </div>
                  );
                })
              )}

              {/* DAILY CHART */}
              {activeChartTab === 'daily' && (
                dayLabels.map((lbl, idx) => {
                  const rev = dayRevenue[idx];
                  const heightPercent = maxDayRev > 0 ? (rev / maxDayRev) * 100 : 0;
                  return (
                    <div key={lbl} className="flex-1 h-full flex flex-col justify-end items-center group relative z-10">
                      <div className="absolute top-0 bg-slate-900 text-white text-[10px] font-mono py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition shadow pointer-events-none">
                        {formatCurrency(rev)} ({dayOrders[idx]} ped)
                      </div>
                      <div
                        className="w-10 bg-gradient-to-t from-emerald-500 to-teal-400 hover:to-teal-300 rounded-t-md transition-all duration-500 relative animate-pulse"
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition rounded-t-md" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 mt-2">
                        {lbl}
                      </span>
                    </div>
                  );
                })
              )}

              {/* PRODUCTS BAR RANKING */}
              {activeChartTab === 'products' && (
                <div className="w-full h-full flex flex-col justify-end gap-2 text-xs select-none">
                  {productRanking.slice(0, 4).map((p, idx) => {
                    const widthPercent = maxProductQty > 0 ? (p.quantity / maxProductQty) * 100 : 0;
                    const colors = [
                      'bg-emerald-600',
                      'bg-indigo-600',
                      'bg-teal-500',
                      'bg-purple-500',
                    ];
                    return (
                      <div key={p.id} className="w-full flex items-center justify-between gap-4">
                        <span className="w-1/3 truncate font-medium text-slate-700 text-[11px] text-left">
                          {p.name}
                        </span>
                        <div className="w-1/2 bg-slate-100 h-4 rounded overflow-hidden relative">
                          <div
                            className={`${colors[idx % colors.length]} h-full rounded transition-all duration-500`}
                            style={{ width: `${Math.max(widthPercent, 5)}%` }}
                          />
                        </div>
                        <span className="w-1/6 font-mono font-bold text-slate-600 text-[10px] text-right">
                          {p.quantity} unid.
                        </span>
                      </div>
                    );
                  })}
                  {productRanking.length === 0 && (
                    <div className="text-slate-400 text-center py-10">Nenhum dado de vendas ainda.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 text-center border-t border-slate-50 pt-3">
            📈 Crescimento acumulado de <strong>+18%</strong> no comparativo quinzenal.
          </p>
        </div>

        {/* Product Highlights and metrics (Right - Col 3) */}
        <div id="product-highlights-box" className="bento-card shadow-sm flex flex-col justify-between gap-6">
          <div>
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-1.5 mb-4 border-b border-slate-50 pb-3">
              <Award className="w-5 h-5 text-emerald-600" /> Destaque de Demanda
            </h3>

            <div className="space-y-4">
              {/* Product Best Seller */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-800 tracking-wider font-mono uppercase">
                  🏆 Produto Mais Vendido (Volume)
                </p>
                {stats.products.bestSeller ? (
                  <div className="mt-1">
                    <p className="text-sm font-semibold text-slate-800">{stats.products.bestSeller.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Quantidade vendida: <strong>{stats.products.bestSeller.quantity} unidades</strong>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">Nenhum produto concluído ainda.</p>
                )}
              </div>

              {/* Most Requested Product frequency */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-800 tracking-wider font-mono uppercase">
                  💡 Mais Solicitado (Frequência)
                </p>
                {stats.products.mostRequested ? (
                  <div className="mt-1">
                    <p className="text-sm font-semibold text-slate-800">{stats.products.mostRequested.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Presente em <strong>{stats.products.mostRequested.count} pedidos</strong> distintos
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">Nenhum pedido efetuado ainda.</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">
              Ranking Geral de Produtos
            </h4>
            <div className="space-y-2">
              {productRanking.slice(0, 3).map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-slate-600 truncate max-w-[140px] font-medium">
                    {idx + 1}. {p.name}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigateTo('Relatórios')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center justify-end gap-1 w-full mt-4"
            >
              Ver relatório completo de produtos <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Recent Orders and Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders (Left - Cols 1 & 2) */}
        <div id="recent-orders-scroller" className="bento-card lg:col-span-2 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-1.5">
              <ShoppingBag className="w-5 h-5 text-emerald-600" /> Pedidos Recentes
            </h3>
            <button
              onClick={() => onNavigateTo('Pedidos')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              Controlar fila de pedidos <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-mono font-bold uppercase text-[10px]">
                  <th className="py-2.5">Código</th>
                  <th className="py-2.5">Cliente</th>
                  <th className="py-2.5">Data</th>
                  <th className="py-2.5 text-right">Total</th>
                  <th className="py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="py-2.5 font-mono font-bold text-slate-700">{o.id}</td>
                    <td className="py-2.5 font-medium text-slate-800">{o.customerName}</td>
                    <td className="py-2.5 text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-800">
                      {formatCurrency(o.total)}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeStyles(o.status)}`}>
                        {getStatusLabel(o.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">Nenhum pedido cadastrado no momento.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Outstanding Customers (Right - Col 3) */}
        <div id="outstanding-customers-panel" className="bento-card shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-50">
              <Users className="w-5 h-5 text-emerald-600" /> Clientes Líderes
            </h3>

            <div className="space-y-4">
              {stats.customers.topBuyers.slice(0, 3).map((cb, idx) => (
                <div key={cb.id} className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/75 transition border border-slate-100/60">
                  <div className="truncate">
                    <p className="font-semibold text-xs text-slate-800 truncate flex items-center gap-1">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      {cb.name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate pl-6">{cb.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold font-mono text-xs text-slate-800">
                      {formatCurrency(cb.totalSpent)}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      {cb.orderCount} compras concluintes
                    </p>
                  </div>
                </div>
              ))}
              {stats.customers.topBuyers.length === 0 && (
                <div className="text-slate-400 text-center py-10 text-xs">Nenhum cliente com compras concluídas.</div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTo('Clientes')}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center justify-center gap-1 border border-slate-200 hover:border-slate-300 py-2 rounded-xl mt-6 transition"
          >
            Gerenciar todos os clientes cadastrados <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
