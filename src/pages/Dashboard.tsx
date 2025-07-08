import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package2, AlertCircle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';

const Dashboard: React.FC = () => {
  const { 
    products, 
    categories, 
    transactions, 
    getLowStockProducts,
    getProductStock,
    getCategoryStock
  } = useInventory();

  const lowStockProducts = getLowStockProducts();
  
  // Calculate total inventory value
  const totalInventoryValue = products.reduce((total, product) => {
    const stock = getProductStock(product.id);
    return total + (stock * product.price);
  }, 0);
  
  // Get recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  // Category distribution data for pie chart
  const categoryData = categories.map(category => {
    const categoryStocks = getCategoryStock(category.id);
    const totalStock = categoryStocks.reduce((sum, item) => sum + item.stock, 0);
    
    return {
      name: category.name,
      value: totalStock
    };
  }).filter(item => item.value > 0);
  
  // Product stock data for bar chart
  const productStockData = products
    .map(product => ({
      name: product.name,
      stock: getProductStock(product.id),
      minStock: product.minStock
    }))
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5);
  
  // Calculating total entries and exits
  const totalEntries = transactions
    .filter(t => t.type === 'entry')
    .reduce((sum, t) => sum + t.quantity, 0);
  
  const totalExits = transactions
    .filter(t => t.type === 'exit')
    .reduce((sum, t) => sum + t.quantity, 0);

  // Colors for the pie chart
  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Package2 className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Productos</p>
              <p className="text-xl font-semibold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
              <p className="text-xl font-semibold text-gray-900">{lowStockProducts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <ArrowDownCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Entradas</p>
              <p className="text-xl font-semibold text-gray-900">{totalEntries}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100 text-amber-600">
              <ArrowUpCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Salidas</p>
              <p className="text-xl font-semibold text-gray-900">{totalExits}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Inventario por Producto</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productStockData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock" fill="#2563EB" />
                <Bar dataKey="minStock" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Distribución por Categoría</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">Alertas de Stock</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(product => {
                const stock = getProductStock(product.id);
                return (
                  <div key={product.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          Stock actual: <span className="font-medium text-red-600">{stock}</span> / Mínimo: {product.minStock}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Stock Bajo
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-4 text-center text-gray-500">
                No hay productos con stock bajo
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">Actividad Reciente</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
            {recentTransactions.length > 0 ? (
              recentTransactions.map(transaction => {
                const product = products.find(p => p.id === transaction.productId);
                return (
                  <div key={transaction.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product?.name}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.type === 'entry' ? 'Entrada' : 'Salida'} de {transaction.quantity} unidades
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transaction.type === 'entry' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {transaction.type === 'entry' ? 'Entrada' : 'Salida'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-4 text-center text-gray-500">
                No hay transacciones recientes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Value Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Valor Total del Inventario</h2>
        <p className="text-3xl font-bold text-blue-600">
          ${totalInventoryValue.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;