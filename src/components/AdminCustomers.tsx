/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, Order } from '../types';
import { formatCurrency, formatDateString, getStatusBadgeStyles, getStatusLabel } from '../utils/helpers';
import { Users, Search, Phone, Mail, MapPin, Calendar, Clock, ShoppingCart, TrendingUp, MessageCircle } from 'lucide-react';

interface AdminCustomersProps {
  customers: Customer[];
  orders: Order[];
  onPromoteAdmin?: (customerId: string, makeAdmin: boolean) => void;
  adminIds?: string[];
}

export default function AdminCustomers({ customers, orders, onPromoteAdmin, adminIds = [] }: AdminCustomersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );
  });

  // Highlighted / Selected customer details
  const activeCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  // Compile individual stats
  const getCustomerMetrics = (cId: string) => {
    const customerOrders = orders.filter(o => o.customerId === cId);
    const completedOrders = customerOrders.filter(o => o.status === 'concluido');
    const totalSpent = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const frequency = completedOrders.length;
    
    // Most popular microgreen variety bought by this customer
    const counts: Record<string, number> = {};
    completedOrders.forEach(o => {
      o.items.forEach(itm => {
        counts[itm.productName] = (counts[itm.productName] || 0) + itm.quantity;
      });
    });
    
    const favoriteVar = Object.entries(counts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Nenhuma';

    return {
      history: customerOrders,
      completedCount: frequency,
      totalSpent,
      favoriteVar,
    };
  };

  const selectedMetrics = activeCustomer ? getCustomerMetrics(activeCustomer.id) : null;

  return (
    <div id="admin-customers-root" className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold font-sans text-slate-900 tracking-tight flex items-center gap-2">
          👥 Gestão de Clientes Ativos
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Acesse a carteira de contatos, dados de faturamento individuais e verifique os volumes de consumo.
        </p>
      </div>

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Customers Directory list (5/12 width) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 focus:outline-none focus:border-emerald-500 rounded-xl text-xs text-slate-800"
            />
          </div>

          <div className="space-y-2 max-h-120 overflow-y-auto pr-1">
            {filteredCustomers.map(c => {
              const metr = getCustomerMetrics(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`p-3.5 rounded-xl border text-xs text-left cursor-pointer transition-all flex items-center justify-between gap-4 ${
                    selectedCustomerId === c.id || (!selectedCustomerId && activeCustomer?.id === c.id)
                      ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-250/20'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="font-bold text-slate-800 truncate text-xs">{c.name}</p>
                      
                      {/* Interactive WhatsApp quick message trigger button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const cleanDigits = c.phone.replace(/\D/g, '');
                          const url = `https://wa.me/${cleanDigits.startsWith('55') ? cleanDigits : '55' + cleanDigits}`;
                          window.open(url, '_blank', 'refr=noreferrer');
                        }}
                        className="bg-emerald-55 hover:bg-emerald-100 p-1.5 rounded-lg border border-emerald-100 transition text-emerald-700 shrink-0 select-none cursor-pointer"
                        title="Iniciar Chat no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{c.email}</p>
                    <p className="text-[10px] text-slate-550 font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400 inline" /> {c.phone}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold font-mono text-emerald-800">{formatCurrency(metr.totalSpent)}</p>
                    <p className="text-[9px] text-slate-400 font-semibold">{metr.completedCount} ped. concl.</p>
                  </div>
                </div>
              );
            })}
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-medium">Nenhum cliente cadastrado ainda.</div>
            )}
          </div>
        </div>

        {/* Right: Selected Customer Metrics & Purchase History (7/12 width) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          {activeCustomer ? (
            <div className="space-y-6">
              
              {/* Profile Card Summary */}
              <div id="customer-profile-card" className="border-b border-slate-100 pb-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-base shadow-inner">
                    {activeCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-slate-800 leading-tight">
                        {activeCustomer.name}
                      </h3>
                      {adminIds.includes(activeCustomer.id) ? (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                          🛡️ Administrador
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                          👤 Cliente
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-450 mt-1 flex items-center gap-1 pb-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      Cadastrado em: {formatDateString(activeCustomer.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Sub contact cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-slate-650 truncate select-all">{activeCustomer.email}</span>
                  </div>
                   <div className="bg-slate-50 p-2 rounded-xl border border-slate-100/50 flex items-center justify-between gap-1.5 sm:col-span-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-slate-650 font-mono select-all truncate">{activeCustomer.phone}</span>
                    </div>
                    <button
                      onClick={() => {
                        const cleanDigits = activeCustomer.phone.replace(/\D/g, '');
                        const url = `https://wa.me/${cleanDigits.startsWith('55') ? cleanDigits : '55' + cleanDigits}`;
                        window.open(url, '_blank', 'refr=noreferrer');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                      title="Chamar Cliente no WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 flex items-center gap-2 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-slate-650 leading-relaxed truncate" title={activeCustomer.address}>
                      {activeCustomer.address}
                    </span>
                  </div>
                </div>

                {/* Account role settings */}
                {onPromoteAdmin && (
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-slate-800">Controle de Privilégios</p>
                      <p className="text-[10px] text-slate-400">Determine se este cadastro possui privilégios de Operador/Admin no sistema.</p>
                    </div>
                    <button
                      onClick={() => onPromoteAdmin(activeCustomer.id, !adminIds.includes(activeCustomer.id))}
                      className={`font-black text-[9px] uppercase tracking-wider py-1.5 px-3.5 rounded-lg transition shrink-0 active:scale-95 ${
                        adminIds.includes(activeCustomer.id)
                          ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                      }`}
                    >
                      {adminIds.includes(activeCustomer.id) ? "Remover Admin ✕" : "Tornar Admin 🛡️"}
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Grid for Selected Customer */}
              {selectedMetrics && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-emerald-50/55 p-3.5 rounded-xl border border-emerald-100/60">
                    <span className="text-[9px] text-emerald-800 font-mono font-bold tracking-wider uppercase block">
                      Total Consumido
                    </span>
                    <span className="text-base font-extrabold font-mono text-emerald-900 mt-1 block">
                      {formatCurrency(selectedMetrics.totalSpent)}
                    </span>
                  </div>
                  <div className="bg-indigo-50/55 p-3.5 rounded-xl border border-indigo-100/60">
                    <span className="text-[9px] text-indigo-800 font-mono font-bold tracking-wider uppercase block">
                      Pedidos Finalizados
                    </span>
                    <span className="text-base font-extrabold font-mono text-indigo-900 mt-1 block">
                      {selectedMetrics.completedCount} vezes
                    </span>
                  </div>
                  <div className="bg-teal-50/55 p-3.5 rounded-xl border border-teal-100/60">
                    <span className="text-[9px] text-teal-800 font-mono font-bold tracking-wider uppercase block">
                      Variedade Preferida
                    </span>
                    <span className="text-xs font-bold text-teal-900 mt-1 block truncate">
                      {selectedMetrics.favoriteVar}
                    </span>
                  </div>
                </div>
              )}

              {/* Purchase history list of products */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-50">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" /> Histórico Operacional de Pedidos ({selectedMetrics?.history.length})
                </h4>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedMetrics?.history.map((o, idx) => (
                    <div
                      key={o.id}
                      className="p-3 bg-slate-50/60 border border-slate-100 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">{o.id}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{formatDateString(o.createdAt)}</span>
                        </div>
                        {/* List products names */}
                        <p className="text-[10px] text-slate-500 mt-1.5">
                          {o.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                        </p>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-bold font-mono text-slate-700">{formatCurrency(o.total)}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusBadgeStyles(o.status)}`}>
                          {getStatusLabel(o.status)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {selectedMetrics?.history.length === 0 && (
                    <div className="text-center py-8 text-slate-400">Este cliente ainda não realizou pedidos.</div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-16 text-center text-slate-405 font-bold">Nenhum cliente cadastrado.</div>
          )}
        </div>

      </div>

    </div>
  );
}
