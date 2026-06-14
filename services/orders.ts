import api from './api';

type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

export type OrderItem = {
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
  note: string;
  variantId: string | null;
  variantName: string | null;
  variantPrice: number | null;
  addonIds: string[];
  addonNames: string[];
  addonTotal: number;
};

type ApiOrderItem = {
  id: string;
  menuItemId: string;
  dishName: string;
  priceAtOrder: number;
  quantity: number;
  dishStatus: 'ordered' | 'preparing' | 'served';
};

type ApiOrder = {
  id: string;
  tableId: string;
  items: ApiOrderItem[];
  status: string;
  createdAt: string;
  updatedAt: string;
  total: number;
};

export type Order = {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: string;
  specialInstructions: string;
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
};

function parseOrder(apiOrder: ApiOrder): Order {
  return {
    id: apiOrder.id,
    tableId: apiOrder.tableId,
    items: apiOrder.items.map(item => ({
      menuItemId: item.menuItemId,
      menuItemName: item.dishName,
      price: item.priceAtOrder,
      quantity: item.quantity,
      note: '',
      orderItemId: item.id,
      variantId: null,
      variantName: null,
      variantPrice: null,
      addonIds: [],
      addonNames: [],
      addonTotal: 0,
    })),
    status: apiOrder.status,
    specialInstructions: '',
    createdAt: apiOrder.createdAt,
    updatedAt: apiOrder.updatedAt,
    totalAmount: apiOrder.total,
  };
}

export const fetchOrderByTable = async (tableId: string): Promise<Order | null> => {
  const res = await api.get<ApiResponse<ApiOrder | null>>(`/orders/table/${tableId}`);
  if (!res.data.data) return null;
  return parseOrder(res.data.data);
};

export const submitOrder = async (
  tableId: string,
  items: OrderItem[],
): Promise<{ success: boolean; orderId: string }> => {
  const res = await api.post<ApiResponse<ApiOrder>>('/orders', {
    tableId,
    items: items.map(i => ({
      menuItemId: i.menuItemId,
      quantity: i.quantity,
      variantId: i.variantId,
      variantName: i.variantName,
      variantPrice: i.variantPrice,
      addonIds: i.addonIds,
      addonNames: i.addonNames,
      addonTotal: i.addonTotal,
    })),
  });
  if (!res.data.success) throw new Error(res.data.message ?? 'Failed to place order');
  return { success: true, orderId: res.data.data.id };
};

export const addItemsToOrder = async (
  orderId: string,
  items: OrderItem[],
): Promise<{ success: boolean }> => {
  const res = await api.post<ApiResponse<ApiOrder>>(`/orders/${orderId}/items`, {
    items: items.map(i => ({
      menuItemId: i.menuItemId,
      quantity: i.quantity,
      variantId: i.variantId,
      variantName: i.variantName,
      variantPrice: i.variantPrice,
      addonIds: i.addonIds,
      addonNames: i.addonNames,
      addonTotal: i.addonTotal,
    })),
  });
  if (!res.data.success) throw new Error(res.data.message ?? 'Failed to add items');
  return { success: true };
};

export const updateItemQuantity = async (
  orderId: string,
  orderItemId: string,
  quantity: number,
): Promise<{ success: boolean }> => {
  const res = await api.put<ApiResponse<ApiOrder>>(`/orders/${orderId}/items/quantity`, {
    orderItemId,
    quantity,
  });
  if (!res.data.success) throw new Error(res.data.message ?? 'Failed to update quantity');
  return { success: true };
};

export const removeItemFromOrder = async (
  orderId: string,
  orderItemId: string,
): Promise<{ success: boolean }> => {
  const res = await api.delete<ApiResponse<ApiOrder>>(`/orders/${orderId}/items`, {
    data: { orderItemId },
  });
  if (!res.data.success) throw new Error(res.data.message ?? 'Failed to remove item');
  return { success: true };
};

export const requestBill = async (tableId: string): Promise<{ success: boolean }> => {
  const res = await api.post<ApiResponse<null>>(`/orders/table/${tableId}/request-bill`);
  if (!res.data.success) throw new Error(res.data.message ?? 'Failed to request bill');
  return { success: true };
};


// ─── Takeout Order Types ──────────────────────────────────────────────────────

export type TakeoutOrderItem = {
  dishName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addonNames: string[];
  addonPrices: number[];
};

export type TakeoutOrderPayload = {
  type: 'TAKEAWAY';
  phoneNumber: string;
  subtotal: number;
  discountType: '%' | '₹';
  discountValue: number;
  discountAmount: number;
  cgstPercent: number;
  sgstPercent: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;
  paymentMethod: string;
  items: TakeoutOrderItem[];
};

// Places a new TAKEAWAY order (no table involved).

/*
export const submitTakeoutOrder = async (
  payload: TakeoutOrderPayload,
): Promise<{ success: boolean }> => {
  const res = await api.post<ApiResponse<any>>('/takeaway/orders', payload);
  if (!res.data.success) throw new Error(res.data.message ?? 'Failed to place takeout order');
  return { success: true };
};

*/

export const submitTakeoutOrder = async (
  payload: TakeoutOrderPayload,
): Promise<{ success: boolean }> => {
  // const res = await api.post<ApiResponse<any>>('/takeaway/orders', payload);
  // if (!res.data.success) throw new Error(res.data.message ?? 'Failed to place takeout order');
  await new Promise(resolve => setTimeout(resolve, 800)); // fake network delay
  return { success: true };
};