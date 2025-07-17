// Types for the database export
export interface DatabaseExport {
  categories: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    description: string;
    categoryId: string;
    sku: string;
    minStock: number;
    image: string;
    price: number;
    barcode?: string;
  }>;
  transactions: Array<{
    id: string;
    productId: string;
    type: 'entry' | 'exit';
    quantity: number;
    unitCost: number;
    date: string;
    notes: string;
  }>;
}