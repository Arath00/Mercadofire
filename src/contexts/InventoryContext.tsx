import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  sku: string;
  minStock: number;
  image: string;
  price: number;
  barcode?: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: 'entry' | 'exit';
  quantity: number;
  unitCost: number; // Only applicable for entries
  date: string;
  notes: string;
}

export type InventoryMethod = 'UEPS' | 'PEPS' | 'weighted';

interface InventoryContextType {
  // Data
  categories: Category[];
  products: Product[];
  transactions: InventoryTransaction[];
  
  // Category operations
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  
  // Product operations
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  
  // Transaction operations
  addTransaction: (transaction: Omit<InventoryTransaction, 'id'>) => void;
  
  // Inventory calculations
  getProductStock: (productId: string) => number;
  getCategoryStock: (categoryId: string) => { productId: string; stock: number }[];
  getLowStockProducts: () => Product[];
  
  // Reports
  getProductTransactions: (productId: string, startDate: string, endDate: string) => InventoryTransaction[];
  calculateInventoryCost: (productId: string, method: InventoryMethod, startDate: string, endDate: string) => {
    entries: InventoryTransaction[];
    exits: InventoryTransaction[];
    remainingStock: number;
    totalCost: number;
    averageCost: number;
  };
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Local storage keys
const STORAGE_KEYS = {
  CATEGORIES: 'inventory_categories',
  PRODUCTS: 'inventory_products',
  TRANSACTIONS: 'inventory_transactions',
};

// Initialize with some sample data
const initialCategories: Category[] = [
  { id: 'cat-beverages', name: 'Bebidas', description: 'Refrescos, jugos, agua y bebidas calientes' },
  { id: 'cat-snacks', name: 'Snacks', description: 'Papas, galletas, dulces y botanas' },
  { id: 'cat-dairy', name: 'Lácteos', description: 'Leche, queso, yogurt y derivados lácteos' },
  { id: 'cat-bakery', name: 'Panadería', description: 'Pan, pasteles, galletas y productos horneados' },
  { id: 'cat-meat', name: 'Carnes', description: 'Carnes frescas, embutidos y productos cárnicos' },
  { id: 'cat-fruits', name: 'Frutas y Verduras', description: 'Productos frescos, frutas y vegetales' },
  { id: 'cat-cleaning', name: 'Limpieza', description: 'Productos de limpieza y cuidado del hogar' },
  { id: 'cat-personal', name: 'Cuidado Personal', description: 'Higiene personal y cuidado corporal' },
  { id: 'cat-frozen', name: 'Congelados', description: 'Productos congelados y helados' },
  { id: 'cat-canned', name: 'Enlatados', description: 'Conservas, enlatados y productos no perecederos' }
];

const initialProducts: Product[] = [
  // Bebidas
  {
    id: uuidv4(),
    name: 'Coca-Cola 600ml',
    description: 'Refresco de cola clásico en botella de vidrio',
    categoryId: 'cat-beverages',
    sku: 'BEB-001',
    minStock: 20,
    image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 15.50,
    barcode: '7501055300013'
  },
  {
    id: uuidv4(),
    name: 'Agua Natural 1L',
    description: 'Agua purificada natural en botella de plástico',
    categoryId: 'cat-beverages',
    sku: 'BEB-002',
    minStock: 30,
    image: 'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 12.00,
    barcode: '7501055301001'
  },
  {
    id: uuidv4(),
    name: 'Jugo de Naranja 1L',
    description: 'Jugo natural de naranja pasteurizado',
    categoryId: 'cat-beverages',
    sku: 'BEB-003',
    minStock: 15,
    image: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 28.00,
    barcode: '7501055302002'
  },
  {
    id: uuidv4(),
    name: 'Cerveza Lager 355ml',
    description: 'Cerveza tipo lager en lata',
    categoryId: 'cat-beverages',
    sku: 'BEB-004',
    minStock: 25,
    image: 'https://images.pexels.com/photos/1552630/pexels-photo-1552630.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 22.00,
    barcode: '7501055303003'
  },
  {
    id: uuidv4(),
    name: 'Café Instantáneo 200g',
    description: 'Café soluble instantáneo premium',
    categoryId: 'cat-beverages',
    sku: 'BEB-005',
    minStock: 10,
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 85.00,
    barcode: '7501055304004'
  },

  // Snacks
  {
    id: uuidv4(),
    name: 'Papas Fritas Clásicas 150g',
    description: 'Papas fritas con sal, sabor original',
    categoryId: 'cat-snacks',
    sku: 'SNK-001',
    minStock: 20,
    image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 32.00,
    barcode: '7501055305005'
  },
  {
    id: uuidv4(),
    name: 'Galletas de Chocolate 300g',
    description: 'Galletas crujientes con chispas de chocolate',
    categoryId: 'cat-snacks',
    sku: 'SNK-002',
    minStock: 15,
    image: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 45.00,
    barcode: '7501055306006'
  },
  {
    id: uuidv4(),
    name: 'Cacahuates Salados 200g',
    description: 'Cacahuates tostados con sal',
    categoryId: 'cat-snacks',
    sku: 'SNK-003',
    minStock: 18,
    image: 'https://images.pexels.com/photos/1295572/pexels-photo-1295572.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 38.00,
    barcode: '7501055307007'
  },
  {
    id: uuidv4(),
    name: 'Chocolate en Barra 100g',
    description: 'Chocolate con leche premium',
    categoryId: 'cat-snacks',
    sku: 'SNK-004',
    minStock: 25,
    image: 'https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 28.00,
    barcode: '7501055308008'
  },
  {
    id: uuidv4(),
    name: 'Gomitas de Frutas 250g',
    description: 'Dulces gomosos sabores surtidos',
    categoryId: 'cat-snacks',
    sku: 'SNK-005',
    minStock: 12,
    image: 'https://images.pexels.com/photos/3776942/pexels-photo-3776942.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 35.00,
    barcode: '7501055309009'
  },

  // Lácteos
  {
    id: uuidv4(),
    name: 'Leche Entera 1L',
    description: 'Leche fresca pasteurizada entera',
    categoryId: 'cat-dairy',
    sku: 'LAC-001',
    minStock: 25,
    image: 'https://images.pexels.com/photos/236010/pexels-photo-236010.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 22.00,
    barcode: '7501055310010'
  },
  {
    id: uuidv4(),
    name: 'Queso Oaxaca 400g',
    description: 'Queso tipo Oaxaca para quesadillas',
    categoryId: 'cat-dairy',
    sku: 'LAC-002',
    minStock: 15,
    image: 'https://images.pexels.com/photos/773253/pexels-photo-773253.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 65.00,
    barcode: '7501055311011'
  },
  {
    id: uuidv4(),
    name: 'Yogurt Natural 1L',
    description: 'Yogurt natural sin azúcar añadida',
    categoryId: 'cat-dairy',
    sku: 'LAC-003',
    minStock: 20,
    image: 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 35.00,
    barcode: '7501055312012'
  },
  {
    id: uuidv4(),
    name: 'Mantequilla 200g',
    description: 'Mantequilla sin sal para cocinar',
    categoryId: 'cat-dairy',
    sku: 'LAC-004',
    minStock: 18,
    image: 'https://images.pexels.com/photos/479643/pexels-photo-479643.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 42.00,
    barcode: '7501055313013'
  },
  {
    id: uuidv4(),
    name: 'Crema Ácida 200ml',
    description: 'Crema ácida para acompañar platillos',
    categoryId: 'cat-dairy',
    sku: 'LAC-005',
    minStock: 12,
    image: 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 28.00,
    barcode: '7501055314014'
  },

  // Panadería
  {
    id: uuidv4(),
    name: 'Pan de Caja Integral 680g',
    description: 'Pan de caja integral con fibra',
    categoryId: 'cat-bakery',
    sku: 'PAN-001',
    minStock: 15,
    image: 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 38.00,
    barcode: '7501055315015'
  },
  {
    id: uuidv4(),
    name: 'Tortillas de Harina 1kg',
    description: 'Tortillas de harina de trigo frescas',
    categoryId: 'cat-bakery',
    sku: 'PAN-002',
    minStock: 20,
    image: 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 32.00,
    barcode: '7501055316016'
  },
  {
    id: uuidv4(),
    name: 'Donas Glaseadas 6 pzs',
    description: 'Donas dulces con glaseado de azúcar',
    categoryId: 'cat-bakery',
    sku: 'PAN-003',
    minStock: 10,
    image: 'https://images.pexels.com/photos/205961/pexels-photo-205961.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 55.00,
    barcode: '7501055317017'
  },
  {
    id: uuidv4(),
    name: 'Muffins de Arándano 4 pzs',
    description: 'Muffins esponjosos con arándanos',
    categoryId: 'cat-bakery',
    sku: 'PAN-004',
    minStock: 8,
    image: 'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 48.00,
    barcode: '7501055318018'
  },

  // Carnes
  {
    id: uuidv4(),
    name: 'Pechuga de Pollo 1kg',
    description: 'Pechuga de pollo fresca sin hueso',
    categoryId: 'cat-meat',
    sku: 'CAR-001',
    minStock: 10,
    image: 'https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 120.00,
    barcode: '7501055319019'
  },
  {
    id: uuidv4(),
    name: 'Carne Molida de Res 500g',
    description: 'Carne molida fresca de res',
    categoryId: 'cat-meat',
    sku: 'CAR-002',
    minStock: 8,
    image: 'https://images.pexels.com/photos/1268549/pexels-photo-1268549.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 85.00,
    barcode: '7501055320020'
  },
  {
    id: uuidv4(),
    name: 'Jamón de Pavo 200g',
    description: 'Jamón de pavo bajo en grasa',
    categoryId: 'cat-meat',
    sku: 'CAR-003',
    minStock: 12,
    image: 'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 65.00,
    barcode: '7501055321021'
  },
  {
    id: uuidv4(),
    name: 'Salchichas de Pavo 500g',
    description: 'Salchichas de pavo para hot dogs',
    categoryId: 'cat-meat',
    sku: 'CAR-004',
    minStock: 15,
    image: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 58.00,
    barcode: '7501055322022'
  },

  // Frutas y Verduras
  {
    id: uuidv4(),
    name: 'Plátanos 1kg',
    description: 'Plátanos frescos maduros',
    categoryId: 'cat-fruits',
    sku: 'FRU-001',
    minStock: 20,
    image: 'https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 25.00,
    barcode: '7501055323023'
  },
  {
    id: uuidv4(),
    name: 'Manzanas Rojas 1kg',
    description: 'Manzanas rojas frescas y crujientes',
    categoryId: 'cat-fruits',
    sku: 'FRU-002',
    minStock: 18,
    image: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 45.00,
    barcode: '7501055324024'
  },
  {
    id: uuidv4(),
    name: 'Tomates 1kg',
    description: 'Tomates frescos para ensaladas',
    categoryId: 'cat-fruits',
    sku: 'FRU-003',
    minStock: 15,
    image: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 35.00,
    barcode: '7501055325025'
  },
  {
    id: uuidv4(),
    name: 'Cebollas 1kg',
    description: 'Cebollas blancas frescas',
    categoryId: 'cat-fruits',
    sku: 'FRU-004',
    minStock: 12,
    image: 'https://images.pexels.com/photos/533342/pexels-photo-533342.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 28.00,
    barcode: '7501055326026'
  },
  {
    id: uuidv4(),
    name: 'Aguacates 3 pzs',
    description: 'Aguacates frescos listos para consumir',
    categoryId: 'cat-fruits',
    sku: 'FRU-005',
    minStock: 25,
    image: 'https://images.pexels.com/photos/557659/pexels-photo-557659.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 42.00,
    barcode: '7501055327027'
  },

  // Limpieza
  {
    id: uuidv4(),
    name: 'Detergente Líquido 1L',
    description: 'Detergente líquido para ropa',
    categoryId: 'cat-cleaning',
    sku: 'LIM-001',
    minStock: 10,
    image: 'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 65.00,
    barcode: '7501055328028'
  },
  {
    id: uuidv4(),
    name: 'Papel Higiénico 4 rollos',
    description: 'Papel higiénico suave doble hoja',
    categoryId: 'cat-cleaning',
    sku: 'LIM-002',
    minStock: 20,
    image: 'https://images.pexels.com/photos/4239013/pexels-photo-4239013.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 38.00,
    barcode: '7501055329029'
  },
  {
    id: uuidv4(),
    name: 'Limpiador Multiusos 500ml',
    description: 'Limpiador desinfectante multiusos',
    categoryId: 'cat-cleaning',
    sku: 'LIM-003',
    minStock: 15,
    image: 'https://images.pexels.com/photos/4239119/pexels-photo-4239119.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 42.00,
    barcode: '7501055330030'
  },
  {
    id: uuidv4(),
    name: 'Esponjas de Cocina 3 pzs',
    description: 'Esponjas para lavar trastes',
    categoryId: 'cat-cleaning',
    sku: 'LIM-004',
    minStock: 25,
    image: 'https://images.pexels.com/photos/4239072/pexels-photo-4239072.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 22.00,
    barcode: '7501055331031'
  },

  // Cuidado Personal
  {
    id: uuidv4(),
    name: 'Champú 400ml',
    description: 'Champú para todo tipo de cabello',
    categoryId: 'cat-personal',
    sku: 'PER-001',
    minStock: 12,
    image: 'https://images.pexels.com/photos/4465831/pexels-photo-4465831.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 55.00,
    barcode: '7501055332032'
  },
  {
    id: uuidv4(),
    name: 'Pasta Dental 100ml',
    description: 'Pasta dental con flúor',
    categoryId: 'cat-personal',
    sku: 'PER-002',
    minStock: 18,
    image: 'https://images.pexels.com/photos/298663/pexels-photo-298663.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 32.00,
    barcode: '7501055333033'
  },
  {
    id: uuidv4(),
    name: 'Desodorante 150ml',
    description: 'Desodorante antitranspirante',
    categoryId: 'cat-personal',
    sku: 'PER-003',
    minStock: 15,
    image: 'https://images.pexels.com/photos/4465815/pexels-photo-4465815.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 48.00,
    barcode: '7501055334034'
  },
  {
    id: uuidv4(),
    name: 'Jabón de Manos 250ml',
    description: 'Jabón líquido antibacterial',
    categoryId: 'cat-personal',
    sku: 'PER-004',
    minStock: 20,
    image: 'https://images.pexels.com/photos/4465828/pexels-photo-4465828.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 35.00,
    barcode: '7501055335035'
  },

  // Congelados
  {
    id: uuidv4(),
    name: 'Pizza Congelada Pepperoni',
    description: 'Pizza congelada con pepperoni',
    categoryId: 'cat-frozen',
    sku: 'CON-001',
    minStock: 8,
    image: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 85.00,
    barcode: '7501055336036'
  },
  {
    id: uuidv4(),
    name: 'Helado de Vainilla 1L',
    description: 'Helado cremoso sabor vainilla',
    categoryId: 'cat-frozen',
    sku: 'CON-002',
    minStock: 10,
    image: 'https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 75.00,
    barcode: '7501055337037'
  },
  {
    id: uuidv4(),
    name: 'Verduras Mixtas Congeladas 500g',
    description: 'Mezcla de verduras congeladas',
    categoryId: 'cat-frozen',
    sku: 'CON-003',
    minStock: 12,
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 45.00,
    barcode: '7501055338038'
  },

  // Enlatados
  {
    id: uuidv4(),
    name: 'Frijoles Negros Enlatados 400g',
    description: 'Frijoles negros cocidos en lata',
    categoryId: 'cat-canned',
    sku: 'ENL-001',
    minStock: 20,
    image: 'https://images.pexels.com/photos/6287520/pexels-photo-6287520.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 28.00,
    barcode: '7501055339039'
  },
  {
    id: uuidv4(),
    name: 'Atún en Agua 140g',
    description: 'Atún en trozos en agua',
    categoryId: 'cat-canned',
    sku: 'ENL-002',
    minStock: 25,
    image: 'https://images.pexels.com/photos/6287461/pexels-photo-6287461.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 32.00,
    barcode: '7501055340040'
  },
  {
    id: uuidv4(),
    name: 'Salsa de Tomate 400g',
    description: 'Salsa de tomate natural enlatada',
    categoryId: 'cat-canned',
    sku: 'ENL-003',
    minStock: 18,
    image: 'https://images.pexels.com/photos/6287334/pexels-photo-6287334.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 25.00,
    barcode: '7501055341041'
  },
  {
    id: uuidv4(),
    name: 'Chiles Jalapeños 220g',
    description: 'Chiles jalapeños en escabeche',
    categoryId: 'cat-canned',
    sku: 'ENL-004',
    minStock: 15,
    image: 'https://images.pexels.com/photos/6287378/pexels-photo-6287378.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 22.00,
    barcode: '7501055342042'
  }
];
const initialTransactions: InventoryTransaction[] = [];

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [transactions, setTransactions] = useState<InventoryTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  // Category operations
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: uuidv4() };
    setCategories([...categories, newCategory]);
  };

  const updateCategory = (updatedCategory: Category) => {
    setCategories(
      categories.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat))
    );
  };

  const deleteCategory = (id: string) => {
    // Check if category is in use by any products
    const inUse = products.some((product) => product.categoryId === id);
    if (inUse) {
      throw new Error('Cannot delete category that is in use by products');
    }
    setCategories(categories.filter((cat) => cat.id !== id));
  };

  // Product operations
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: uuidv4() };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(
      products.map((prod) => (prod.id === updatedProduct.id ? updatedProduct : prod))
    );
  };

  const deleteProduct = (id: string) => {
    // Check if product has any transactions
    const hasTransactions = transactions.some((transaction) => transaction.productId === id);
    if (hasTransactions) {
      throw new Error('Cannot delete product that has transactions');
    }
    setProducts(products.filter((prod) => prod.id !== id));
  };

  // Transaction operations
  const addTransaction = (transaction: Omit<InventoryTransaction, 'id'>) => {
    const newTransaction = { ...transaction, id: uuidv4() };
    
    // Validate transaction
    if (transaction.type === 'exit') {
      const currentStock = getProductStock(transaction.productId);
      if (currentStock < transaction.quantity) {
        throw new Error('Not enough stock for this transaction');
      }
    }
    
    setTransactions([...transactions, newTransaction]);
  };

  // Inventory calculations
  const getProductStock = (productId: string): number => {
    const productTransactions = transactions.filter((t) => t.productId === productId);
    
    return productTransactions.reduce((stock, transaction) => {
      if (transaction.type === 'entry') {
        return stock + transaction.quantity;
      } else {
        return stock - transaction.quantity;
      }
    }, 0);
  };

  const getCategoryStock = (categoryId: string) => {
    const categoryProducts = products.filter((p) => p.categoryId === categoryId);
    
    return categoryProducts.map((product) => ({
      productId: product.id,
      stock: getProductStock(product.id),
    }));
  };

  const getLowStockProducts = () => {
    return products.filter((product) => {
      const stock = getProductStock(product.id);
      return stock <= product.minStock;
    });
  };

  // Reports
  const getProductTransactions = (
    productId: string,
    startDate: string,
    endDate: string
  ): InventoryTransaction[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        t.productId === productId &&
        transactionDate >= start &&
        transactionDate <= end
      );
    });
  };

  const calculateInventoryCost = (
    productId: string,
    method: InventoryMethod,
    startDate: string,
    endDate: string
  ) => {
    const filteredTransactions = getProductTransactions(productId, startDate, endDate);
    const entries = filteredTransactions.filter((t) => t.type === 'entry');
    const exits = filteredTransactions.filter((t) => t.type === 'exit');
    
    let remainingStock = 0;
    let totalCost = 0;
    let averageCost = 0;
    
    // Different calculation methods
    if (method === 'PEPS') {
      // First In, First Out
      const entriesQueue = [...entries].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      let remainingEntries = [...entriesQueue];
      
      // Process exits
      for (const exit of exits.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )) {
        let remainingExitQuantity = exit.quantity;
        
        while (remainingExitQuantity > 0 && remainingEntries.length > 0) {
          const oldestEntry = remainingEntries[0];
          
          if (oldestEntry.quantity <= remainingExitQuantity) {
            // Use entire entry
            remainingExitQuantity -= oldestEntry.quantity;
            remainingEntries.shift();
          } else {
            // Use partial entry
            remainingEntries[0] = {
              ...oldestEntry,
              quantity: oldestEntry.quantity - remainingExitQuantity,
            };
            remainingExitQuantity = 0;
          }
        }
      }
      
      // Calculate remaining stock and cost
      remainingStock = remainingEntries.reduce((sum, entry) => sum + entry.quantity, 0);
      totalCost = remainingEntries.reduce((sum, entry) => sum + (entry.quantity * entry.unitCost), 0);
      averageCost = remainingStock > 0 ? totalCost / remainingStock : 0;
      
    } else if (method === 'UEPS') {
      // Last In, First Out
      const entriesStack = [...entries].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      let remainingEntries = [...entriesStack];
      
      // Process exits
      for (const exit of exits.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )) {
        let remainingExitQuantity = exit.quantity;
        
        while (remainingExitQuantity > 0 && remainingEntries.length > 0) {
          const newestEntry = remainingEntries[0];
          
          if (newestEntry.quantity <= remainingExitQuantity) {
            // Use entire entry
            remainingExitQuantity -= newestEntry.quantity;
            remainingEntries.shift();
          } else {
            // Use partial entry
            remainingEntries[0] = {
              ...newestEntry,
              quantity: newestEntry.quantity - remainingExitQuantity,
            };
            remainingExitQuantity = 0;
          }
        }
      }
      
      // Calculate remaining stock and cost
      remainingStock = remainingEntries.reduce((sum, entry) => sum + entry.quantity, 0);
      totalCost = remainingEntries.reduce((sum, entry) => sum + (entry.quantity * entry.unitCost), 0);
      averageCost = remainingStock > 0 ? totalCost / remainingStock : 0;
      
    } else if (method === 'weighted') {
      // Weighted Average Cost
      let totalUnits = 0;
      let totalValue = 0;
      
      // Calculate initial weighted average
      for (const entry of entries) {
        totalUnits += entry.quantity;
        totalValue += entry.quantity * entry.unitCost;
      }
      
      // Apply exits
      for (const exit of exits) {
        if (totalUnits > 0) {
          const currentAverageCost = totalValue / totalUnits;
          totalValue -= exit.quantity * currentAverageCost;
          totalUnits -= exit.quantity;
        }
      }
      
      remainingStock = totalUnits;
      totalCost = totalValue;
      averageCost = remainingStock > 0 ? totalCost / remainingStock : 0;
    }
    
    return {
      entries,
      exits,
      remainingStock,
      totalCost,
      averageCost,
    };
  };

  const value = {
    categories,
    products,
    transactions,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    addTransaction,
    getProductStock,
    getCategoryStock,
    getLowStockProducts,
    getProductTransactions,
    calculateInventoryCost,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

// Custom hook to use the inventory context
export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};