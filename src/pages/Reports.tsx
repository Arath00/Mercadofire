import React, { useState } from 'react';
import { useInventory, InventoryMethod } from '../contexts/InventoryContext';
import { PieChart, Printer, Download, FileText, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

const Reports: React.FC = () => {
  const { products, calculateInventoryCost, getProductTransactions } = useInventory();
  
  // Parámetros de informe
  const [productId, setProductId] = useState<string>('');
  const [inventoryMethod, setInventoryMethod] = useState<InventoryMethod>('weighted');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showReport, setShowReport] = useState(false);
  
  // Informar datos
  const [reportData, setReportData] = useState<{
    entries: any[];
    exits: any[];
    kardexData?: any[];
    remainingStock: number;
    totalCost: number;
    averageCost: number;
  } | null>(null);
  
  const generateReport = () => {
    if (!productId || !startDate || !endDate) {
      return;
    }
    
    const data = calculateInventoryCost(productId, inventoryMethod, startDate, endDate);
    setReportData(data);
    setShowReport(true);
  };
  
  const resetReport = () => {
    setShowReport(false);
    setReportData(null);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleExportToExcel = () => {
    if (!showReport || !reportData) {
      return;
    }

    // Crear un nuevo workbook
    const workbook = XLSX.utils.book_new();
    
    // Datos del resumen
    const summaryData = [
      ['REPORTE DE INVENTARIO'],
      [''],
      ['Producto:', getProductName(productId)],
      ['Método de Valuación:', 
        inventoryMethod === 'PEPS' ? 'Primeras Entradas, Primeras Salidas' :
        inventoryMethod === 'UEPS' ? 'Últimas Entradas, Primeras Salidas' :
        'Costo Promedio Ponderado'
      ],
      ['Período:', `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`],
      ['Fecha de Generación:', new Date().toLocaleDateString()],
      [''],
      ['RESUMEN'],
      ['Stock Final:', reportData.remainingStock + ' unidades'],
      ['Costo Total:', '$' + reportData.totalCost.toFixed(2)],
      ['Costo Unitario Promedio:', '$' + reportData.averageCost.toFixed(2)],
      ['']
    ];

    // Crear hoja de resumen
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // Datos de entradas
    if (reportData.entries.length > 0) {
      const entriesData = [
        ['ENTRADAS'],
        [''],
        ['Fecha', 'Cantidad', 'Costo Unitario', 'Costo Total'],
        ...reportData.entries.map(entry => [
          new Date(entry.date).toLocaleDateString(),
          entry.quantity,
          '$' + entry.unitCost.toFixed(2),
          '$' + (entry.quantity * entry.unitCost).toFixed(2)
        ])
      ];
      
      const entriesSheet = XLSX.utils.aoa_to_sheet(entriesData);
      XLSX.utils.book_append_sheet(workbook, entriesSheet, 'Entradas');
    }

    // Datos de salidas
    if (reportData.exits.length > 0) {
      const exitsData = [
        ['SALIDAS'],
        [''],
        ['Fecha', 'Cantidad', 'Costo Calculado'],
        ...reportData.exits.map(exit => [
          new Date(exit.date).toLocaleDateString(),
          exit.quantity,
          '$' + (exit.quantity * reportData.averageCost).toFixed(2)
        ])
      ];
      
      const exitsSheet = XLSX.utils.aoa_to_sheet(exitsData);
      XLSX.utils.book_append_sheet(workbook, exitsSheet, 'Salidas');
    }

    // Generar nombre del archivo
    const fileName = `Reporte_${getProductName(productId).replace(/\s+/g, '_')}_${startDate}_${endDate}.xlsx`;
    
    // Descargar el archivo
    XLSX.writeFile(workbook, fileName);
  };
  
  // Obtener el nombre del producto por ID
  const getProductName = (id: string) => {
    const product = products.find(p => p.id === id);
    return product ? product.name : 'Producto desconocido';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
      </div>

      {/* Generador de informes */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-medium text-gray-900">Generador de Reportes</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Reporte de Inventario por Método</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
                  Producto
                </label>
                <select
                  id="productId"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Seleccione un producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="inventoryMethod" className="block text-sm font-medium text-gray-700">
                  Método de Inventario
                </label>
                <select
                  id="inventoryMethod"
                  value={inventoryMethod}
                  onChange={(e) => setInventoryMethod(e.target.value as InventoryMethod)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="weighted">Costo Promedio Ponderado</option>
                  <option value="PEPS">PEPS (Primeras Entradas, Primeras Salidas)</option>
                  <option value="UEPS">UEPS (Últimas Entradas, Primeras Salidas)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={generateReport}
                  disabled={!productId || !startDate || !endDate}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    !productId || !startDate || !endDate ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Generar Reporte
                </button>
                
                {showReport && (
                  <button
                    onClick={resetReport}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-l border-gray-200 pl-6">
            <h3 className="text-md font-medium text-gray-700 mb-3">Acciones rápidas</h3>
            <div className="space-y-4">
              <button
                onClick={handlePrint}
                disabled={!showReport}
                className={`flex items-center w-full px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  !showReport ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Reporte
              </button>
              
              <button
                onClick={handleExportToExcel}
                disabled={!showReport}
                className={`flex items-center w-full px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  !showReport ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar a Excel
              </button>
              
              <button
                disabled={!showReport}
                className={`flex items-center w-full px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  !showReport ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <PieChart className="h-4 w-4 mr-2" />
                Ver Gráficos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Results */}
      {showReport && reportData && (
        <div className="bg-white shadow rounded-lg overflow-hidden print:shadow-none" id="printable-report">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 print:bg-white">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Reporte de Inventario: {getProductName(productId)}
              </h2>
              <div className="text-sm text-gray-500">
                {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Método: {
                inventoryMethod === 'PEPS' ? 'Primeras Entradas, Primeras Salidas' :
                inventoryMethod === 'UEPS' ? 'Últimas Entradas, Primeras Salidas' :
                'Costo Promedio Ponderado'
              }
            </p>
          </div>
          
          <div className="p-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Stock Final</p>
                <p className="text-2xl font-bold text-blue-900">{reportData.remainingStock} unidades</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-800">Costo Total</p>
                <p className="text-2xl font-bold text-green-900">${reportData.totalCost.toFixed(2)}</p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-amber-800">Costo Unitario Promedio</p>
                <p className="text-2xl font-bold text-amber-900">
                  ${reportData.averageCost.toFixed(2)}
                </p>
              </div>
            </div>
            
            {/* Entries */}
            {/* Kardex Table for PEPS */}
            {inventoryMethod === 'PEPS' && reportData.kardexData ? (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Kardex - Control de Inventario PEPS</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                          Fecha
                        </th>
                        <th colSpan={3} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-green-50">
                          Compras
                        </th>
                        <th colSpan={3} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-red-50">
                          Ventas
                        </th>
                        <th colSpan={3} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                          Saldos
                        </th>
                      </tr>
                      <tr>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase border-r">Cantidad</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase border-r">Costo Unit.</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase border-r">Costo Total</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase border-r">Cantidad</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase border-r">Costo Unit.</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase border-r">Costo Total</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase border-r">Cantidad</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase border-r">Costo Unit.</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">Costo Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.kardexData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r">
                            {new Date(row.fecha).toLocaleDateString()}
                          </td>
                          {/* Compras */}
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-center border-r bg-green-25">
                            {row.compras.cantidad || '-'}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-right border-r bg-green-25">
                            {row.compras.costoUnitario ? `$${row.compras.costoUnitario.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-right border-r bg-green-25">
                            {row.compras.costoTotal ? `$${row.compras.costoTotal.toFixed(2)}` : '-'}
                          </td>
                          {/* Ventas */}
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-center border-r bg-red-25">
                            {row.ventas.cantidad || '-'}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-right border-r bg-red-25">
                            {row.ventas.costoUnitario ? `$${row.ventas.costoUnitario.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-right border-r bg-red-25">
                            {row.ventas.costoTotal ? `$${row.ventas.costoTotal.toFixed(2)}` : '-'}
                          </td>
                          {/* Saldos */}
                          <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-center border-r bg-blue-25">
                            {row.saldos.cantidad}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right border-r bg-blue-25">
                            ${row.saldos.costoUnitario.toFixed(2)}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right bg-blue-25">
                            ${row.saldos.costoTotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <>
                {/* Traditional format for other methods */}
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Entradas</h3>
                  {reportData.entries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cantidad
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Costo Unitario
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Costo Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.entries.map((entry) => (
                            <tr key={entry.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(entry.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {entry.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${entry.unitCost.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${(entry.quantity * entry.unitCost).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No hay entradas en el período seleccionado</p>
                  )}
                </div>
                
                {/* Exits */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Salidas</h3>
                  {reportData.exits.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cantidad
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Costo Calculado
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.exits.map((exit) => (
                            <tr key={exit.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(exit.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {exit.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${(exit.quantity * reportData.averageCost).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No hay salidas en el período seleccionado</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;