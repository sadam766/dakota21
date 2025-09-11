

import React, { useState, useEffect, FC } from 'react';
import type { DocumentType } from '../types';
import { XIcon } from './icons';

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (document: DocumentType) => void;
  documentToEdit: DocumentType | null;
  nextId: string;
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


// Helper to format date from DD/MM/YYYY to YYYY-MM-DD for input
const toInputDate = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        // Assuming DD/MM/YYYY
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr; // Fallback for other formats, or if already correct
};

// Helper to format date from YYYY-MM-DD to DD/MM/YYYY for saving
const fromInputDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        // Assuming YYYY-MM-DD
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr; // Fallback
}

const DocumentFormModal: FC<DocumentFormModalProps> = ({ isOpen, onClose, onSave, documentToEdit, nextId }) => {
  const [doc, setDoc] = useState<Partial<DocumentType>>({});

  useEffect(() => {
    if (isOpen) {
        if (documentToEdit) {
            setDoc({
                ...documentToEdit,
                invoiceDate: toInputDate(documentToEdit.invoiceDate),
                taxInvoiceDate: toInputDate(documentToEdit.taxInvoiceDate),
                dueDate: toInputDate(documentToEdit.dueDate),
                paymentDate: toInputDate(documentToEdit.paymentDate),
            });
        } else {
            // Initialize for a new document
            const today = new Date().toISOString().split('T')[0];
            setDoc({
                id: nextId,
                proformaInvoiceNumber: `PI-${String(Math.floor(Math.random() * 900) + 100)} / New Project`,
                invoiceNumber: '',
                invoiceValue: 0,
                invoiceDate: today,
                taxInvoiceNumber: '',
                taxInvoiceDate: '',
                status: 'PENDING',
                dueDate: today,
                paymentValue: 0,
                paymentDate: '',
            });
        }
    }
  }, [documentToEdit, isOpen, nextId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'invoiceValue' || name === 'paymentValue') {
      setDoc(prev => ({ ...prev, [name]: parseFormattedNumber(value) }));
    } else {
      setDoc(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc.proformaInvoiceNumber) {
        alert("Proforma Invoice Number is required.");
        return;
    }
    
    const finalDoc: DocumentType = {
        ...doc,
        id: doc.id || nextId,
        invoiceDate: fromInputDate(doc.invoiceDate!),
        taxInvoiceDate: fromInputDate(doc.taxInvoiceDate!),
        dueDate: fromInputDate(doc.dueDate!),
        paymentDate: fromInputDate(doc.paymentDate!) || '-',
        proformaInvoiceNumber: doc.proformaInvoiceNumber || '',
        invoiceNumber: doc.invoiceNumber || '',
        invoiceValue: doc.invoiceValue || 0,
        taxInvoiceNumber: doc.taxInvoiceNumber || '',
        status: doc.status || 'PENDING',
        paymentValue: doc.paymentValue || 0,
    };
    onSave(finalDoc);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col transform transition-all duration-300 scale-95 animate-modal-pop">
        <style>{`
          @keyframes modal-pop {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-modal-pop { animation: modal-pop 0.3s ease-out forwards; }
        `}</style>
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{documentToEdit ? 'Edit Document' : 'Create New Document'}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 bg-white dark:bg-slate-800">
            <div>
              <label htmlFor="proformaInvoiceNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Proforma Invoice Number</label>
              <input type="text" name="proformaInvoiceNumber" value={doc.proformaInvoiceNumber || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800 dark:text-gray-200"/>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Number</label>
                <input type="text" name="invoiceNumber" value={doc.invoiceNumber || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800 dark:text-gray-200"/>
              </div>
               <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <select name="status" value={doc.status || 'PENDING'} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800 dark:text-gray-200">
                      <option value="PAID">PAID</option>
                      <option value="UNPAID">UNPAID</option>
                      <option value="PENDING">PENDING</option>
                      <option value="OVERDUE">OVERDUE</option>
                  </select>
              </div>
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="invoiceValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Value</label>
                <input type="text" inputMode="numeric" name="invoiceValue" value={doc.invoiceValue ? formatNumberInput(String(doc.invoiceValue)) : ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800 dark:text-gray-200"/>
              </div>
              <div>
                <label htmlFor="paymentValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Value</label>
                <input type="text" inputMode="numeric" name="paymentValue" value={doc.paymentValue ? formatNumberInput(String(doc.paymentValue)) : ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800 dark:text-gray-200"/>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="taxInvoiceNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tax Invoice Number</label>
                <input type="text" name="taxInvoiceNumber" value={doc.taxInvoiceNumber || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800 dark:text-gray-200" placeholder="e.g., 010.000-24.00000001"/>
              </div>
              <div>
                <label htmlFor="taxInvoiceDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tax Invoice Date</label>
                <input type="date" name="taxInvoiceDate" value={doc.taxInvoiceDate || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800 dark:text-gray-200"/>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Date</label>
                    <input type="date" name="invoiceDate" value={doc.invoiceDate || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800 dark:text-gray-200"/>
                </div>
                 <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                    <input type="date" name="dueDate" value={doc.dueDate || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800 dark:text-gray-200"/>
                </div>
                 <div>
                    <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Date</label>
                    <input type="date" name="paymentDate" value={doc.paymentDate || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800 dark:text-gray-200"/>
                </div>
            </div>
        </form>
        <div className="flex justify-end items-center p-5 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl">
          <button onClick={onClose} type="button" className="px-5 py-2.5 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-slate-600 mr-3 transition-colors">Cancel</button>
          <button onClick={(e) => { e.preventDefault(); handleSubmit(e); }} type="submit" className="px-5 py-2.5 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 shadow-sm transition-colors">Save Document</button>
        </div>
      </div>
    </div>
  );
};

export default DocumentFormModal;