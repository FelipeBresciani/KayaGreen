/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Customer, ShippingConfig } from '../types';
import { formatCurrency } from '../utils/helpers';
import { ShoppingCart, Plus, Minus, Trash2, Home, Phone, ShoppingBag, Eye, Scale, Sparkles, CheckCircle2, Truck } from 'lucide-react';

interface ClientCatalogueProps {
  products: Product[];
  currentCustomer: Customer;
  onPlaceOrder: (
    items: {
      productId: string;
      productName: string;
      quantity: number;
      weight: number;
      unit: 'g' | 'kg' | 'un';
      pricePerWeight: number;
      subtotal: number;
    }[],
    notes?: string,
    paymentMethod?: string,
    deliveryMethod?: 'entrega' | 'retirada',
    deliveryFee?: number
  ) => void;
  onCartChange?: (isOpen: boolean) => void;
  shippingConfig?: ShippingConfig;
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedWeight: number;
  price: number;
}

export default function ClientCatalogue({ products, currentCustomer, onPlaceOrder, onCartChange, shippingConfig }: ClientCatalogueProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartLocal, setShowCartLocal] = useState(true);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
  const [selectedWeights, setSelectedWeights] = useState<Record<string, number>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'pix' | 'credito' | 'debito'>('pix');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Shipping choice state
  const [deliveryMethod, setDeliveryMethod] = useState<'entrega' | 'retirada'>('entrega');

  const getDeliveryFee = (): number => {
    if (deliveryMethod === 'retirada') return 0;
    
    // Auto-free-shipping calculation
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const threshold = shippingConfig?.freeShippingThreshold ?? 75;
    if (subtotal >= threshold) return 0;

    const addressStr = currentCustomer.address || '';
    
    // Match customized neighborhood rates
    const bairrosMap = shippingConfig?.greenhouseBairros ?? {};
    const addressUpper = addressStr.toUpperCase();
    
    for (const [bairro, fee] of Object.entries(bairrosMap)) {
      if (addressUpper.includes(bairro.toUpperCase())) {
        return fee;
      }
    }
    
    return shippingConfig?.fixedFee ?? 10;
  };

  const deliveryFee = getDeliveryFee();

  // Auto-clear error message after 7 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const isProfileIncomplete = !currentCustomer.phone || 
                              currentCustomer.phone.trim() === '' || 
                              currentCustomer.phone === '(11) 90000-0000' || 
                              currentCustomer.phone === '(11) 99999-9999' ||
                              currentCustomer.phone.replace(/\D/g, '') === '11900000000' ||
                              currentCustomer.phone.replace(/\D/g, '') === '11999999999' ||
                              !currentCustomer.address || 
                              currentCustomer.address.trim() === '' || 
                              currentCustomer.address === 'Por favor, atualize seu endereço' ||
                              currentCustomer.address.toLowerCase().includes('kayagreen');

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
    if (weight === 20 && product.price20g !== undefined) return product.price20g;
    if (weight === 40 && product.price40g !== undefined) return product.price40g;
    if (weight === 60 && product.price60g !== undefined) return product.price60g;

    let baseWeight = 20; // Default base weight for new products is 20g
    if (product.id === 'prod_1') baseWeight = 50;  // Rúcula: price is for 50g
    if (product.id === 'prod_2') baseWeight = 100; // Girassol: price is for 100g
    if (product.id === 'prod_3') baseWeight = 50;  // Rabanete: price is for 50g
    if (product.id === 'prod_4') baseWeight = 50;  // Brócolis: price is for 50g
    if (product.id === 'prod_5') baseWeight = 40;  // Coentro: price is for 40g
    if (product.id === 'prod_6') baseWeight = 50;  // Beterraba: price is for 50g
    if (product.id === 'prod_7') baseWeight = 50;  // Repolho Roxo: price is for 50g
    
    const pricePerGram = product.pricePerWeight / baseWeight;
    return Number((pricePerGram * weight).toFixed(2));
  };

  // Cart operations
  const handleAddToCart = (product: Product, weight: number) => {
    const isUnidade = product.saleType === 'unidade';
    const finalWeight = isUnidade ? 1 : weight;
    const price = isUnidade ? product.pricePerWeight : getProductPriceForWeight(product, finalWeight);

    const currentQtyInCart = cart
      .filter(item => item.product.id === product.id)
      .reduce((sum, item) => sum + (item.quantity * item.selectedWeight), 0);
    
    if (currentQtyInCart + finalWeight > product.availableWeight) {
      if (isUnidade) {
        setErrorMessage(`Estoque insuficiente de ${product.name}! Você já adicionou ${currentQtyInCart} un ao carrinho e o estoque máximo restante é de ${product.availableWeight} un.`);
      } else {
        setErrorMessage(`Estoque insuficiente de ${product.name}! Você já adicionou ${currentQtyInCart}g ao carrinho e o estoque máximo restante é de ${product.availableWeight}g.`);
      }
      setOrderSuccessId(null);
      return;
    }

    setErrorMessage(null);
    setCart(prev => {
      const existing = prev.find(
        item => item.product.id === product.id && item.selectedWeight === finalWeight
      );
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.selectedWeight === finalWeight
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, selectedWeight: finalWeight, price }];
    });
    setShowCart(true);
    setOrderSuccessId(null);
  };

  const handleUpdateQuantity = (productId: string, weight: number, delta: number) => {
    setCart(prev => {
      const itemToUpdate = prev.find(item => item.product.id === productId && item.selectedWeight === weight);
      if (!itemToUpdate) return prev;

      const isUnidade = itemToUpdate.product.saleType === 'unidade';

      if (delta > 0) {
        const currentQtyInCart = prev
          .filter(item => item.product.id === productId)
          .reduce((sum, item) => sum + (item.quantity * item.selectedWeight), 0);
        
        if (currentQtyInCart + weight > itemToUpdate.product.availableWeight) {
          if (isUnidade) {
            setErrorMessage(`Estoque insuficiente! O estoque total para ${itemToUpdate.product.name} é de ${itemToUpdate.product.availableWeight} un.`);
          } else {
            setErrorMessage(`Estoque insuficiente! O estoque total para ${itemToUpdate.product.name} é de ${itemToUpdate.product.availableWeight}g.`);
          }
          return prev;
        }
      }

      setErrorMessage(null);
      return prev.map(item => {
        if (item.product.id === productId && item.selectedWeight === weight) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: Math.max(newQty, 1) };
        }
        return item;
      });
    });
  };

  const handleRemoveFromCart = (productId: string, weight: number) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.selectedWeight === weight)));
  };

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const totalWeightStr = () => {
    let g = 0;
    let units = 0;
    cart.forEach(item => {
      if (item.product.saleType === 'unidade') {
        units += item.quantity;
      } else {
        g += item.quantity * item.selectedWeight;
      }
    });

    const parts = [];
    if (g > 0) {
      parts.push(g >= 1000 ? `${(g / 1000).toFixed(1)} kg` : `${g}g`);
    }
    if (units > 0) {
      parts.push(`${units} un`);
    }
    return parts.length > 0 ? parts.join(' + ') : '0g';
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || isProfileIncomplete) return;

    // Validate cart items total weight for each product against available weight
    for (const item of cart) {
      const p = products.find(prod => prod.id === item.product.id);
      if (p) {
        const colheitaInCart = cart
          .filter(cit => cit.product.id === p.id)
          .reduce((sum, cit) => sum + (cit.quantity * cit.selectedWeight), 0);
        if (colheitaInCart > p.availableWeight) {
          setErrorMessage(`⚠️ Seu carrinho excede o estoque disponível de ${p.name}! (No carrinho: ${colheitaInCart}g | Disponível: ${p.availableWeight}g)`);
          return;
        }
      }
    }

    setErrorMessage(null);
    setShowConfirmModal(true);
  };

  const handleFinalOrderConfirm = () => {
    if (cart.length === 0 || isProfileIncomplete) return;

    // Final security check for stock
    for (const item of cart) {
      const p = products.find(prod => prod.id === item.product.id);
      if (p) {
        const colheitaInCart = cart
          .filter(cit => cit.product.id === p.id)
          .reduce((sum, cit) => sum + (cit.quantity * cit.selectedWeight), 0);
        if (colheitaInCart > p.availableWeight) {
          setErrorMessage(`⚠️ Seu carrinho excede o estoque disponível de ${p.name}! (No carrinho: ${colheitaInCart}g | Disponível: ${p.availableWeight}g)`);
          setShowConfirmModal(false);
          return;
        }
      }
    }

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

    onPlaceOrder(orderItems, orderNotes, selectedPayment, deliveryMethod, deliveryFee);

    // Reset shopping cart
    setCart([]);
    setOrderNotes('');
    setShowConfirmModal(false);
    
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
      {isProfileIncomplete && (
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

      {/* Error message feedback banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200/60 p-4 rounded-2xl flex items-start gap-3 animate-scale-up relative">
          <div className="h-6 w-6 rounded-full bg-rose-105 flex items-center justify-center text-rose-800 shrink-0 text-sm">
            ⚠️
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-rose-900 leading-normal mb-0.5">Controle de Estoque</p>
            <p className="text-xs text-rose-700 leading-relaxed font-semibold">
              {errorMessage}
            </p>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="absolute top-3 right-3 text-rose-450 hover:text-rose-800 focus:outline-none transition font-black text-sm cursor-pointer px-1.5 py-0.5"
          >
            ×
          </button>
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
            const isUnidade = p.saleType === 'unidade';
            const currentWeightInCart = cart
              .filter(item => item.product.id === p.id)
              .reduce((sum, item) => sum + (item.quantity * item.selectedWeight), 0);
            
            const remainingWeight = p.availableWeight - currentWeightInCart;
            const isOutOfStock = isUnidade ? p.availableWeight < 1 : p.availableWeight < 20;

            let activeWeight = isUnidade ? 1 : (selectedWeights[p.id] || 20);
            if (!isUnidade && activeWeight > remainingWeight && remainingWeight >= 20) {
              if (remainingWeight >= 60) activeWeight = 60;
              else if (remainingWeight >= 40) activeWeight = 40;
              else if (remainingWeight >= 20) activeWeight = 20;
            }

            const price = isUnidade ? p.pricePerWeight : getProductPriceForWeight(p, activeWeight);
            const isOutOfStockForCart = isUnidade ? remainingWeight < 1 : remainingWeight < 20;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-xs transition duration-200 flex flex-col justify-between p-5 relative"
              >
                {/* Visual Accent/Status badging */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-full select-none">
                    🌱 {isUnidade ? 'Unidade' : 'Microverdes'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {currentWeightInCart > 0 && (
                      <span className="bg-emerald-50 text-emerald-700 font-bold text-[9px] px-2 py-0.5 rounded-full border border-emerald-100/40 transition">
                        No carrinho: {currentWeightInCart}{isUnidade ? ' un' : 'g'}
                      </span>
                    )}
                    {isOutOfStock ? (
                      <span className="bg-rose-50 text-rose-600 font-bold text-[9px] px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-wider font-mono">
                        Esgotado
                      </span>
                    ) : p.availableWeight <= (isUnidade ? 5 : 150) ? (
                      <span className="bg-amber-50 text-amber-700 font-bold text-[9px] px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider font-mono">
                        Restam {p.availableWeight}{isUnidade ? ' un' : 'g'}
                      </span>
                    ) : (
                      <span className="bg-slate-50 text-slate-500 font-bold text-[9px] px-2 py-0.5 rounded-full border border-slate-150 uppercase tracking-wider font-mono">
                        Estoque: {p.availableWeight}{isUnidade ? ' un' : 'g'}
                      </span>
                    )}
                  </div>
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
                    {isUnidade ? (
                      <div className="w-[88px] shrink-0 font-sans">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase font-mono tracking-wider mb-1">
                          Venda
                        </span>
                        <div className="bg-blue-50 text-blue-800 text-[10px] font-black tracking-wide rounded-xl py-2 px-1 text-center border border-blue-105 select-none leading-normal">
                          Por Unidade
                        </div>
                      </div>
                    ) : (
                      <div className="w-[88px] shrink-0">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase font-mono tracking-wider mb-1">
                          Tamanho
                        </span>
                        <div className="relative">
                          <select
                            value={activeWeight}
                            onChange={(e) => setSelectedWeights(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                            className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl pl-2.5 pr-6 py-2 appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer font-mono transition"
                          >
                            <option value={20} disabled={remainingWeight < 20}>20g</option>
                            <option value={40} disabled={remainingWeight < 40}>40g</option>
                            <option value={60} disabled={remainingWeight < 60}>60g</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-500">
                            <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}

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
                      disabled={isOutOfStock || isOutOfStockForCart || remainingWeight < activeWeight}
                      onClick={() => handleAddToCart(p, activeWeight)}
                      className={`px-3 py-2 rounded-xl text-xs font-black tracking-tight transition flex items-center gap-1 active:scale-95 shrink-0 h-9.5 cursor-pointer ${
                        (isOutOfStock || isOutOfStockForCart || remainingWeight < activeWeight)
                          ? 'bg-slate-155 text-slate-400 cursor-not-allowed border border-slate-200/40 select-none'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs focus:ring-2 focus:ring-emerald-350'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isOutOfStockForCart ? 'Sem estoque' : remainingWeight < activeWeight ? 'Esgotado' : 'Adicionar'}
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
              {cart.map(item => {
                const totalWeightInCartForThisProduct = cart
                  .filter(cit => cit.product.id === item.product.id)
                  .reduce((sum, cit) => sum + (cit.quantity * cit.selectedWeight), 0);
                const isPlusDisabled = totalWeightInCartForThisProduct + item.selectedWeight > item.product.availableWeight;

                return (
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
                          className="p-1 hover:bg-white rounded text-slate-650 transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono font-bold text-slate-800 text-xs">{item.quantity}</span>
                        <button
                          disabled={isPlusDisabled}
                          onClick={() => handleUpdateQuantity(item.product.id, item.selectedWeight, 1)}
                          className={`p-1 rounded text-slate-650 transition ${isPlusDisabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : 'hover:bg-white cursor-pointer'}`}
                          title={isPlusDisabled ? "Estoque total atingido" : "Aumentar quantidade"}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveFromCart(item.product.id, item.selectedWeight)}
                        className="text-slate-450 hover:text-red-600 transition p-1 cursor-pointer"
                        title="Deletar do carrinho"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

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

                {/* Method selection (Entrega vs Retirada) */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">Como deseja receber?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('entrega')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold text-center flex items-center justify-center gap-1.5 transition cursor-pointer select-none outline-none ${
                        deliveryMethod === 'entrega'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-extrabold shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Entrega em Casa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('retirada')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold text-center flex items-center justify-center gap-1.5 transition cursor-pointer select-none outline-none ${
                        deliveryMethod === 'retirada'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-extrabold shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Retirar na Estufa</span>
                    </button>
                  </div>
                </div>

                {/* Shipping cost indicator box */}
                <div className="bg-white rounded-xl border border-slate-200/70 p-3 space-y-2">
                  <div className="flex justify-between items-center text-[11px] text-slate-600">
                    <span>Produtos Subtotal:</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(cartSubtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-600">Taxa de Frete / Envio:</span>
                    {deliveryMethod === 'retirada' ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">Grátis (Retirada)</span>
                    ) : deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5 animate-pulse">🚚 Frete Grátis</span>
                    ) : (
                      <span className="font-mono font-bold text-slate-800">{formatCurrency(deliveryFee)}</span>
                    )}
                  </div>
                  
                  {deliveryMethod === 'entrega' && deliveryFee > 0 && shippingConfig && (
                    <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between">
                      <span>Faltam <strong className="text-emerald-750 font-mono">{(formatCurrency(shippingConfig.freeShippingThreshold - cartSubtotal))}</strong> para Frete Grátis!</span>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-xs text-slate-800 font-extrabold">
                    <span>Total Estimado:</span>
                    <span className="font-mono text-emerald-800 text-sm font-black">{formatCurrency(cartSubtotal + deliveryFee)}</span>
                  </div>
                </div>

                {/* Simulated delivery warning */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">Observações do Pedido</label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    placeholder="Observações de acesso, ponto de referência ou preferências..."
                    className="w-full border border-slate-205 rounded-xl px-2.5 py-2 text-slate-800 resize-none focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>

                {/* Default buyer coordinates feedback */}
                <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/50 space-y-1 text-[10.5px]">
                  <p className="font-bold text-emerald-900 flex items-center gap-1">📍 Destinatário</p>
                  <p className="text-slate-700 font-semibold truncate">{currentCustomer.name}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentCustomer.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:text-emerald-700 transition block truncate underline decoration-dotted cursor-pointer"
                    title="Ver endereço no Google Maps"
                  >
                    {currentCustomer.address}
                  </a>
                  <p className="text-slate-400 mt-1 pl-1 border-l border-emerald-300">
                    O pedido será registrado instantaneamente com seus dados cadastrados.
                  </p>
                </div>

                {/* Submit button */}
                {isProfileIncomplete ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-amber-600 font-bold bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center">
                      ⚠️ Você precisa atualizar seu telefone e endereço de entrega no menu superior "Meu Perfil" antes de enviar o pedido.
                    </p>
                    <button
                      type="button"
                      disabled
                      className="w-full bg-slate-200 text-slate-400 font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 cursor-not-allowed select-none"
                    >
                      <ShoppingBag className="w-4 h-4 cursor-not-allowed" /> Pedido Bloqueado (Perfil Incompleto)
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 shadow transition-all duration-150 active:scale-97 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" /> Encomendar Microverdes
                  </button>
                )}
              </form>
            )}
          </div>
        )}

      </div>
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full p-6 space-y-5 animate-scale-up">
            <div className="text-center space-y-1">
              <span className="text-3xl">🛒</span>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">Confirmar Encomenda</h3>
              <p className="text-xs text-slate-500">Por favor, escolha um método de pagamento e confirme seus dados.</p>
            </div>

            {/* Order total info */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2.5 text-xs">
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 font-sans">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-705">
                    <span>{item.quantity}x {item.product.name} ({item.selectedWeight}g)</span>
                    <span className="font-mono text-slate-800 font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-250 pt-2 space-y-1.5 text-[11px] font-sans">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal de Itens</span>
                  <span className="font-mono text-slate-750">{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Forma de Recebimento</span>
                  <span className="font-bold text-slate-700">{deliveryMethod === 'entrega' ? '🚚 Entrega em Casa' : '🏠 Retirar na Estufa'}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Taxa de Envio</span>
                  <span className="font-mono font-bold text-slate-800">
                    {deliveryMethod === 'retirada' ? 'R$ 0,00' : deliveryFee === 0 ? 'Grátis (Cortesia)' : formatCurrency(deliveryFee)}
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-200/60 pt-2 flex justify-between font-bold text-sm text-slate-800">
                <span>Total Geral a Pagar</span>
                <span className="font-mono text-emerald-700">{formatCurrency(cartSubtotal + deliveryFee)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Forma de Pagamento na Entrega:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayment('pix')}
                  className={`py-2 px-3 rounded-xl border-2 text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    selectedPayment === 'pix'
                      ? 'border-emerald-500 bg-emerald-50/40 text-emerald-800'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                  }`}
                >
                  <span className="text-md">📱</span>
                  <span>Pix</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayment('credito')}
                  className={`py-2 px-3 rounded-xl border-2 text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    selectedPayment === 'credito'
                      ? 'border-emerald-500 bg-emerald-50/40 text-emerald-800'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                  }`}
                >
                  <span className="text-md">💳</span>
                  <span>Crédito</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayment('debito')}
                  className={`py-2 px-3 rounded-xl border-2 text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    selectedPayment === 'debito'
                      ? 'border-emerald-500 bg-emerald-50/40 text-emerald-800'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                  }`}
                >
                  <span className="text-md">🏦</span>
                  <span>Débito</span>
                </button>
              </div>
            </div>

            {/* Notice block */}
            <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 text-center">
              <p className="text-[11px] text-amber-850 leading-normal font-medium">
                🚚 <strong>Aviso:</strong> O pagamento será realizado apenas no momento da entrega dos seus microverdes!
              </p>
            </div>

            {/* Buttons path */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl border border-slate-200 transition text-xs cursor-pointer text-center select-none"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleFinalOrderConfirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition text-xs cursor-pointer text-center select-none shadow-sm"
              >
                Confirmar e Encomendar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
