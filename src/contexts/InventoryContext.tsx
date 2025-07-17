import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import databaseData from '../data/database.json';

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

// Load data from your database export
const initialCategories: Category[] = databaseData.categories || [];

const initialProducts: Product[] = databaseData.products || [];
const initialTransactions: InventoryTransaction[] = databaseData.transactions || [];

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