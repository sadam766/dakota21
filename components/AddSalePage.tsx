

import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon } from './icons';
import type { SalesType } from '../types';

interface AddSalePageProps {
  setActiveView: (view: string) => void;
  saleToEdit: SalesType | null;
  setEditingSale: (sale: SalesType | null) => void;
  onAddSale: (saleData: Omit<SalesType, 'id'>) => void;
  onUpdateSale: (saleData: SalesType) => void;
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


const AddSalePage: React.FC<AddSalePageProps> = ({ setActiveView, saleToEdit, setEditingSale, onAddSale, onUpdateSale }) => {
  const [saleData, setSaleData] = useState<Partial<SalesType>>({
    soNumber: '',
    customer: '',
    salesPerson: '',
    poNumber: '',
    amount: 0,
    status: 'Draft',
    date: new Date().toISOString().split('T')[0],
  });

  const isEditing = !!saleToEdit;

  useEffect(() => {
    if (saleToEdit) {
      setSaleData(saleToEdit);
    } else {
      setSaleData({
        soNumber: '',
        customer: '',
        salesPerson: '',
        poNumber: '',
        amount: 0,
        status: 'Draft',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [saleToEdit]);

  const handleCancel = () => {
    setEditingSale(null);
    setActiveView('orders/list');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    if (id === 'amount') {
      setSaleData(prev => ({...prev, amount: parseFormattedNumber(value) }));
    } else {
      setSaleData(prev => ({...prev, [id]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullSaleData = saleData as SalesType;

    if (!fullSaleData.soNumber || !fullSaleData.customer || !fullSaleData.salesPerson || fullSaleData.amount <= 0) {
      alert('Please fill out all required fields and enter a valid amount.');
      return;
    }
    
    if (isEditing) {
      onUpdateSale(fullSaleData);
      alert(`Sale #${fullSaleData.soNumber} has been updated.`);
    } else {
      const { id, ...newSaleData } = fullSaleData;
      onAddSale(newSaleData);
      alert(`New sale #${fullSaleData.soNumber} has been created.`);
    }
    setEditingSale(null);
    setActiveView('orders/list');
  }
  

  return (
    <div className="p-8 bg-gray-50 dark:bg-slate-900 min-h-full">
      <div className="flex items-center mb-6">
        <button onClick={handleCancel} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 mr-2">
            <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{isEditing ? 'Edit Sale' : 'Create New Sale'}</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400 mt-1 mb-8 ml-10">{isEditing ? `Editing sale #${saleData.soNumber}` : 'Fill in the details below to create a new sales order.'}</p>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label htmlFor="soNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">SO Number</label>
                    <input 
                        type="text" 
                        id="soNumber" 
                        value={saleData.soNumber || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200" 
                        placeholder="e.g., SO-10203" 
                        required
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name</label>
                        <input 
                            type="text" 
                            id="customer" 
                            value={saleData.customer || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200" 
                            placeholder="e.g., Acme Corporation" 
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="salesPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sales Person</label>
                        <input 
                            type="text" 
                            id="salesPerson" 
                            value={saleData.salesPerson || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200" 
                            placeholder="e.g., Jane Smith"
                            required
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="poNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">PO Number</label>
                        <input 
                            type="text" 
                            id="poNumber"
                            value={saleData.poNumber || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200" 
                            placeholder="e.g., PO-12345"
                        />
                    </div>
                     <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (IDR)</label>
                        <input 
                            type="text"
                            inputMode="numeric"
                            id="amount" 
                            value={saleData.amount ? formatNumberInput(String(saleData.amount)) : ''}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200" 
                            placeholder="0"
                            required
                        />
                    </div>
                </div>
                 <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select id="status" value={saleData.status || 'Draft'} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200">
                        <option>Draft</option>
                        <option>Unpaid</option>
                        <option>Pending</option>
                        <option>Paid</option>
                        <option>Overdue</option>
                    </select>
                </div>
                

                <div className="pt-6 flex justify-end space-x-3">
                    <button type="button" onClick={handleCancel} className="px-6 py-2 rounded-md bg-gray-100 dark:bg-slate-600 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button type="submit" className="px-6 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        {isEditing ? 'Save Changes' : 'Save Sale'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AddSalePage;
