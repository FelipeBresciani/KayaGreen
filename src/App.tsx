/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Customer, Order, Notification, OrderStatus, ShippingConfig } from './types';


// Firebase core configuration
import { 
  db, 
  auth, 
  isFirebaseConfigured, 
  handleFirestoreError, 
  OperationType 
} from './utils/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';

// Component imports
import RoleSelector from './components/RoleSelector';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import AdminProducts from './components/AdminProducts';
import AdminOrders from './components/AdminOrders';
import AdminCustomers from './components/AdminCustomers';
import AdminReports from './components/AdminReports';
import ClientCatalogue from './components/ClientCatologue';
import ClientOrders from './components/ClientOrders';

// Icons imports
import {
  LayoutDashboard,
  Package,
  FileSpreadsheet,
  Users,
  LineChart,
  ShoppingBag,
  History,
  Info,
  Bell,
  X,
  CheckCircle,
  Menu,
  Sparkles
} from 'lucide-react';



const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  fixedFee: 10.00,
  freeShippingThreshold: 75.00,
  localCity: 'Florianópolis',
  greenhouseBairros: {
    'Centro': 5.00,
    'Trindade': 8.00,
    'Itacorubi': 8.00,
    'Córrego Grande': 8.00,
    'Saco dos Limões': 10.00,
    'Campeche': 15.00,
    'Lagoa da Conceição': 12.00,
    'Ingleses': 20.00,
    'Jurerê': 20.00,
    'Coqueiros': 10.00,
    'Estreito': 10.00
  }
};

export default function App() {
  const useFirebase = isFirebaseConfigured();

  // State definitions loaded from localStorage or initialized with defaults
  const [role, setRole] = useState<'admin' | 'cliente'>(() => {
    return (localStorage.getItem('micro_role') as 'admin' | 'cliente') || 'cliente';
  });

  const [currentCustomerId, setCurrentCustomerId] = useState<string>(() => {
    return localStorage.getItem('micro_customer_id') || '';
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const raw = localStorage.getItem('micro_products');
    return (raw && !useFirebase) ? JSON.parse(raw) : [];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const raw = localStorage.getItem('micro_customers');
    return (raw && !useFirebase) ? JSON.parse(raw) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const raw = localStorage.getItem('micro_orders');
    return (raw && !useFirebase) ? JSON.parse(raw) : [];
  });

  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(() => {
    const raw = localStorage.getItem('micro_shipping_config');
    return raw ? JSON.parse(raw) : DEFAULT_SHIPPING_CONFIG;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const raw = localStorage.getItem('micro_notifications');
    return (raw && !useFirebase) ? JSON.parse(raw) : [];
  });

  const [adminIds, setAdminIds] = useState<string[]>([]);

  // Sidebar Layout States
  const [adminTab, setAdminTab] = useState('Dashboard'); // Dashboard, Produtos, Pedidos, Clientes, Relatórios
  const [clientTab, setClientTab] = useState('Catálogo'); // Catálogo, Meus Pedidos
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Corner floating Toast notifications
  const [toast, setToast] = useState<{ id: number; title: string; message: string } | null>(null);

  // Auth Status loading and session tracking states
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Sync state to localStorage ONLY if Firebase is offline
  useEffect(() => {
    if (!useFirebase) {
      localStorage.setItem('micro_role', role);
      localStorage.setItem('micro_customer_id', currentCustomerId);
      localStorage.setItem('micro_products', JSON.stringify(products));
      localStorage.setItem('micro_customers', JSON.stringify(customers));
      localStorage.setItem('micro_orders', JSON.stringify(orders));
      localStorage.setItem('micro_shipping_config', JSON.stringify(shippingConfig));
      localStorage.setItem('micro_notifications', JSON.stringify(notifications));
    }
  }, [role, currentCustomerId, products, customers, orders, shippingConfig, notifications, useFirebase]);

  // Firebase Realtime Synchronization Listeners
  useEffect(() => {
    if (!useFirebase || !db || !userLoggedIn) return;

    // 1. Sync Catalog Products (Public read catalog)
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prodList: Product[] = [];
      snapshot.forEach(docSnap => {
        prodList.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setProducts(prodList);
    }, (error) => {
      console.warn("Products sync error:", error);
    });

    // 2. Sync Registered Users as Customers (Admin gets full list, Cliente gets their own document)
    let unsubscribeUsers = () => {};
    if (role === 'admin') {
      unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const custList: Customer[] = [];
        snapshot.forEach(docSnap => {
          const d = docSnap.data();
          custList.push({
            id: d.uid || docSnap.id,
            name: d.name || 'Cliente Sem Nome',
            email: d.email || '',
            phone: d.phone || '',
            address: d.address || d.deliveryAddress || '',
            createdAt: d.createdAt || new Date().toISOString()
          });
        });
        setCustomers(custList);
      }, (error) => {
        console.warn("Users sync error:", error);
      });
    } else if (currentCustomerId) {
      unsubscribeUsers = onSnapshot(doc(db, 'users', currentCustomerId), (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          setCustomers([{
            id: d.uid || docSnap.id,
            name: d.name || 'Cliente Sem Nome',
            email: d.email || '',
            phone: d.phone || '',
            address: d.address || d.deliveryAddress || '',
            createdAt: d.createdAt || new Date().toISOString()
          }]);
        } else {
          setCustomers([]);
        }
      }, (error) => {
        console.warn("User self profile sync error:", error);
      });
    }

    // 3. Sync Consolidated Orders (Admin gets all orders, Cliente gets their own orders)
    let unsubscribeOrders = () => {};
    if (role === 'admin') {
      unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        const ordList: Order[] = [];
        snapshot.forEach(docSnap => {
          ordList.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });
        ordList.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(ordList);
      }, (error) => {
        console.warn("Orders sync error:", error);
      });
    } else if (currentCustomerId) {
      unsubscribeOrders = onSnapshot(
        query(collection(db, 'orders'), where('customerId', '==', currentCustomerId)),
        (snapshot) => {
          const ordList: Order[] = [];
          snapshot.forEach(docSnap => {
            ordList.push({ id: docSnap.id, ...docSnap.data() } as Order);
          });
          ordList.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(ordList);
        }, (error) => {
          console.warn("Client orders sync error:", error);
        }
      );
    }

    // 4. Sync Realtime Botanical System Notifications (Admin gets all notifications, Cliente gets their own)
    let unsubscribeNotifications = () => {};
    if (role === 'admin') {
      unsubscribeNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
        const notifList: Notification[] = [];
        snapshot.forEach(docSnap => {
          notifList.push({ id: docSnap.id, ...docSnap.data() } as Notification);
        });
        notifList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(notifList);
      }, (error) => {
        console.warn("Notifications sync error:", error);
      });
    } else if (currentCustomerId) {
      unsubscribeNotifications = onSnapshot(
        query(collection(db, 'notifications'), where('customerId', '==', currentCustomerId)),
        (snapshot) => {
          const notifList: Notification[] = [];
          snapshot.forEach(docSnap => {
            notifList.push({ id: docSnap.id, ...docSnap.data() } as Notification);
          });
          notifList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setNotifications(notifList);
        }, (error) => {
          console.warn("Client notifications sync error:", error);
        }
      );
    }

    // 5. Sync Explicit Administrators Collection (Admin only)
    let unsubscribeAdmins = () => {};
    if (role === 'admin') {
      unsubscribeAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
        const ids: string[] = [];
        snapshot.forEach(docSnap => {
          ids.push(docSnap.id);
        });
        setAdminIds(ids);
      }, (error) => {
        console.warn("Admins sync error:", error);
      });
    }

    // 6. Sync Shipping Configuration (Client and Admin both)
    const unsubscribeShipping = onSnapshot(doc(db, 'shipping_config', 'main_config'), (snapshot) => {
      if (snapshot.exists()) {
        setShippingConfig(snapshot.data() as ShippingConfig);
      } else {
        if (role === 'admin') {
          // Initialize default shipping config if not found
          setDoc(doc(db, 'shipping_config', 'main_config'), DEFAULT_SHIPPING_CONFIG)
            .catch(err => console.warn("Failed to seed default shipping config:", err));
        }
      }
    }, (error) => {
      console.warn("Shipping config sync error:", error);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeUsers();
      unsubscribeOrders();
      unsubscribeNotifications();
      unsubscribeAdmins();
      unsubscribeShipping();
    };
  }, [useFirebase, userLoggedIn, role, currentCustomerId]);

  // Auth Status listener for active session mapping
  useEffect(() => {
    if (!useFirebase || !auth || !db) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          let currentRole: 'admin' | 'cliente' = 'cliente';

          // Automatically bootstrap felipe.bresciani1@gmail.com into admin list
          if (user.email === 'felipe.bresciani1@gmail.com') {
            currentRole = 'admin';
            try {
              await setDoc(doc(db, 'admins', user.uid), {
                assignedBy: 'system_bootstrap',
                assignedAt: new Date().toISOString()
              });
              // Ensure they exist in users with role
              await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: user.displayName || 'Admin Felipe',
                email: user.email,
                phone: '(11) 99999-9999',
                address: 'Florianópolis, SC - Sede Kayagreen',
                role: 'admin',
                createdAt: new Date().toISOString()
              }, { merge: true });

            } catch (e) {
              console.error("Erro bootstrapping admin:", e);
            }
          } else {
            const isAdminCheck = await getDoc(doc(db, 'admins', user.uid));
            if (isAdminCheck.exists()) {
              currentRole = 'admin';
            }
          }

          // Register profile in users if not yet complete
          try {
            let userDoc = await getDoc(doc(db, 'users', user.uid));
            
            // Se for um novo usuário (não o fundador) e o perfil ainda não existir,
            // aguarda breves instantes para permitir que o LoginScreen salve os dados reais inseridos pelo cliente
            if (!userDoc.exists() && user.email !== 'felipe.bresciani1@gmail.com') {
              for (let i = 0; i < 5; i++) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                  break;
                }
              }
            }

            if (!userDoc.exists()) {
              if (user.email === 'felipe.bresciani1@gmail.com') {
                await setDoc(doc(db, 'users', user.uid), {
                  uid: user.uid,
                  name: user.displayName || 'Admin Felipe',
                  email: user.email,
                  phone: '(11) 99999-9999',
                  address: 'Florianópolis, SC - Sede Kayagreen',
                  role: currentRole,
                  createdAt: new Date().toISOString()
                });
              } else {
                await setDoc(doc(db, 'users', user.uid), {
                  uid: user.uid,
                  name: user.displayName || 'Novo Cliente',
                  email: user.email || '',
                  phone: '',
                  address: 'Por favor, atualize seu endereço',
                  role: currentRole,
                  createdAt: new Date().toISOString()
                });
              }
            } else if (user.email !== 'felipe.bresciani1@gmail.com') {
              const currentData = userDoc.data();
              if (currentData && currentData.role !== currentRole) {
                await updateDoc(doc(db, 'users', user.uid), { role: currentRole });
              }
            }
          } catch (e) {
            console.error("Erro verificando usuario", e);
          }

          setRole(currentRole);
          setCurrentCustomerId(user.uid);
          setUserLoggedIn(true);
        } else {
          setUserLoggedIn(false);
          setCurrentCustomerId('');
          setRole('cliente');
        }
      } catch (err) {
        console.error("Auth status routing failed:", err);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [useFirebase]);

  // Toast auto-dismiss triggers after 4.5 seconds
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Toast and push-notification creator helper
  const triggerToastAndNotification = (
    recipient: 'admin' | 'cliente',
    targetCustomerId: string | undefined,
    title: string,
    message: string,
    orderId?: string
  ) => {
    const newNotif: Notification = {
      id: 'not_' + Date.now().toString().slice(-6),
      recipient,
      customerId: targetCustomerId,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
      orderId
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Only show live corner toast if the recipient matches the active view context!
    const isToastVisible = 
      (recipient === 'admin' && role === 'admin') ||
      (recipient === 'cliente' && role === 'cliente' && currentCustomerId === targetCustomerId);

    if (isToastVisible) {
      setToast({
        id: Date.now(),
        title,
        message
      });
    }
  };

  // Profile switches
  const handleSwitchRole = (newRole: 'admin' | 'cliente', customerId: string) => {
    setRole(newRole);
    if (customerId) {
      setCurrentCustomerId(customerId);
    }
    setMobileMenuOpen(false);
  };

  // Sign up simulation (Cadastro de Clientes)
  const handleRegisterCustomer = async (newCustomer: Omit<Customer, 'id' | 'createdAt'>) => {
    const freshId = useFirebase && auth?.currentUser ? auth.currentUser.uid : 'cust_' + (customers.length + 1);
    const dateISO = new Date().toISOString();
    const freshCustomer = {
      uid: freshId,
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      address: newCustomer.address,
      role: 'cliente',
      createdAt: dateISO
    };

    if (useFirebase && db) {
      try {
        await setDoc(doc(db, 'users', freshId), freshCustomer);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `users/${freshId}`);
      }
    } else {
      setCustomers(prev => [...prev, { id: freshId, ...newCustomer, createdAt: dateISO }]);
    }

    setCurrentCustomerId(freshId);
    setRole('cliente');
    setClientTab('Catálogo');

    triggerToastAndNotification(
      'admin',
      undefined,
      'Novo Cliente Cadastrado',
      `O cliente ${newCustomer.name} realizou cadastro no sistema de vendas.`
    );
  };

  // Products CRUD handlers
  const handleAddProduct = async (newProd: Omit<Product, 'id'>) => {
    const freshId = 'prod_' + Date.now().toString().slice(-6);
    const p: Product = {
      id: freshId,
      ...newProd
    };

    if (useFirebase && db) {
      try {
        await setDoc(doc(db, 'products', freshId), p);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `products/${freshId}`);
      }
    } else {
      setProducts(prev => [...prev, p]);
    }

    setToast({
      id: Date.now(),
      title: 'Produto Cadastrado',
      message: `A cultura ${p.name} foi adicionada com sucesso ao menu.`
    });
  };

const handleUpdateProduct = async (updatedProd: Product) => {
  if (useFirebase && db) {
    try {
      await setDoc(doc(db, 'products', updatedProd.id), updatedProd);
      setToast({
        id: Date.now(),
        title: 'Produto Atualizado ✅',
        message: `Os parâmetros de ${updatedProd.name} foram alterados.`
      });
    } catch (e: any) {
      console.error('Erro ao salvar produto:', e);
      setToast({
        id: Date.now(),
        title: 'Erro ao Salvar ❌',
        message: `Falha: ${e?.message || 'Erro desconhecido. Veja o console.'}`
      });
    }
  } else {
    setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
    setToast({
      id: Date.now(),
      title: 'Produto Atualizado',
      message: `Os parâmetros de ${updatedProd.name} foram alterados.`
    });
  }
};

  const handleDeleteProduct = async (id: string) => {
    const item = products.find(p => p.id === id);
    if (useFirebase && db) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
      }
    } else {
      setProducts(prev => prev.filter(p => p.id !== id));
    }

    if (item) {
      setToast({
        id: Date.now(),
        title: 'Produto Excluído',
        message: `A cultura ${item.name} foi removida da base de dados.`
      });
    }
  };

  // Sequential Order Flow handlers
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus, comment?: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const nowISO = new Date().toISOString();
    let updatedProducts = [...products];

    // If moving to 'concluido', adjust product weights from virtual stock
    if (nextStatus === 'concluido') {
      targetOrder.items.forEach(async (item) => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          const weightDelta = item.quantity * item.weight;
          const absoluteNewVol = Math.max(prod.availableWeight - weightDelta, 0);
          
          if (useFirebase && db) {
            try {
              await updateDoc(doc(db, 'products', prod.id), { availableWeight: absoluteNewVol });
            } catch (e) {
              console.error("Erro ao atualizar estoque", e);
            }
          } else {
            updatedProducts = updatedProducts.map(p => p.id === prod.id ? { ...p, availableWeight: absoluteNewVol } : p);
          }
        }
      });
      if (!useFirebase) {
        setProducts(updatedProducts);
      }
    }

    const payload = {
      ...targetOrder,
      status: nextStatus,
      updatedAt: nowISO,
      statusHistory: [
        ...targetOrder.statusHistory,
        { status: nextStatus, updatedAt: nowISO, comment: comment || '' }
      ]
    };

    if (useFirebase && db) {
      try {
        await setDoc(doc(db, 'orders', orderId), payload);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
      }
    } else {
      setOrders(orders.map(o => o.id === orderId ? payload : o));
    }

    // Dynamic Notifications according to requirement 9 (Notificações)
    const clientName = targetOrder.customerName;

    if (nextStatus === 'planejado') {
      triggerToastAndNotification(
        'cliente',
        targetOrder.customerId,
        'Encomenda Aceita! 🤝',
        `Seu pedido ${orderId} foi aceito e agendado com sucesso!`,
        orderId
      );
    } else if (nextStatus === 'em_producao') {
      triggerToastAndNotification(
        'cliente',
        targetOrder.customerId,
        'Em Preparo 📦',
        `Excelentes notícias! Seus microverdes do pedido ${orderId} entraram em fase de preparo e separação para envio.`,
        orderId
      );
    } else if (nextStatus === 'em_entrega') {
      triggerToastAndNotification(
        'cliente',
        targetOrder.customerId,
        'Saiu para Entrega! 🚚',
        `Seu pedido ${orderId} já saiu para entrega e está a caminho do seu endereço!`,
        orderId
      );
    } else if (nextStatus === 'concluido') {
      triggerToastAndNotification(
        'cliente',
        targetOrder.customerId,
        'Entrega Concluída 🎉',
        `Seu pedido ${orderId} foi entregue com sucesso! Obrigado por comprar microverdes sempre frescos!`,
        orderId
      );
    } else if (nextStatus === 'cancelado') {
      triggerToastAndNotification(
        'cliente',
        targetOrder.customerId,
        'Pedido Cancelado',
        `Seu pedido ${orderId} foi cancelado pelo operador: "${comment || 'Cancelado pelo administrador'}"`,
        orderId
      );
      triggerToastAndNotification(
        'admin',
        undefined,
        'Pedido Cancelado / Alterado',
        `O pedido ${orderId} de ${clientName} foi alterado para Cancelado.`,
        orderId
      );
    }
  };

  const handleUpdateShippingConfig = async (newConfig: ShippingConfig) => {
    setShippingConfig(newConfig);
    if (useFirebase && db) {
      try {
        await setDoc(doc(db, 'shipping_config', 'main_config'), newConfig);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'shipping_config/main_config');
      }
    }
  };

  // Client shopping checkout placement handler
  const handlePlaceOrder = async (
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
  ) => {
    const activeCustomer = customers.find(c => c.id === currentCustomerId);
    if (!activeCustomer) return;

    const freshOrderId = 'PED-' + Math.floor(1000 + Math.random() * 9000);
    const nowISO = new Date().toISOString();
    const sumTotalItems = items.reduce((s, i) => s + i.subtotal, 0);
    const sumTotal = sumTotalItems + (deliveryFee || 0);

    const freshOrder: Order = {
      id: freshOrderId,
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      customerEmail: activeCustomer.email,
      customerPhone: activeCustomer.phone,
      customerAddress: activeCustomer.address,
      items,
      total: sumTotal,
      status: 'aguardando_aprovacao',
      createdAt: nowISO,
      updatedAt: nowISO,
      notes: notes || '',
      paymentMethod: paymentMethod || '',
      deliveryMethod: deliveryMethod || 'retirada',
      deliveryFee: deliveryFee || 0,
      statusHistory: [
        { status: 'aguardando_aprovacao', updatedAt: nowISO, comment: 'Pedido submetido pelo cliente. Aguardando aprovação financeira.' }
      ]
    };

    if (useFirebase && db) {
      try {
        await setDoc(doc(db, 'orders', freshOrderId), freshOrder);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `orders/${freshOrderId}`);
      }
    } else {
      setOrders(prev => [freshOrder, ...prev]);
    }

    triggerToastAndNotification(
      'admin',
      undefined,
      'Novo Pedido Recebido',
      `O cliente ${activeCustomer.name} submeteu uma nova encomenda (${freshOrderId}) no valor de R$ ${sumTotal.toFixed(2)}.`,
      freshOrderId
    );

    // Set side tab view
    setClientTab('Meus Pedidos');
  };

  // Notifications operations
  const handleMarkNotificationRead = async (id: string) => {
    if (useFirebase && db) {
      try {
        await updateDoc(doc(db, 'notifications', id), { isRead: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `notifications/${id}`);
      }
    } else {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    const currentUnread = notifications.filter(
      n => !n.isRead && (n.recipient === role && (role === 'admin' || n.customerId === currentCustomerId))
    );

    if (useFirebase && db) {
      currentUnread.forEach(async (n) => {
        try {
          await updateDoc(doc(db, 'notifications', n.id), { isRead: true });
        } catch (e) {
          console.error("Erro limpando notificacao", e);
        }
      });
    } else {
      setNotifications(prev =>
        prev.map(n => {
          const isCurrentTarget = 
            (n.recipient === 'admin' && role === 'admin') ||
            (n.recipient === 'cliente' && role === 'cliente' && n.customerId === currentCustomerId);
          return isCurrentTarget ? { ...n, isRead: true } : n;
        })
      );
    }

    setToast({
      id: Date.now(),
      title: 'Alertas Lidos',
      message: 'Todas as notificações da sessão foram marcadas como lidas.'
    });
  };

  // One-click text Backup exports (Backup periódico)
  const handleBackupData = () => {
    try {
      const backupObj = {
        products,
        customers,
        orders,
        notifications
      };
      const jsonStr = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-estufa-vendas-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
    } catch {
      setToast({
        id: Date.now(),
        title: 'Falha no Backup',
        message: 'Ocorreu um erro ao codificar o arquivo de backup.'
      });
    }
  };

  // Account Privilege Promotion Handler
  const handlePromoteAdmin = async (customerId: string, makeAdmin: boolean) => {
    if (useFirebase && db) {
      try {
        if (makeAdmin) {
          await setDoc(doc(db, 'admins', customerId), {
            assignedBy: auth?.currentUser?.displayName || 'Admin',
            assignedAt: new Date().toISOString()
          });
          await updateDoc(doc(db, 'users', customerId), { role: 'admin' });
        } else {
          await deleteDoc(doc(db, 'admins', customerId));
          await updateDoc(doc(db, 'users', customerId), { role: 'cliente' });
        }
        setToast({
          id: Date.now(),
          title: makeAdmin ? 'Promovido a Admin 🛡️' : 'Admin Removido',
          message: makeAdmin ? 'O usuário recebeu privilégios completos de administrador.' : 'Privilégios de administrador do usuário revogados.'
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `admins/${customerId}`);
      }
    } else {
      // Simulate locally by adding to a mock set
      if (makeAdmin) {
        setAdminIds(prev => [...prev, customerId]);
      } else {
        setAdminIds(prev => prev.filter(id => id !== customerId));
      }
      setToast({
        id: Date.now(),
        title: makeAdmin ? 'Promovido a Admin (Simulação)' : 'Admin Removido (Simulação)',
        message: makeAdmin ? 'O usuário foi promovido localmente para testes.' : 'Acesso Administrador removido localmente.'
      });
    }
  };

  // Validation File restoration
  const handleRestoreData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.products && parsed.customers && parsed.orders && parsed.notifications) {
        setProducts(parsed.products);
        setCustomers(parsed.customers);
        setOrders(parsed.orders);
        setNotifications(parsed.notifications);
        
        setToast({
          id: Date.now(),
          title: 'Backup Restaurado',
          message: 'Os registros de vendas, estufa e histórico foram carregados com sucesso!'
        });
      } else {
        throw new Error('Formato inválido.');
      }
    } catch {
      setToast({
        id: Date.now(),
        title: 'Falha na Restauração',
        message: 'O arquivo .json fornecido é inválido ou está corrompido.'
      });
    }
  };

  // Active profile variables references
  const currentCustomer = customers.find(c => c.id === currentCustomerId) || customers[0] || {
    id: currentCustomerId || 'guest',
    name: 'Cliente',
    email: '',
    phone: '',
    address: 'Por favor, atualize seu endereço',
    createdAt: new Date().toISOString()
  };

  if (useFirebase && authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-450 font-sans p-6">
        <div className="text-center space-y-4">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
          <p className="text-xs font-bold tracking-widest uppercase font-mono">Carregando Kayagreen...</p>
        </div>
      </div>
    );
  }

  if (useFirebase && !userLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col antialiased">
      
      {/* Simulation control Header */}
      <RoleSelector
        currentRole={role}
        currentCustomerId={currentCustomerId}
        customers={customers}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        useFirebase={useFirebase}
      />

      {/* Main Container structure divided into Sidebar (left) and Panel Content (right) */}
      <div id="application-layout-grid" className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6 relative">
        
        {/* Navigation Sidebar Drawer */}
        <aside
          id="role-sidebar-navigation"
          className={`lg:w-64 bg-white text-slate-700 rounded-2xl flex flex-col justify-between p-5 border border-slate-200 shadow-sm ${
            mobileMenuOpen ? 'fixed inset-y-0 left-0 z-40 w-64' : 'hidden lg:flex shrink-0'
          }`}
        >
          <div className="space-y-6">
            
            {/* Kayagreen Brand Logo & Name Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100/80">
              <div className="flex items-center gap-3">
                <div className="bg-slate-50 border border-slate-100/60 p-1.5 rounded-xl w-11 h-11 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  <img
                    src="https://ugc.production.linktr.ee/d7ee3797-a896-427c-8af9-dda870971839_MARCA-KAYACV-03.png"
                    alt="Kayagreen Logo"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 tracking-tight block leading-snug">
                    Kayagreen
                  </span>
                  <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm uppercase tracking-wider select-none font-mono">
                    Microverdes
                  </span>
                </div>
              </div>

              {/* Close Drawer Button on Mobile */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition cursor-pointer"
                title="Fechar Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Header / active profile tag */}
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-widest block mb-1">
                Acesso Ativo
              </span>
              <p className="font-extrabold text-sm truncate text-slate-800">
                {role === 'admin' ? '💼 Central de Gestão' : `👤 ${currentCustomer?.name || 'Cliente'}`}
              </p>
            </div>

            {/* Sidebar Buttons navigation */}
            <nav className="space-y-1.5 text-xs font-semibold">
              
              {role === 'admin' ? (
                // ADMIN Tabs
                <>
                  <button
                    onClick={() => { setAdminTab('Dashboard'); setMobileMenuOpen(false); }}
                    className={`nav-btn w-full px-3.5 py-2.5 rounded-xl text-left flex items-center gap-2.5 transition ${
                      adminTab === 'Dashboard' ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/70 shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                    title="Dashboard Geral"
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>Dashboard Geral</span>
                  </button>
                  <button
                    onClick={() => { setAdminTab('Produtos'); setMobileMenuOpen(false); }}
                    className={`nav-btn w-full px-3.5 py-2.5 rounded-xl text-left flex items-center gap-2.5 transition ${
                      adminTab === 'Produtos' ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/70 shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                    title="Gestão de Produtos"
                  >
                    <Package className="w-4 h-4 shrink-0" />
                    <span>Gestão de Produtos</span>
                  </button>
                  <button
                    onClick={() => { setAdminTab('Pedidos'); setMobileMenuOpen(false); }}
                    className={`nav-btn w-full px-3.5 py-2.5 rounded-xl text-left flex items-center gap-2.5 transition relative ${
                      adminTab === 'Pedidos' ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/70 shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                    title="Fila de Pedidos"
                  >
                    <FileSpreadsheet className="w-4 h-4 shrink-0" />
                    <span>Fila de Pedidos</span>
                    {orders.filter(o => o.status === 'aguardando_aprovacao').length > 0 && (
                      <span className="ml-auto bg-amber-500 text-slate-900 font-extrabold text-[9px] h-4 px-1.5 rounded-full flex items-center justify-center animate-bounce">
                        {orders.filter(o => o.status === 'aguardando_aprovacao').length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => { setAdminTab('Clientes'); setMobileMenuOpen(false); }}
                    className={`nav-btn w-full px-3.5 py-2.5 rounded-xl text-left flex items-center gap-2.5 transition ${
                      adminTab === 'Clientes' ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/70 shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                    title="Carteira de Clientes"
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Carteira de Clientes</span>
                  </button>
                  <button
                    onClick={() => { setAdminTab('Relatórios'); setMobileMenuOpen(false); }}
                    className={`nav-btn w-full px-3.5 py-2.5 rounded-xl text-left flex items-center gap-2.5 transition ${
                      adminTab === 'Relatórios' ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/70 shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                    title="Relatórios de Venda"
                  >
                    <LineChart className="w-4 h-4 shrink-0" />
                    <span>Relatórios de Venda</span>
                  </button>
                </>
              ) : (
                // CUSTOMER Tabs
                <>
                  <button
                    onClick={() => { setClientTab('Catálogo'); setMobileMenuOpen(false); }}
                    className={`nav-btn w-full px-3.5 py-2.5 rounded-xl text-left flex items-center gap-2.5 transition ${
                      clientTab === 'Catálogo' ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/70 shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                    title="Catálogo de Estufa"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>Catálogo de Estufa</span>
                  </button>
                  <button
                    onClick={() => { setClientTab('Meus Pedidos'); setMobileMenuOpen(false); }}
                    className={`nav-btn w-full px-3.5 py-2.5 rounded-xl text-left flex items-center gap-2.5 transition relative ${
                      clientTab === 'Meus Pedidos' ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/70 shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                    title="Minhas Encomendas"
                  >
                    <History className="w-4 h-4 shrink-0" />
                    <span>Minhas Encomendas</span>
                    {orders.filter(o => o.customerId === currentCustomerId && ['aguardando_aprovacao', 'planejado', 'em_producao', 'em_entrega'].includes(o.status)).length > 0 && (
                      <span className="ml-auto bg-emerald-500 text-emerald-950 font-black text-[9px] h-4 px-1.5 rounded-full flex items-center justify-center">
                        {orders.filter(o => o.customerId === currentCustomerId && ['aguardando_aprovacao', 'planejado', 'em_producao', 'em_entrega'].includes(o.status)).length}
                      </span>
                    )}
                  </button>
                </>
              )}

            </nav>
          </div>

          {/* Botanical safety footer */}
          <div className="border-t border-slate-100 pt-4 text-[10px] text-slate-400 leading-normal space-y-1 mt-6">
            <p>🔄 Integridade da Estufa: 100%</p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=S%C3%A3o+Caetano+do+Sul+-+SP+-+Brasil"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-emerald-600 transition cursor-pointer"
              title="Ver no Google Maps"
            >
              <span>📍 São Caetano do Sul - SP - Brasil</span>
            </a>
          </div>
        </aside>

        {/* Backgdrop overlay for mobile drawers */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 lg:hidden z-30"
          />
        )}

        {/* Primary Content panel (Right) */}
        <main id="primary-content-view" className="flex-1 w-full space-y-4">
          
          {/* Mobile responsive toggle header bar */}
          <div className="lg:hidden flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm mb-2 text-xs">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="bg-slate-100 hover:bg-slate-150 p-2 rounded-xl text-slate-705 border border-slate-200"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <span className="font-bold text-slate-800">
              {role === 'admin' ? `Operador: ${adminTab}` : `Comprando: ${clientTab}`}
            </span>
            <div className="w-9 h-9 bg-emerald-100 rounded-xl text-lg flex items-center justify-center">🌱</div>
          </div>

          {/* Dynamic views routing blocks */}
          <div id="active-routed-panel">
            {role === 'admin' ? (
              // ADMIN VIEWS ROUTING
              <>
                {adminTab === 'Dashboard' && (
                  <AdminDashboard
                    orders={orders}
                    customers={customers}
                    products={products}
                    onNavigateTo={(tab) => setAdminTab(tab)}
                    shippingConfig={shippingConfig}
                    onUpdateShippingConfig={handleUpdateShippingConfig}
                  />
                )}
                {adminTab === 'Produtos' && (
                  <AdminProducts
                    products={products}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                  />
                )}
                {adminTab === 'Pedidos' && (
                  <AdminOrders
                    orders={orders}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                  />
                )}
                {adminTab === 'Clientes' && (
                  <AdminCustomers
                    customers={customers}
                    orders={orders}
                    onPromoteAdmin={handlePromoteAdmin}
                    adminIds={adminIds}
                  />
                )}
                {adminTab === 'Relatórios' && (
                  <AdminReports
                    orders={orders}
                    products={products}
                    customers={customers}
                  />
                )}
              </>
            ) : (
              // CLIENT VIEWS ROUTING
              <>
                {clientTab === 'Catálogo' && (
                  <ClientCatalogue
                    products={products}
                    currentCustomer={currentCustomer}
                    onPlaceOrder={handlePlaceOrder}
                    onCartChange={(isOpen) => setCartOpen(isOpen)}
                    shippingConfig={shippingConfig}
                  />
                )}
                {clientTab === 'Meus Pedidos' && (
                  <ClientOrders
                    orders={orders}
                    currentCustomerId={currentCustomer.id}
                  />
                )}
              </>
            )}
          </div>

        </main>
      </div>

      {/* Floating Corner Toasts notifications alert overlays */}
      {toast && (
        <div
          id="toast-floating-banner"
          className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-4 max-w-sm w-80 z-50 animate-scale-up flex gap-3 text-xs"
        >
          <div className="h-8 w-8 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center text-sm font-bold shrink-0">
            🌱
          </div>
          <div className="space-y-1 select-none flex-1">
            <p className="font-extrabold text-white text-xs">{toast.title}</p>
            <p className="text-slate-350 leading-relaxed text-[11px] font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-500 hover:text-white h-fit p-0.5"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
