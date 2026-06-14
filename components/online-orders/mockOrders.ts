export type Platform = 'zomato' | 'swiggy';
export type OrderStatus = 'pending' | 'accepted' | 'rejected';

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  platform: Platform;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  deliveryFee: number;
  placedAgo: string;
  deliveryAddress: string;
  paymentMethod: string;
  specialInstructions?: string;
  status: OrderStatus;
};

export const getOrderSubtotal = (order: Order) =>
  order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const getOrderTotal = (order: Order) =>
  getOrderSubtotal(order) + order.deliveryFee;

export const initialOrders: Order[] = [
  // ---- Zomato ----
  {
    id: 'zom-1',
    platform: 'zomato',
    orderNumber: 'ZOM-4521',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98765 43210',
    items: [
      { id: 'i1', name: 'Butter Chicken', quantity: 2, price: 220 },
      { id: 'i2', name: 'Garlic Naan', quantity: 3, price: 45 },
      { id: 'i3', name: 'Jeera Rice', quantity: 1, price: 130 },
    ],
    deliveryFee: 30,
    placedAgo: '4 min ago',
    deliveryAddress: '14B, Lake View Apartments, Salt Lake, Kolkata',
    paymentMethod: 'Paid Online',
    specialInstructions: 'Please make it less spicy.',
    status: 'pending',
  },
  {
    id: 'zom-2',
    platform: 'zomato',
    orderNumber: 'ZOM-4522',
    customerName: 'Rohan Mehta',
    customerPhone: '+91 91234 56789',
    items: [
      { id: 'i1', name: 'Paneer Tikka', quantity: 1, price: 240 },
      { id: 'i2', name: 'Tandoori Roti', quantity: 4, price: 25 },
      { id: 'i3', name: 'Dal Makhani', quantity: 1, price: 190 },
    ],
    deliveryFee: 25,
    placedAgo: '11 min ago',
    deliveryAddress: '7, Park Street, Near City Mall, Kolkata',
    paymentMethod: 'Cash on Delivery',
    status: 'pending',
  },
  {
    id: 'zom-3',
    platform: 'zomato',
    orderNumber: 'ZOM-4519',
    customerName: 'Ayesha Khan',
    customerPhone: '+91 99887 76655',
    items: [
      { id: 'i1', name: 'Chicken Biryani', quantity: 1, price: 280 },
      { id: 'i2', name: 'Raita', quantity: 1, price: 40 },
    ],
    deliveryFee: 20,
    placedAgo: '26 min ago',
    deliveryAddress: '22, Camac Street, Kolkata',
    paymentMethod: 'Paid Online',
    status: 'accepted',
  },
  {
    id: 'zom-4',
    platform: 'zomato',
    orderNumber: 'ZOM-4515',
    customerName: 'Vikram Singh',
    customerPhone: '+91 90011 22334',
    items: [
      { id: 'i1', name: 'Veg Manchurian', quantity: 2, price: 170 },
      { id: 'i2', name: 'Fried Rice', quantity: 1, price: 160 },
    ],
    deliveryFee: 30,
    placedAgo: '42 min ago',
    deliveryAddress: '3, Rashbehari Avenue, Kolkata',
    paymentMethod: 'Paid Online',
    specialInstructions: 'Pack sauces separately.',
    status: 'rejected',
  },

  // ---- Swiggy ----
  {
    id: 'swg-1',
    platform: 'swiggy',
    orderNumber: 'SWG-7841',
    customerName: 'Ananya Roy',
    customerPhone: '+91 98123 45678',
    items: [
      { id: 'i1', name: 'Margherita Pizza', quantity: 1, price: 299 },
      { id: 'i2', name: 'Garlic Bread', quantity: 1, price: 99 },
      { id: 'i3', name: 'Coke (500ml)', quantity: 2, price: 40 },
    ],
    deliveryFee: 35,
    placedAgo: '2 min ago',
    deliveryAddress: 'Flat 6C, Hiland Park, EM Bypass, Kolkata',
    paymentMethod: 'Paid Online',
    specialInstructions: 'Ring the bell twice.',
    status: 'pending',
  },
  {
    id: 'swg-2',
    platform: 'swiggy',
    orderNumber: 'SWG-7839',
    customerName: 'Karan Patel',
    customerPhone: '+91 99001 11223',
    items: [
      { id: 'i1', name: 'Chicken Burger', quantity: 2, price: 159 },
      { id: 'i2', name: 'French Fries', quantity: 1, price: 99 },
    ],
    deliveryFee: 25,
    placedAgo: '8 min ago',
    deliveryAddress: '45, Southern Avenue, Kolkata',
    paymentMethod: 'Cash on Delivery',
    status: 'pending',
  },
  {
    id: 'swg-3',
    platform: 'swiggy',
    orderNumber: 'SWG-7835',
    customerName: 'Sneha Iyer',
    customerPhone: '+91 97700 88990',
    items: [
      { id: 'i1', name: 'Veg Thali', quantity: 1, price: 220 },
      { id: 'i2', name: 'Sweet Lassi', quantity: 1, price: 70 },
    ],
    deliveryFee: 20,
    placedAgo: '19 min ago',
    deliveryAddress: '12, Gariahat Road, Kolkata',
    paymentMethod: 'Paid Online',
    status: 'pending',
  },
  {
    id: 'swg-4',
    platform: 'swiggy',
    orderNumber: 'SWG-7830',
    customerName: 'Arjun Nair',
    customerPhone: '+91 96655 44332',
    items: [
      { id: 'i1', name: 'Chowmein', quantity: 1, price: 150 },
      { id: 'i2', name: 'Spring Rolls', quantity: 1, price: 130 },
      { id: 'i3', name: 'Manchow Soup', quantity: 1, price: 110 },
    ],
    deliveryFee: 30,
    placedAgo: '37 min ago',
    deliveryAddress: '9, Ballygunge Place, Kolkata',
    paymentMethod: 'Paid Online',
    status: 'accepted',
  },
];