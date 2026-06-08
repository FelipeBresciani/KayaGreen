/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Order, Product, Customer } from '../types';
import { generateReportData, formatCurrency, toLocalDateInputString } from '../utils/helpers';
import { FileDown, Calendar, Filter, BarChart3, AlertCircle, RefreshCw, ShoppingBag, Award, Tag, Users, Clock } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface AdminReportsProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
}

export default function AdminReports({ orders, products, customers }: AdminReportsProps) {
  // Preset filters
  const [startDate, setStartDate] = useState<string>('2026-03-01'); // historical seeding start
  const [endDate, setEndDate] = useState<string>(() => toLocalDateInputString(new Date().toISOString())); // Dynamic today's date
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  // Tab configuration
  const [reportTab, setReportTab] = useState<'vendas' | 'produtos' | 'clientes' | 'temporal'>('vendas');

  const filterState = useMemo(() => ({
    startDate,
    endDate,
    productId: selectedProductId,
    customerId: selectedCustomerId
  }), [startDate, endDate, selectedProductId, selectedCustomerId]);

  // Compute report data
  const report = useMemo(() => {
    return generateReportData(orders, products, customers, filterState);
  }, [orders, products, customers, filterState]);

  // Clear filters
  const handleResetFilters = () => {
    setStartDate('2026-03-01');
    setEndDate(toLocalDateInputString(new Date().toISOString()));
    setSelectedProductId('');
    setSelectedCustomerId('');
  };

  // Preset periods
  const handleSelectPeriodPreset = (preset: 'all' | '30days' | 'june') => {
    const todayStr = toLocalDateInputString(new Date().toISOString());
    if (preset === 'all') {
      setStartDate('2026-03-01');
      setEndDate(todayStr);
    } else if (preset === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      setStartDate(toLocalDateInputString(thirtyDaysAgo.toISOString()));
      setEndDate(todayStr);
    } else if (preset === 'june') {
      setStartDate('2026-06-01');
      setEndDate(todayStr);
    }
  };

  // EXPORT ENGINE: Generates a download text snippet
  const handleExportReport = () => {
    const divider = '\r\n=======================================================\r\n';
    let fileContent = `RELATÓRIO GERENCIAL - COMPLETO DE CLIENTES E VENDAS\r\n`;
    fileContent += `🌱 Emissor: Gestor do Sistema de Vendas de Microverdes\r\n`;
    fileContent += `📅 Período de Análise: ${startDate || 'Início'} até ${endDate || 'Fim'}\r\n`;
    fileContent += `📦 Filtro de Produto: ${products.find(p=>p.id===selectedProductId)?.name || 'Todos'}\r\n`;
    fileContent += `👤 Filtro de Cliente: ${customers.find(c=>c.id===selectedCustomerId)?.name || 'Todos'}\r\n`;
    fileContent += divider;

    // Sales
    fileContent += `1. BALANÇO DE COMPRAS E VENDAS\r\n`;
    fileContent += ` - Quantidade total vendida (Unidades): ${report.summary.totalQtySold} pacotes\r\n`;
    fileContent += ` - Faturamento finalizado realizado: R$ ${report.summary.totalValueSold.toFixed(2)}\r\n`;
    fileContent += ` - Ticket Médio por pedido concluído: R$ ${report.summary.ticketMedio.toFixed(2)}\r\n`;
    fileContent += ` - Contagem de pedidos sob filtros: ${report.summary.ordersCount} (Concluídos: ${report.summary.completedCount})\r\n`;
    fileContent += divider;

    // Products
    fileContent += `2. DESEMPENHO DE PRODUTOS (RAKING DE VENDAS)\r\n`;
    report.products.mostSold.forEach((p, idx) => {
      fileContent += ` #${idx+1} [${p.name}] - Quantidade: ${p.quantity} unidades | Receita: R$ ${p.revenue.toFixed(2)}\r\n`;
    });
    fileContent += divider;

    // Customers
    fileContent += `3. CADASTRO DE CLIENTES (RANKING DE COMPRA AVULSA)\r\n`;
    report.customers.ranked.forEach((c, idx) => {
      fileContent += ` #${idx+1} [${c.name}] - Pedidos efetuados: ${c.orderCount} | Total investido: R$ ${c.spend.toFixed(2)}\r\n`;
    });
    fileContent += divider;

    // Temporal
    fileContent += `4. MÉTRICAS TEMPORAIS (DIAS E PERÍODOS)\r\n`;
    if (report.temporal.bestDay) {
      fileContent += ` - Dia de pico de vendas: ${report.temporal.bestDay.dateStr} (R$ ${report.temporal.bestDay.totalRevenue.toFixed(2)} faturados)\r\n`;
    }
    if (report.temporal.worstDay) {
      fileContent += ` - Dia de menor movimento: ${report.temporal.worstDay.dateStr} (R$ ${report.temporal.worstDay.totalRevenue.toFixed(2)} faturados)\r\n`;
    }
    fileContent += `\r\n - Histórico de faturamento semanal:\r\n`;
    report.temporal.weekly.forEach(w => {
      fileContent += `    * ${w.weekLabel}: R$ ${w.totalRevenue.toFixed(2)} (${w.orderCount} pedidos)\r\n`;
    });
    fileContent += `\r\n - Histórico de faturamento mensal:\r\n`;
    report.temporal.monthly.forEach(m => {
      fileContent += `    * ${m.monthLabel}: R$ ${m.totalRevenue.toFixed(2)} (${m.orderCount} pedidos)\r\n`;
    });
    fileContent += divider;
    fileContent += `Gerado automaticamente via Central Administrativa de Vendas em ${new Date().toLocaleString()}`;

    // Create a Blob and trigger trigger download element
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-microverdes-${startDate}-a-${endDate}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT ENGINE: Generates a premium and descriptive business PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header Green Banner
    doc.setFillColor(16, 185, 129); // Emerald 500
    doc.rect(0, 0, 210, 42, 'F');

    // Title text inside banner
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('KAYAGREEN', 15, 17);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('RELATÓRIO GERENCIAL E DESEMPENHO DE VENDAS', 15, 25);
    doc.text(`Data de Emissão: ${new Date().toLocaleString('pt-BR')}`, 15, 32);
    doc.text('Apoio de Decisão Estratégica e Planejamento de Estufa', 15, 38);

    // Filter information card
    doc.setFillColor(241, 245, 249);
    doc.rect(12, 47, 186, 24, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(12, 47, 186, 24, 'S');

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('RECORTE E FILTROS DO RELATÓRIO:', 18, 53);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Período de Análise: ${startDate || 'Histórico Completo'} até ${endDate || 'Hoje'}`, 18, 59);
    doc.text(`Cultura/Produto: ${products.find(p=>p.id===selectedProductId)?.name || 'Todos os Microverdes'}`, 18, 65);
    doc.text(`Cliente de Origem: ${customers.find(c=>c.id===selectedCustomerId)?.name || 'Todos os Clientes'}`, 110, 59);

    // KPI Cards - Row 1
    const cardY = 76;
    const cardW = 58;
    const cardH = 24;

    // Card 1: Faturamento Realizado
    doc.setFillColor(248, 250, 252);
    doc.rect(12, cardY, cardW, cardH, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.rect(12, cardY, cardW, cardH, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 185, 129);
    doc.text('FATURAMENTO REALIZADO', 16, cardY + 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(report.summary.totalValueSold), 16, cardY + 16);

    // Card 2: Volume Vendido
    doc.setFillColor(248, 250, 252);
    doc.rect(12 + cardW + 6, cardY, cardW, cardH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(12 + cardW + 6, cardY, cardW, cardH, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(115, 115, 115);
    doc.text('QUANTIDADE VENDIDA', 12 + cardW + 10, cardY + 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`${report.summary.totalQtySold} Pacotes`, 12 + cardW + 10, cardY + 16);

    // Card 3: Ticket Médio
    doc.setFillColor(248, 250, 252);
    doc.rect(12 + (cardW * 2) + 12, cardY, cardW, cardH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(12 + (cardW * 2) + 12, cardY, cardW, cardH, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(115, 115, 115);
    doc.text('TICKET MÉDIO (PEDIDO)', 12 + (cardW * 2) + 14, cardY + 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(report.summary.ticketMedio), 12 + (cardW * 2) + 14, cardY + 16);

    // Table 1: Desempenho de Culturas (Produtos)
    let yPos = 112;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('DESEMPENHO DO CATÁLOGO DE CULTURAS (RANKING)', 12, yPos);
    
    yPos += 3;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(12, yPos, 198, yPos);

    // Header Table
    yPos += 5;
    doc.setFillColor(241, 245, 249);
    doc.rect(12, yPos, 186, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Cultura / Produto', 15, yPos + 4.5);
    doc.text('Quantidade Vendida', 110, yPos + 4.5);
    doc.text('Receita Gerada (R$)', 160, yPos + 4.5);

    yPos += 6;
    report.products.mostSold.forEach((p, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(12, yPos, 186, 6.5, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(`${idx + 1}. ${p.name}`, 15, yPos + 4.5);
      doc.text(`${p.quantity} pacotes`, 110, yPos + 4.5);
      doc.text(formatCurrency(p.revenue), 160, yPos + 4.5);
      yPos += 6.5;
    });

    if (report.products.mostSold.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.text('Nenhuma venda no período filtrado.', 20, yPos + 5);
      yPos += 8;
    }

    // Table 2: Clientes Líderes
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('PRINCIPAIS CLIENTES E RECORRÊNCIA', 12, yPos);
    
    yPos += 3;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(12, yPos, 198, yPos);

    // Header Table Clientes
    yPos += 5;
    doc.setFillColor(241, 245, 249);
    doc.rect(12, yPos, 186, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Cliente', 15, yPos + 4.5);
    doc.text('Frequência de Compras', 110, yPos + 4.5);
    doc.text('Valor Total Investido (R$)', 160, yPos + 4.5);

    yPos += 6;
    report.customers.ranked.slice(0, 10).forEach((c, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(12, yPos, 186, 6.5, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(`${idx + 1}. ${c.name}`, 15, yPos + 4.5);
      doc.text(`${c.orderCount} pedido(s)`, 110, yPos + 4.5);
      doc.text(formatCurrency(c.spend), 160, yPos + 4.5);
      yPos += 6.5;
    });

    if (report.customers.ranked.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.text('Nenhum consumo de cliente registrado no período.', 20, yPos + 5);
      yPos += 8;
    }

    // Footnotes with signature
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Relatório oficial da Kayagreen® - Todos os direitos reservados. Sistema homologado para planejamento de colheita.', 15, 285);
    doc.text('Pág. 1 de 1', 185, 285);

    doc.save(`relatorio-vendas-kayagreen-${startDate}-a-${endDate}.pdf`);
  };

  return (
    <div id="admin-reports-root" className="space-y-6">
      
      {/* Header text with action button for exporting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-900 tracking-tight flex items-center gap-2">
            📊 Relatórios Gerenciais Avançados
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gere relatórios instantâneos sobre o andamento e a saúde de seu faturamento combinando filtros detalhados.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition duration-200 shrink-0 self-start sm:self-auto active:scale-95 cursor-pointer"
          >
            <FileDown className="w-4 h-4" /> Exportar Relatório PDF 📄
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel Card */}
      <div id="reports-filters-panel" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          Filtros de Consolidação dos Dados
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-emerald-500 bg-white"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-emerald-500 bg-white"
            />
          </div>

          {/* Product Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Filtrar Cultura/Produto</label>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-emerald-500 bg-white"
            >
              <option value="">Todos os microverdes</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Filtrar por Cliente de Origem</label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-emerald-500 bg-white"
            >
              <option value="">Todos os clientes</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Quick presets and Reset buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-50">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span>Intervalos rápidos:</span>
            <button
              onClick={() => handleSelectPeriodPreset('all')}
              className="hover:text-emerald-700 hover:underline px-1.5"
            >
              Histórico Integral
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => handleSelectPeriodPreset('30days')}
              className="hover:text-emerald-700 hover:underline px-1.5"
            >
              Últimos 30 Dias
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => handleSelectPeriodPreset('june')}
              className="hover:text-emerald-700 hover:underline px-1.5"
            >
              Mês Completo (Junho)
            </button>
          </div>

          <button
            onClick={handleResetFilters}
            className="text-[11px] text-slate-500 hover:text-emerald-750 font-bold flex items-center gap-1 mt-1 sm:mt-0"
          >
            <RefreshCw className="w-3 h-3" /> Limpar Filtros
          </button>
        </div>

      </div>

      {/* Tab select layout for compiling different report formats */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
        
        {/* Navigation tabs */}
        <div className="flex bg-slate-50 border-b border-slate-100 p-1 flex-wrap">
          <button
            onClick={() => setReportTab('vendas')}
            className={`flex-1 min-w-[100px] text-center font-bold py-3 transition border-b-2 flex items-center justify-center gap-2 ${
              reportTab === 'vendas'
                ? 'border-emerald-600 text-emerald-850 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Relatório de Vendas
          </button>
          <button
            onClick={() => setReportTab('produtos')}
            className={`flex-1 min-w-[100px] text-center font-bold py-3 transition border-b-2 flex items-center justify-center gap-2 ${
              reportTab === 'produtos'
                ? 'border-emerald-600 text-emerald-850 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" /> Relatório de Produtos
          </button>
          <button
            onClick={() => setReportTab('clientes')}
            className={`flex-1 min-w-[100px] text-center font-bold py-3 transition border-b-2 flex items-center justify-center gap-2 ${
              reportTab === 'clientes'
                ? 'border-emerald-600 text-emerald-850 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Relatório de Clientes
          </button>
          <button
            onClick={() => setReportTab('temporal')}
            className={`flex-1 min-w-[100px] text-center font-bold py-3 transition border-b-2 flex items-center justify-center gap-2 ${
              reportTab === 'temporal'
                ? 'border-emerald-600 text-emerald-850 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" /> Relatório Temporal
          </button>
        </div>

        {/* Dynamic Inner Tab Content */}
        <div className="p-6">
          
          {/* TAB 1: RELATÓRIO DE VENDAS */}
          {reportTab === 'vendas' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-800">
                    Quantidade Vendida
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-950 mt-1 block">
                    {report.summary.totalQtySold} pacotes
                  </span>
                  <p className="text-[10px] text-slate-400 mt-2">Volume comercializado sob filtros</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-55/40 border border-emerald-100">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-800">
                    Valor Total Vendido
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-950 mt-1 block">
                    {formatCurrency(report.summary.totalValueSold)}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-2">Faturamento finalizado conciliado</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-800">
                    Ticket Médio
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-950 mt-1 block">
                    {formatCurrency(report.summary.ticketMedio)}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-2">Valor médio recebido por entrega</p>
                </div>
              </div>

              {/* GRÁFICOS IMPORTANTES PARA O NEGÓCIO */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                
                {/* Chart 1: Participação de Receita por Cultura */}
                <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50">
                    <h4 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-emerald-600" /> Vendas por Cultura / Produto
                    </h4>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-extrabold uppercase font-mono">Receita Líquida</span>
                  </div>
                  <div className="space-y-3.5">
                    {report.products.mostSold.slice(0, 5).map((p, idx) => {
                      const totalRev = report.summary.totalValueSold || 1;
                      const percent = Math.min((p.revenue / totalRev) * 100, 100);
                      const colors = ['bg-emerald-600', 'bg-teal-500', 'bg-indigo-600', 'bg-purple-500', 'bg-amber-500'];
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700 truncate max-w-[190px]">{p.name}</span>
                            <span className="font-mono text-slate-500 font-bold">
                              {formatCurrency(p.revenue)} ({percent.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`${colors[idx % colors.length]} h-full rounded-full transition-all duration-500`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {report.products.mostSold.length === 0 && (
                      <p className="text-xs text-slate-400 py-10 text-center">Nenhum dado financeiro disponível sob os parâmetros atuais.</p>
                    )}
                  </div>
                </div>

                {/* Chart 2: Pipeline de Produção & Saúde de Caixa */}
                <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50">
                      <h4 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        💼 Fluxos Financeiros & Carteira Coletada
                      </h4>
                      <span className="text-[9px] text-slate-400 uppercase font-mono">Kayagreen</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono">Dinheiro Recebido</span>
                        <span className="text-lg font-black font-mono text-emerald-950 mt-1 block">
                          {formatCurrency(report.summary.totalValueSold)}
                        </span>
                        <div className="w-full bg-emerald-250 h-1.5 rounded-full overflow-hidden mt-3">
                          <div className="bg-emerald-600 h-full w-full" />
                        </div>
                        <span className="text-[9px] text-emerald-650 mt-2 font-bold select-none">✓ Concluído</span>
                      </div>
                      
                      <div className="bg-blue-50/60 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-blue-800 uppercase font-mono">Dinheiro na Fila</span>
                        <span className="text-lg font-black font-mono text-slate-950 mt-1 block">
                          {formatCurrency(orders.filter(o => ['planejado', 'em_producao', 'em_entrega'].includes(o.status)).reduce((acc, o) => acc + o.total, 0))}
                        </span>
                        <div className="w-full bg-blue-250 h-1.5 rounded-full overflow-hidden mt-3">
                          <div className="bg-blue-500 h-full w-4/6" />
                        </div>
                        <span className="text-[9px] text-blue-655 mt-2 font-bold select-none">● Em Preparo / Envio</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-slate-600 mt-4 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100 flex items-start gap-1.5 font-medium">
                    <span>💡 <strong>Métricas do Negócio:</strong> Mapeie a proporção do Dinheiro na Fila para agendar compras de insumos para as novas semeaduras.</span>
                  </div>
                </div>

              </div>

              <div id="vendas-filtering-alert" className="flex items-start gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-150 text-[10.5px] text-slate-500 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  O faturamento realizado só contabiliza pedidos com status final <strong>Concluído</strong> (Etapa 5). Pedidos com status provisórios (Planejado, Em Produção ou Em Entrega) constam temporariamente no balanço geral planejado de faturamento.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: RELATÓRIO DE PRODUTOS */}
          {reportTab === 'produtos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Products Most Sold */}
              <div>
                <h4 className="font-bold text-xs text-emerald-800 flex items-center gap-1.5 pb-2 border-b border-emerald-100 mb-3">
                  <Award className="w-4 h-4" /> Culturas Mais Vendidas (Maior Demanda)
                </h4>
                <div className="space-y-2">
                  {report.products.mostSold.map((p, idx) => (
                    <div key={idx} className="p-3 bg-emerald-50/20 border border-emerald-100/40 rounded-xl flex items-center justify-between gap-4 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Pacotes vendidos: {p.quantity}</p>
                      </div>
                      <span className="font-bold font-mono text-emerald-800">
                        {formatCurrency(p.revenue)}
                      </span>
                    </div>
                  ))}
                  {report.products.mostSold.length === 0 && (
                    <p className="text-slate-400 text-center py-6">Nenhum produto vendido no período.</p>
                  )}
                </div>
              </div>

              {/* Products Least Sold */}
              <div>
                <h4 className="font-bold text-xs text-amber-800 flex items-center gap-1.5 pb-2 border-b border-amber-100 mb-3">
                  <AlertCircle className="w-4 h-4" /> Estoque Estagnado ou Menores Vendas
                </h4>
                <div className="space-y-2">
                  {report.products.leastSold.map((p, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/10 border border-amber-100/30 rounded-xl flex items-center justify-between gap-4 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Pacotes vendidos: {p.quantity}</p>
                      </div>
                      <span className="font-bold font-mono text-amber-800">
                        {formatCurrency(p.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: RELATÓRIO DE CLIENTES */}
          {reportTab === 'clientes' && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-800 pb-2 border-b border-slate-50 mb-3">
                Monitor de Consumo e Frequência dos Clientes
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-705 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-mono font-bold uppercase text-[9px]">
                      <th className="py-2.5">Nome do Cliente</th>
                      <th className="py-2.5 text-center">Frequência de Compras</th>
                      <th className="py-2.5 text-right">Faturamento Total do Cliente (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.customers.ranked.map((c, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/60 transition">
                        <td className="py-3 font-semibold text-slate-800 flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-800 font-bold h-5 w-5 rounded-full flex items-center justify-center text-[9px]">
                            {idx + 1}
                          </span>
                          {c.name}
                        </td>
                        <td className="py-3 text-center font-bold text-slate-650">{c.orderCount} pedido(s)</td>
                        <td className="py-3 text-right font-mono font-bold text-emerald-850">
                          {formatCurrency(c.spend)}
                        </td>
                      </tr>
                    ))}
                    {report.customers.ranked.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">Nenhum faturamento registrado sob os critérios.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: RELATÓRIO TEMPORAL */}
          {reportTab === 'temporal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Daily metrics highlights */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-slate-800 pb-2 border-b border-slate-50">
                  Dias com Mais e Menos Vendas
                </h4>

                <div className="space-y-2">
                  <div className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-150 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-emerald-800 uppercase tracking-wide font-mono text-[10px]">🥇 Melhor Dia de Venda</p>
                      <p className="font-bold text-slate-800 mt-1">{report.temporal.bestDay ? report.temporal.bestDay.dateStr : 'Sem dados'}</p>
                    </div>
                    {report.temporal.bestDay && (
                      <span className="text-sm font-black text-emerald-900 font-mono">
                        {formatCurrency(report.temporal.bestDay.totalRevenue)}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-500 uppercase tracking-wide font-mono text-[10px]">🥈 Menor Dia de Venda</p>
                      <p className="font-bold text-slate-800 mt-1">{report.temporal.worstDay ? report.temporal.worstDay.dateStr : 'Sem dados'}</p>
                    </div>
                    {report.temporal.worstDay && (
                      <span className="text-sm font-extrabold text-slate-600 font-mono">
                        {formatCurrency(report.temporal.worstDay.totalRevenue)}
                      </span>
                    )}
                  </div>
                </div>

                <div id="revenue-growth-text" className="bg-emerald-50/20 p-4 rounded-xl text-[10.5px] leading-relaxed text-slate-500 border border-emerald-150/40">
                  Os dados acima representam os dias com volume de pico de faturamento. Considere aumentar a sua escala de germinação 7 a 9 dias antes das quartas e quintas-feiras, que costumam registrar recordes devido ao abastecimento de restaurantes na região central de São Paulo.
                </div>
              </div>

              {/* Evolution trend summaries list */}
              <div>
                <h4 className="font-bold text-xs text-slate-800 pb-2 border-b border-slate-50 mb-3">
                  Evolução do Faturamento Mensal (Líquido)
                </h4>

                <div className="space-y-2">
                  {report.temporal.monthly.map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-xs font-medium text-slate-705">
                      <span className="font-semibold text-slate-850">{m.monthLabel}</span>
                      <div className="flex items-center gap-4 font-mono">
                        <span>{m.orderCount} ped. concluintes</span>
                        <span className="font-bold text-emerald-800">{formatCurrency(m.totalRevenue)}</span>
                      </div>
                    </div>
                  ))}
                  {report.temporal.monthly.length === 0 && (
                    <p className="text-slate-400 py-6 text-center">Nenhum dado temporal encontrado.</p>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
