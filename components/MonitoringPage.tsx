
import React, { useState, useMemo, useEffect } from 'react';
import type { SalesType, PaymentOverviewInvoice, TaxInvoiceType } from '../types';
import { SearchIcon, EyeIcon } from './icons';
import PaginationControls from './PaginationControls';

interface MonitoringPageProps {
  sales: SalesType[];
  invoices: PaymentOverviewInvoice[];
  taxInvoices: TaxInvoiceType[];
  spdDocs: PaymentOverviewInvoice[];
  setActiveView: (view: string) => void;
  setSelectedSale: (sale: SalesType | null) => void;
}

type MonitoredSale = {
  sale: SalesType;
  invoice?: PaymentOverviewInvoice;
  taxInvoice?: TaxInvoiceType;
  spd?: PaymentOverviewInvoice;
};

type FilterType = 'All' | 'Needs Invoice' | 'Needs SPD' | 'Unpaid';

const InvoiceStatusBadge = ({ status }: { status: PaymentOverviewInvoice['status'] }) => {
    const statusClasses = {
        Paid: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
        Unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
        Draft: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
        Overdue: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusClasses[status]}`}>{status}</span>;
}

const MonitoringPage: React.FC<MonitoringPageProps> = ({ sales, invoices, taxInvoices, spdDocs, setActiveView, setSelectedSale }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeFilter]);

    const monitoredData = useMemo(() => {
        return sales.map(sale => {
            const invoice = invoices.find(inv => inv.soNumber === sale.soNumber);
            const taxInvoice = taxInvoices.find(ti => ti.referensi === sale.soNumber);
            const spd = spdDocs.find(s => s.soNumber === sale.soNumber);
            return { sale, invoice, taxInvoice, spd };
        }).sort((a,b) => new Date(b.sale.date).getTime() - new Date(a.sale.date).getTime());
    }, [sales, invoices, taxInvoices, spdDocs]);

    const filteredData = useMemo(() => {
        return monitoredData.filter(item => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = !term ||
                item.sale.soNumber.toLowerCase().includes(term) ||
                item.sale.customer.toLowerCase().includes(term) ||
                item.sale.salesPerson.toLowerCase().includes(term);

            if (!matchesSearch) return false;

            switch (activeFilter) {
                case 'Needs Invoice': return !item.invoice;
                case 'Needs SPD': return !!item.invoice && !item.spd;
                case 'Unpaid': return !!item.invoice && item.invoice.status !== 'Paid';
                case 'All':
                default:
                    return true;
            }
        });
    }, [monitoredData, activeFilter, searchTerm]);
    
    const paginatedData = useMemo(() => {
        const totalItems = filteredData.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
        const startEntry = totalItems > 0 ? indexOfFirstItem + 1 : 0;
        const endEntry = Math.min(indexOfLastItem, totalItems);
        return { totalItems, currentItems, totalPages, startEntry, endEntry };
    }, [filteredData, currentPage, itemsPerPage]);

    const handleViewDetails = (sale: SalesType) => {
        setSelectedSale(sale);
        setActiveView('orders/detail');
    };

    const filters: { id: FilterType; label: string }[] = [
        { id: 'All', label: 'All Sales' },
        { id: 'Needs Invoice', label: 'Needs Invoice' },
        { id: 'Needs SPD', label: 'Needs SPD' },
        { id: 'Unpaid', label: 'Unpaid' },
    ];

    return (
        <div className="p-8 bg-gray-50 dark:bg-slate-900 min-h-full">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Sales Monitoring</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Track sales orders from creation to completion.</p>

            <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Search by SO, customer..." 
                          className="pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
                        {filters.map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                                    activeFilter === filter.id 
                                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm' 
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="p-3 font-medium">SO Number</th>
                                <th className="p-3 font-medium">Customer</th>
                                <th className="p-3 font-medium">Date</th>
                                <th className="p-3 font-medium text-right">Amount</th>
                                <th className="p-3 font-medium">Invoice</th>
                                <th className="p-3 font-medium">Tax Invoice</th>
                                <th className="p-3 font-medium">SPD</th>
                                <th className="p-3 font-medium text-center">Payment</th>
                                <th className="p-3 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {paginatedData.currentItems.map(({ sale, invoice, taxInvoice, spd }) => (
                                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">{sale.soNumber}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-300">{sale.customer}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-300">{sale.date}</td>
                                    <td className="p-3 text-gray-800 dark:text-gray-200 font-semibold text-right">{sale.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</td>
                                    <td className="p-3">
                                        {invoice ? (
                                            <div>
                                                <p className="font-semibold text-gray-700 dark:text-gray-200">{invoice.number}</p>
                                                <InvoiceStatusBadge status={invoice.status} />
                                            </div>
                                        ) : (
                                            <button onClick={() => setActiveView('invoice/nomor-invoice')} className="px-2 py-1 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-md">
                                                Create Invoice
                                            </button>
                                        )}
                                    </td>
                                    <td className="p-3 text-gray-600 dark:text-gray-300">{taxInvoice?.nomorFaktur || 'N/A'}</td>
                                    <td className="p-3">
                                        {spd ? (
                                            <p className="font-semibold text-gray-700 dark:text-gray-200">{spd.number}</p>
                                        ) : (
                                            <button onClick={() => setActiveView('invoice-list')} className="px-2 py-1 text-xs font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-md">
                                                Create SPD
                                            </button>
                                        )}
                                    </td>
                                    <td className="p-3 text-center">
                                        {invoice ? <InvoiceStatusBadge status={invoice.status} /> : <span className="text-gray-400">-</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => handleViewDetails(sale)} className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300 rounded-full" title="View Details">
                                            <EyeIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
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

export default MonitoringPage;
