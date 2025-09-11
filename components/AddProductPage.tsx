

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { SalesOrderType, ProductType } from '../types';

interface AddProductPageProps {
    setActiveView: (view: string) => void;
    onAddProduct: (product: Omit<ProductType, 'id' | 'image' | 'status'>) => void;
    onUpdateProduct: (product: ProductType) => void;
    productToEdit: ProductType | null;
    setEditingProduct: (product: ProductType | null) => void;
    onAddSalesOrder: (salesOrder: SalesOrderType) => void;
    salesOrders: SalesOrderType[];
}

const formatNumberInput = (value: string | number): string => {
  const strValue = String(value);
  if (!strValue) return '';
  const numberValue = parseInt(strValue.replace(/[^0-9]/g, ''), 10);
  if (isNaN(numberValue)) return '';
  return numberValue.toLocaleString('id-ID');
};

const parseFormattedNumber = (value: string): number => {
  if (!value) return 0;
  return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
};


const AddProductPage: React.FC<AddProductPageProps> = ({ setActiveView, onAddProduct, onUpdateProduct, productToEdit, setEditingProduct, onAddSalesOrder, salesOrders }) => {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState(0);

  const [soSearchTerm, setSoSearchTerm] = useState('');
  const [filteredSOs, setFilteredSOs] = useState<string[]>([]);
  const [isSOSearchOpen, setIsSOSearchOpen] = useState(false);
  const soSearchRef = useRef<HTMLDivElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);

  // Get unique SO numbers for the dropdown
  const uniqueSOs = useMemo(() => [...new Set(salesOrders.map(so => so.soNumber))], [salesOrders]);
  
  useEffect(() => {
    if (productToEdit) {
        setIsEditing(true);
        setProductName(productToEdit.name);
        setCategory(productToEdit.category);
        setQuantity(productToEdit.stock);
        setUnit(productToEdit.unit || '');
        setPrice(productToEdit.price);
        setSoSearchTerm(''); // can't edit SO assignment this way
    } else {
        setIsEditing(false);
        // reset form fields
        setProductName('');
        setCategory('');
        setQuantity(0);
        setUnit('');
        setPrice(0);
        setSoSearchTerm('');
    }
  }, [productToEdit]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (soSearchRef.current && !soSearchRef.current.contains(event.target as Node)) {
            setIsSOSearchOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleSOFocus = () => {
    setFilteredSOs(uniqueSOs);
    setIsSOSearchOpen(true);
  };

  const handleSOChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSoSearchTerm(term);
    if (term) {
        setFilteredSOs(
            uniqueSOs.filter(so => so.toLowerCase().includes(term.toLowerCase()))
        );
        setIsSOSearchOpen(true);
    } else {
        setFilteredSOs(uniqueSOs);
        setIsSOSearchOpen(true);
    }
  };

  const handleSOSelect = (soNumber: string) => {
    setSoSearchTerm(soNumber);
    setIsSOSearchOpen(false);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName || !category || quantity <= 0 || !unit || price <= 0) {
        alert('Please fill out all product fields correctly.');
        return;
    }
    
    if (isEditing && productToEdit) {
        const updatedProduct: ProductType = {
            ...productToEdit,
            name: productName,
            category: category,
            price: price,
            stock: quantity,
            status: quantity > 0 ? (quantity < 20 ? 'Low Stock' : 'In Stock') : 'Out of Stock',
            unit: unit
        };
        onUpdateProduct(updatedProduct);
        alert(`Product "${productName}" updated.`);
        setActiveView('products/list');
    } else {
        const isSO = soSearchTerm.trim() !== '';

        if (isSO) {
            const newSalesOrder: SalesOrderType = {
                id: Date.now().toString(),
                soNumber: soSearchTerm,
                name: productName,
                category: category,
                quantity: quantity,
                satuan: unit,
                price: price,
            };
            onAddSalesOrder(newSalesOrder);
            alert(`Product added to Sales Order ${soSearchTerm}`);
            setActiveView('products/sales-order');
        } else {
            onAddProduct({
                name: productName,
                category: category,
                price: price,
                stock: quantity,
                unit: unit,
            });
            alert(`Product "${productName}" added to the product list.`);
            setActiveView('products/list');
        }
    }
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setActiveView('products/list');
  };


  return (
    <div className="p-8 bg-gray-50 dark:bg-slate-900 min-h-full">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">Fill in the details below to {isEditing ? 'update your product' : 'add a new product to your inventory'}.</p>

      <div className="mt-8 max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Product Information</h3>
            <form onSubmit={handleSubmit} className="space-y-6">

                <div ref={soSearchRef} className="relative">
                    <label htmlFor="so-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">SO/Sales Order (Optional)</label>
                     <input
                        type="text"
                        id="so-number"
                        value={soSearchTerm}
                        onChange={handleSOChange}
                        onFocus={handleSOFocus}
                        placeholder="Search or select an SO to add to it"
                        autoComplete="off"
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200"
                        disabled={isEditing}
                     />
                    {isSOSearchOpen && filteredSOs.length > 0 && (
                        <ul className="absolute z-20 w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                            {filteredSOs.map(soNum => (
                                <li key={soNum} onClick={() => handleSOSelect(soNum)} className="p-3 hover:bg-indigo-50 dark:hover:bg-slate-600 cursor-pointer text-sm text-gray-800 dark:text-gray-200">
                                    {soNum}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div>
                    <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label>
                    <input 
                      type="text" 
                      id="product-name" 
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200" 
                      placeholder="e.g., Kabel Tembaga 2.5mm"
                      required
                    />
                </div>

                <div>
                    <label htmlFor="product-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                     <select 
                      id="product-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200"
                      required
                    >
                        <option value="">Select Category</option>
                        <option>Kabel</option>
                        <option>Aksesoris</option>
                        <option>Network</option>
                        <option>Other</option>
                    </select>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                       <input 
                         type="number" 
                         id="stock" 
                         value={quantity}
                         onChange={(e) => setQuantity(Number(e.target.value))}
                         className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200" 
                         placeholder="0" 
                         required
                        />
                    </div>
                     <div>
                       <label htmlFor="unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unit (Satuan)</label>
                       <input 
                         type="text" 
                         id="unit"
                         value={unit}
                         onChange={(e) => setUnit(e.target.value)}
                         className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200" 
                         placeholder="e.g., meter, pcs, unit" 
                         required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                    <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 dark:text-gray-400 sm:text-sm">Rp</span>
                        </div>
                        <input 
                          type="text"
                          inputMode="numeric"
                          id="price" 
                          value={price ? formatNumberInput(String(price)) : ''}
                          onChange={(e) => setPrice(parseFormattedNumber(e.target.value))}
                          className="block w-full rounded-md border-gray-300 dark:border-slate-600 pl-8 pr-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" 
                          placeholder="0" 
                          required
                        />
                    </div>
                </div>

                <div className="pt-6 flex justify-end space-x-3">
                    <button type="button" onClick={handleCancel} className="px-6 py-2 rounded-md bg-gray-100 dark:bg-slate-600 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300">Cancel</button>
                    <button type="submit" className="px-6 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">{isEditing ? 'Save Changes' : 'Save Product'}</button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AddProductPage;
