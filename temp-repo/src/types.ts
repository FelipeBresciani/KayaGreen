/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WeightUnit = 'g' | 'kg';

export interface Product {
  id: string;
  name: string;
  description: string;
  availableWeight: number; // For stock management
  unit: WeightUnit;
  pricePerWeight: number; // Base price for selling
  price20g?: number; // Price specifically for 20g
  price40g?: number; // Price specifically for 40g
  price60g?: number; // Price specifically for 60g
  image: string; // URL or preset identifier
  status: 'ativo' | 'inativo';
}

export type OrderStatus =
  | 'aguardando_aprovacao'
  | 'planejado'
  | 'em_producao'
  | 'em_entrega'
  | 'concluido'
  | 'cancelado';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number; // Number of units of the given weight
  weight: number; // Weight per unit (e.g. 100g, 250g, 1kg)
  unit: WeightUnit;
  pricePerWeight: number; // Saved price at time of order
  subtotal: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  paymentMethod?: string;
  statusHistory: {
    status: OrderStatus;
    updatedAt: string;
    comment?: string;
  }[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipient: 'admin' | 'cliente';
  customerId?: string; // If 'cliente', target specific customer
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  orderId?: string;
}
