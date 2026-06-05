/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Customer, Order, Notification } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Microverdes de Rúcula',
    description: 'Sabor picante e marcante. Excelente para finalização de pratos finos, saladas e massas.',
    availableWeight: 2500, // 2.5kg
    unit: 'g',
    pricePerWeight: 14.50, // Price per 50g unit
    image: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&q=80&w=400',
    status: 'ativo',
  },
  {
    id: 'prod_2',
    name: 'Microverdes de Girassol',
    description: 'Textura extremamente crocante e sabor adocicado de castanha. Ideal para sanduíches e sucos verdes.',
    availableWeight: 5000, // 5kg
    unit: 'g',
    pricePerWeight: 12.00, // Price per 100g unit
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400',
    status: 'ativo',
  },
  {
    id: 'prod_3',
    name: 'Microverdes de Rabanete',
    description: 'Coloração vermelha vibrante com sabor picante clássico do rabanete. Muito nutritivo e digestivo.',
    availableWeight: 3100,
    unit: 'g',
    pricePerWeight: 15.00, // Price per 50g unit
    image: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&q=80&w=400',
    status: 'ativo',
  },
  {
    id: 'prod_4',
    name: 'Microverdes de Brócolis',
    description: 'Sabor suave e neutro, carregado com altas doses de sulforafano e antioxidantes indispensáveis.',
    availableWeight: 4000,
    unit: 'g',
    pricePerWeight: 16.00, // Price per 50g unit
    image: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&q=80&w=400',
    status: 'ativo',
  },
  {
    id: 'prod_5',
    name: 'Microverdes de Coentro',
    description: 'Sabor super concentrado de coentro. Perfeito para culinária mexicana, peixes, drinks e ceviches.',
    availableWeight: 1800,
    unit: 'g',
    pricePerWeight: 18.00, // Price per 40g unit
    image: 'https://images.unsplash.com/photo-1588691535490-6ecf56a64b97?auto=format&fit=crop&q=80&w=400',
    status: 'ativo',
  },
  {
    id: 'prod_6',
    name: 'Microverdes de Beterraba',
    description: 'Caules vermelhos intensos e folhas verdes com veios. Uma presença visual incrível com sabor adocicado de terra.',
    availableWeight: 2000,
    unit: 'g',
    pricePerWeight: 16.50, // Price per 50g unit
    image: 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?auto=format&fit=crop&q=80&w=400',
    status: 'ativo',
  },
  {
    id: 'prod_7',
    name: 'Microverdes de Repolho Roxo',
    description: 'Tom roxo escuro espetacular, sabor leve de repolho e excelente aporte de vitaminas A, C e E.',
    availableWeight: 1500,
    unit: 'g',
    pricePerWeight: 15.50, // Price per 50g unit
    image: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&q=80&w=400',
    status: 'inativo', // Seeded as inactive for admin demo
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: 'Mariana Silva',
    phone: '(11) 98765-4321',
    email: 'mariana.silva@email.com',
    address: 'Av. Paulista, 1200 - Ap 45, Bela Vista, São Paulo - SP',
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'cust_2',
    name: 'Carlos Oliveira (Restaurante Manjericão)',
    phone: '(11) 97777-8888',
    email: 'contato@restaurantemanjericao.com.br',
    address: 'Rua dos Pinheiros, 450, Pinheiros, São Paulo - SP',
    createdAt: '2026-03-12T14:30:00Z',
  },
  {
    id: 'cust_3',
    name: 'Beatriz Costa',
    phone: '(11) 99123-4567',
    email: 'beatriz.costa@email.com',
    address: 'Alameda Lorena, 890 - Casa, Jardim Paulista, São Paulo - SP',
    createdAt: '2026-04-05T11:15:00Z',
  },
  {
    id: 'cust_4',
    name: 'Rodrigo Santos (Buffet Verde Oliva)',
    phone: '(11) 96543-2109',
    email: 'rodrigo.santos@verdeoliva.com',
    address: 'Rua Augusta, 2100 - Bloco B, Consolação, São Paulo - SP',
    createdAt: '2026-04-20T09:40:00Z',
  }
];

// Helper to generate ISO strings relative to the baseline current date 2026-06-05
export const getPastDateISO = (daysAgo: number, hoursOffset = 10, minutesOffset = 0): string => {
  const date = new Date('2026-06-05T19:00:00Z');
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hoursOffset);
  date.setMinutes(minutesOffset);
  return date.toISOString();
};

export const INITIAL_ORDERS: Order[] = [
  // MARCH 2026 (Historical completed orders)
  {
    id: 'PED-1001',
    customerId: 'cust_1',
    customerName: 'Mariana Silva',
    customerEmail: 'mariana.silva@email.com',
    customerPhone: '(11) 98765-4321',
    customerAddress: 'Av. Paulista, 1200 - Ap 45, Bela Vista, São Paulo - SP',
    items: [
      {
        productId: 'prod_1',
        productName: 'Microverdes de Rúcula',
        quantity: 2,
        weight: 50,
        unit: 'g',
        pricePerWeight: 14.50,
        subtotal: 29.00
      },
      {
        productId: 'prod_2',
        productName: 'Microverdes de Girassol',
        quantity: 1,
        weight: 100,
        unit: 'g',
        pricePerWeight: 12.00,
        subtotal: 12.00
      }
    ],
    total: 41.00,
    status: 'concluido',
    createdAt: getPastDateISO(90, 9, 30), // ~March 7
    updatedAt: getPastDateISO(87, 16, 0),
    statusHistory: [
      { status: 'aguardando_aprovacao', updatedAt: getPastDateISO(90, 9, 30) },
      { status: 'planejado', updatedAt: getPastDateISO(89, 10, 0) },
      { status: 'em_producao', updatedAt: getPastDateISO(88, 8, 0) },
      { status: 'em_entrega', updatedAt: getPastDateISO(87, 14, 0) },
      { status: 'concluido', updatedAt: getPastDateISO(87, 16, 0), comment: 'Entregue com sucesso' }
    ]
  },
  {
    id: 'PED-1002',
    customerId: 'cust_2',
    customerName: 'Carlos Oliveira (Restaurante Manjericão)',
    customerEmail: 'contato@restaurantemanjericao.com.br',
    customerPhone: '(11) 97777-8888',
    customerAddress: 'Rua dos Pinheiros, 450, Pinheiros, São Paulo - SP',
    items: [
      {
        productId: 'prod_2',
        productName: 'Microverdes de Girassol',
        quantity: 8,
        weight: 100,
        unit: 'g',
        pricePerWeight: 12.00,
        subtotal: 96.00
      },
      {
        productId: 'prod_4',
        productName: 'Microverdes de Brócolis',
        quantity: 5,
        weight: 50,
        unit: 'g',
        pricePerWeight: 16.00,
        subtotal: 80.00
      }
    ],
    total: 176.00,
    status: 'concluido',
    createdAt: getPastDateISO(82, 14, 15), // ~March 15
    updatedAt: getPastDateISO(78, 11, 30),
    statusHistory: [
      { status: 'aguardando_aprovacao', updatedAt: getPastDateISO(82, 14, 15) },
      { status: 'planejado', updatedAt: getPastDateISO(81, 9, 0) },
      { status: 'em_producao', updatedAt: getPastDateISO(80, 8, 0) },
      { status: 'em_entrega', updatedAt: getPastDateISO(78, 10, 0) },
      { status: 'concluido', updatedAt: getPastDateISO(78, 11, 30) }
    ]
  },

  // APRIL 2026
  {
    id: 'PED-1003',
    customerId: 'cust_3',
    customerName: 'Beatriz Costa',
    customerEmail: 'beatriz.costa@email.com',
    customerPhone: '(11) 99123-4567',
    customerAddress: 'Alameda Lorena, 890 - Casa, Jardim Paulista, São Paulo - SP',
    items: [
      {
        productId: 'prod_3',
        productName: 'Microverdes de Rabanete',
        quantity: 3,
        weight: 50,
        unit: 'g',
        pricePerWeight: 15.00,
        subtotal: 45.00
      },
      {
        productId: 'prod_1',
        productName: 'Microverdes de Rúcula',
        quantity: 2,
        weight: 50,
        unit: 'g',
        pricePerWeight: 14.50,
        subtotal: 29.00
      }
    ],
    total: 74.00,
    status: 'concluido',
    createdAt: getPastDateISO(58, 10, 5), // ~April 8
    updatedAt: getPastDateISO(54, 15, 0),
    statusHistory: [
      { status: 'aguardando_aprovacao', updatedAt: getPastDateISO(58, 10, 5) },
      { status: 'planejado', updatedAt: getPastDateISO(57, 9, 0) },
      { status: 'em_producao', updatedAt: getPastDateISO(56, 8, 30) },
      { status: 'em_entrega', updatedAt: getPastDateISO(54, 13, 0) },
      { status: 'concluido', updatedAt: getPastDateISO(54, 15, 0) }
    ]
  },
  {
    id: 'PED-1004',
    customerId: 'cust_2',
    customerName: 'Carlos Oliveira (Restaurante Manjericão)',
    customerEmail: 'contato@restaurantemanjericao.com.br',
    customerPhone: '(11) 97777-8888',
    customerAddress: 'Rua dos Pinheiros, 450, Pinheiros, São Paulo - SP',
    items: [
      {
        productId: 'prod_2',
        productName: 'Microverdes de Girassol',
        quantity: 10,
        weight: 100,
        unit: 'g',
        pricePerWeight: 12.00,
        subtotal: 120.00
      },
      {
        productId: 'prod_5',
        productName: 'Microverdes de Coentro',
        quantity: 6,
        weight: 40,
        unit: 'g',
        pricePerWeight: 18.00,
        subtotal: 108.00
      }
    ],
    total: 228.00,
    status: 'concluido',
    createdAt: getPastDateISO(48, 15, 0), // ~April 18
    updatedAt: getPastDateISO(44, 11, 45),
    statusHistory: [
      { status: 'aguardando_aprovacao', updatedAt: getPastDateISO(48, 15, 0) },
      { status: 'planejado', updatedAt: getPastDateISO(47, 10, 0) },
      { status: 'em_producao', updatedAt: getPastDateISO(46, 8, 0) },
      { status: 'em_entrega', updatedAt: getPastDateISO(44, 9, 30) },
      { status: 'concluido', updatedAt: getPastDateISO(44, 11, 45) }
    ]
  },
  {
    id: 'PED-1005',
    customerId: 'cust_4',
    customerName: 'Rodrigo Santos (Buffet Verde Oliva)',
    customerEmail: 'rodrigo.santos@verdeoliva.com',
    customerPhone: '(11) 96543-2109',
    customerAddress: 'Rua Augusta, 2100 - Bloco B, Consolação, São Paulo - SP',
    items: [
      {
        productId: 'prod_1',
        productName: 'Microverdes de Rúcula',
        quantity: 10,
        weight: 50,
        unit: 'g',
        pricePerWeight: 14.50,
        subtotal: 145.00
      },
      {
        productId: 'prod_3',
        productName: 'Microverdes de Rabanete',
        quantity: 8,
        weight: 50,
        unit: 'g',
        pricePerWeight: 15.00,
        subtotal: 120.00
      },
      {
        productId: 'prod_6',
        productName: 'Microverdes de Beterraba',
        quantity: 5,
        weight: 50,
        unit: 'g',
        pricePerWeight: 16.50,
        subtotal: 82.50
      }
    ],
    total: 347.50,
    status: 'concluido',
    createdAt: getPastDateISO(42, 11, 0), // ~April 24
    updatedAt: getPastDateISO(38, 12, 0),
    statusHistory: [
      { status: 'aguardando_aprovacao', updatedAt: getPastDateISO(42, 11, 0) },
      { status: 'planejado', updatedAt: getPastDateISO(41, 10, 0) },
      { status: 'em_producao', updatedAt: getPastDateISO(40, 8, 0) },
      { status: 'em_entrega', updatedAt: getPastDateISO(38, 10, 30) },
      { status: 'concluido', updatedAt: getPastDateISO(38, 12, 0) }
    ]
  },
  {
    id: 'PED-1006',
    customerId: 'cust_1',
    customerName: 'Mariana Silva',
    customerEmail: 'mariana.silva@email.com',
    customerPhone: '(11) 98765-4321',
    customerAddress: 'Av. Paulista, 1200 - Ap 45, Bela Vista, São Paulo - SP',
    items: [
      {
        productId: 'prod_4',
        productName: 'Microverdes de Brócolis',
        quantity: 2,
        weight: 50,
        unit: 'g',
        pricePerWeight: 16.00,
        subtotal: 32.00
      }
    ],
    total: 32.00,
    status: 'cancelado',
    createdAt: getPastDateISO(36, 17, 30), // ~April 30
    updatedAt: getPastDateISO(36, 18, 0),
    statusHistory: [
      { status: 'aguardando_aprovacao', updatedAt: getPastDateISO(36, 17, 30) },
      { status: 'cancelado', updatedAt: getPastDateISO(36, 18, 0), comment: 'Rejeitado pelo administrador ou cancelado pelo cliente.' }
    ]
  },

  // MAY 2026
  {
    id: 'PED-1007',
    customerId: 'cust_2',
    customerName: 'Carlos Oliveira (Restaurante Manjericão)',
    customerEmail: 'contato@restaurantemanjericao.com.br',
    customerPhone: '(11) 97777-8888',
    customerAddress: 'Rua dos Pinheiros, 450, Pinheiros, São Paulo - SP',
    items: [
      {
        productId: 'prod_1',
        productName: 'Microverdes de Rúcula',
        quantity: 5,
        weight: 50,
        unit: 'g',
        pricePerWeight: 14.50,
        subtotal: 72.50
      },
      {
        productId: 'prod_2',
        productName: 'Microverdes de Girassol',
        quantity: 12,
        weight: 100,
        unit: 'g',
        pricePerWeight: 12.00,
        subtotal: 144.00
      },
      {
        productId: 'prod_4',
        productName: 'Microverdes de Brócolis',
        quantity: 6,
        weight: 50,
        unit: 'g',
        pricePerWeight: 16.00,
        subtotal: 96.00
      }
    ],
    total: 312.50,
    status: 'concluido',
    createdAt: getPastDateISO(28, 14, 0), // ~May 8
    updatedAt: getPastDateISO(24, 15, 30),
    statusHistory: [
      { status: 'aguardando_aprovacao', updatedAt: getPastDateISO(28, 14, 0) },
      { status: 'planejado', updatedAt: getPastDateISO(27, 9, 30) },
      { status: 'em_producao', updatedAt: getPastDateISO(26, 8, 0) },
      { status: 'em_entrega', updatedAt: getPastDateISO(24, 13, 0) },
      { status: 'concluido', updatedAt: getPastDateISO(24, 15, 30) }
    ]
  },
  {
    id: 'PED-1008',
    customerId: 'cust_3',
    customerName: 'Beatriz Costa',
    customerEmail: 'beatriz.costa@email.com',
    customerPhone: '(11) 99123-4567',
    customerAddress: 'Alameda Lorena, 890 - Casa, Jardim Paulista, São Paulo - SP',
    items: [
      {
        productId: 'prod_3',
        productName: 'Microverdes de Rabanete',
        quantity: 4,
        weight: 50,
        unit: 'g',
        pricePerWeight: 15.00,
        subtotal: 60.00
      },
      {
        productId: 'prod_6',
        productName: 'Microverdes de Beterraba',
        quantity: 2,
        weight: 50,
        unit: 'g',
        pricePerWeight: 16.50,
        subtotal: 33.00
      }
    ],
    total: 93.00,
    status: 'concluido',
    createdAt: getPastDateISO(22, 10, 0), // ~May 14
    updatedAt: getPastDateISO(18, 12, 0),
    statusHistory: [
      { status: 'aguardando_aprovacao', updatedAt: getPastDateISO(22, 10, 0) },
      { status: 'planejado', updatedAt: getPastDateISO(21, 10, 0) },
      { status: 'em_producao', updatedAt: getPastDateISO(20, 8, 30) },
      { status: 'em_entrega', updatedAt: getPastDateISO(18, 10, 0) },
      { status: 'concluido', updatedAt: getPastDateISO(18, 12, 0) }
    ]
  },
  {
    id: 'PED-1009',
    customerId: 'cust_4',
    customerName: 'Rodrigo Santos (Buffet Verde Oliva)',
    customerEmail: 'rodrigo.santos@verdeoliva.com',
    customerPhone: '(11) 96543-2109',
    customerAddress: 'Rua Augusta, 2100 - Bloco B, Consolação, São Paulo - SP',
    items: [
      {
        productId: 'prod_5',
        productName: 'Microverdes de Coentro',
        quantity: 8,
        weight: 40,
        unit: 'g',
        pricePerWeight: 18.00,
        subtotal: 144.00
      },
      {
        productId: 'prod_2',
        productName: 'Microverdes de Girassol',
        quantity: 6,
        weight: 100,
        unit: 'g',
        pricePerWeight: 12.00,
        subtotal: 72.00
      }
    ],
    total: 216.00,
    status: 'concluido',
    createdAt: getPastDateISO(14, 15, 30), // ~May 22
    updatedAt: getPastDateISO(10, 11, 0),
    statusHistory: [
      { status: 'aguardando_aprovacao', updatedAt: getPastDateISO(14, 15, 30) },
      { status: 'planejado', updatedAt: getPastDateISO(13, 9, 30) },
      { status: 'em_producao', updatedAt: getPastDateISO(12, 8, 0) },
      { status: 'em_entrega', updatedAt: getPastDateISO(10, 9, 0) },
      { status: 'concluido', updatedAt: getPastDateISO(10, 11, 0) }
    ]
  },
  {
    id: 'PED-1010',
    customerId: 'cust_1',
    customerName: 'Mariana Silva',
    customerEmail: 'mariana.silva@email.com',
    customerPhone: '(11) 98765-4321',
    customerAddress: 'Av. Paulista, 1200 - Ap 45, Bela Vista, São Paulo - SP',
    items: [
      {
        productId: 'prod_1',
        productName: 'Microverdes de Rúcula',
        quantity: 3,
        weight: 50,
        unit: 'g',
        pricePerWeight: 14.50,
        subtotal: 43.50
      },
      {
        productId: 'prod_3',
        productName: 'Microverdes de Rabanete',
        quantity: 1,
        weight: 50,
        unit: 'g',
        pricePerWeight: 15.00,
        subtotal: 15.00
      }
    ],
    total: 58.50,
    status: 'concluido',
    createdAt: getPastDateISO(8, 11, 15), // ~May 28
    updatedAt: getPastDateISO(4, 16, 0),
    statusHistory: [
      { status: 'aguardando_aprovacao', updatedAt: getPastDateISO(8, 11, 15) },
      { status: 'planejado', updatedAt: getPastDateISO(7, 10, 0) },
      { status: 'em_producao', updatedAt: getPastDateISO(6, 9, 0) },
      { status: 'em_entrega', updatedAt: getPastDateISO(4, 14, 0) },
      { status: 'concluido', updatedAt: getPastDateISO(4, 16, 0) }
    ]
  },

  // JUNE 2026 (Active/Recent/Pending orders)
  {
    id: 'PED-1011',
    customerId: 'cust_2',
    customerName: 'Carlos Oliveira (Restaurante Manjericão)',
    customerEmail: 'contato@restaurantemanjericao.com.br',
    customerPhone: '(11) 97777-8888',
    customerAddress: 'Rua dos Pinheiros, 450, Pinheiros, São Paulo - SP',
    items: [
      {
        productId: 'prod_2',
        productName: 'Microverdes de Girassol',
        quantity: 15,
        weight: 100,
        unit: 'g',
        pricePerWeight: 12.00,
        subtotal: 180.00
      },
      {
        productId: 'prod_4',
        productName: 'Microverdes de Brócolis',
        quantity: 8,
        weight: 50,
        unit: 'g',
        pricePerWeight: 16.00,
        subtotal: 128.00
      }
    ],
    total: 308.00,
    status: 'em_producao', // Active order currently In Production
    createdAt: getPastDateISO(3, 10, 0), // June 2
    updatedAt: getPastDateISO(2, 9, 0),
    statusHistory: [
      { status: 'aguardando_aprovacao', updatedAt: getPastDateISO(3, 10, 0) },
      { status: 'planejado', updatedAt: getPastDateISO(2, 8, 30) },
      { status: 'em_producao', updatedAt: getPastDateISO(2, 9, 0) }
    ]
  },
  {
    id: 'PED-1012',
    customerId: 'cust_3',
    customerName: 'Beatriz Costa',
    customerEmail: 'beatriz.costa@email.com',
    customerPhone: '(11) 99123-4567',
    customerAddress: 'Alameda Lorena, 890 - Casa, Jardim Paulista, São Paulo - SP',
    items: [
      {
        productId: 'prod_3',
        productName: 'Microverdes de Rabanete',
        quantity: 2,
        weight: 50,
        unit: 'g',
        pricePerWeight: 15.00,
        subtotal: 30.00
      },
      {
        productId: 'prod_5',
        productName: 'Microverdes de Coentro',
        quantity: 2,
        weight: 40,
        unit: 'g',
        pricePerWeight: 18.00,
        subtotal: 36.00
      }
    ],
    total: 66.00,
    status: 'em_entrega', // Shipped - active order
    createdAt: getPastDateISO(2, 14, 0), // June 3
    updatedAt: getPastDateISO(0, 15, 0), // June 5 (Today evening)
    statusHistory: [
      { status: 'aguardando_aprovacao', updatedAt: getPastDateISO(2, 14, 0) },
      { status: 'planejado', updatedAt: getPastDateISO(1, 9, 0) },
      { status: 'em_producao', updatedAt: getPastDateISO(1, 10, 0) },
      { status: 'em_entrega', updatedAt: getPastDateISO(0, 15, 0) }
    ]
  },
  {
    id: 'PED-1013',
    customerId: 'cust_4',
    customerName: 'Rodrigo Santos (Buffet Verde Oliva)',
    customerEmail: 'rodrigo.santos@verdeoliva.com',
    customerPhone: '(11) 96543-2109',
    customerAddress: 'Rua Augusta, 2100 - Bloco B, Consolação, São Paulo - SP',
    items: [
      {
        productId: 'prod_1',
        productName: 'Microverdes de Rúcula',
        quantity: 12,
        weight: 50,
        unit: 'g',
        pricePerWeight: 14.50,
        subtotal: 174.00
      }
    ],
    total: 174.00,
    status: 'planejado', // Approved - Planned
    createdAt: getPastDateISO(1, 16, 45), // June 4
    updatedAt: getPastDateISO(0, 10, 0), // June 5
    statusHistory: [
      { status: 'aguardando_aprovacao', updatedAt: getPastDateISO(1, 16, 45) },
      { status: 'planejado', updatedAt: getPastDateISO(0, 10, 0) }
    ]
  },
  {
    id: 'PED-1014',
    customerId: 'cust_1',
    customerName: 'Mariana Silva',
    customerEmail: 'mariana.silva@email.com',
    customerPhone: '(11) 98765-4321',
    customerAddress: 'Av. Paulista, 1200 - Ap 45, Bela Vista, São Paulo - SP',
    items: [
      {
        productId: 'prod_6',
        productName: 'Microverdes de Beterraba',
        quantity: 3,
        weight: 50,
        unit: 'g',
        pricePerWeight: 16.50,
        subtotal: 49.50
      },
      {
        productId: 'prod_1',
        productName: 'Microverdes de Rúcula',
        quantity: 1,
        weight: 50,
        unit: 'g',
        pricePerWeight: 14.50,
        subtotal: 14.50
      }
    ],
    total: 64.00,
    status: 'aguardando_aprovacao', // Awaits admin approval
    createdAt: getPastDateISO(0, 16, 20), // June 5, hours ago
    updatedAt: getPastDateISO(0, 16, 20),
    statusHistory: [
      { status: 'aguardando_aprovacao', updatedAt: getPastDateISO(0, 16, 20) }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'not_1',
    recipient: 'admin',
    title: 'Novo pedido criado',
    message: 'O cliente Mariana Silva realizou um novo pedido (PED-1014) no valor de R$ 64,00.',
    isRead: false,
    createdAt: getPastDateISO(0, 16, 20),
    orderId: 'PED-1014'
  },
  {
    id: 'not_2',
    recipient: 'cliente',
    customerId: 'cust_3',
    title: 'Pedido saiu para entrega!',
    message: 'Seu pedido PED-1012 saiu para o endereço de entrega.',
    isRead: false,
    createdAt: getPastDateISO(0, 15, 0),
    orderId: 'PED-1012'
  },
  {
    id: 'not_3',
    recipient: 'admin',
    title: 'Novo pedido criado',
    message: 'O cliente Rodrigo Santos realizou um novo pedido (PED-1013) no valor de R$ 174,00.',
    isRead: true,
    createdAt: getPastDateISO(1, 16, 45),
    orderId: 'PED-1013'
  },
  {
    id: 'not_4',
    recipient: 'cliente',
    customerId: 'cust_4',
    title: 'Pedido aprovado',
    message: 'Seu pedido PED-1013 foi aprovado e encontra-se com status Planejado.',
    isRead: false,
    createdAt: getPastDateISO(0, 10, 0),
    orderId: 'PED-1013'
  }
];
