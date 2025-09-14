import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { PaymentOverviewInvoice, ConsumerType, SalesType, SalesOrderType } from '../types';
import { XIcon } from './icons';

interface AddInvoiceNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoiceData: Omit<PaymentOverviewInvoice, 'id' | 'status' | 'email'>) => void;
  consumers: ConsumerType[];
  invoiceToEdit: PaymentOverviewInvoice | null;
  nextInvoiceNumbersInfo?: {
      sar: { prefix: string; sequence: number; fullNumber: string };
      kw: { prefix: string; suffix: string; sequence: number; fullNumber: string };
  };
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


const AddInvoiceNumberModal: React.FC<AddInvoiceNumberModalProps> = ({ isOpen, onClose, onSave, consumers, invoiceToEdit, nextInvoiceNumbersInfo, sales, salesOrders }) => {
  const [invoiceType, setInvoiceType] = useState<'SAR' | 'KW'>('SAR');
  const [number, setNumber] = useState('');
  const [client, setClient] = useState('');
  const [soNumber, setSoNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | string>('');

  const [useAutomatic, setUseAutomatic] = useState(true);
  const [autoSequence, setAutoSequence] = useState('');
  
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const clientSearchRef = useRef<HTMLDivElement>(null);
  
  const [isSoDropdownOpen, setIsSoDropdownOpen] = useState(false);
  const soSearchRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setNumber('');
    setClient('');
    setSoNumber('');
    setDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setIsClientDropdownOpen(false);
    setIsSoDropdownOpen(false);
    setUseAutomatic(true);
    setAutoSequence('');
    setInvoiceType('SAR');
  };

  useEffect(() => {
    if (isOpen) {
      if (invoiceToEdit) {
        setUseAutomatic(false);
        setNumber(invoiceToEdit.number);
        setClient(invoiceToEdit.client);
        setSoNumber(invoiceToEdit.soNumber || '');
        setDate(invoiceToEdit.date);
        setAmount(invoiceToEdit.amount);
        if (invoiceToEdit.number.startsWith('KW/')) {
            setInvoiceType('KW');
        } else {
            setInvoiceType('SAR');
        }
      } else {
        resetForm();
        if (nextInvoiceNumbersInfo) {
            setInvoiceType('SAR');
            setNumber(nextInvoiceNumbersInfo.sar.fullNumber);
            setAutoSequence(String(nextInvoiceNumbersInfo.sar.sequence));
        }
      }
    }
  }, [isOpen, invoiceToEdit, nextInvoiceNumbersInfo]);

  useEffect(() => {
    if (isOpen && !invoiceToEdit && useAutomatic && nextInvoiceNumbersInfo) {
        if (invoiceType === 'SAR') {
            const newSequence = String(nextInvoiceNumbersInfo.sar.sequence);
            setAutoSequence(newSequence);
            setNumber(`${nextInvoiceNumbersInfo.sar.prefix}${newSequence.padStart(8, '0')}`);
        } else { // KW
            const newSequence = String(nextInvoiceNumbersInfo.kw.sequence);
            setAutoSequence(newSequence);
            setNumber(`${nextInvoiceNumbersInfo.kw.prefix}${newSequence.padStart(4, '0')}${nextInvoiceNumbersInfo.kw.suffix}`);
        }
    }
  }, [invoiceType, isOpen, invoiceToEdit, useAutomatic, nextInvoiceNumbersInfo]);

  useEffect(() => {
    if (useAutomatic && !invoiceToEdit && nextInvoiceNumbersInfo) {
        let newNumber = '';
        if (invoiceType === 'SAR') {
            newNumber = `${nextInvoiceNumbersInfo.sar.prefix}${String(autoSequence).padStart(8, '0')}`;
        } else { // KW
            newNumber = `${nextInvoiceNumbersInfo.kw.prefix}${String(autoSequence).padStart(4, '0')}${nextInvoiceNumbersInfo.kw.suffix}`;
        }
        setNumber(newNumber);
    }
}, [autoSequence, invoiceType, useAutomatic, invoiceToEdit, nextInvoiceNumbersInfo]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
            setIsClientDropdownOpen(false);
        }
        if (soSearchRef.current && !soSearchRef.current.contains(event.target as Node)) {
            setIsSoDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  const filteredConsumers = useMemo(() => {
    if (!client) return [];
    return consumers.filter(c => c.name.toLowerCase().includes(client.toLowerCase()));
  }, [client, consumers]);
  
  const uniqueSOs = useMemo(() => [...new Set(salesOrders.map(s => s.soNumber))], [salesOrders]);

  const filteredSOs = useMemo(() => {
      if (!soNumber) return [];
      return uniqueSOs.filter(s => s.toLowerCase().includes(soNumber.toLowerCase()));
  }, [soNumber, uniqueSOs]);
  
  const handleClientSelect = (consumerName: string) => {
    setClient(consumerName);
    setIsClientDropdownOpen(false);
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClient(e.target.value);
    setIsClientDropdownOpen(true);
  };
  
  const handleSoSelect = (selectedSoNumber: string) => {
    setSoNumber(selectedSoNumber);
    setIsSoDropdownOpen(false);
    const saleInfo = sales.find(s => s.soNumber === selectedSoNumber);
    if (saleInfo) {
        setClient(saleInfo.customer);
        setAmount(saleInfo.amount);
        setDate(saleInfo.date);
    } else {
        setClient('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        alert(`Sales information for SO "${selectedSoNumber}" not found. Please enter details manually.`);
    }
  };

  const handleSoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSoNumber(e.target.value);
    setIsSoDropdownOpen(true);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(parseFormattedNumber(String(amount)));
    if (!number || !client || !date || isNaN(numericAmount) || numericAmount <= 0) {
      alert("Please fill all required fields correctly.");
      return;
    }
    onSave({ number, client, date, amount: numericAmount, soNumber });
    handleClose();
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-95 animate-modal-pop">
        <style>{`
          @keyframes modal-pop {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-modal-pop { animation: modal-pop 0.3s ease-out forwards; }
        `}</style>
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {invoiceToEdit ? 'Edit Nomor Faktur' : 'Add New Invoice Number'}
          </h2>
          <button onClick={handleClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {!invoiceToEdit && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipe Faktur</label>
                    <div className="flex rounded-md border border-gray-300 dark:border-slate-600">
                        <button
                            type="button"
                            onClick={() => setInvoiceType('SAR')}
                            disabled={!!invoiceToEdit}
                            className={`px-4 py-2 block w-full text-sm leading-5 font-medium rounded-l-md focus:z-10 focus:outline-none transition ${
                                invoiceType === 'SAR' 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-600'
                            }`}
                        >
                            SAR
                        </button>
                        <button
                            type="button"
                            onClick={() => setInvoiceType('KW')}
                            disabled={!!invoiceToEdit}
                            className={`-ml-px px-4 py-2 block w-full text-sm leading-5 font-medium rounded-r-md focus:z-10 focus:outline-none transition ${
                                invoiceType === 'KW' 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-600'
                            }`}
                        >
                            KW / Proforma
                        </button>
                    </div>
                </div>
            )}
          <div>
            <label htmlFor="inv-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nomor Faktur</label>
            {!invoiceToEdit && (
                 <div className="flex items-center gap-2 mt-2 mb-1">
                     <input
                        type="checkbox"
                        id="auto-number-check"
                        checked={useAutomatic}
                        onChange={() => setUseAutomatic(!useAutomatic)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                     <label htmlFor="auto-number-check" className="text-sm text-gray-600 dark:text-gray-400">Nomor Otomatis</label>
                     {invoiceType === 'SAR' && nextInvoiceNumbersInfo?.sar && (
                        <>
                            <input 
                                type="text"
                                value={nextInvoiceNumbersInfo.sar.prefix}
                                readOnly
                                className="w-20 px-2 py-1 bg-gray-100 dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded-md text-sm text-gray-500 dark:text-gray-400"
                            />
                            <input 
                                type="number"
                                value={autoSequence}
                                onChange={e => setAutoSequence(e.target.value)}
                                disabled={!useAutomatic}
                                className="flex-1 px-2 py-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-slate-600"
                            />
                        </>
                    )}
                    {invoiceType === 'KW' && nextInvoiceNumbersInfo?.kw && (
                         <>
                            <input type="text" value={nextInvoiceNumbersInfo.kw.prefix} readOnly className="w-16 px-2 py-1 bg-gray-100 dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded-l-md text-sm text-gray-500 dark:text-gray-400"/>
                            <input 
                                type="number" 
                                value={autoSequence}
                                onChange={e => setAutoSequence(e.target.value)}
                                disabled={!useAutomatic}
                                className="flex-1 w-20 px-2 py-1 bg-white dark:bg-slate-700 border-t border-b border-gray-300 dark:border-slate-600 text-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-slate-600"
                            />
                            <input type="text" value={nextInvoiceNumbersInfo.kw.suffix} readOnly className="-ml-px w-28 px-2 py-1 bg-gray-100 dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded-r-md text-sm text-gray-500 dark:text-gray-400"/>
                         </>
                    )}
                 </div>
            )}
            <input
              type="text"
              id="inv-number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              disabled={useAutomatic && !invoiceToEdit}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-slate-600"
              placeholder={invoiceType === 'SAR' ? "e.g., SAR/25000001" : "e.g., KW/ABCD/KEU/2024"}
              required
            />
          </div>
          <div ref={soSearchRef}>
            <label htmlFor="so-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sales Order / SO (Opsional)</label>
            <div className="relative">
              <input
                type="text"
                id="so-number"
                value={soNumber}
                onChange={handleSoChange}
                onFocus={() => setIsSoDropdownOpen(true)}
                autoComplete="off"
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200"
                placeholder="Search and select a Sales Order"
              />
              {isSoDropdownOpen && filteredSOs.length > 0 && (
                <ul className="absolute z-20 w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {filteredSOs.map(soNum => (
                    <li
                      key={soNum}
                      onClick={() => handleSoSelect(soNum)}
                      className="p-3 hover:bg-indigo-50 dark:hover:bg-slate-600 cursor-pointer text-sm text-gray-800 dark:text-gray-200"
                    >
                      {soNum}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="inv-client" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pelanggan</label>
            <div className="relative" ref={clientSearchRef}>
              <input
                type="text"
                id="inv-client"
                value={client}
                onChange={handleClientChange}
                onFocus={() => setIsClientDropdownOpen(true)}
                autoComplete="off"
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200"
                placeholder="e.g., PT. XYZ Corp"
                required
              />
              {isClientDropdownOpen && filteredConsumers.length > 0 && (
                <ul className="absolute z-20 w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {filteredConsumers.map(consumer => (
                    <li
                      key={consumer.id}
                      onClick={() => handleClientSelect(consumer.name)}
                      className="p-3 hover:bg-indigo-50 dark:hover:bg-slate-600 cursor-pointer text-sm text-gray-800 dark:text-gray-200"
                    >
                      {consumer.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inv-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal</label>
              <input
                type="date"
                id="inv-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200"
                required
              />
            </div>
            <div>
              <label htmlFor="inv-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jumlah</label>
              <input
                type="text"
                inputMode="numeric"
                id="inv-amount"
                value={amount === '' ? '' : formatNumberInput(String(amount))}
                onChange={(e) => setAmount(parseFormattedNumber(e.target.value))}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200"
                placeholder="0"
                required
              />
            </div>
          </div>
          <div className="flex justify-end items-center pt-4 space-x-3">
            <button onClick={handleClose} type="button" className="px-5 py-2.5 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition-colors">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInvoiceNumberModal;