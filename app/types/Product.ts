// app/types/Product.ts
export type LiquorProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'whiskey' | 'vodka' | 'rum' | 'tequila' | 'gin' | 'wine' | 'beer' | 'other';
  subCategory?: string; // e.g., "single malt", "blended", "red", "white"
  brand: string;
  alcoholContent: number; // e.g., 40 for 40% ABV
  volume: number; // in ml
  countryOfOrigin?: string;
  imageUrl: string;
  inStock: number;
  featured?: boolean;
  ageStatement?: number; // for aged spirits
  tastingNotes?: string[];
  addedBy?: string;
  createdAt?: any;
  updatedAt?: any;
};