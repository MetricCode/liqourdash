// types/Product.ts
import { Timestamp } from 'firebase/firestore';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  inStock: number;
  alcoholContent?: number;
  volume?: number;
  brand?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  addedBy?: string;
};