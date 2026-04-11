import axios from 'axios';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: 'https://your-backend-url.com/api', // Replace when backend is ready
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type TableStatus = 'empty' | 'occupied' | 'order_taken' | 'delivered';

export type Table = {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  section: string;
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

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_TABLES: Table[] = [
  { id: 't1',  number: 1,  capacity: 2, status: 'empty',       section: 'Indoor' },
  { id: 't2',  number: 2,  capacity: 4, status: 'order_taken', section: 'Indoor' },
  { id: 't3',  number: 3,  capacity: 4, status: 'occupied',    section: 'Indoor' },
  { id: 't4',  number: 4,  capacity: 6, status: 'empty',       section: 'Indoor' },
  { id: 't5',  number: 5,  capacity: 2, status: 'delivered',   section: 'Indoor' },
  { id: 't6',  number: 6,  capacity: 4, status: 'order_taken', section: 'Indoor' },
  { id: 't7',  number: 7,  capacity: 8, status: 'empty',       section: 'Outdoor' },
  { id: 't8',  number: 8,  capacity: 4, status: 'occupied',    section: 'Outdoor' },
  { id: 't9',  number: 9,  capacity: 2, status: 'empty',       section: 'Outdoor' },
  { id: 't10', number: 10, capacity: 6, status: 'order_taken', section: 'Outdoor' },
  { id: 't11', number: 11, capacity: 4, status: 'empty',       section: 'Bar' },
  { id: 't12', number: 12, capacity: 2, status: 'delivered',   section: 'Bar' },
];

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

const DEMO_EXISTING_ORDER: Order = {
  id: 'ord_demo_001',
  tableId: 't2',
  tableNumber: 2,
  waiterId: 'w1',
  waiterName: 'Demo Waiter',
  items: [
    { menuItemId: 'm3',  menuItemName: 'Chicken Wings',       price: 449,  quantity: 2, note: 'Extra crispy, extra sauce on side' },
    { menuItemId: 'm11', menuItemName: 'Ribeye Steak 300g',   price: 1499, quantity: 1, note: 'Medium rare, pepper sauce' },
    { menuItemId: 'm11', menuItemName: 'Ribeye Steak 300g',   price: 1499, quantity: 1, note: 'Well done, mushroom sauce' },
    { menuItemId: 'm23', menuItemName: 'Virgin Mojito',       price: 199,  quantity: 3, note: '' },
  ],
  status: 'pending',
  specialInstructions: 'Table has a birthday guest, surprise dessert if possible',
  createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  totalAmount: 0,
};

// ─── API Functions ────────────────────────────────────────────────────────────

// AUTH
export const loginWaiter = async (payload: LoginPayload): Promise<LoginResponse> => {
  // TODO: Replace with real API call when backend is ready
  // return api.post('/auth/login', payload).then(r => r.data);

  // Demo response
  await new Promise(r => setTimeout(r, 800));
  if (payload.username && payload.password) {
    return {
      token: 'demo_token_abc123',
      waiter: { id: 'w1', name: payload.username, role: 'waiter' },
    };
  }
  throw new Error('Invalid credentials');
};

// TABLES
export const fetchTables = async (): Promise<Table[]> => {
  // TODO: Replace with real API call when backend is ready
  // return api.get('/tables').then(r => r.data);

  await new Promise(r => setTimeout(r, 600));
  return DEMO_TABLES;
};

// MENU
export const fetchMenuCategories = async (): Promise<MenuCategory[]> => {
  // TODO: Replace with real API call when backend is ready
  // return api.get('/menu/categories').then(r => r.data);

  await new Promise(r => setTimeout(r, 300));
  return DEMO_CATEGORIES;
};

export const fetchMenuItems = async (): Promise<MenuItem[]> => {
  // TODO: Replace with real API call when backend is ready
  // return api.get('/menu/items').then(r => r.data);

  await new Promise(r => setTimeout(r, 400));
  return DEMO_MENU_ITEMS;
};

// ORDERS
export const fetchOrderByTable = async (tableId: string): Promise<Order | null> => {
  // TODO: Replace with real API call when backend is ready
  // return api.get(`/orders/table/${tableId}`).then(r => r.data).catch(() => null);

  await new Promise(r => setTimeout(r, 500));
  if (tableId === 't2' || tableId === 't6' || tableId === 't10') {
    return { ...DEMO_EXISTING_ORDER, tableId, tableNumber: parseInt(tableId.replace('t', '')) };
  }
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