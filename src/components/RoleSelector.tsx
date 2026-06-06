import React, { useState } from 'react';
import { Customer, Notification } from '../types';
import { 
  Bell, 
  Shield, 
  User, 
  LogOut, 
  Settings, 
  MapPin, 
  Phone, 
  X, 
  Check, 
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { formatDateTimeString } from '../utils/helpers';
import { auth as firebaseAuthInstance, db } from '../utils/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

interface RoleSelectorProps {
  currentRole: 'admin' | 'cliente';
  currentCustomerId: string;
  customers: Customer[];
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  useFirebase?: boolean;
}

export default function RoleSelector({
  currentRole,
  currentCustomerId,
  customers,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  useFirebase = false
}: RoleSelectorProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Find currently logged-in customer info
  const activeCustomer = customers.find(c => c.id === currentCustomerId);

  // Form states initialized only on open
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  
  // Structured address fields
  const [editCep, setEditCep] = useState('');
  const [editStreetAndNum, setEditStreetAndNum] = useState('');
  const [editComplement, setEditComplement] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');

  const formatPhone = (input: string) => {
    const digits = input.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatCep = (input: string) => {
    const digits = input.replace(/\D/g, '').slice(0, 8);
    if (!digits) return '';
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const parseAddressString = (addressStr: string) => {
    const parts = {
      cep: '',
      streetAndNum: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: ''
    };

    if (!addressStr || addressStr.toLowerCase().includes('atualize') || addressStr.toLowerCase().includes('favor')) {
      return parts;
    }

    try {
      // 1. CEP matching
      const cepMatch = addressStr.match(/CEP:\s*(\d{5}-?\d{3})/i) || addressStr.match(/\b(\d{5}-\d{3})\b/);
      if (cepMatch) {
        parts.cep = cepMatch[1];
        addressStr = addressStr.replace(/,?\s*CEP:\s*\d{5}-?\d{3}/i, '').replace(/,?\s*\d{5}-\d{3}/, '');
      }

      // 2. Split into segments
      const segmentWithState = addressStr.split(' - ').map(s => s.trim());
      if (segmentWithState.length >= 3) {
        parts.streetAndNum = segmentWithState[0];
        
        const middle = segmentWithState[1].split(',').map(s => s.trim());
        if (middle.length >= 2) {
          parts.neighborhood = middle[0];
          parts.city = middle[1];
        } else {
          parts.neighborhood = segmentWithState[1];
        }
        parts.state = segmentWithState[2].substring(0, 2).toUpperCase();
      } else {
        const commaSegments = addressStr.split(',').map(s => s.trim());
        if (commaSegments.length >= 1) parts.streetAndNum = commaSegments[0];
        if (commaSegments.length >= 2) parts.neighborhood = commaSegments[1];
        if (commaSegments.length >= 3) parts.city = commaSegments[2];
        if (commaSegments.length >= 4) {
          parts.state = commaSegments[3].substring(0, 2).toUpperCase();
        }
      }
    } catch (e) {
      console.error('Error parsing address', e);
    }
    return parts;
  };

  const handleCepChange = async (cepValue: string) => {
    const formatted = formatCep(cepValue);
    setEditCep(formatted);

    const cleared = cepValue.replace(/\D/g, '');
    if (cleared.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleared}/json/`);
        const data = await res.json();
        if (!data.erro) {
          if (data.logradouro) setEditStreetAndNum(data.logradouro);
          if (data.bairro) setEditNeighborhood(data.bairro);
          if (data.localidade) setEditCity(data.localidade);
          if (data.uf) setEditState(data.uf);
        }
      } catch (err) {
        console.error('Erro de busca de CEP:', err);
      }
    }
  };

  const initForm = () => {
    if (activeCustomer) {
      setEditName(activeCustomer.name || '');
      setEditPhone(formatPhone(activeCustomer.phone || ''));
      
      const rawAddress = activeCustomer.address || '';
      const parsed = parseAddressString(rawAddress);
      setEditCep(parsed.cep ? formatCep(parsed.cep) : '');
      setEditStreetAndNum(parsed.streetAndNum || '');
      setEditComplement(parsed.complement || '');
      setEditNeighborhood(parsed.neighborhood || '');
      setEditCity(parsed.city || '');
      setEditState(parsed.state || 'SP');
    }
    setErrorMsg('');
    setSuccessMsg('');
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentCustomerId) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (!editName.trim()) {
        throw new Error('O campo nome não pode estar vazio.');
      }
      if (!editPhone.trim()) {
        throw new Error('O telefone não pode estar vazio.');
      }
      if (!editStreetAndNum.trim() || !editNeighborhood.trim() || !editCity.trim() || !editCep.trim()) {
        throw new Error('Por favor, preencha todos os campos obrigatórios do endereço (CEP, Rua/Número, Bairro e Cidade).');
      }
      
      const compiledAddress = `${editStreetAndNum.trim()}${editComplement.trim() ? `, ${editComplement.trim()}` : ''} - ${editNeighborhood.trim()}, ${editCity.trim()} - ${editState.trim()}, CEP: ${editCep.trim()}`;

      const userRef = doc(db, 'users', currentCustomerId);
      await updateDoc(userRef, {
        name: editName.trim(),
        phone: editPhone.trim(),
        address: compiledAddress
      });

      setSuccessMsg('Informações de perfil salvas com sucesso!');
      setTimeout(() => {
        setShowProfileModal(false);
      }, 1550);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocorreu um erro ao atualizar suas informações.');
    } finally {
      setLoading(true);
      // Wait briefly for firestore realtime sync to write
      setTimeout(() => setLoading(false), 550);
    }
  };

  const handleSignOut = async () => {
    if (!firebaseAuthInstance) return;
    try {
      await signOut(firebaseAuthInstance);
    } catch (err) {
      console.error('Erro ao sair da conta:', err);
    }
  };

  // Active notifications counts
  const unreadNotifications = notifications.filter(
    n => !n.isRead && (n.recipient === currentRole && (currentRole === 'admin' || n.customerId === currentCustomerId))
  );

  const displayedNotifications = notifications.filter(
    n => n.recipient === currentRole && (currentRole === 'admin' || n.customerId === currentCustomerId)
  ).slice(0, 10);

  return (
    <div id="role-selector-container" className="bg-emerald-950 text-white border-b border-emerald-900 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg w-9 h-9 flex items-center justify-center overflow-hidden shadow-sm select-none shrink-0">
            <img
              src="https://ugc.production.linktr.ee/d7ee3797-a896-427c-8af9-dda870971839_MARCA-KAYACV-03.png"
              alt="Logo Kayagreen"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight leading-none text-emerald-50">
              Kayagreen
            </h1>
            <p className="text-[9px] font-mono text-emerald-400 mt-1 hidden min-[400px]:block">
              Painel de Pedidos & Cultivo de Microverdes
            </p>
          </div>
        </div>

        {/* Right: Status and Navigation Menu */}
        <div className="flex items-center gap-3">
          
          {/* Quick Notifications panel */}
          <div className="relative">
            <button
              id="notification-trigger"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-emerald-900 rounded-lg text-emerald-200 hover:text-white transition duration-150 relative cursor-pointer"
              title="Notificações"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                id="notifications-dropdown"
                className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in"
              >
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900 flex items-center gap-1">
                    🔔 Alertas da Estufa ({currentRole === 'admin' ? 'Painel' : 'Cliente'})
                  </span>
                  {unreadNotifications.length > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="text-[10px] text-emerald-600 hover:text-emerald-800 underline font-semibold"
                    >
                      Ler todas
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {displayedNotifications.length === 0 ? (
                    <div className="py-6 px-4 text-center text-xs text-gray-400">
                      Nenhuma notificação cadastrada.
                    </div>
                  ) : (
                    displayedNotifications.map(n => (
                      <div
                        key={n.id}
                        className={`px-4 py-2.5 border-b border-gray-50 last:border-0 flex flex-col gap-0.5 hover:bg-gray-50 transition duration-150 ${
                          !n.isRead ? 'bg-emerald-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-[11px] text-gray-800 leading-snug">
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <button
                              onClick={() => {
                                onMarkNotificationRead(n.id);
                              }}
                              className="text-[9px] text-emerald-600 hover:underline font-bold shrink-0"
                            >
                              Marcar lida
                            </button>
                          )}
                        </div>
                        <p className="text-[10.5px] text-gray-500 leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[9px] text-gray-400 mt-0.5">
                          {formatDateTimeString(n.createdAt)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-emerald-900" />

          {/* User controls */}
          {currentRole === 'admin' ? (
            /* ADMIN CONTROLS */
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-900 border border-emerald-800 rounded-full px-3 py-1 flex items-center gap-1 text-emerald-200 select-none">
                <Shield className="w-3.5 h-3.5 text-amber-500" /> Admin
              </span>
              <button
                onClick={handleSignOut}
                className="bg-emerald-800 hover:bg-rose-900 text-emerald-200 hover:text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-all cursor-pointer active:scale-95"
                title="Sair do painel de administração"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair da Conta</span>
              </button>
            </div>
          ) : (
            /* CLIENT CONTROLS */
            <div className="flex items-center gap-2">
              {/* Profile edit trigger */}
              <button
                onClick={initForm}
                className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 hover:text-white py-1.5 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Editar minhas informações de endereço e perfil"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[65px] min-[400px]:max-w-[120px] truncate">
                  {activeCustomer?.name || 'Meu Perfil'}
                </span>
                <Settings className="w-3 h-3 text-emerald-500 ml-0.5" />
              </button>

              <button
                onClick={handleSignOut}
                className="bg-emerald-950 hover:bg-rose-905 text-emerald-300 hover:text-white font-bold p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                title="Desconectar do sistema"
              >
                <LogOut className="w-3.8 h-3.8" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Profile Modal for editing client info directly in Firestore */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-backdrop">
          <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-2xl p-6 w-full max-w-md relative animate-scale-up space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Atualizar Meus Dados</h3>
                  <p className="text-[10px] text-slate-400">Edite seu endereço de entrega e telefone</p>
                </div>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-950/80 border border-rose-900/60 p-2.5 rounded-lg text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-950/80 border border-emerald-900/60 p-2.5 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <p>{successMsg}</p>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-wider">Nome Completo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500 font-sans transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-wider">Telefone / WhatsApp</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={e => setEditPhone(formatPhone(e.target.value))}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500 font-sans transition-colors"
                  />
                </div>
              </div>

              {/* Enhanced structured address editing */}
              <div className="space-y-3 border-t border-slate-900 pt-3">
                <h4 className="text-[10px] font-extrabold text-emerald-450 uppercase tracking-widest">Endereço de Entrega</h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1 col-span-1">
                    <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-wider">CEP</label>
                    <input
                      type="text"
                      required
                      value={editCep}
                      onChange={e => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500 font-sans transition-colors font-mono"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-wider">Rua e Número</label>
                    <input
                      type="text"
                      required
                      value={editStreetAndNum}
                      onChange={e => setEditStreetAndNum(e.target.value)}
                      placeholder="Av. Paulista, 1000"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500 font-sans transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-wider">Bairro</label>
                    <input
                      type="text"
                      required
                      value={editNeighborhood}
                      onChange={e => setEditNeighborhood(e.target.value)}
                      placeholder="Centro"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500 font-sans transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-wider">Complemento / Apto</label>
                    <input
                      type="text"
                      value={editComplement}
                      onChange={e => setEditComplement(e.target.value)}
                      placeholder="Ex: Apto 12"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500 font-sans transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1 col-span-2">
                    <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-wider">Cidade</label>
                    <input
                      type="text"
                      required
                      value={editCity}
                      onChange={e => setEditCity(e.target.value)}
                      placeholder="Cidade"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500 font-sans transition-colors"
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-wider">Estado (UF)</label>
                    <select
                      value={editState}
                      onChange={e => setEditState(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-sans transition-colors cursor-pointer"
                    >
                      {['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'].map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-850 pt-4 flex gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold py-2 rounded-xl border border-slate-800 text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-black py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
