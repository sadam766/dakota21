import React from 'react';
import type { PaymentOverviewInvoice } from '../types';
import { SendIcon, SettingsIcon } from './icons';

interface InvoiceActionPanelProps {
    invoice: PaymentOverviewInvoice;
    onStatusChange: (newStatus: PaymentOverviewInvoice['status']) => void;
    onPrintTypeChange: (newPrintType: 'Original' | 'Copy') => void;
    onCreatedByChange: (name: string) => void;
    onSave: () => void;
    onPreview: () => void;
    onSend: () => void;
}

const InvoiceActionPanel: React.FC<InvoiceActionPanelProps> = ({ invoice, onStatusChange, onPrintTypeChange, onCreatedByChange, onSave, onPreview, onSend }) => {

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onStatusChange(e.target.value as PaymentOverviewInvoice['status']);
    };
    
    const handlePrintTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onPrintTypeChange(e.target.value as 'Original' | 'Copy');
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <button onClick={onSend} className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <SendIcon className="w-5 h-5 mr-2" />
                        Send Invoice
                    </button>
                    <button className="flex-shrink-0 p-2 border rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                </div>
                <button onClick={onPreview} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Preview
                </button>
                <button onClick={onSave} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Save
                </button>
                
                <div className="pt-4 space-y-4">
                    <div>
                        <label htmlFor="invoice-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                           Status
                        </label>
                        <select
                            id="invoice-status"
                            name="status"
                            className="block w-full py-2 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={invoice.status}
                            onChange={handleStatusChange}
                        >
                            <option>Paid</option>
                            <option>Pending</option>
                            <option>Unpaid</option>
                            <option>Draft</option>
                            <option>Overdue</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="print-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                           Print Type
                        </label>
                        <select
                            id="print-type"
                            name="printType"
                            className="block w-full py-2 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={invoice.printType || 'Original'}
                            onChange={handlePrintTypeChange}
                        >
                            <option>Original</option>
                            <option>Copy</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="created-by" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                           Pembuat Invoice
                        </label>
                        <input
                            type="text"
                            id="created-by"
                            name="createdBy"
                            className="block w-full py-2 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={invoice.createdBy || ''}
                            onChange={(e) => onCreatedByChange(e.target.value)}
                            placeholder="Nama pembuat"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceActionPanel;