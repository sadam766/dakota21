

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeftIcon } from './icons';
import type { SalesType, ConsumerType, SalesOrderType } from '../types';

interface AddSalePageProps {
  setActiveView: (view: string) => void;
  saleToEdit: SalesType | null;
  setEditingSale: (sale: SalesType | null) => void;
  onAddSale: (saleData: Omit<SalesType, 'id'>) => void;
  onUpdateSale: (saleData: SalesType) => void;
  consumers: ConsumerType[];
  sales: SalesType[];
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


const AddSalePage: React.FC<AddSalePageProps> = ({ setActiveView, saleToEdit, setEditingSale, onAddSale, onUpdateSale, consumers, sales, salesOrders }) => {
  const [saleData, setSaleData] = useState<Partial<SalesType>>({
    soNumber: '',
    customer: '',
    salesPerson: '',
    poNumber: '',
    amount: 0,
    status: 'Unpaid',
    date: new Date().toISOString().split('T')[0],
  });
  
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);
  
  const [soSearchTerm, setSoSearchTerm] = useState('');
  const [isSoDropdownOpen, setIsSoDropdownOpen] = useState(false);
  const soRef = useRef<HTMLDivElement>(null);

  const isEditing = !!saleToEdit;
  
  const uniqueSOs = useMemo(() => {
    const fromSales = sales.map(s => s.soNumber);
    const fromOrders = salesOrders.map(so => so.soNumber);
    return [...new Set([...fromSales, ...fromOrders])].filter(Boolean).sort();
  }, [sales, salesOrders]);
  
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm) return [];
    return consumers.filter(c => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()));
  }, [customerSearchTerm, consumers]);

  const filteredSOs = useMemo(() => {
    if (!soSearchTerm) return uniqueSOs;
    return uniqueSOs.filter(so => so.toLowerCase().includes(soSearchTerm.toLowerCase()));
  }, [soSearchTerm, uniqueSOs]);


  useEffect(() => {
    if (saleToEdit) {
      setSaleData(saleToEdit);
      setCustomerSearchTerm(saleToEdit.customer);
      setSoSearchTerm(saleToEdit.soNumber);
    } else {
      setSaleData({
        soNumber: '',
        customer: '',
        salesPerson: '',
        poNumber: '',
        amount: 0,
        status: 'Unpaid',
        date: new Date().toISOString().split('T')[0],
      });
      setCustomerSearchTerm('');
      setSoSearchTerm('');
    }
  }, [saleToEdit]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (customerRef.current && !customerRef.current.contains(event.target as Node)) {
            setIsCustomerDropdownOpen(false);
        }
        if (soRef.current && !soRef.current.contains(event.target as Node)) {
            setIsSoDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCancel = () => {
    setEditingSale(null);
    setActiveView('orders/list');
  };

  const handleGenericChange = (id: keyof SalesType, value: any) => {
    setSaleData(prev => ({...prev, [id]: value }));
  };

  const handleAmountChange = (value: string) => {
    handleGenericChange('amount', parseFormattedNumber(value));
  };
  
  const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setCustomerSearchTerm(term);
    handleGenericChange('customer', term); // Allow typing new customer
    setIsCustomerDropdownOpen(true);
  };
  
  const handleCustomerSelect = (consumer: ConsumerType) => {
    setCustomerSearchTerm(consumer.name);
    handleGenericChange('customer', consumer.name);
    setIsCustomerDropdownOpen(false);
  };
  
  const handleSoSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSoSearchTerm(term);
    handleGenericChange('soNumber', term); // Allow typing new SO Number
    setIsSoDropdownOpen(true);
  };
  
  const handleSoSelect = (soNumber: string) => {
    const existingSale = sales.find(s => s.soNumber === soNumber);
    if(existingSale && !isEditing) {
      setSaleData(existingSale);
      setCustomerSearchTerm(existingSale.customer);
      setSoSearchTerm(existingSale.soNumber);
    } else {
      setSoSearchTerm(soNumber);
      handleGenericChange('soNumber', soNumber);
    }
    setIsSoDropdownOpen(false);
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
                 <div ref={soRef} className="relative">
                    <label htmlFor="soNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">SO Number</label>
                    <input 
                        type="text" 
                        id="soNumber" 
                        value={soSearchTerm}
                        onChange={handleSoSearch}
                        onFocus={() => setIsSoDropdownOpen(true)}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200" 
                        placeholder="e.g., SO-10203" 
                        required
                        autoComplete="off"
                    />
                    {isSoDropdownOpen && filteredSOs.length > 0 && (
                      <ul className="absolute z-20 w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                        {filteredSOs.map(so => (
                          <li key={so} onClick={() => handleSoSelect(so)} className="p-3 hover:bg-indigo-50 dark:hover:bg-slate-600 cursor-pointer text-sm text-gray-800 dark:text-gray-200">
                            {so}
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div ref={customerRef} className="relative">
                        <label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name</label>
                        <input 
                            type="text" 
                            id="customer" 
                            value={customerSearchTerm}
                            onChange={handleCustomerSearch}
                            onFocus={() => setIsCustomerDropdownOpen(true)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200" 
                            placeholder="e.g., Acme Corporation" 
                            required
                            autoComplete="off"
                        />
                        {isCustomerDropdownOpen && filteredCustomers.length > 0 && (
                          <ul className="absolute z-20 w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                            {filteredCustomers.map(c => (
                              <li key={c.id} onClick={() => handleCustomerSelect(c)} className="p-3 hover:bg-indigo-50 dark:hover:bg-slate-600 cursor-pointer text-sm text-gray-800 dark:text-gray-200">
                                {c.name}
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                     <div>
                        <label htmlFor="salesPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sales Person</label>
                        <input 
                            type="text"
                            id="salesPerson" 
                            value={saleData.salesPerson || ''}
                            onChange={(e) => handleGenericChange('salesPerson', e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200"
                            placeholder="e.g., John Doe"
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
                            onChange={(e) => handleGenericChange('poNumber', e.target.value)}
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
                            onChange={(e) => handleAmountChange(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200" 
                            placeholder="0"
                            required
                        />
                    </div>
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