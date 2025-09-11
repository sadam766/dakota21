import React, { useState, useEffect } from 'react';
import type { InvoiceType } from '../types';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxfE7lZgkXkmhY47B8Q-Vnzcu7dnqeSBm991sdm6kbtu7h9pB5ZLCg-vFOZu7NfD6OvzA/exec";

type LastInvoiceItem = Omit<InvoiceType, 'clientName' | 'clientAvatar' | 'issuedDate' | 'balance' | 'total'> & { 
  description: string; 
  amount: string; 
};

interface StatusPillProps {
    status: InvoiceType['status'];
}

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-semibold';
    const statusClasses = {
        Paid: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
        Unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
        Draft: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
        Downloaded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
    };
    return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
}

const LastInvoiceCard: React.FC = () => {
  const [invoices, setInvoices] = useState<LastInvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mockLastInvoices: LastInvoiceItem[] = [
        { id: '#8745', description: 'Kabel Tembaga 2.5mm', status: 'Paid', amount: 'Rp 1.500.000' },
        { id: '#8746', description: 'Konektor RJ45', status: 'Pending', amount: 'Rp 400.000' },
        { id: '#8747', description: 'Kabel Fiber Optik', status: 'Unpaid', amount: 'Rp 1.750.000' },
        { id: '#8748', description: 'Maintenance', status: 'Paid', amount: 'Rp 2.000.000' },
    ];
    setInvoices(mockLastInvoices);
    setLoading(false);
    setError(null);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Last Invoice</h3>
        <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">See all</button>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="text-sm text-gray-500 dark:text-gray-400">
            <th className="pb-2 font-normal">#Invoice</th>
            <th className="pb-2 font-normal">Description</th>
            <th className="pb-2 font-normal">Status</th>
            <th className="pb-2 font-normal text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">Loading...</td></tr>
          ) : error ? (
            <tr><td colSpan={4} className="text-center py-4 text-red-500">{error}</td></tr>
          ) : (
            invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-gray-100 dark:border-slate-700 last:border-b-0">
                <td className="py-3 font-semibold text-gray-700 dark:text-gray-200">{invoice.id}</td>
                <td className="py-3 text-gray-600 dark:text-gray-300">{invoice.description}</td>
                <td className="py-3"><StatusPill status={invoice.status} /></td>
                <td className="py-3 text-right font-semibold text-gray-700 dark:text-gray-200">{invoice.amount}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LastInvoiceCard;