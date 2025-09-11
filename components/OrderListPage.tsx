
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { SalesType, PaymentOverviewInvoice } from '../types';
import { ExportIcon, FilterIcon, MoreVerticalIcon, PlusIcon, SearchIcon, SortIcon, PencilIcon, TrashIcon, ImportIcon, EyeIcon } from './icons';
import PaymentOverview from './PaymentOverview';
import PaginationControls from './PaginationControls';

declare const XLSX: any;

// MOCK DATA
const tabs: Array<keyof typeof tabCounts> = ['All Sales', 'Draft', 'Paid', 'Unpaid', 'Pending', 'Overdue'];
const tabCounts = { 'All Sales': 96, 'Draft': 12, 'Paid': 62, 'Unpaid': 17, 'Pending': 5, 'Overdue': 0 };


// SUB-COMPONENTS
const StatusBadge = ({ status }: { status: SalesType['status'] }) => {
    const statusClasses = {
        Paid: 'bg-[#EBF9F1] text-[#1D8A53] dark:bg-green-900/50 dark:text-green-300',
        Pending: 'bg-[#FFF8E5] text-[#E49E00] dark:bg-yellow-900/50 dark:text-yellow-300',
        Unpaid: 'bg-[#FEEEEE] text-[#D92D20] dark:bg-red-900/50 dark:text-red-300',
        Draft: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
        Overdue: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
        Shipping: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        Delivered: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        Cancelled: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
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

interface SalesPageProps {
    sales: SalesType[];
    setActiveView: (view: string) => void;
    setSelectedSale: (sale: SalesType) => void;
    setEditingSale: (sale: SalesType | null) => void;
    loading: boolean;
    error: string | null;
}

// MAIN COMPONENT
const SalesPage: React.FC<SalesPageProps> = ({ sales, setActiveView, setSelectedSale, setEditingSale, loading, error }) => {
    const [activeTab, setActiveTab] = useState<keyof typeof tabCounts>('All Sales');
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

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm, filters]);

    const filteredSales = useMemo(() => {
      return sales
          .filter(sale => {
              if (activeTab === 'All Sales') return true;
              const saleStatus = activeTab.replace(' Sales', '');
              return sale.status === saleStatus;
          })
          .filter(sale => {
              const term = searchTerm.toLowerCase();
              if (!term) return true;
              return (
                  sale.soNumber.toLowerCase().includes(term) ||
                  sale.customer.toLowerCase().includes(term) ||
                  sale.salesPerson.toLowerCase().includes(term) ||
                  (sale.poNumber || '').toLowerCase().includes(term) ||
                  String(sale.amount).includes(term) ||
                  sale.status.toLowerCase().includes(term)
              );
          })
          .filter(sale => {
            const { amountMin, amountMax, dateStart, dateEnd } = filters;
            if (amountMin !== '' && sale.amount < parseFloat(amountMin)) return false;
            if (amountMax !== '' && sale.amount > parseFloat(amountMax)) return false;

            const saleDate = new Date(sale.date);
            if (dateStart) {
                const startDate = new Date(dateStart);
                startDate.setHours(0, 0, 0, 0);
                if (saleDate < startDate) return false;
            }
            if (dateEnd) {
                const endDate = new Date(dateEnd);
                endDate.setHours(23, 59, 59, 999);
                if (saleDate > endDate) return false;
            }
            return true;
          });
    }, [activeTab, searchTerm, sales, filters]);
    
    const paginatedData = useMemo(() => {
        const totalItems = filteredSales.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
        const startEntry = totalItems > 0 ? indexOfFirstItem + 1 : 0;
        const endEntry = Math.min(indexOfLastItem, totalItems);

        return {
          totalItems,
          totalPages,
          currentItems,
          startEntry,
          endEntry,
        };
    }, [filteredSales, currentPage, itemsPerPage]);

    const salesAsInvoices = useMemo(() => {
        return filteredSales.map(sale => ({
            id: sale.id,
            number: sale.soNumber,
            client: sale.customer,
            email: '', // Not available or needed for overview
            date: sale.date,
            amount: sale.amount,
            status: sale.status,
            soNumber: sale.soNumber,
        }));
    }, [filteredSales]);


    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedRows(new Set(filteredSales.map(i => i.id)));
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
    
    const handlePreview = (sale: SalesType) => {
        setSelectedSale(sale);
        setActiveView('orders/detail');
        setOpenActionMenuId(null);
    };
    
    const handleEdit = (sale: SalesType) => {
        setEditingSale(sale);
        setActiveView('orders/add');
        setOpenActionMenuId(null);
    };

    const handleDelete = (saleId: string) => {
        // This should be handled by a parent function now
        if (window.confirm('Are you sure you want to delete this sale?')) {
            // onDeleteSale(saleId); // something like this
            alert(`Delete functionality for ${saleId} should be handled by App.tsx`);
        }
        setOpenActionMenuId(null);
    };

    const handleExport = () => {
      const ws = XLSX.utils.json_to_sheet(filteredSales);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales");
      XLSX.writeFile(wb, "SalesList.xlsx");
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
             <PaymentOverview invoices={salesAsInvoices} />

            {/* Sales Section */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Sales</h1>
                <div className="flex items-center space-x-3">
                    <input type="file" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} accept=".xlsx, .xls"/>
                    <button onClick={handleImportClick} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 text-sm shadow-sm">
                        <ImportIcon className="w-5 h-5" /><span>Import</span>
                    </button>
                    <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 text-sm shadow-sm">
                        <ExportIcon className="w-5 h-5" /><span>Export</span>
                    </button>
                    <button onClick={() => { setEditingSale(null); setActiveView('orders/add'); }} className="flex items-center space-x-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 text-sm shadow-sm">
                        <PlusIcon className="w-5 h-5" /> <span>New Sale</span>
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
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-base">Filter Sales</h4>
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
                                    checked={filteredSales.length > 0 && selectedRows.size === filteredSales.length} 
                                    aria-label="Select all sales"
                                    />
                                </th>
                                <TableHeader label="NUMBER SO" />
                                <TableHeader label="CUSTOMER" />
                                <TableHeader label="SALES" />
                                <TableHeader label="NO. PO" />
                                <TableHeader label="AMOUNT" />
                                <TableHeader label="STATUS" />
                                <th className="p-4">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-6 text-gray-500 dark:text-gray-400">Loading sales data...</td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-6 text-red-500">{error}</td>
                                </tr>
                            ) : paginatedData.currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-6 text-gray-500 dark:text-gray-400">No sales found.</td>
                                </tr>
                            ) : (
                                paginatedData.currentItems.map((sale) => (
                                    <tr key={sale.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 last:border-b-0">
                                        <td className="p-4 w-12 text-center">
                                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500 bg-gray-100 dark:bg-slate-900" 
                                            checked={selectedRows.has(sale.id)} 
                                            onChange={() => handleSelectRow(sale.id)} 
                                            aria-label={`Select sale ${sale.soNumber}`}
                                            />
                                        </td>
                                        <td className="p-4 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{sale.soNumber}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                            {sale.customer}
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                          {sale.salesPerson}
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{sale.poNumber}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{sale.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</td>
                                        <td className="p-4 whitespace-nowrap"><StatusBadge status={sale.status} /></td>
                                        <td className="p-4 text-center">
                                            <div className="relative inline-block text-left" ref={openActionMenuId === sale.id ? actionMenuRef : null}>
                                                <button onClick={() => setOpenActionMenuId(sale.id === openActionMenuId ? null : sale.id)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" aria-label={`Actions for sale ${sale.soNumber}`}>
                                                    <MoreVerticalIcon className="w-5 h-5" />
                                                </button>
                                                {openActionMenuId === sale.id && (
                                                    <div className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black dark:ring-slate-700 ring-opacity-5 z-10">
                                                        <div className="py-1" role="menu" aria-orientation="vertical">
                                                             <button onClick={() => handlePreview(sale)} className="w-full text-left text-gray-700 dark:text-gray-300 group flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700" role="menuitem">
                                                                <EyeIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"/>
                                                                Preview
                                                            </button>
                                                             <button onClick={() => handleEdit(sale)} className="w-full text-left text-gray-700 dark:text-gray-300 group flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700" role="menuitem">
                                                                <PencilIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"/>
                                                                Edit
                                                            </button>
                                                            <button onClick={() => handleDelete(sale.id)} className="w-full text-left text-red-600 dark:text-red-400 group flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700" role="menuitem">
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

export default SalesPage;
