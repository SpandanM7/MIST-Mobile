import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: 'https://mist-backend-0a05.onrender.com/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token Helpers ────────────────────────────────────────────────────────────
const TOKEN_KEY = 'mist_auth_token';
export const saveToken = (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token);
export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);
export const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

// ─── Interceptor — injects Bearer token into every request ───────────────────
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type TableStatus = 'empty' | 'occupied' | 'bill_requested';

export type Table = {
  id: string;
  number: string;
  capacity: number;
  status: TableStatus;
  section: string;
  floor: string;
  floorId: string;
  sectionId: string;
  occupiedAt: string | null;
};

// Raw shapes returned by /floors
export type ApiTable = {
  id: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  sectionId: string;
  occupiedAt: string | null;
};

export type ApiSection = {
  id: string;
  name: string;
  floorId: string;
  tables: ApiTable[];
};

export type ApiFloor = {
  id: string;
  name: string;
  sortOrder: number;
  sections: ApiSection[];
};

export type Floor = {
  id: string;
  name: string;
  sortOrder: number;
  sections: Section[];
};

export type Section = {
  id: string;
  name: string;
  floorId: string;
  tables: Table[];
};

// Standard API response wrapper
type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

// ─── Menu Types ───────────────────────────────────────────────────────────────
// Real API: GET /menu returns categories with embedded dishes
// Fields like isVeg, description, tags, icon are NOT in the backend —
// they're optional here so the UI degrades gracefully when absent.

export type MenuCategory = {
  id: string;
  name: string;
  icon?: string;       // not in API — UI falls back to a default emoji
};

export type MenuItem = {
  id: string;          // dish UUID from backend
  categoryId: string;
  name: string;
  price: number;
  isAvailable: boolean; // mapped from `available` in API response
  description?: string; // not in API
  isVeg?: boolean;      // not in API
  tags?: string[];      // not in API
};

// Raw shapes returned by GET /menu
type ApiDish = {
  id: string;
  name: string;
  price: number;
  available: boolean;
  recipe?: string;
};

type ApiMenuCategory = {
  id: string;
  name: string;
  items: ApiDish[];
};

// ─── Order Types ──────────────────────────────────────────────────────────────

export type OrderItem = {
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
  note: string;
};

// Raw order item as returned by GET /orders/table/:tableId
type ApiOrderItem = {
  id: string;          // orderItemId — needed for update/remove calls
  menuItemId: string;
  dishName: string;
  price: number;
  quantity: number;
  dishStatus: 'ordered' | 'preparing' | 'served';
};

// Raw order as returned by GET /orders/table/:tableId
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

export type LoginPayload = {
  email: string;
  password: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseFloors(apiFloors: ApiFloor[]): { floors: Floor[]; tables: Table[] } {
  const allTables: Table[] = [];

  const floors: Floor[] = apiFloors
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(apiFloor => {
      const sections: Section[] = apiFloor.sections.map(apiSection => {
        const tables: Table[] = apiSection.tables.map(apiTable => ({
          id: apiTable.id,
          number: apiTable.tableNumber,
          capacity: apiTable.capacity,
          status: apiTable.status,
          section: apiSection.name,
          floor: apiFloor.name,
          floorId: apiFloor.id,
          sectionId: apiSection.id,
          occupiedAt: apiTable.occupiedAt,
        }));
        allTables.push(...tables);
        return { id: apiSection.id, name: apiSection.name, floorId: apiFloor.id, tables };
      });
      return { id: apiFloor.id, name: apiFloor.name, sortOrder: apiFloor.sortOrder, sections };
    });

  return { floors, tables: allTables };
}

// Maps the flat ApiOrder from the backend into the Order type the UI expects.
// The backend doesn't store specialInstructions or per-item notes — those are
// UI-only concepts, so they default to empty strings.
function parseOrder(apiOrder: ApiOrder): Order {
  return {
    id: apiOrder.id,
    tableId: apiOrder.tableId,
    items: apiOrder.items.map(item => ({
      menuItemId: item.menuItemId,
      menuItemName: item.dishName,
      price: item.price,
      quantity: item.quantity,
      note: '',                   // backend has no per-item note
      orderItemId: item.id,       // kept for update/remove calls
    })),
    status: apiOrder.status,
    specialInstructions: '',      // backend has no specialInstructions
    createdAt: apiOrder.createdAt,
    updatedAt: apiOrder.updatedAt,
    totalAmount: apiOrder.total,
  };
}

// ─── API Functions ────────────────────────────────────────────────────────────

// AUTH
export const loginWaiter = async (payload: { email: string; password: string }): Promise<void> => {
  const res = await api.post<ApiResponse<{ token: string }>>('/auth/login', {
    email: payload.email,
    password: payload.password,
  });
  if (!res.data.success) throw new Error(res.data.message ?? 'Login failed');
  await saveToken(res.data.data.token);
};

// TABLES
export const fetchFloors = async (): Promise<Floor[]> => {
  const response = await api.get<ApiResponse<ApiFloor[]>>('/floors');
  const { floors } = parseFloors(response.data.data);
  return floors;
};

export const fetchTables = async (): Promise<Table[]> => {
  const response = await api.get<ApiResponse<ApiFloor[]>>('/floors');
  const { tables } = parseFloors(response.data.data);
  return tables;
};

// MENU
// GET /menu returns categories with embedded dishes.
// We split them into two flat lists so [tableId].tsx can work with them as before.
export const fetchMenuCategories = async (): Promise<MenuCategory[]> => {
  const res = await api.get<ApiResponse<ApiMenuCategory[]>>('/menu');
  return res.data.data.map(cat => ({
    id: cat.id,
    name: cat.name,
    // Backend has no icon — UI should handle icon being undefined
  }));
};

export const fetchMenuItems = async (): Promise<MenuItem[]> => {
  const res = await api.get<ApiResponse<ApiMenuCategory[]>>('/menu');
  const items: MenuItem[] = [];
  for (const cat of res.data.data) {
    for (const dish of cat.items) {
      items.push({
        id: dish.id,
        categoryId: cat.id,
        name: dish.name,
        price: dish.price,
        isAvailable: dish.available,
        // description, isVeg, tags are not in the API — left undefined
      });
    }
  }
  return items;
};

// ORDERS

// Returns the currently open order for a table, or null if none.
export const fetchOrderByTable = async (tableId: string): Promise<Order | null> => {
  const res = await api.get<ApiResponse<ApiOrder | null>>(`/orders/table/${tableId}`);
  if (!res.data.data) return null;
  return parseOrder(res.data.data);
};

// Places a NEW order on an empty table.
// Backend only needs tableId + items (menuItemId + quantity).
// specialInstructions, waiterId, waiterName are UI-only — not sent.
export const submitOrder = async (
  tableId: string,
  items: OrderItem[],
): Promise<{ success: boolean; orderId: string }> => {
  const res = await api.post<ApiResponse<ApiOrder>>('/orders', {
    tableId,
    items: items.map(i => ({
      menuItemId: i.menuItemId,
      quantity: i.quantity,
    })),
  });
  if (!res.data.success) throw new Error(res.data.message ?? 'Failed to place order');
  return { success: true, orderId: res.data.data.id };
};

// Adds NEW items to an existing open order.
// Use this when the waiter is in edit mode and adds items not previously in the order.
export const addItemsToOrder = async (
  orderId: string,
  items: OrderItem[],
): Promise<{ success: boolean }> => {
  const res = await api.post<ApiResponse<ApiOrder>>(`/orders/${orderId}/items`, {
    items: items.map(i => ({
      menuItemId: i.menuItemId,
      quantity: i.quantity,
    })),
  });
  if (!res.data.success) throw new Error(res.data.message ?? 'Failed to add items');
  return { success: true };
};

// Updates the quantity of one specific item already in an open order.
// orderItemId is the item's own UUID (ApiOrderItem.id), NOT the menuItemId.
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

// Removes a specific item from an open order.
// Only works if dishStatus is 'ordered' (not yet in preparation).
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

// Marks the table as bill_requested. Does not modify the order.
export const requestBill = async (tableId: string): Promise<{ success: boolean }> => {
  const res = await api.post<ApiResponse<null>>(`/orders/table/${tableId}/request-bill`);
  if (!res.data.success) throw new Error(res.data.message ?? 'Failed to request bill');
  return { success: true };
};

export default api;