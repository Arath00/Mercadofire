import React, { useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { Plus, Edit, Trash2, X, Package2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductFormData {
  name: string;
  description: string;
  categoryId: string;
  sku: string;
  minStock: number;
  image: string;
  price: number;
  barcode?: string;
}

const Products: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct, getProductStock } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    categoryId: '',
    sku: '',
    minStock: 5,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const handleOpenModal = (productId?: string) => {
    if (productId) {
      const product = products.find((p) => p.id === productId);
      if (product) {
        setFormData({
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          sku: product.sku,
          minStock: product.minStock,
          image: '',
          price: 0,
          barcode: '',
          image: product.image,
          price: product.price,
          barcode: product.barcode || '',
        });
        setEditingProduct(productId);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        sku: '',
        minStock: 5,
      });
      setEditingProduct(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['minStock', 'price'].includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre del producto es requerido');
      return;
    }
    
    if (!formData.categoryId) {
      toast.error('Debe seleccionar una categoría');
      return;
    }
    
    try {
      if (editingProduct) {
        updateProduct({
          id: editingProduct,
          ...formData,
        });
        toast.success('Producto actualizado con éxito');
      } else {
        addProduct(formData);
        toast.success('Producto agregado con éxito');
      }
      handleCloseModal();
    } catch (error) {
      toast.error('Error al guardar el producto');
      console.error(error);
    }
  };

  const handleDelete = (id: string) => {
    try {
      deleteProduct(id);
      toast.success('Producto eliminado con éxito');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error al eliminar el producto');
      }
      console.error(error);
    }
  };

  // Filter products based on search term and category filter
  const filteredProducts = products.filter(
    (product) =>
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (categoryFilter === '' || product.categoryId === categoryFilter)
  );

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : 'Sin categoría';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Category filter */}
        <div className="md:w-1/3">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products list */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredProducts.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredProducts.map((product) => {
              const stock = getProductStock(product.id);
              const isLowStock = stock <= product.minStock;
              
              return (
                <li key={product.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="h-16 w-16 object-cover rounded-lg mr-4 flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=400';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                          <Package2 className="h-5 w-5 mr-2 text-gray-400" />
                          {product.name}
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            {product.sku}
                          </span>
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">{product.description}</p>
                        <div className="mt-2 flex items-center text-sm flex-wrap gap-2">
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-800">
                            {getCategoryName(product.categoryId)}
                          </span>
                          <span className={`ml-3 rounded-full px-2.5 py-0.5 text-xs ${
                            isLowStock 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            Stock: {stock} {isLowStock ? '(Bajo)' : ''}
                          </span>
                          <span className="ml-3 text-xs text-gray-500">
                            Mínimo: {product.minStock}
                          </span>
                          <span className="ml-3 text-xs font-medium text-green-600">
                            ${product.price.toFixed(2)}
                          </span>
                          {product.barcode && (
                            <span className="ml-3 text-xs text-gray-400">
                              {product.barcode}
                            </span>
                          )}
                        </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenModal(product.id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-8 text-center text-gray-500">
            {searchTerm || categoryFilter
              ? "No se encontraron productos con esos filtros"
              : "No hay productos registrados"}
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
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
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
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Nombre
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                        SKU
                      </label>
                      <input
                        type="text"
                        name="sku"
                        id="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">
                        Código de Barras
                      </label>
                      <input
                        type="text"
                        name="barcode"
                        id="barcode"
                        value={formData.barcode}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                        Categoría
                      </label>
                      <select
                        name="categoryId"
                        id="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      >
                        <option value="" disabled>
                          Seleccione una categoría
                        </option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                      <label htmlFor="minStock" className="block text-sm font-medium text-gray-700">
                        Stock Mínimo
                      </label>
                      <input
                        type="number"
                        name="minStock"
                        id="minStock"
                        min="0"
                        value={formData.minStock}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      </div>
                      <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                          Precio ($)
                        </label>
                        <input
                          type="number"
                          name="price"
                          id="price"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                        URL de Imagen
                      </label>
                      <input
                        type="url"
                        name="image"
                        id="image"
                        value={formData.image}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                      {formData.image && (
                        <div className="mt-2">
                          <img 
                            src={formData.image} 
                            alt="Vista previa" 
                            className="h-20 w-20 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=400';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Descripción
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        rows={3}
                        value={formData.description}
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
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingProduct ? 'Actualizar' : 'Crear'}
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

export default Products;