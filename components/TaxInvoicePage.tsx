
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { TaxInvoiceType } from '../types';
import { ExportIcon, FilterIcon, MoreVerticalIcon, PlusIcon, SearchIcon, SortIcon, ImportIcon } from './icons';
import PaginationControls from './PaginationControls';
import TaxInvoiceOverview from './TaxInvoiceOverview';

declare const XLSX: any;

const tabs: Array<keyof typeof tabCounts> = ['All', 'APPROVED', 'Dibatalkan'];
const tabCounts = { 'All': 4, 'APPROVED': 3, 'Dibatalkan': 1 };

// SUB-COMPONENTS
const StatusBadge = ({ status }: { status: TaxInvoiceType['statusFaktur'] }) => {
    const statusClasses = {
        'APPROVED': 'bg-[#EBF9F1] text-[#1D8A53] dark:bg-green-900/50 dark:text-green-300',
        'Dibatalkan': 'bg-[#FEEEEE] text-[#D92D20] dark:bg-red-900/50 dark:text-red-300',
    };

    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses[status]}`}>{status}</span>;
}

const TableHeader = ({ label, sortable = false }: { label: string, sortable?: boolean }) => (
    <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-left whitespace-nowrap">
        <div className="flex items-center">
            {label}
            {sortable && <SortIcon className="ml-2 text-gray-400 dark:text-gray-500" />}
        </div>
    </th>
);

interface TaxInvoicePageProps {
  taxInvoices: TaxInvoiceType[];
  loading: boolean;
  error: string | null;
}

const TaxInvoicePage: React.FC<TaxInvoicePageProps> = ({ taxInvoices, loading, error }) => {
    const [activeTab, setActiveTab] = useState<keyof typeof tabCounts>('All');
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        dppMin: '',
        dppMax: '',
        dateStart: '',
        dateEnd: '',
        kodeTransaksi: [] as string[],
    });
    const filterRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [isDuplicateFilterActive, setIsDuplicateFilterActive] = useState(false);
    
    const uniqueTransactionCodes = useMemo(() => {
        return [...new Set(taxInvoices.map(inv => inv.kodeTransaksi))].sort();
    }, [taxInvoices]);

    const handleKodeTransaksiFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFilters(prev => {
            const currentCodes = prev.kodeTransaksi;
            if (checked) {
                return { ...prev, kodeTransaksi: [...currentCodes, value] };
            } else {
                return { ...prev, kodeTransaksi: currentCodes.filter(code => code !== value) };
            }
        });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
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
    }, [activeTab, searchTerm, filters, isDuplicateFilterActive]);

    const filteredInvoices = useMemo(() => {
        if (isDuplicateFilterActive) {
            const approvedInvoices = taxInvoices.filter(inv => inv.statusFaktur === 'APPROVED');
            
            const groupKey = (invoice: TaxInvoiceType) => `${invoice.nomorFaktur}|${invoice.referensi}`;
    
            const groupCounts = approvedInvoices.reduce((acc, invoice) => {
                const key = groupKey(invoice);
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
    
            const duplicateGroupKeys = new Set(
                Object.keys(groupCounts).filter(key => groupCounts[key] > 1)
            );
    
            return approvedInvoices
                .filter(invoice => duplicateGroupKeys.has(groupKey(invoice)))
                .sort((a, b) => {
                    const compareNomor = a.nomorFaktur.localeCompare(b.nomorFaktur);
                    if (compareNomor !== 0) return compareNomor;
                    return a.referensi.localeCompare(b.referensi);
                });
        }

        return taxInvoices
            .filter(invoice => {
                if (activeTab === 'All') return true;
                return invoice.statusFaktur === activeTab;
            })
            .filter(invoice => {
                const term = searchTerm.toLowerCase();
                if (!term) return true;
                return (
                    invoice.npwpPembeli.toLowerCase().includes(term) ||
                    invoice.namaPembeli.toLowerCase().includes(term) ||
                    invoice.kodeTransaksi.toLowerCase().includes(term) ||
                    invoice.nomorFaktur.toLowerCase().includes(term) ||
                    invoice.tanggalFaktur.toLowerCase().includes(term) ||
                    String(invoice.masaPajak).includes(term) ||
                    String(invoice.tahun).includes(term) ||
                    invoice.statusFaktur.toLowerCase().includes(term) ||
                    String(invoice.hargaJualDpp).includes(term) ||
                    String(invoice.dppNilaiLain).includes(term) ||
                    String(invoice.ppn).includes(term) ||
                    invoice.referensi.toLowerCase().includes(term)
                );
            })
            .filter(invoice => {
                const { dppMin, dppMax, dateStart, dateEnd, kodeTransaksi } = filters;
                if (dppMin !== '' && invoice.hargaJualDpp < parseFloat(dppMin)) return false;
                if (dppMax !== '' && invoice.hargaJualDpp > parseFloat(dppMax)) return false;

                const invoiceDate = new Date(invoice.tanggalFaktur);
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
                 if (kodeTransaksi.length > 0 && !kodeTransaksi.includes(invoice.kodeTransaksi)) {
                    return false;
                }
                return true;
            });
    }, [activeTab, searchTerm, taxInvoices, filters, isDuplicateFilterActive]);

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
    
    const handleToggleDuplicateFilter = () => {
        const nextState = !isDuplicateFilterActive;
        setIsDuplicateFilterActive(nextState);
        if (nextState) {
            setSearchTerm('');
            setIsFilterOpen(false);
            setActiveTab('All');
        }
    };

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
    
    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(filteredInvoices);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "TaxInvoices");
        XLSX.writeFile(wb, "TaxInvoiceList.xlsx");
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        alert('Import functionality should be handled by App.tsx');
    };

    return (
        <div className="p-6 md:p-8 font-sans bg-[#F9FAFB] dark:bg-slate-900">
            
            <TaxInvoiceOverview taxInvoices={filteredInvoices} />

            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tax Invoices</h1>
                <div className="flex items-center space-x-3">
                    <input type="file" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} accept=".xlsx, .xls"/>
                    <button onClick={handleImportClick} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 text-sm shadow-sm">
                        <ImportIcon className="w-5 h-5" /><span>Import</span>
                    </button>
                    <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 text-sm shadow-sm">
                        <ExportIcon className="w-5 h-5" /><span>Export</span>
                    </button>
                    <button 
                        onClick={handleToggleDuplicateFilter}
                        className={`flex items-center space-x-2 px-4 py-2.5 border rounded-lg font-medium text-sm shadow-sm transition-colors ${
                            isDuplicateFilterActive 
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300' 
                            : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                        }`}
                    >
                        <FilterIcon className="w-5 h-5" />
                        <span>Filter Duplikat</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 text-sm shadow-sm">
                        <PlusIcon className="w-5 h-5" /> <span>New Tax Invoice</span>
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex flex-wrap items-center border-b border-gray-200 dark:border-slate-700">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            disabled={isDuplicateFilterActive}
                            className={`px-1 pb-3 pt-1 mx-3 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === tab && !isDuplicateFilterActive ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'} disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed`}>
                            {tab}
                            <span className={`ml-2 px-2 py-0.5 rounded-md text-xs ${activeTab === tab && !isDuplicateFilterActive ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'}`}>
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
                          className="pl-10 pr-4 py-2 w-64 rounded-lg bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm disabled:bg-gray-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          disabled={isDuplicateFilterActive}
                        />
                    </div>
                    <div className="relative" ref={filterRef}>
                        <button onClick={() => setIsFilterOpen(prev => !prev)} disabled={isDuplicateFilterActive} className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            <FilterIcon className="w-5 h-5" /><span>Filters</span>
                        </button>
                        {isFilterOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-10 p-4">
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-base">Filter Tax Invoices</h4>
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
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">DPP Range (IDR)</label>
                                        <div className="flex items-center space-x-2">
                                            <input type="number" placeholder="Min" value={filters.dppMin} onChange={e => setFilters({...filters, dppMin: e.target.value})} className="w-full text-sm border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                                             <span className="text-gray-500 dark:text-gray-400">-</span>
                                            <input type="number" placeholder="Max" value={filters.dppMax} onChange={e => setFilters({...filters, dppMax: e.target.value})} className="w-full text-sm border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Kode Transaksi</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {uniqueTransactionCodes.map(code => (
                                                <div key={code} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id={`filter-kode-${code}`}
                                                        value={code}
                                                        checked={filters.kodeTransaksi.includes(code)}
                                                        onChange={handleKodeTransaksiFilterChange}
                                                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                                    />
                                                    <label htmlFor={`filter-kode-${code}`} className="ml-2 text-sm text-gray-600 dark:text-gray-400">{code}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-6">
                                    <button onClick={() => setFilters({ dppMin: '', dppMax: '', dateStart: '', dateEnd: '', kodeTransaksi: [] })} className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium rounded-md">Clear</button>
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
                                <TableHeader label="NPWP Pembeli / Identitas lainnya" sortable />
                                <TableHeader label="Nama Pembeli" />
                                <TableHeader label="Kode Transaksi" sortable />
                                <TableHeader label="Nomor Faktur Pajak" />
                                <TableHeader label="Tanggal Faktur Pajak" sortable />
                                <TableHeader label="Masa Pajak" sortable />
                                <TableHeader label="Tahun" />
                                <TableHeader label="Status Faktur" sortable />
                                <TableHeader label="Harga Jual/Penggantian/DPP" />
                                <TableHeader label="DPP Nilai Lain/DPP" />
                                <TableHeader label="PPN" />
                                <TableHeader label="Referensi" />
                                <th className="p-4">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={14} className="text-center p-6 text-gray-500 dark:text-gray-400">Loading tax invoices...</td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={14} className="text-center p-6 text-red-500">{error}</td>
                                </tr>
                            ) : paginatedData.currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={14} className="text-center p-6 text-gray-500 dark:text-gray-400">
                                        {isDuplicateFilterActive ? 'Tidak ada faktur duplikat dengan status "APPROVED" ditemukan.' : 'No tax invoices found.'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.currentItems.map((invoice) => (
                                    <tr key={invoice.id} className={`border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 last:border-b-0 ${isDuplicateFilterActive ? 'bg-red-50 dark:bg-red-900/40' : ''}`}>
                                        <td className="p-4 w-12 text-center">
                                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500 bg-gray-100 dark:bg-slate-900"
                                            checked={selectedRows.has(invoice.id)}
                                            onChange={() => handleSelectRow(invoice.id)}
                                            aria-label={`Select tax invoice ${invoice.nomorFaktur}`}
                                            />
                                        </td>
                                        <td className="p-4 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{invoice.npwpPembeli}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{invoice.namaPembeli}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{invoice.kodeTransaksi}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{invoice.nomorFaktur}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{invoice.tanggalFaktur}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{invoice.masaPajak}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{invoice.tahun}</td>
                                        <td className="p-4 whitespace-nowrap"><StatusBadge status={invoice.statusFaktur} /></td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap text-right">{invoice.hargaJualDpp.toLocaleString('id-ID')}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap text-right">{invoice.dppNilaiLain.toLocaleString('id-ID')}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap text-right">{invoice.ppn.toLocaleString('id-ID')}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{invoice.referensi}</td>
                                        <td className="p-4 text-center">
                                            <button className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" aria-label={`Actions for tax invoice ${invoice.nomorFaktur}`}>
                                                <MoreVerticalIcon className="w-5 h-5" />
                                            </button>
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

export default TaxInvoicePage;