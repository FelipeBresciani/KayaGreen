/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { getStatusBadgeStyles, getStatusLabel, formatCurrency, formatDateTimeString } from '../utils/helpers';
import { Clock, CheckSquare, Sparkles, Truck, ShoppingCart, HelpCircle, FileText } from 'lucide-react';

interface ClientOrdersProps {
  orders: Order[];
  currentCustomerId: string;
}

export default function ClientOrders({ orders, currentCustomerId }: ClientOrdersProps) {
  // Filter for logged-in customer only
  const clientOrders = orders.filter(o => o.customerId === currentCustomerId)
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(clientOrders[0] || null);

  // Sync selected order if order updates happen or selector switch takes place
  const focusedOrder = clientOrders.find(o => o.id === selectedOrder?.id) || clientOrders[0];

  const steps: { status: OrderStatus; label: string; desc: string; icon: string }[] = [
    { status: 'aguardando_aprovacao', label: '1. Análise', desc: 'Seu pedido está sob análise operacional', icon: '⏳' },
    { status: 'planejado', label: '2. Aceito', desc: 'Seu pedido foi aceito e está agendado', icon: '🤝' },
    { status: 'em_producao', label: '3. Em Preparo', desc: 'Seus microverdes estão sendo preparados e embalados', icon: '🌱' },
    { status: 'em_entrega', label: '4. Saiu para Entrega 🔔', desc: 'A caminho! Notificação de envio enviada em tempo real', icon: '🚚' },
    { status: 'concluido', label: '5. Entregue', desc: 'Encomenda entregue com sucesso', icon: '✅' },
  ];

  // Helper to determine step states
  const getStepState = (order: Order, stepStatus: OrderStatus, index: number) => {
    if (order.status === 'cancelado') {
      return 'inactive';
    }

    const currentIdx = steps.findIndex(s => s.status === order.status);
    if (stepStatus === order.status) {
      return 'active';
    }
    if (index < currentIdx) {
      return 'completed';
    }
    return 'pending';
  };

  return (
    <div id="client-orders-root" className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold font-sans text-slate-900 tracking-tight flex items-center gap-2">
          📦 Histórico de Encomendas
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Acompanhe em tempo real o desenvolvimento vegetal e logística de entrega dos seus microverdes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Encomendas history scroller (5/12 width) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
            Minhas Encomendas ({clientOrders.length})
          </h3>

          <div className="space-y-2 max-h-120 overflow-y-auto pr-1">
            {clientOrders.map(o => (
              <div
                key={o.id}
                onClick={() => {
                  setSelectedOrder(o);
                  // Focus detail panel on mobile/tablet screens smoothly
                  const el = document.getElementById('encomenda-focus-tracker');
                  if (el && window.innerWidth < 1024) {
                    setTimeout(() => {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }
                }}
                className={`p-3.5 rounded-xl border text-xs text-left cursor-pointer transition flex items-center justify-between gap-4 ${
                  focusedOrder?.id === o.id
                    ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-250/20'
                    : 'border-slate-100 hover:border-slate-150'
                }`}
              >
                <div className="space-y-1">
                  <span className="font-mono font-bold text-slate-900 block">{o.id}</span>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {new Date(o.createdAt).toLocaleDateString('pt-BR')} • {o.items.length} item(ns)
                  </p>
                  <p className="font-bold text-slate-800 font-mono pt-1">
                    {formatCurrency(o.total)}
                  </p>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusBadgeStyles(o.status)}`}>
                    {getStatusLabel(o.status)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {clientOrders.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">Nenhum pedido efetuado ainda.</div>
            )}
          </div>
        </div>

        {/* Right column: Track timeline progress focused (7/12 width) */}
        <div id="encomenda-focus-tracker" className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          {focusedOrder ? (
            <div className="space-y-6 text-xs">
              
              {/* Receipt Header info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-800">{focusedOrder.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeStyles(focusedOrder.status)}`}>
                      {getStatusLabel(focusedOrder.status)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Fizeram o pedido em: {formatDateTimeString(focusedOrder.createdAt)}
                  </p>
                  {focusedOrder.paymentMethod && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                      <span className="text-slate-500 font-medium">Pagamento na entrega:</span>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase">
                        {focusedOrder.paymentMethod === 'pix' ? 'Pix 📱' : focusedOrder.paymentMethod === 'credito' ? 'Crédito 💳' : focusedOrder.paymentMethod === 'debito' ? 'Débito 💳' : focusedOrder.paymentMethod}
                      </span>
                    </div>
                  )}
                  {focusedOrder.deliveryMethod && (
                    <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                      <span className="text-slate-500 font-medium">Forma de Recebimento:</span>
                      <span className="bg-slate-50 text-slate-700 border border-slate-200 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase flex items-center gap-0.5">
                        {focusedOrder.deliveryMethod === 'entrega' ? '🚚 Entrega' : '🏠 Retirada'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[9px] text-slate-400 block font-mono font-bold uppercase">Total da Compra</span>
                  <span className="text-base font-black font-mono text-emerald-800">{formatCurrency(focusedOrder.total)}</span>
                </div>
              </div>

              {/* Sequential Progress Timeline (The Core Flow) */}
              <div className="space-y-3">
                <h4 className="font-mono font-bold text-[10.5px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  🎯 Progresso de Desenvolvimento Vegetativo (Estufa)
                </h4>

                <div className="relative pl-6 border-l border-slate-150 space-y-4 my-2">
                  {focusedOrder.status === 'cancelado' ? (
                    <div className="relative pl-2 text-rose-800 bg-rose-50 p-4 rounded-xl border border-rose-150 space-y-1">
                      <span className="absolute -left-[30px] top-4 bg-white h-5 w-5 rounded-full border-2 border-rose-500 text-rose-500 font-bold flex items-center justify-center text-[10px]">
                        ✕
                      </span>
                      <p className="font-bold text-sm">Pedido Rejeitado ou Cancelado</p>
                      <p className="text-xs text-rose-650 leading-relaxed pt-1 select-all">
                        {focusedOrder.statusHistory.find(h => h.status === 'cancelado')?.comment || 'Pedido cancelado pelo administrador.'}
                      </p>
                    </div>
                  ) : (
                    steps.map((st, sIdx) => {
                      const state = getStepState(focusedOrder, st.status, sIdx);
                      return (
                        <div key={st.status} className="relative">
                          {/* Dot logic indicator */}
                          <span className={`absolute -left-[31px] top-0.5 h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center text-[9px] transition ${
                            state === 'completed'
                              ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                              : state === 'active'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-black animate-scale-up border-dashed scale-105 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-350'
                          }`}>
                            {state === 'completed' ? '✓' : st.icon}
                          </span>

                          <div className={`p-2.5 rounded-xl border transition ${
                            state === 'completed'
                              ? 'border-slate-50 bg-slate-50/20'
                              : state === 'active'
                              ? 'border-emerald-500 bg-emerald-50/15'
                              : 'border-slate-50 opacity-55'
                          }`}>
                            <p className={`font-bold ${state === 'active' ? 'text-emerald-950 font-sans' : 'text-slate-800'}`}>
                              {st.label}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {st.desc}
                            </p>
                            {/* Timestamp if logged */}
                            {focusedOrder.statusHistory.find(h => h.status === st.status) && (
                              <span className="text-[9px] text-slate-400 font-mono mt-1.5 block">
                                Registrado em: {formatDateTimeString(focusedOrder.statusHistory.find(h => h.status === st.status)!.updatedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Order breakdown list visual */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="font-mono font-bold text-[10.5px] text-slate-400 uppercase tracking-widest flex items-center gap-1 py-1">
                  <FileText className="w-3.5 h-3.5" /> Detalhamento de Itens Adquiridos
                </h4>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-105 divide-y divide-slate-150">
                  {focusedOrder.items.map((i, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div>
                        <p className="font-bold text-slate-800">{i.productName}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {i.unit === 'un' ? (
                            `${i.quantity} unidade(s) (${formatCurrency(i.pricePerWeight)}/unid)`
                          ) : (
                            `${i.quantity} pacote(s) x ${i.weight}${i.unit} (${formatCurrency(i.pricePerWeight)}/unid)`
                          )}
                        </p>
                      </div>
                      <span className="font-bold font-mono text-slate-800">
                        {formatCurrency(i.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotal & delivery fee breakdown */}
                <div className="bg-slate-50/40 p-3 rounded-xl border border-slate-200/50 space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal de Itens:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatCurrency(focusedOrder.items.reduce((sum, item) => sum + item.subtotal, 0))}
                    </span>
                  </div>
                  {focusedOrder.deliveryMethod === 'entrega' && (
                    <div className="flex justify-between">
                      <span>Taxa de Entrega:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {focusedOrder.deliveryFee === 0 || !focusedOrder.deliveryFee ? 'Grátis' : formatCurrency(focusedOrder.deliveryFee)}
                      </span>
                    </div>
                  )}
                  {focusedOrder.deliveryMethod === 'retirada' && (
                    <div className="flex justify-between">
                      <span>Forma de Recebimento:</span>
                      <span className="font-bold text-emerald-800">Retirada na Estufa (Grátis)</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5 border-t border-slate-200 text-slate-950 font-black">
                    <span>Total Pago / Faturado:</span>
                    <span className="font-mono text-emerald-800">{formatCurrency(focusedOrder.total)}</span>
                  </div>
                </div>

                {focusedOrder.notes && (
                  <div className="bg-purple-50/20 border border-purple-100 p-3 rounded-xl text-slate-650 text-[10.5px]">
                    <p className="font-bold text-purple-900 mb-0.5">📝 Observações Adicionais:</p>
                    <p className="italic leading-relaxed">{focusedOrder.notes}</p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 font-bold">Selecione uma compra para rastrear o crescimento vegetal.</div>
          )}
        </div>

      </div>

    </div>
  );
}
