/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, WeightUnit } from '../types';
import { Plus, Edit2, Trash2, Package, Scale, DollarSign, Eye, EyeOff } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

interface AdminProductsProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

// Fallback image url for any newly created products so they still render nicely elsewhere
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&q=80&w=400';

export default function AdminProducts({ products, onAddProduct, onUpdateProduct, onDeleteProduct }: AdminProductsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [availableWeight, setAvailableWeight] = useState(1000);
  const [unit, setUnit] = useState<WeightUnit>('g');
  const [pricePerWeight, setPricePerWeight] = useState(15.00);
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setAvailableWeight(1000);
    setUnit('g');
    setPricePerWeight(15.00);
    setStatus('ativo');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description);
    setAvailableWeight(p.availableWeight);
    setUnit(p.unit);
    setPricePerWeight(p.pricePerWeight);
    setStatus(p.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || pricePerWeight <= 0 || availableWeight < 0) return;

    if (editingProduct) {
      onUpdateProduct({
        id: editingProduct.id,
        name,
        description,
        availableWeight: Number(availableWeight),
        unit,
        pricePerWeight: Number(pricePerWeight),
        image: editingProduct.image || DEFAULT_FALLBACK_IMAGE,
        status,
      });
    } else {
      onAddProduct({
        name,
        description,
        availableWeight: Number(availableWeight),
        unit,
        pricePerWeight: Number(pricePerWeight),
        image: DEFAULT_FALLBACK_IMAGE,
        status,
      });
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (p: Product) => {
    onUpdateProduct({
      ...p,
      status: p.status === 'ativo' ? 'inativo' : 'ativo',
    });
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmationId) {
      onDeleteProduct(deleteConfirmationId);
      setDeleteConfirmationId(null);
    }
  };

  return (
    <div id="admin-products-root" className="space-y-6">
      
      {/* Header and Add buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-900 tracking-tight flex items-center gap-2">
            🌱 Módulo de Produtos
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre novas culturas, acompanhe quantidades disponíveis e defina preços no catálogo.
          </p>
        </div>
        <button
          id="btn-cadastrar-produto"
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition duration-200 shrink-0 self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" /> Cadastrar Produto
        </button>
      </div>

      {/* Simplified Bento Clean Table Container */}
      <div className="bento-card p-0 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Produtos Cadastrados ({products.length})</span>
        </div>
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-550 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-4">Cultura / Nome</th>
                <th className="p-4">Descrição</th>
                <th className="p-4 text-center">Unidade</th>
                <th className="p-4 text-right">Estoque</th>
                <th className="p-4 text-right">Preço</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map(p => (
                <tr 
                  key={p.id} 
                  className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${
                    p.status === 'inativo' ? 'bg-slate-50/40 text-slate-400' : 'text-slate-700'
                  }`}
                >
                  <td className="p-4 font-semibold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-base select-none">🌱</span>
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="p-4 max-w-xs truncate" title={p.description}>
                    {p.description}
                  </td>
                  <td className="p-4 text-center font-medium font-mono text-slate-500">
                    {p.unit === 'g' ? '50g (Pacote)' : '1kg'}
                  </td>
                  <td className="p-4 text-right font-bold font-mono">
                    <span className={`${p.availableWeight <= 200 ? 'text-amber-600' : 'text-slate-700'}`}>
                      {p.availableWeight} {p.unit}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold font-mono text-emerald-700">
                    {formatCurrency(p.pricePerWeight)}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(p)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                        p.status === 'ativo'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                      title="Clique para alternar o status"
                    >
                      {p.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                        title="Editar produto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Deletar produto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <span>Nenhum produto cadastrado. Adicione um novo utilizando o botão no topo.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card-based layout - Premium responsiveness */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 md:hidden">
          {products.map(p => (
            <div
              key={p.id}
              className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition bg-white ${
                p.status === 'inativo' ? 'border-slate-100 bg-slate-50/45 opacity-75' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-805 text-xs truncate">
                    <span>🌱</span>
                    <span className="truncate">{p.name}</span>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(p)}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition shrink-0 ${
                      p.status === 'ativo'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-slate-100 text-slate-550 border-slate-200'
                    }`}
                  >
                    {p.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed" title={p.description}>
                  {p.description}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between font-mono text-[10px] gap-2">
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8px] tracking-wide">Preço base</span>
                  <span className="font-bold text-emerald-700 text-xs">{formatCurrency(p.pricePerWeight)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block uppercase font-bold text-[8px] tracking-wide">Disponível ({p.unit})</span>
                  <span className={`font-bold text-xs ${p.availableWeight <= 200 ? 'text-amber-600' : 'text-slate-700'}`}>
                    {p.availableWeight} {p.unit}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-end gap-2">
                <button
                  onClick={() => openEditModal(p)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-650 hover:text-emerald-750 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-650 hover:text-white hover:bg-rose-600 bg-rose-50/50 border border-slate-200 rounded-lg flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="p-8 text-center text-slate-400 font-medium col-span-1 sm:col-span-2">
              <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <span>Nenhum produto cadastrado.</span>
            </div>
          )}
        </div>
      </div>

      {/* Safety Deletion Modal Dialog inside iframe to replace browser alerts */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-100 text-center space-y-4 animate-scale-up">
            <div className="bg-rose-100 text-rose-700 h-12 w-12 rounded-full flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Excluir este microverde?</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Você tem certeza que deseja excluir este produto? Esta ação é permanente e pode afetar a leitura de pedidos históricos no sistema.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-rose-605 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs transition"
              >
                Sim, Excluir
              </button>
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition"
              >
                Não, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Dialog Modal for Add/Edit */}
      {isModalOpen && (
        <div id="product-modal-dialog" className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md my-8 overflow-hidden animate-scale-up">
            
            {/* Modal header */}
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌱</span>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">
                    {editingProduct ? 'Editar Microverde' : 'Cadastrar Novo Microverde'}
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">
                    {editingProduct ? 'Modificar dados no catálogo' : 'Adicionar cultura à estufa'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-300 hover:text-white p-1 rounded-full hover:bg-emerald-900 transition text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              
              {/* Product NAME */}
              <div>
                <label className="block text-xs font-bold text-slate-705 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Microverdes de Manjericão Roxo"
                  className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              {/* Product DESCRIPTION */}
              <div>
                <label className="block text-xs font-bold text-slate-705 mb-1">Descrição</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descreva coloração, harmonização ou benefícios..."
                  className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-3 py-2 text-slate-800 resize-none"
                />
              </div>

              {/* Weight and pricing Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Available Weight */}
                <div>
                  <label className="block text-xs font-bold text-slate-705 mb-1 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-emerald-600" /> Estoque
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={availableWeight}
                    onChange={e => setAvailableWeight(Number(e.target.value))}
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>

                {/* Weight Unit */}
                <div>
                  <label className="block text-xs font-bold text-slate-705 mb-1">Unidade</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value as WeightUnit)}
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-3 py-2 text-slate-800 bg-white"
                  >
                    <option value="g">Gramas (g)</option>
                    <option value="kg">Quilos (kg)</option>
                  </select>
                </div>

                {/* Price per weight unit */}
                <div>
                  <label className="block text-xs font-bold text-slate-705 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min={0.01}
                    value={pricePerWeight}
                    onChange={e => setPricePerWeight(Number(e.target.value))}
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>

              </div>

              {/* Status active/inactive toggle */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-850">Ativar no Catálogo?</p>
                  <p className="text-[10px] text-slate-400">Variedades inativas são ocultadas de novos pedidos.</p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setStatus(status === 'ativo' ? 'inativo' : 'ativo')}
                    className={`w-12 h-6 rounded-full p-0.5 transition-all duration-300 ${
                      status === 'ativo' ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-300 ${
                        status === 'ativo' ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Footer Form Controls */}
              <div className="flex gap-2 pt-4 border-t border-slate-50">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition duration-200"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl px-4 transition"
                >
                  Cancelar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
