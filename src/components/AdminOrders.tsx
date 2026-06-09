/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { getStatusBadgeStyles, getStatusLabel, formatCurrency, formatDateTimeString } from '../utils/helpers';
import { Check, ArrowRight, X, Clock, HelpCircle, FileText, Search, User, Home, Phone, ChevronDown, CheckCircle2 } from 'lucide-react';

interface AdminOrdersProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, nextStatus: OrderStatus, comment?: string) => void;
}

export default function AdminOrders({ orders, onUpdateOrderStatus }: AdminOrdersProps) {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] || null);
  const [cancelComment, setCancelComment] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  // helper to get time elapsed
  const getTimeAgo = (isoString: string) => {
    const elapsedMs = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(elapsedMs / 60000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes} min atrás`;
    const hours = Math.floor(elapsedMs / 3600000);
    if (hours < 24) return `${hours}h atrás`;
    return new Date(isoString).toLocaleDateString('pt-BR');
  };

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const matchesStatus = selectedStatusFilter === 'todos' || o.status === selectedStatusFilter;
    const matchesQuery = 
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Handle Order Status progression
  const handleAdvanceStatus = (order: Order) => {
    let next: OrderStatus = order.status;
    let comment = '';

    if (order.status === 'aguardando_aprovacao') {
      next = 'planejado';
      comment = 'Pedido analisado e aceito com sucesso.';
    } else if (order.status === 'planejado') {
      next = 'em_producao';
      comment = 'Pedido em fase de preparo na estufa.';
    } else if (order.status === 'em_producao') {
      next = 'em_entrega';
      comment = 'Pedido finalizado, higienizado e enviado para entrega! (Cliente Notificado 🔔)';
    } else if (order.status === 'em_entrega') {
      next = 'concluido';
      comment = 'Entregue com sucesso nas mãos do cliente.';
    }

    onUpdateOrderStatus(order.id, next, comment);
    
    // Auto-update standard view
    const updatedOrder = { ...order, status: next };
    setSelectedOrder(updatedOrder);
  };

  const handleCancelOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    onUpdateOrderStatus(selectedOrder.id, 'cancelado', cancelComment || 'Cancelamento administrado pelo operador.');
    
    // update selected view
    setSelectedOrder({ ...selectedOrder, status: 'cancelado' });
    setCancelComment('');
    setShowCancelPrompt(false);
  };

  // Status progression labels
  const getNextStepLabel = (status: OrderStatus) => {
    switch (status) {
      case 'aguardando_aprovacao':
        return 'Aceitar Encomenda (Aceito)';
      case 'planejado':
        return 'Iniciar Preparo (Em Preparo)';
      case 'em_producao':
        return 'Sair para Entrega (Enviar 🔔)';
      case 'em_entrega':
        return 'Marcar como Entregue (Concluir)';
      default:
        return '';
    }
  };

  return (
    <div id="admin-orders-root" className="space-y-6">
      
      {/* Header and statistics overview Row */}
      <div>
        <h2 className="text-xl font-bold font-sans text-slate-900 tracking-tight flex items-center gap-2">
          📑 Painel de Controle de Pedidos
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Acompanhe todos os estágios do ciclo vegetativo dos produtos encomendados pelos clientes.
        </p>
      </div>

      {/* Main split dashboard: Left (List of Orders), Right (Focused detail view) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Order List Column (7/12 width) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          
          {/* Controls Bar: Filter & Search */}
          <div className="flex flex-col sm:flex-row gap-2">
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por código ou cliente..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 focus:outline-none focus:border-emerald-500 rounded-xl text-xs text-slate-800"
              />
            </div>

            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="border border-slate-200 focus:outline-none focus:border-emerald-500 rounded-xl text-xs py-1.5 px-3 bg-white text-slate-700 font-medium shrink-0"
            >
              <option value="todos">Todos os status</option>
              <option value="aguardando_aprovacao">Em Análise</option>
              <option value="planejado">Aceito</option>
              <option value="em_producao">Em Preparo</option>
              <option value="em_entrega">Saiu para Entrega</option>
              <option value="concluido">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Orders scrollable list */}
          <div className="space-y-2 max-h-144 overflow-y-auto pr-1">
            {filteredOrders.map(o => (
              <div
                key={o.id}
                onClick={() => {
                  setSelectedOrder(o);
                  setShowCancelPrompt(false);
                  if (window.innerWidth < 1024) {
                    setTimeout(() => {
                      document.getElementById('order-focus-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }
                }}
                className={`p-3.5 rounded-xl border text-xs text-left cursor-pointer transition flex items-center justify-between gap-4 ${
                  selectedOrder?.id === o.id
                    ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-250/20'
                    : 'border-slate-200/60 hover:bg-slate-50 hover:border-slate-350'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{o.id}</span>
                    {o.status === 'aguardando_aprovacao' && (
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Aguardando Aprovação" />
                    )}
                    <span className="text-slate-400 font-mono text-[10px]">
                      • {getTimeAgo(o.createdAt)}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 truncate max-w-[190px]">{o.customerName}</p>
                  <p className="text-[10px] text-slate-400">
                    {o.items.length} pacote(s) • Total: <strong className="font-mono">{formatCurrency(o.total)}</strong>
                  </p>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusBadgeStyles(o.status)}`}>
                    {getStatusLabel(o.status)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-medium">Nenhum pedido condizente com os filtros.</div>
            )}
          </div>
        </div>

        {/* Right Side: Order Detail focus panel (5/12 width) */}
        <div id="order-focus-details" className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-96">
          {selectedOrder ? (
            <div className="flex flex-col h-full text-xs">
              
              {/* Header Box */}
              <div className="bg-slate-900 text-white p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm tracking-tight text-emerald-400">
                    {selectedOrder.id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getStatusBadgeStyles(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Criado em: {formatDateTimeString(selectedOrder.createdAt)}
                </p>
              </div>

              {/* Body Box */}
              <div className="p-5 space-y-5 flex-1 max-h-120 overflow-y-auto">
                {/* Visual Status Progression Stepper */}
                {selectedOrder.status !== 'cancelado' && (
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3 shadow-xs">
                    <p className="font-mono font-bold text-[9px] text-slate-400 uppercase tracking-widest text-center">
                      Progresso da Encomenda na Estufa
                    </p>
                    <div className="flex items-center justify-between relative px-2">
                      {/* Connection Line background */}
                      <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 z-0" />
                      
                      {/* Interactive visual line indicating completed percentage */}
                      <div 
                        className="absolute top-4 left-4 h-0.5 bg-emerald-600 transition-all duration-300 z-0"
                        style={{
                          width: (() => {
                            switch (selectedOrder.status) {
                              case 'aguardando_aprovacao': return '0%';
                              case 'planejado': return '25%';
                              case 'em_producao': return '50%';
                              case 'em_entrega': return '75%';
                              case 'concluido': return '100%';
                              default: return '0%';
                            }
                          })()
                        }}
                      />

                      {[
                        { status: 'aguardando_aprovacao', label: 'Análise', icon: '⏳' },
                        { status: 'planejado', label: 'Aceito', icon: '📝' },
                        { status: 'em_producao', label: 'Em Preparo', icon: '🌱' },
                        { status: 'em_entrega', label: 'Saiu p/ Entrega', icon: '🚚' },
                        { status: 'concluido', label: 'Entregue', icon: '✅' },
                      ].map((st, sIdx) => {
                        const statusWeights: Record<string, number> = {
                          aguardando_aprovacao: 0,
                          planejado: 1,
                          em_producao: 2,
                          em_entrega: 3,
                          concluido: 4,
                        };
                        const currentWeight = statusWeights[selectedOrder.status] || 0;
                        const isCompleted = sIdx < currentWeight;
                        const isCurrent = sIdx === currentWeight;

                        return (
                          <div key={st.status} className="flex flex-col items-center relative z-10">
                            <div 
                              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                                isCompleted 
                                  ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                                  : isCurrent 
                                  ? 'bg-amber-500 text-white font-black ring-4 ring-amber-100 scale-105' 
                                  : 'bg-white text-slate-400 border border-slate-200 shadow-xs'
                              }`}
                              title={st.label}
                            >
                              {isCompleted ? '✓' : st.icon}
                            </div>
                            <span className={`text-[8px] mt-1 font-bold ${
                              isCurrent ? 'text-slate-800' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                            }`}>
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {selectedOrder.status === 'em_entrega' && (
                      <div className="mt-2.5 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                        <div className="text-center text-[10px] font-bold text-slate-700 flex flex-col gap-1">
                          <span className="text-sm">🌱 Alerta de Entrega Manual</span>
                          <span className="text-[9px] text-slate-500 font-normal leading-normal">
                            Para evitar taxas de APIs de WhatsApp, você pode disparar mensagens e e-mails de forma gratuita usando os botões rápidos abaixo com alertas pré-configurados!
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const cleanPhone = selectedOrder.customerPhone.replace(/\D/g, '');
                              const itemsList = selectedOrder.items.map(itm => {
                                const isUnit = itm.unit === 'un' || itm.weight === 1;
                                const cleanName = itm.productName.replace(' - Pacote 1g', ' - Unitário');
                                const totalDetail = isUnit 
                                  ? (itm.quantity === 1 ? '1 Unidade' : `${itm.quantity} Unidades`)
                                  : `${itm.quantity * itm.weight}${itm.unit || 'g'}`;
                                return `• ${itm.quantity}x ${cleanName} (${totalDetail})`;
                              }).join('\n');
                              const msg = `Olá, ${selectedOrder.customerName}! 🌱 Seu pedido de Microverdes Kayagreen acabou de sair para entrega! 🚚\n\n📦 Itens Enviados:\n${itemsList}\n\n💰 Valor Total: R$ ${selectedOrder.total.toFixed(2)}\n💳 Forma de pagamento: ${selectedOrder.paymentMethod === 'pix' ? 'Pix 📱' : selectedOrder.paymentMethod === 'credito' ? 'Cartão de Crédito 💳' : selectedOrder.paymentMethod === 'debito' ? 'Cartão de Débito 💳' : 'A combinar'} na entrega.\n\nFique atento para receber seus microverdes fresquinhos em instantes! Muito obrigado. 💚`;
                              const url = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(msg)}`;
                              window.open(url, '_blank');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9.5px] py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                            title="Disparar aviso por WhatsApp"
                          >
                            <span>📱 Enviar WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const itemsList = selectedOrder.items.map(itm => {
                                const isUnit = itm.unit === 'un' || itm.weight === 1;
                                const cleanName = itm.productName.replace(' - Pacote 1g', ' - Unitário');
                                const totalDetail = isUnit 
                                  ? (itm.quantity === 1 ? '1 Unidade' : `${itm.quantity} Unidades`)
                                  : `${itm.quantity * itm.weight}${itm.unit || 'g'}`;
                                return `• ${itm.quantity}x ${cleanName} (${totalDetail})`;
                              }).join('\n');
                              const subject = `Cultivo Kayagreen: Seus microverdes já saíram para entrega! 🚚`;
                              const body = `Olá, ${selectedOrder.customerName}!\n\nSeu pedido de deliciosos microverdes Kayagreen no valor de R$ ${selectedOrder.total.toFixed(2)} já saiu para entrega! 🚚\n\n📦 Itens enviados:\n${itemsList}\n\nForma de pagamento escolhida: ${selectedOrder.paymentMethod === 'pix' ? 'Pix 📱' : selectedOrder.paymentMethod === 'credito' ? 'Cartão de Crédito 💳' : selectedOrder.paymentMethod === 'debito' ? 'Cartão de Débito 💳' : 'A combinar'} na entrega.\n\nEm instantes nosso entregador chegará ao seu endereço cadastrado:\n${selectedOrder.customerAddress}\n\nMuito obrigado pelo seu apoio ao cultivo orgânico e local!\nEquipe Kayagreen`;
                              window.open(`mailto:${selectedOrder.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                            }}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-[9.5px] py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition shadow-xs text-center justify-center"
                            title="Disparar aviso por E-mail"
                          >
                            <span>✉️ Enviar E-mail</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Customer Details info block */}
                <div className="space-y-2">
                  <h4 className="font-mono font-bold text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Detalhes do Cliente
                  </h4>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-705 space-y-1">
                    <p className="font-bold text-slate-800">{selectedOrder.customerName}</p>
                    <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-450" /> {selectedOrder.customerPhone}</p>
                    <p className="truncate" title={selectedOrder.customerEmail}>✉️ {selectedOrder.customerEmail}</p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.customerAddress)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-1.5 pt-1 border-t border-slate-100/60 mt-1 hover:text-emerald-700 transition cursor-pointer group"
                      title="Ver no Google Maps"
                    >
                      <Home className="w-3 h-3 text-slate-450 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span className="underline decoration-dotted group-hover:no-underline">{selectedOrder.customerAddress}</span>
                    </a>
                    {selectedOrder.paymentMethod && (
                      <div className="pt-2 border-t border-slate-100/60 mt-1.5 text-xs flex items-center justify-between">
                        <span className="font-semibold text-slate-400 text-[10px] uppercase">Forma de Pagamento:</span>
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                          {selectedOrder.paymentMethod === 'pix' ? 'Pix 📱' : selectedOrder.paymentMethod === 'credito' ? 'Crédito 💳' : selectedOrder.paymentMethod === 'debito' ? 'Débito 💳' : selectedOrder.paymentMethod} (Na Entrega)
                        </span>
                      </div>
                    )}
                    {selectedOrder.deliveryMethod && (
                      <div className="pt-2 border-t border-slate-100/60 mt-1.5 text-xs flex items-center justify-between">
                        <span className="font-semibold text-slate-400 text-[10px] uppercase">Forma de Envio:</span>
                        <span className="bg-slate-50 text-slate-700 border border-slate-205 font-bold px-2 py-0.5 rounded text-[10px] uppercase flex items-center gap-1">
                          {selectedOrder.deliveryMethod === 'entrega' ? '🚚 Entrega em Casa' : '🏠 Retirada na Estufa'}
                        </span>
                      </div>
                    )}
                    {selectedOrder.notes && (
                      <div className="pt-2 border-t border-slate-100/60 mt-1.5 text-[11px]">
                        <span className="font-semibold text-slate-400 text-[10px] uppercase block mb-1">Observações:</span>
                        <div className="bg-slate-100/60 p-2 rounded-lg border border-slate-200/50 text-slate-700 leading-normal italic">
                          "{selectedOrder.notes}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items in the cart */}
                <div className="space-y-2">
                  <h4 className="font-mono font-bold text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> Produtos Solicitados
                  </h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50">
                    {selectedOrder.items.map((itm, index) => {
                      const isUnit = itm.unit === 'un' || itm.weight === 1;
                      const cleanName = itm.productName.replace(' - Pacote 1g', ' - Unitário');
                      return (
                        <div key={index} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-50 transition">
                          <div className="truncate">
                            <p className="font-bold text-slate-800 truncate">{cleanName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {isUnit ? (
                                `${itm.quantity} unidade(s) (${formatCurrency(itm.pricePerWeight)}/unid)`
                              ) : (
                                `${itm.quantity} pacotinho(s) x ${itm.weight}${itm.unit} (${formatCurrency(itm.pricePerWeight)}/unid)`
                              )}
                            </p>
                          </div>
                          <span className="font-bold text-slate-800 font-mono align-middle pr-1">
                            {formatCurrency(itm.subtotal)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pricing summaries block */}
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500 items-center">
                      <span>Subtotal de Itens:</span>
                      <span className="font-mono font-bold text-slate-700">
                        {formatCurrency(selectedOrder.items.reduce((sum, item) => sum + item.subtotal, 0))}
                      </span>
                    </div>
                    {selectedOrder.deliveryMethod === 'entrega' && (
                      <div className="flex justify-between text-slate-500 items-center">
                        <span>Taxa de Entrega:</span>
                        <span className="font-mono font-bold text-slate-700">
                          {selectedOrder.deliveryFee === 0 || !selectedOrder.deliveryFee ? 'Grátis' : formatCurrency(selectedOrder.deliveryFee)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/60 mt-2">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Valor total faturado</p>
                        {['planejado', 'em_producao', 'em_entrega'].includes(selectedOrder.status) && (
                          <span className="text-[9px] bg-amber-150 text-amber-800 font-bold px-1 rounded animate-pulse">PROVISÓRIO</span>
                        )}
                        {selectedOrder.status === 'concluido' && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded flex items-center gap-0.5 w-fit">✓ LIQUIDADO</span>
                        )}
                      </div>
                      <span className="text-base font-black text-emerald-800 font-mono leading-none">
                        {formatCurrency(selectedOrder.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Timeline History */}
                <div className="space-y-2">
                  <p className="font-mono font-bold text-[10px] text-slate-400 uppercase tracking-widest">
                    Histórico de Atualizações
                  </p>
                  <div className="relative pl-4 border-l border-slate-200 space-y-3.5 my-2">
                    {selectedOrder.statusHistory.map((hist, hIdx) => (
                      <div key={hIdx} className="relative">
                        {/* Dot indicator */}
                        <span className="absolute -left-[20.5px] top-0.5 bg-white h-3 w-3 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                          <span className="h-1 w-1 bg-emerald-600 rounded-full" />
                        </span>
                        <p className="font-bold text-slate-800 leading-none">
                          {getStatusLabel(hist.status)}
                        </p>
                        <p className="text-[9.5px] text-slate-405 font-mono mt-0.5">
                          {formatDateTimeString(hist.updatedAt)}
                        </p>
                        {hist.comment && (
                          <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100/75 mt-1">
                            {hist.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-slate-50 p-5 border-t border-slate-100">
                {['concluido', 'cancelado'].includes(selectedOrder.status) ? (
                  <div className="text-center text-xs text-slate-400 font-medium py-2 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-350" />
                    <span>Este pedido já foi finalizado e arquivado. O status não pode mais ser alterado.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Progression flow button */}
                    <button
                      onClick={() => handleAdvanceStatus(selectedOrder)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow transition-all duration-150 active:scale-98"
                    >
                      <span>{getNextStepLabel(selectedOrder.status)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Cancellation prompt option */}
                    {!showCancelPrompt ? (
                      <button
                        onClick={() => setShowCancelPrompt(true)}
                        className="w-full text-center text-[11px] text-slate-450 hover:text-rose-600 hover:underline py-1 font-semibold"
                      >
                        Rejeitar ou Cancelar Pedido
                      </button>
                    ) : (
                      <form onSubmit={handleCancelOrder} className="space-y-2 pt-2 border-t border-slate-150">
                        <textarea
                          placeholder="Motivo do cancelamento (opcional, ex: falta de lote de sementes)..."
                          value={cancelComment}
                          onChange={e => setCancelComment(e.target.value)}
                          rows={2}
                          className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-rose-500 text-slate-800 resize-none bg-white"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-1.5 rounded-lg text-xs"
                          >
                            Confirmar Rejeição
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCancelPrompt(false)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 font-bold">Inicie um pedido para vê-lo listado.</div>
          )}
        </div>

      </div>

    </div>
  );
}
