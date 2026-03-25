export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface MarketItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string; // ISO string
  location: string;
  imageUrl?: string;
  description?: string;
  type: 'match' | 'training' | 'campus';
}
