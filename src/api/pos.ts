import { del, get, patch, post } from './client';
export type Category = { id: string; name: string; description?: string; active: boolean; displayOrder: number };
export type MenuItem = { id: string; categoryId: string; name: string; description?: string; price: string; taxBasisPoints: number; available: boolean; active: boolean; kitchenStation?: string };
export type Table = { id: string; tableNumber: string; name?: string; section?: string; capacity: number; status: string };
export type OrderItem = { id: string; itemNameSnapshot: string; unitPriceSnapshot: string; quantity: number; notes?: string; status: string; discount: string };
export type Order = { id: string; orderNumber?: string; type: string; status: string; tableId?: string; subtotal: string; tax: string; discount: string; total: string; items?: OrderItem[]; createdAt: string };
export type Reservation = { id: string; customerName: string; phone?: string; guestCount: number; startAt: string; tableId?: string; status: string; notes?: string };
export type Receipt = { id: string; orderId: string; paymentId: string; number: string; snapshot: Record<string, unknown>; createdAt: string };
export type Summary = { grossSales: string; refunds: string; netSales: string; completedOrders: number };
export const pos = {
  categories: () => get<Category[]>('/categories'), addCategory: (v: object) => post<Category>('/categories', v), editCategory: (id: string, v: object) => patch<Category>(`/categories/${id}`, v),
  menu: () => get<MenuItem[]>('/menu-items'), addMenu: (v: object) => post<MenuItem>('/menu-items', v), editMenu: (id: string, v: object) => patch<MenuItem>(`/menu-items/${id}`, v), removeMenu: (id: string) => del(`/menu-items/${id}`),
  tables: () => get<Table[]>('/tables'), addTable: (v: object) => post<Table>('/tables', v), editTable: (id: string, v: object) => patch<Table>(`/tables/${id}`, v),
  orders: () => get<Order[]>('/orders'), order: (id: string) => get<Order>(`/orders/${id}`), addOrder: (v: object) => post<Order>('/orders', v), addItem: (id: string, v: object) => post(`/orders/${id}/items`, v), action: (id: string, action: string) => post<Order>(`/orders/${id}/${action}`), voidItem: (id: string, itemId: string, reason: string) => post(`/orders/${id}/items/${itemId}/void`, { reason }),
  reservations: () => get<Reservation[]>('/reservations'), addReservation: (v: object) => post<Reservation>('/reservations', v), editReservation: (id: string, v: object) => patch<Reservation>(`/reservations/${id}`, v), seat: (id: string) => post<{ order: Order }>(`/reservations/${id}/seat`),
  dashboard: () => get<Summary>('/dashboard'), report: (from: string, to: string) => get<Summary>('/reports', { from, to }),
  receipts: () => get<Receipt[]>('/receipts'), receipt: (id: string) => get<Record<string, unknown>>(`/receipts/${id}`), receiptByOrder: (id: string) => get<Receipt>(`/receipts/order/${id}`),
};
