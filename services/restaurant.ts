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
  number: string;       // e.g. "T1" — string to match API
  capacity: number;
  status: TableStatus;
  section: string;      // section name
  floor: string;        // floor name
  floorId: string;
  sectionId: string;
  occupiedAt: string | null;
};

// Raw shapes returned by /floors — used internally when parsing
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

export type MenuCategory = {
  id: string;
  name: string;
  icon: string;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  isVeg: boolean;
  tags: string[];
};

export type OrderItem = {
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
  note: string; // per-item note (e.g. "less spicy", "medium rare")
};

export type Order = {
  id: string;
  tableId: string;
  tableNumber: number;
  waiterId: string;
  waiterName: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  specialInstructions: string; // overall order note
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  waiter: {
    id: string;
    name: string;
    role: string;
  };
};

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

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_CATEGORIES: MenuCategory[] = [
  { id: 'c1', name: 'Starters',  icon: '🥗' },
  { id: 'c2', name: 'Mains',     icon: '🍽️' },
  { id: 'c3', name: 'Grills',    icon: '🥩' },
  { id: 'c4', name: 'Pasta',     icon: '🍝' },
  { id: 'c5', name: 'Drinks',    icon: '🥤' },
  { id: 'c6', name: 'Desserts',  icon: '🍮' },
];

const DEMO_MENU_ITEMS: MenuItem[] = [
  // Starters
  { id: 'm1',  categoryId: 'c1', name: 'Garlic Bread',          description: 'Toasted sourdough with herb butter and roasted garlic',      price: 249,  isAvailable: true,  isVeg: true,  tags: ['popular'] },
  { id: 'm2',  categoryId: 'c1', name: 'Bruschetta',            description: 'Fresh tomatoes, basil, olive oil on grilled ciabatta',       price: 299,  isAvailable: true,  isVeg: true,  tags: [] },
  { id: 'm3',  categoryId: 'c1', name: 'Chicken Wings',         description: 'Crispy fried wings tossed in smoky buffalo sauce',           price: 449,  isAvailable: true,  isVeg: false, tags: ['spicy', 'popular'] },
  { id: 'm4',  categoryId: 'c1', name: 'Calamari Fritti',       description: 'Lightly battered squid rings with marinara dip',             price: 399,  isAvailable: true,  isVeg: false, tags: [] },
  { id: 'm5',  categoryId: 'c1', name: 'Soup of the Day',       description: 'Chef\'s daily fresh soup served with crusty bread',          price: 199,  isAvailable: true,  isVeg: true,  tags: [] },
  // Mains
  { id: 'm6',  categoryId: 'c2', name: 'Grilled Salmon',        description: 'Atlantic salmon fillet with lemon butter, mashed potato',    price: 799,  isAvailable: true,  isVeg: false, tags: ['chef special'] },
  { id: 'm7',  categoryId: 'c2', name: 'Butter Chicken',        description: 'Tender chicken in rich tomato-cream curry, basmati rice',    price: 549,  isAvailable: true,  isVeg: false, tags: ['popular'] },
  { id: 'm8',  categoryId: 'c2', name: 'Paneer Tikka Masala',   description: 'Cottage cheese in spiced onion-tomato gravy, naan',          price: 499,  isAvailable: true,  isVeg: true,  tags: ['popular'] },
  { id: 'm9',  categoryId: 'c2', name: 'Fish & Chips',          description: 'Beer-battered cod with thick-cut fries and tartar sauce',    price: 649,  isAvailable: false, isVeg: false, tags: [] },
  { id: 'm10', categoryId: 'c2', name: 'Mushroom Risotto',      description: 'Arborio rice with wild mushrooms, parmesan, fresh thyme',    price: 499,  isAvailable: true,  isVeg: true,  tags: ['chef special'] },
  // Grills
  { id: 'm11', categoryId: 'c3', name: 'Ribeye Steak 300g',     description: 'Prime aged ribeye, choice of sauce and two sides',          price: 1499, isAvailable: true,  isVeg: false, tags: ['premium'] },
  { id: 'm12', categoryId: 'c3', name: 'Sirloin Steak 250g',    description: 'Classic sirloin, grilled to order, herb compound butter',   price: 1199, isAvailable: true,  isVeg: false, tags: ['popular'] },
  { id: 'm13', categoryId: 'c3', name: 'BBQ Lamb Chops',        description: 'Marinated lamb chops, mint yogurt, grilled vegetables',     price: 999,  isAvailable: true,  isVeg: false, tags: [] },
  { id: 'm14', categoryId: 'c3', name: 'Mixed Grill Platter',   description: 'Assorted grilled meats: chicken, lamb, beef with dips',     price: 1299, isAvailable: true,  isVeg: false, tags: ['popular', 'for sharing'] },
  // Pasta
  { id: 'm15', categoryId: 'c4', name: 'Spaghetti Carbonara',   description: 'Pancetta, egg yolk, pecorino, black pepper, al dente',      price: 499,  isAvailable: true,  isVeg: false, tags: ['popular'] },
  { id: 'm16', categoryId: 'c4', name: 'Penne Arrabbiata',      description: 'Spicy tomato sauce, garlic, fresh basil, parmesan',         price: 399,  isAvailable: true,  isVeg: true,  tags: ['spicy'] },
  { id: 'm17', categoryId: 'c4', name: 'Fettuccine Alfredo',    description: 'Creamy butter parmesan sauce, grilled chicken',             price: 549,  isAvailable: true,  isVeg: false, tags: [] },
  { id: 'm18', categoryId: 'c4', name: 'Lasagna al Forno',      description: 'Layered beef bolognese, béchamel, oven-baked',              price: 599,  isAvailable: true,  isVeg: false, tags: [] },
  // Drinks
  { id: 'm19', categoryId: 'c5', name: 'Fresh Lime Soda',       description: 'Freshly squeezed lime, soda, choice of sweet or salted',    price: 129,  isAvailable: true,  isVeg: true,  tags: [] },
  { id: 'm20', categoryId: 'c5', name: 'Mango Lassi',           description: 'Thick chilled yogurt drink with Alphonso mango pulp',       price: 179,  isAvailable: true,  isVeg: true,  tags: ['popular'] },
  { id: 'm21', categoryId: 'c5', name: 'Cold Coffee',           description: 'Espresso blended with milk, ice cream, chocolate syrup',    price: 199,  isAvailable: true,  isVeg: true,  tags: [] },
  { id: 'm22', categoryId: 'c5', name: 'Sparkling Water',       description: 'Chilled sparkling mineral water 500ml',                    price: 99,   isAvailable: true,  isVeg: true,  tags: [] },
  { id: 'm23', categoryId: 'c5', name: 'Virgin Mojito',         description: 'Muddled mint, lime, brown sugar, soda, crushed ice',        price: 199,  isAvailable: true,  isVeg: true,  tags: ['popular'] },
  // Desserts
  { id: 'm24', categoryId: 'c6', name: 'Chocolate Lava Cake',   description: 'Warm dark chocolate cake, molten centre, vanilla ice cream', price: 349, isAvailable: true,  isVeg: true,  tags: ['popular'] },
  { id: 'm25', categoryId: 'c6', name: 'Tiramisu',              description: 'Classic Italian ladyfinger dessert, mascarpone, espresso',  price: 299,  isAvailable: true,  isVeg: true,  tags: [] },
  { id: 'm26', categoryId: 'c6', name: 'Gulab Jamun',           description: 'Soft milk-solid dumplings in rose-cardamom sugar syrup',   price: 199,  isAvailable: true,  isVeg: true,  tags: ['popular'] },
  { id: 'm27', categoryId: 'c6', name: 'Cheesecake',            description: 'New York style cheesecake with seasonal berry compote',     price: 349,  isAvailable: true,  isVeg: true,  tags: [] },
];

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
export const fetchMenuCategories = async (): Promise<MenuCategory[]> => {
  // TODO: Replace with real API call when backend is ready
  await new Promise(r => setTimeout(r, 300));
  return DEMO_CATEGORIES;
};

export const fetchMenuItems = async (): Promise<MenuItem[]> => {
  // TODO: Replace with real API call when backend is ready
  await new Promise(r => setTimeout(r, 400));
  return DEMO_MENU_ITEMS;
};

// ORDERS
export const fetchOrderByTable = async (tableId: string): Promise<Order | null> => {
  // TODO: Replace with real API call when backend is ready
  // return api.get<ApiResponse<Order>>(`/orders/table/${tableId}`).then(r => r.data.data).catch(() => null);

  await new Promise(r => setTimeout(r, 500));
  return null;
};

export const submitOrder = async (
  tableId: string,
  items: OrderItem[],
  specialInstructions: string,
  waiterId: string,
  waiterName: string,
): Promise<{ success: boolean; orderId: string }> => {
  // TODO: Replace with real API call when backend is ready
  // return api.post('/orders', { tableId, items, specialInstructions, waiterId, waiterName }).then(r => r.data);

  await new Promise(r => setTimeout(r, 700));
  return { success: true, orderId: `ord_${Date.now()}` };
};

export const updateOrder = async (
  orderId: string,
  items: OrderItem[],
  specialInstructions: string,
): Promise<{ success: boolean }> => {
  // TODO: Replace with real API call when backend is ready
  // return api.put(`/orders/${orderId}`, { items, specialInstructions }).then(r => r.data);

  await new Promise(r => setTimeout(r, 700));
  return { success: true };
};

export default api;