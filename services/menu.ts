import api from './api';

type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

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
  price: number;
  isAvailable: boolean;
  variants: Variant[];
  addons: Addon[];
  description?: string;
  isVeg?: boolean;
  tags?: string[];
};

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
        variants: (dish.variants ?? []).map(v => ({ id: v.id, name: v.name, price: v.price })),
        addons: (dish.addons ?? []).map(a => ({ id: a.id, name: a.name, price: a.price })),
      });
    }
  }
  return items;
};