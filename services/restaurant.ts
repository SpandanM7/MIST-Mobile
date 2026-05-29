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

export type Variant = {
  id: string;
  name: string;
  price: number;
};

export type Addon = {
  id: string;
  name: string;
  price: number;
};

export type MenuCategory = {
  id: string;
  name: string;
  icon?: string;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  price: number;           // base price (used when no variant is selected)
  isAvailable: boolean;
  variants: Variant[];     // if non-empty, user MUST pick one
  addons: Addon[];         // always optional, user picks zero or more
  description?: string;
  isVeg?: boolean;
  tags?: string[];
};

// Raw shapes returned by GET /menu
type ApiAddon = {
  id: string;
  name: string;
  price: number;
};

type ApiVariant = {
  id: string;
  name: string;
  price: number;
};

type ApiDish = {
  id: string;
  name: string;
  price: number;
  available: boolean;
  recipe?: string;
  categoryId: string;
  categoryName: string;
  variants: ApiVariant[];
  addons: ApiAddon[];
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
  // Variant fields — null when the item has no variants
  variantId: string | null;
  variantName: string | null;
  variantPrice: number | null;
  // Addon fields — empty arrays when no addons selected
  addonIds: string[];
  addonNames: string[];
  addonTotal: number;
};

// Raw order item as returned by GET /orders/table/:tableId
type ApiOrderItem = {
  id: string;
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

function parseOrder(apiOrder: ApiOrder): Order {
  return {
    id: apiOrder.id,
    tableId: apiOrder.tableId,
    items: apiOrder.items.map(item => ({
      menuItemId: item.menuItemId,
      menuItemName: item.dishName,
      price: item.price,
      quantity: item.quantity,
      note: '',
      orderItemId: item.id,
      // Variant/addon info is not stored in existing order items from the backend
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
// GET /menu returns categories with embedded dishes including variants and addons.
// We make a single request and split into two flat lists for the UI.
export const fetchMenuCategories = async (): Promise<MenuCategory[]> => {
  const res = await api.get<ApiResponse<ApiMenuCategory[]>>('/menu');
  return res.data.data.map(cat => ({
    id: cat.id,
    name: cat.name,
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
        variants: (dish.variants ?? []).map(v => ({
          id: v.id,
          name: v.name,
          price: v.price,
        })),
        addons: (dish.addons ?? []).map(a => ({
          id: a.id,
          name: a.name,
          price: a.price,
        })),
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

// Adds NEW items to an existing open order.
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