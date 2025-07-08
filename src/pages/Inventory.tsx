import React, { useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { ArrowDownCircle, ArrowUpCircle, X, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface TransactionFormData {
  productId: string;
  type: 'entry' | 'exit';
  quantity: number;
  unitCost: number;
  date: string;
  notes: string;
}

const Inventory: React.FC = () => {
  const { products, transactions, addTransaction, getProductStock } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'entry' | 'exit'>('entry');
  const [formData, setFormData] = useState<TransactionFormData>({
    productId: '',
    type: 'entry',
    quantity: 1,
    unitCost: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'' | 'entry' | 'exit'>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const handleOpenModal = (type: 'entry' | 'exit') => {
    setTransactionType(type);
    setFormData({
      productId: products.length > 0 ? products[0].id : '',
      type,
      quantity: 1,
      unitCost: type === 'entry' ? 0 : 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['quantity', 'unitCost'].includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId) {
      toast.error('Debe seleccionar un producto');
      return;
    }
    
    if (formData.quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    
    if (formData.type === 'entry' && formData.unitCost <= 0) {
      toast.error('El costo unitario debe ser mayor a 0');
      return;
    }
    
    try {
      addTransaction(formData);
      toast.success(`${formData.type === 'entry' ? 'Entrada' : 'Salida'} registrada con éxito`);
      handleCloseModal();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(`Error al registrar ${formData.type === 'entry' ? 'entrada' : 'salida'}`);
      }
      console.error(error);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const product = products.find((p) => p.id === transaction.productId);
    const matchesSearch = product
      ? product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      : false;
    
    const matchesType = filterType === '' || transaction.type === filterType;
    
    const transactionDate = new Date(transaction.date);
    const isAfterStartDate = !startDate || transactionDate >= new Date(startDate);
    const isBeforeEndDate = !endDate || transactionDate <= new Date(endDate);
    
    return matchesSearch && matchesType && isAfterStartDate && isBeforeEndDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Get product name by ID
  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : 'Producto desconocido';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => handleOpenModal('entry')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <ArrowDownCircle className="h-4 w-4 mr-2" />
            Registrar Entrada
          </button>
          <button
            onClick={() => handleOpenModal('exit')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            Registrar Salida
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Filtros</h2>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="text-gray-500 hover:text-gray-700"
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buscar por producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="filterType" className="block text-sm font-medium text-gray-700">
                Tipo de Transacción
              </label>
              <select
                id="filterType"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as '' | 'entry' | 'exit')}
              >
                <option value="">Todos</option>
                <option value="entry">Entradas</option>
                <option value="exit">Salidas</option>
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Fecha Inicio
              </label>
              <input
                type="date"
                id="startDate"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                Fecha Fin
              </label>
              <input
                type="date"
                id="endDate"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Transactions list */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Movimientos de Inventario</h3>
        </div>
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo Unit.
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getProductName(transaction.productId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === 'entry'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {transaction.type === 'entry' ? 'Entrada' : 'Salida'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.type === 'entry' ? `$${transaction.unitCost.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.type === 'entry'
                        ? `$${(transaction.quantity * transaction.unitCost).toFixed(2)}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {transaction.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No se encontraron transacciones
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleCloseModal}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  {transactionType === 'entry' ? 'Registrar Entrada' : 'Registrar Salida'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
                        Producto
                      </label>
                      <select
                        name="productId"
                        id="productId"
                        value={formData.productId}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      >
                        <option value="" disabled>
                          Seleccione un producto
                        </option>
                        {products.map((product) => {
                          const stock = getProductStock(product.id);
                          const disabled = transactionType === 'exit' && stock <= 0;
                          
                          return (
                            <option key={product.id} value={product.id} disabled={disabled}>
                              {product.name} {disabled ? '(Sin stock)' : `(Stock: ${stock})`}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        id="quantity"
                        min="1"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    {transactionType === 'entry' && (
                      <div>
                        <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700">
                          Costo Unitario ($)
                        </label>
                        <input
                          type="number"
                          name="unitCost"
                          id="unitCost"
                          min="0.01"
                          step="0.01"
                          value={formData.unitCost}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                    )}
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                        Fecha
                      </label>
                      <input
                        type="date"
                        name="date"
                        id="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notas
                      </label>
                      <textarea
                        name="notes"
                        id="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      transactionType === 'entry'
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        : 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                    }`}
                  >
                    {transactionType === 'entry' ? 'Registrar Entrada' : 'Registrar Salida'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;