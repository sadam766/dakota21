import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { PaymentOverviewInvoice } from '../types';
import { ExportIcon, FilterIcon, MoreVerticalIcon, PlusIcon, SearchIcon, SortIcon, TrashIcon, EyeIcon, ImportIcon, PencilIcon } from './icons';
import PaymentOverview from './PaymentOverview';
import PaginationControls from './PaginationControls';

declare const XLSX: any;

// SUB-COMPONENTS
const StatusBadge = ({ status }: { status: PaymentOverviewInvoice['status'] }) => {
    const statusClasses = {
        Paid: 'bg-[#EBF9F1] text-[#1D8A53] dark:bg-green-900/50 dark:text-green-300',
        Pending: 'bg-[#FFF8E5] text-[#E49E00] dark:bg-yellow-900/50 dark:text-yellow-300',
        Unpaid: 'bg-[#FEEEEE] text-[#D92D20] dark:bg-red-900/50 dark:text-red-300',
        Draft: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
        Overdue: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    };

    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses[status]}`}>{status}</span>;
}

const TableHeader = ({ label }: { label: string }) => (
    <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-left whitespace-nowrap">
        <div className="flex items-center">
            {label}
            <SortIcon className="ml-2 text-gray-400 dark:text-gray-500" />
        </div>
    </th>
);

interface InvoiceListPageProps {
  invoices: PaymentOverviewInvoice[];
  onDeleteInvoice: (invoiceId: string) => void;
  setActiveView: (view: string) => void;
  setEditingInvoice: (invoice: PaymentOverviewInvoice | null) => void;
  loading: boolean;
  error: string | null;
}

// MAIN COMPONENT
const InvoiceListPage: React.FC<InvoiceListPageProps> = ({ invoices, onDeleteInvoice, setActiveView, setEditingInvoice, loading, error }) => {
    const [activeTab, setActiveTab] = useState<string>('All Invoices');
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        amountMin: '',
        amountMax: '',
        dateStart: '',
        dateEnd: '',
    });
    const actionMenuRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const tabCounts = useMemo(() => {
        const numberCounts = invoices.reduce((acc, inv) => {
            acc[inv.number] = (acc[inv.number] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const duplicateInvoicesCount = invoices.filter(inv => numberCounts[inv.number] > 1).length;

        return {
            'All Invoices': invoices.length,
            'Draft': invoices.filter(inv => inv.status === 'Draft').length,
            'Paid': invoices.filter(inv => inv.status === 'Paid').length,
            'Unpaid': invoices.filter(inv => inv.status === 'Unpaid').length,
            'Pending': invoices.filter(inv => inv.status === 'Pending').length,
            'Overdue': invoices.filter(inv => inv.status === 'Overdue').length,
            'Duplicate': duplicateInvoicesCount,
        };
    }, [invoices]);
    
    const tabs: Array<keyof typeof tabCounts> = ['All Invoices', 'Draft', 'Paid', 'Unpaid', 'Pending', 'Overdue', 'Duplicate'];

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm, filters]);
    
    const filteredInvoices = useMemo(() => {
      const duplicateNumbers = new Set(
          Object.entries(
              invoices.reduce((acc, inv) => {
                  acc[inv.number] = (acc[inv.number] || 0) + 1;
                  return acc;
              }, {} as Record<string, number>)
          )
          .filter(([, count]) => count > 1)
          .map(([number]) => number)
      );

      return invoices
          .filter(invoice => {
              if (activeTab === 'All Invoices') return true;
              if (activeTab === 'Duplicate') return duplicateNumbers.has(invoice.number);
              
              const tabStatus = activeTab.replace(' Invoices', '');
              return invoice.status === tabStatus;
          })
          .filter(invoice => {
              const term = searchTerm.toLowerCase();
              if (!term) return true;
              return (
                  invoice.number.toLowerCase().includes(term) ||
                  invoice.client.toLowerCase().includes(term) ||
                  (invoice.soNumber || '').toLowerCase().includes(term) ||
                  invoice.date.toLowerCase().includes(term) ||
                  String(invoice.amount).includes(term) ||
                  invoice.status.toLowerCase().includes(term)
              );
          })
          .filter(invoice => {
            const { amountMin, amountMax, dateStart, dateEnd } = filters;
            if (amountMin !== '' && invoice.amount < parseFloat(amountMin)) return false;
            if (amountMax !== '' && invoice.amount > parseFloat(amountMax)) return false;
            
            const invoiceDate = new Date(invoice.date);
            if (dateStart) {
                const startDate = new Date(dateStart);
                startDate.setHours(0, 0, 0, 0);
                if (invoiceDate < startDate) return false;
            }
            if (dateEnd) {
                const endDate = new Date(dateEnd);
                endDate.setHours(23, 59, 59, 999);
                if (invoiceDate > endDate) return false;
            }
            return true;
          });
    }, [activeTab, searchTerm, invoices, filters]);

    const paginatedData = useMemo(() => {
        const totalItems = filteredInvoices.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
        const startEntry = totalItems > 0 ? indexOfFirstItem + 1 : 0;
        const endEntry = Math.min(indexOfLastItem, totalItems);

        return {
          totalItems,
          totalPages,
          currentItems,
          startEntry,
          endEntry,
        };
    }, [filteredInvoices, currentPage, itemsPerPage]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setOpenActionMenuId(null);
            }
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedRows(new Set(filteredInvoices.map(i => i.id)));
        } else {
            setSelectedRows(new Set());
        }
    }

    const handleSelectRow = (id: string) => {
        const newSelection = new Set(selectedRows);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedRows(newSelection);
    }
    
    const handleEditInvoice = (invoice: PaymentOverviewInvoice) => {
        setEditingInvoice(invoice);
        setActiveView('invoice/add');
        setOpenActionMenuId(null);
    };

    const handleDeleteInvoice = (invoiceId: string) => {
        onDeleteInvoice(invoiceId);
        setOpenActionMenuId(null);
    };

    const handleCreateNew = () => {
        setEditingInvoice(null);
        setActiveView('invoice/add');
    };
    
    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(filteredInvoices);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Invoices");
        XLSX.writeFile(wb, "InvoiceList.xlsx");
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        // This should be handled by a parent function
        alert('Import functionality should be handled by App.tsx');
    };

    return (
        <div className="p-6 md:p-8 font-sans bg-[#F9FAFB] dark:bg-slate-900">
            <PaymentOverview invoices={filteredInvoices} />

            {/* Invoice Payments Section */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Invoice Payments</h1>
                <div className="flex items-center space-x-3">
                    <input type="file" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} accept=".xlsx, .xls"/>
                    <button onClick={handleImportClick} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 text-sm shadow-sm">
                        <ImportIcon className="w-5 h-5" /><span>Import</span>
                    </button>
                    <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 text-sm shadow-sm">
                        <ExportIcon className="w-5 h-5" /><span>Export</span>
                    </button>
                    <button onClick={handleCreateNew} className="flex items-center space-x-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 text-sm shadow-sm">
                        <PlusIcon className="w-5 h-5" /> <span>New invoice</span>
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex flex-wrap items-center border-b border-gray-200 dark:border-slate-700">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-1 pb-3 pt-1 mx-3 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === tab ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>
                            {tab} 
                            <span className={`ml-2 px-2 py-0.5 rounded-md text-xs ${activeTab === tab ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'}`}>
                                {tabCounts[tab]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
                <div className="flex justify-between items-center p-4">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Search" 
                          className="pl-10 pr-4 py-2 w-64 rounded-lg bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                     <div className="relative" ref={filterRef}>
                        <button onClick={() => setIsFilterOpen(prev => !prev)} className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 text-sm shadow-sm">
                            <FilterIcon className="w-5 h-5" /><span>Filters</span>
                        </button>
                        {isFilterOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-10 p-4">
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-base">Filter Invoices</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Date Range</label>
                                        <div className="flex items-center space-x-2">
                                            <input type="date" value={filters.dateStart} onChange={e => setFilters({...filters, dateStart: e.target.value})} className="w-full text-sm border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                                            <span className="text-gray-500 dark:text-gray-400">-</span>
                                            <input type="date" value={filters.dateEnd} onChange={e => setFilters({...filters, dateEnd: e.target.value})} className="w-full text-sm border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Amount Range (IDR)</label>
                                        <div className="flex items-center space-x-2">
                                            <input type="number" placeholder="Min" value={filters.amountMin} onChange={e => setFilters({...filters, amountMin: e.target.value})} className="w-full text-sm border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                                             <span className="text-gray-500 dark:text-gray-400">-</span>
                                            <input type="number" placeholder="Max" value={filters.amountMax} onChange={e => setFilters({...filters, amountMax: e.target.value})} className="w-full text-sm border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-6">
                                    <button onClick={() => setFilters({ amountMin: '', amountMax: '', dateStart: '', dateEnd: '' })} className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium rounded-md">Clear</button>
                                    <button onClick={() => setIsFilterOpen(false)} className="px-4 py-1.5 text-sm text-white font-semibold bg-teal-600 rounded-md hover:bg-teal-700">Apply</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-700/50 border-y border-gray-200 dark:border-slate-700">
                                <th className="p-4 w-12 text-center">
                                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500 bg-gray-100 dark:bg-slate-900" 
                                    onChange={handleSelectAll} 
                                    checked={filteredInvoices.length > 0 && selectedRows.size === filteredInvoices.length} 
                                    aria-label="Select all invoices"
                                    />
                                </th>
                                <TableHeader label="NUMBER" />
                                <TableHeader label="CLIENT" />
                                <TableHeader label="ALAMAT" />
                                <TableHeader label="DATE" />
                                <TableHeader label="AMOUNT" />
                                <TableHeader label="STATUS" />
                                <th className="p-4 text-center">
                                     Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-6 text-gray-500 dark:text-gray-400">Loading invoices...</td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-6 text-red-500">{error}</td>
                                </tr>
                            ) : paginatedData.currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-6 text-gray-500 dark:text-gray-400">No invoices found.</td>
                                </tr>
                            ) : (
                                paginatedData.currentItems.map((invoice) => (
                                    <tr key={invoice.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 last:border-b-0">
                                        <td className="p-4 w-12 text-center">
                                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500 bg-gray-100 dark:bg-slate-900" 
                                            checked={selectedRows.has(invoice.id)} 
                                            onChange={() => handleSelectRow(invoice.id)} 
                                            aria-label={`Select invoice ${invoice.number}`}
                                            />
                                        </td>
                                        <td className="p-4 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{invoice.number}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{invoice.client}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{invoice.billToAddress || '-'}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{invoice.date}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{invoice.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</td>
                                        <td className="p-4 whitespace-nowrap"><StatusBadge status={invoice.status} /></td>
                                        <td className="p-4 text-center">
                                            <div className="relative inline-block text-left" ref={openActionMenuId === invoice.id ? actionMenuRef : null}>
                                                <button onClick={() => setOpenActionMenuId(invoice.id === openActionMenuId ? null : invoice.id)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                                    <MoreVerticalIcon className="w-5 h-5" />
                                                </button>
                                                {openActionMenuId === invoice.id && (
                                                    <div className="origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black dark:ring-slate-700 ring-opacity-5 z-10">
                                                        <div className="py-1" role="menu" aria-orientation="vertical">
                                                            <button onClick={() => handleEditInvoice(invoice)} className="w-full text-left text-gray-700 dark:text-gray-300 group flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700" role="menuitem">
                                                                <PencilIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"/>
                                                                Edit
                                                            </button>
                                                            <button onClick={() => onDeleteInvoice(invoice.id)} className="w-full text-left text-red-600 dark:text-red-400 group flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700" role="menuitem">
                                                                <TrashIcon className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500"/>
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-between items-center p-4 text-sm text-gray-600 dark:text-gray-400">
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

export default InvoiceListPage;