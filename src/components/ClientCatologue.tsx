/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Customer } from '../types';
import { formatCurrency } from '../utils/helpers';
import { ShoppingCart, Plus, Minus, Trash2, Home, Phone, ShoppingBag, Eye, Scale, Sparkles, CheckCircle2 } from 'lucide-react';

interface ClientCatalogueProps {
  products: Product[];
  currentCustomer: Customer;
  onPlaceOrder: (items: { productId: string; productName: string; quantity: number; weight: number; unit: 'g' | 'kg'; pricePerWeight: number; subtotal: number }[], notes?: string) => void;
  onCartChange?: (isOpen: boolean) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedWeight: 20 | 40 | 60;
  price: number;
}

export default function ClientCatalogue({ products, currentCustomer, onPlaceOrder, onCartChange }: ClientCatalogueProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartLocal, setShowCartLocal] = useState(true);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
  const [selectedWeights, setSelectedWeights] = useState<Record<string, 20 | 40 | 60>>({});

  const showCart = true; // Always display shopping cart as requested
  const setShowCart = (val: boolean) => {
    // Keep it always open
    setShowCartLocal(true);
    if (onCartChange) {
      onCartChange(true);
    }
  };

  // Filter out inactive products (Only display "Ativos")
  const activeProducts = products.filter(p => p.status === 'ativo');

  // Helper to calculate pack price proportionately to the default seed weight
  const getProductPriceForWeight = (product: Product, weight: number): number => {
    let baseWeight = 50; 
    if (product.id === 'prod_2') baseWeight = 100; // Girassol is 100g
    if (product.id === 'prod_5') baseWeight = 40;  // Coentro is 40g
    
    const pricePerGram = product.pricePerWeight / baseWeight;
    return Number((pricePerGram * weight).toFixed(2));
  };

  // Cart operations
  const handleAddToCart = (product: Product, weight: 20 | 40 | 60) => {
    const price = getProductPriceForWeight(product, weight);
    setCart(prev => {
      const existing = prev.find(
        item => item.product.id === product.id && item.selectedWeight === weight
      );
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.selectedWeight === weight
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, selectedWeight: weight, price }];
    });
    setShowCart(true);
    setOrderSuccessId(null);
  };

  const handleUpdateQuantity = (productId: string, weight: 20 | 40 | 60, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId && item.selectedWeight === weight) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: Math.max(newQty, 1) };
        }
        return item;
      });
    });
  };

  const handleRemoveFromCart = (productId: string, weight: 20 | 40 | 60) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.selectedWeight === weight)));
  };

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const totalWeightStr = () => {
    let g = 0;
    cart.forEach(item => {
      g += item.quantity * item.selectedWeight;
    });
    return g >= 1000 ? `${(g / 1000).toFixed(1)} kg` : `${g}g`;
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Convert cart items to order objects
    const orderItems = cart.map(item => {
      return {
        productId: item.product.id,
        productName: `${item.product.name} - Pacote ${item.selectedWeight}g`,
        quantity: item.quantity,
        weight: item.selectedWeight,
        unit: 'g' as const,
        pricePerWeight: item.price,
        subtotal: item.price * item.quantity
      };
    });

    onPlaceOrder(orderItems, orderNotes);

    // Reset shopping cart
    setCart([]);
    setOrderNotes('');
    setShowCart(false);
    
    // Trigger localized visual feedback
    const randomCode = 'PED-' + Math.floor(1000 + Math.random() * 9000);
    setOrderSuccessId(randomCode);
  };

  return (
    <div id="client-catalogue-root" className="space-y-8 relative">
      
      {/* Title greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-105 shadow-sm relative overflow-hidden">
        {/* Absolute fresh decoration style */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 bg-emerald-50 h-32 w-32 rounded-full opacity-40 select-none pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            🌱 Olá, {currentCustomer.name}!
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Explore nossa colheita de microverdes frescos cultivados de forma 100% orgânica e faça sua encomenda.
          </p>
        </div>

        <button
          onClick={() => {
            const el = document.getElementById('shopping-cart-drawer');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
          className="relative bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 font-bold text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-2 shrink-0 select-none transition active:scale-95 cursor-pointer lg:cursor-default lg:hover:bg-emerald-50"
          title="Ver meu carrinho de compras"
        >
          <ShoppingCart className="w-4.5 h-4.5 text-emerald-600" />
          <span>Carrinho de Compras</span>
          {cart.length > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shadow">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Provisional Profile Completion Warning Banner */}
      {(currentCustomer.phone === '(11) 90000-0000' || currentCustomer.address === 'Por favor, atualize seu endereço' || !currentCustomer.phone || !currentCustomer.address) && (
        <div className="bg-amber-50/75 border border-amber-200/85 p-4.5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4.5 animate-scale-up">
          <div className="text-xs text-amber-900 font-sans leading-relaxed flex items-start gap-2.5">
            <span className="text-xl leading-none">⚠️</span>
            <div>
              <p className="font-extrabold text-amber-950">Seu perfil está incompleto!</p>
              <p className="text-[11px] text-amber-850 mt-0.5">Detectamos número de telefone de teste ou endereço genérico. Por favor, clique no botão <strong className="text-amber-950">"Meu Perfil"</strong> no menu do topo da tela para atualizar seu cadastro com endereço correto de entrega e WhatsApp!</p>
            </div>
          </div>
        </div>
      )}

      {/* Success checkout feedback popup */}
      {orderSuccessId && (
        <div className="bg-emerald-50 border border-emerald-250 p-5 rounded-2xl flex items-start gap-4 animate-scale-up">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 text-lg">
            🌱
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-1">
              Ref: {orderSuccessId} • Pedido Criado com Sucesso!
            </h4>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Sua solicitação de microverdes foi encaminhada para a estufa. Agora nosso administrador irá avaliar o pedido para aprovação (Status atual: <strong>Aguardando aprovação</strong>). Você receberá notificações a cada avanço no cultivo ou logística!
            </p>
            <div className="pt-1.5 flex gap-3 text-[11px] font-semibold">
              <span className="text-emerald-800">Acompanhe na aba "Meus Pedidos" à esquerda.</span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Grid split panel: Catalog items list VS Cart sidebar overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Products catalog list - Stable layout structure */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5 transition-all duration-350">
          {activeProducts.map(p => {
            const activeWeight = selectedWeights[p.id] || 20;
            const price = getProductPriceForWeight(p, activeWeight);
            const isOutOfStock = p.availableWeight <= 100; // less than 100g
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-xs transition duration-200 flex flex-col justify-between p-5 relative"
              >
                {/* Visual Accent/Status badging */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-full select-none">
                    🌱 Microverdes
                  </span>
                  {isOutOfStock ? (
                    <span className="bg-rose-50 text-rose-600 font-bold text-[9px] px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-wider font-mono">
                      Esgotado
                    </span>
                  ) : (
                    <span className="bg-slate-50 text-slate-500 font-bold text-[9px] px-2 py-0.5 rounded-full border border-slate-150 uppercase tracking-wider font-mono">
                      Em estoque
                    </span>
                  )}
                </div>

                {/* Content info */}
                <div className="flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-slate-800 tracking-tight leading-snug truncate">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed min-h-12 line-clamp-3">
                      {p.description}
                    </p>
                  </div>

                  <div className="flex items-end justify-between border-t border-slate-100 pt-4 gap-2">
                    {/* Compact Weight Select dropdown */}
                    <div className="w-[88px] shrink-0">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase font-mono tracking-wider mb-1">
                        Tamanho
                      </span>
                      <div className="relative">
                        <select
                          value={activeWeight}
                          onChange={(e) => setSelectedWeights(prev => ({ ...prev, [p.id]: Number(e.target.value) as 20 | 40 | 60 }))}
                          className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl pl-2.5 pr-6 py-2 appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer font-mono transition"
                        >
                          <option value={20}>20g</option>
                          <option value={40}>40g</option>
                          <option value={60}>60g</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-500">
                          <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Subtotal representation based on selection */}
                    <div className="flex-1 text-center pb-0.5">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase font-mono tracking-wider mb-1">
                        Preço
                      </span>
                      <span className="text-[13px] font-black text-emerald-800 font-mono block truncate">
                        {formatCurrency(price)}
                      </span>
                    </div>

                    {/* Quick active Add to Cart trigger action */}
                    <button
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(p, activeWeight)}
                      className={`px-3 py-2 rounded-xl text-xs font-black tracking-tight transition flex items-center gap-1 active:scale-95 shrink-0 h-9.5 ${
                        isOutOfStock 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/40'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs focus:ring-2 focus:ring-emerald-350'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column: Interactive Checkout Cart panel (4/12 width) */}
        {showCart && (
          <div id="shopping-cart-drawer" className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-slide-left lg:sticky lg:top-24">
            <div className="bg-emerald-950 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                🛒 Meu Carrinho
              </h3>
            </div>

            {/* Cart list elements */}
            <div className="p-4 border-b border-slate-100 divide-y divide-slate-105 max-h-72 overflow-y-auto">
              {cart.map(item => (
                <div key={`${item.product.id}-${item.selectedWeight}`} className="py-3 flex items-center justify-between gap-3 text-xs first:pt-0 last:pb-0">
                  <div className="truncate">
                    <p className="font-bold text-slate-800 truncate leading-snug">{item.product.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {formatCurrency(item.price)} • Pacote {item.selectedWeight}g
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 align-middle">
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-150">
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, item.selectedWeight, -1)}
                        className="p-1 hover:bg-white rounded text-slate-650 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-mono font-bold text-slate-800 text-xs">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, item.selectedWeight, 1)}
                        className="p-1 hover:bg-white rounded text-slate-650 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveFromCart(item.product.id, item.selectedWeight)}
                      className="text-slate-400 hover:text-red-650 transition p-1"
                      title="Deletar do carrinho"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">Seu carrinho de compras está vazio.</div>
              )}
            </div>

            {/* Subtotal metadata box */}
            {cart.length > 0 && (
              <form onSubmit={handleCheckoutSubmit} className="p-4 bg-slate-50 text-xs space-y-4">
                
                {/* Weight summing and metrics */}
                <div className="grid grid-cols-2 gap-2 text-slate-650 border-b border-slate-200/50 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase font-mono">Peso Total Colheita</span>
                    <span className="text-xs font-bold font-mono text-slate-800 flex items-center gap-1 mt-0.5"><Scale className="w-3.5 h-3.5 text-emerald-600 inline" /> {totalWeightStr()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase font-mono">Balanço do Carrinho</span>
                    <span className="text-sm font-black font-mono text-emerald-800 mt-0.5">{formatCurrency(cartSubtotal)}</span>
                  </div>
                </div>

                {/* Simulated delivery warning */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">Observações de Endereço ou Entrega</label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    placeholder="Adicione observações para o motoboy ou solicitações especiais de corte..."
                    className="w-full border border-slate-205 rounded-xl px-2.5 py-2 text-slate-800 resize-none focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>

                {/* Default buyer coordinates feedback */}
                <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/50 space-y-1 text-[10.5px]">
                  <p className="font-bold text-emerald-900 flex items-center gap-1">📍 Destinatário</p>
                  <p className="text-slate-700 font-semibold truncate">{currentCustomer.name}</p>
                  <p className="text-slate-500 truncate">{currentCustomer.address}</p>
                  <p className="text-slate-400 mt-1 pl-1 border-l border-emerald-300">
                    O pedido será registrado instantaneamente com seus dados cadastrados.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 shadow transition-all duration-150 active:scale-97"
                >
                  <ShoppingBag className="w-4 h-4" /> Encomendar Microverdes
                </button>
              </form>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
