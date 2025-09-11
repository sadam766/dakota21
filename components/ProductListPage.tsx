import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ProductType } from '../types';
import { SearchIcon, ExportIcon, ImportIcon } from './icons';
import PaginationControls from './PaginationControls';

declare const XLSX: any;

interface ProductListPageProps {
  products: ProductType[];
  setActiveView: (view: string) => void;
  setEditingProduct: (product: ProductType) => void;
  onDeleteProduct: (productId: string) => void;
  loading: boolean;
  error: string | null;
}

const ProductListPage: React.FC<ProductListPageProps> = ({ products, setActiveView, setEditingProduct, onDeleteProduct, loading, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);


  const uniqueCategories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        if (categoryFilter === 'All Categories') return true;
        return product.category === categoryFilter;
      })
      .filter(product => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;
        return (
            product.name.toLowerCase().includes(term) ||
            product.category.toLowerCase().includes(term) ||
            String(product.stock).includes(term) ||
            (product.unit || '').toLowerCase().includes(term) ||
            String(product.price).includes(term)
        );
      });
  }, [searchTerm, categoryFilter, products]);

  const paginatedData = useMemo(() => {
    const totalItems = filteredProducts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const startEntry = totalItems > 0 ? indexOfFirstItem + 1 : 0;
    const endEntry = Math.min(indexOfLastItem, totalItems);

    return {
      totalItems,
      totalPages,
      currentItems,
      startEntry,
      endEntry,
    };
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredProducts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "ProductList.xlsx");
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      // Note: This import handler should ideally call a parent function to update the central state.
      // For now, it adds to a temporary local view, but these won't be persisted without a parent handler.
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              const data = e.target?.result;
              try {
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length > 0 && 'name' in json[0] && 'category' in json[0] && 'price' in json[0]) {
                     alert(`${json.length} products imported successfully! Please implement a parent handler to persist them.`);
                } else {
                     alert("Import failed. Please check the Excel file format. Required columns: name, category, price, stock, status.");
                }
              } catch(err) {
                console.error("Import error:", err);
                alert("An error occurred during import. Please ensure the file is a valid Excel file.");
              }
          };
          reader.readAsArrayBuffer(file);
          if(fileInputRef.current) fileInputRef.current.value = '';
      }
  };
  
  const handleEdit = (product: ProductType) => {
    setEditingProduct(product);
    setActiveView('products/add');
  };

  const handleDelete = (productId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      onDeleteProduct(productId);
    }
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-slate-900 min-h-full">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Product List</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your products inventory.</p>

      <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="pl-10 pr-4 py-2 rounded-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <select 
              className="border border-gray-200 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
                <option>All Categories</option>
                {uniqueCategories.map(cat => <option key={cat}>{cat}</option>)}
            </select>
            <input type="file" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} accept=".xlsx, .xls" />
            <button onClick={handleImportClick} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 text-sm shadow-sm">
                <ImportIcon className="w-5 h-5" />
                <span>Import</span>
            </button>
            <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 text-sm shadow-sm">
                <ExportIcon className="w-5 h-5" />
                <span>Export</span>
            </button>
            <button onClick={() => setActiveView('products/add')} className="px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700">Add Product</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50">
                <th className="p-3 font-normal">PRODUCT</th>
                <th className="p-3 font-normal">CATEGORY</th>
                <th className="p-3 font-normal">QUANTITY</th>
                <th className="p-3 font-normal">SATUAN</th>
                <th className="p-3 font-normal">PRICE</th>
                <th className="p-3 font-normal text-center">TINDAKAN</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                    <td colSpan={6} className="text-center p-4 text-gray-500 dark:text-gray-400">Loading products...</td>
                </tr>
              ) : error ? (
                <tr>
                    <td colSpan={6} className="text-center p-4 text-red-500">{error}</td>
                </tr>
              ) : paginatedData.currentItems.length > 0 ? (
                paginatedData.currentItems.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="p-3 font-semibold text-gray-700 dark:text-gray-200">{product.name}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{product.category}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{product.stock} units</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{product.unit || 'pcs'}</td>
                    <td className="p-3 font-semibold text-gray-700 dark:text-gray-200">{product.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</td>
                    <td className="p-3 text-center space-x-4">
                      <button onClick={() => handleEdit(product)} className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 hover:opacity-80 transition-opacity">Edit</button>
                      <button onClick={() => onDeleteProduct(product.id)} className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-80 transition-opacity">Hapus</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={6} className="text-center p-4 text-gray-500 dark:text-gray-400">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{`Showing ${paginatedData.startEntry} to ${paginatedData.endEntry} of ${paginatedData.totalItems} entries`}</span>
            <PaginationControls 
                currentPage={currentPage}
                totalPages={paginatedData.totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;