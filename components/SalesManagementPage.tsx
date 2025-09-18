
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { SalesType, DocumentType, TaxInvoiceType, PaymentOverviewInvoice } from '../types';
import {
  MoreVerticalIcon,
  SearchIcon,
  GridIcon,
  ListIcon,
  PlusIcon,
  ChevronLeftIcon,
  CalendarIcon,
  ChevronDownIcon,
  PencilIcon,
  ArrowUpDownIcon,
  TrashIcon,
} from './icons';
import DocumentFormModal from './DocumentFormModal';
import PaginationControls from './PaginationControls';

// New Sub-components to build the page

const TaxStatusBadge: React.FC<{ status: TaxInvoiceType['statusFaktur'] | undefined }> = ({ status }) => {
    if (!status) return <span className="text-gray-500 dark:text-gray-400">-</span>;
    const statusClasses = {
        'APPROVED': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
        'Dibatalkan': 'bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-slate-300',
    };
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusClasses[status]}`}>{status}</span>;
}


// Card for each document in the grid
const DocumentCard: React.FC<{ doc: DocumentType, formatIDR: (val: number) => string }> = ({ doc, formatIDR }) => {
  const statusClasses: {[key in DocumentType['status']]: string} = {
    PAID: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    UNPAID: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex flex-col space-y-3 shadow-sm hover:shadow-lg dark:hover:shadow-slate-900/50 transition-shadow duration-300 h-full">
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-gray-800 dark:text-gray-100 pr-2">{doc.proformaInvoiceNumber}</h4>
        {/* Action button is now handled by the parent component */}
      </div>
      <div>
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${statusClasses[doc.status]}`}>{doc.status}</span>
      </div>
      <div className="flex justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Nilai Pembayaran</p>
          <p className="font-semibold text-gray-800 dark:text-gray-200">{formatIDR(doc.paymentValue)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Nilai Invoice</p>
          <p className="font-semibold text-gray-800 dark:text-gray-200">{formatIDR(doc.invoiceValue)}</p>
        </div>
      </div>
       <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">No. Invoice</p>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{doc.invoiceNumber}</p>
      </div>
       <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">No. Faktur Pajak</p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{doc.taxInvoiceNumber || '-'}</p>
          <div className="flex justify-between items-center mt-1">
             <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tgl. Faktur Pajak</p>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{doc.taxInvoiceDate || '-'}</p>
             </div>
             <TaxStatusBadge status={doc.taxInvoiceStatus} />
          </div>
      </div>
      <div className="flex justify-between text-xs">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Tanggal Invoice</p>
          <p className="font-medium text-gray-700 dark:text-gray-300">{doc.invoiceDate}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 dark:text-gray-400">Jatuh Tempo</p>
          <p className="font-medium text-gray-700 dark:text-gray-300">{doc.dueDate}</p>
        </div>
      </div>
    </div>
  );
};


// Card for the top summary (Estimates, Change Orders, Invoices)
const SummaryStat: React.FC<{
  title: string;
  count: number;
  stats: Array<{ label: string; value: string; color: string; count: number }>;
}> = ({ title, count, stats }) => (
  <div className="flex-1">
    <div className="flex items-center space-x-2">
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
      <span className="text-xs font-bold text-gray-500 bg-gray-200 dark:bg-slate-700 dark:text-gray-300 px-2 py-0.5 rounded-full">{count}</span>
    </div>
    <div className="flex items-baseline space-x-4 mt-3">
      {stats.map((stat, index) => (
        <div key={index}>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
          <div className="flex items-center mt-1">
            <span className={`w-2 h-2 rounded-full ${stat.color} mr-1.5`}></span>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label} ({stat.count})</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);


// Status badge for the list view
const StatusBadge: React.FC<{ status: DocumentType['status'] }> = ({ status }) => {
    const statusClasses = {
        PAID: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        UNPAID: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
        PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
        OVERDUE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    };
    return <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusClasses[status]}`}>{status}</span>;
}

type SortableKeys = keyof DocumentType | 'proformaInvoiceNumber';

interface SalesManagementPageProps {
  sales: SalesType[];
  selectedSale: SalesType | null;
  setActiveView: (view: string) => void;
  taxInvoices: TaxInvoiceType[];
  invoices: PaymentOverviewInvoice[];
  onSaveDocument: (doc: DocumentType) => void;
  onDeleteDocument: (docId: string) => void;
}

const SalesManagementPage: React.FC<SalesManagementPageProps> = ({ sales, selectedSale, setActiveView, taxInvoices, invoices, onSaveDocument, onDeleteDocument }) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // State for interactivity
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' }>({ key: 'invoiceDate', direction: 'desc' });
  const [isSortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [isDatepickerOpen, setDatepickerOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
  const [tempDateRange, setTempDateRange] = useState({ start: '', end: '' });
  const [displayDateRange, setDisplayDateRange] = useState({ start: 'All Time', end: '' });
  
  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<DocumentType | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 6 : 10;

  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Effect to handle clicks outside of dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setDatepickerOpen(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig, viewMode, filterDateRange]);

  const handleApplyDateRange = () => {
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (tempDateRange.start && tempDateRange.end) {
        setFilterDateRange(tempDateRange);
        setDisplayDateRange({ start: formatDate(tempDateRange.start), end: formatDate(tempDateRange.end) });
    } else {
        setFilterDateRange({ start: '', end: '' });
        setDisplayDateRange({ start: 'All Time', end: '' });
    }
    setDatepickerOpen(false);
  };
  
  const documentsWithData = useMemo(() => {
    if (!selectedSale || !invoices) return [];
    
    // Helper to format YYYY-MM-DD to DD/MM/YYYY
    const formatDateForDisplay = (dateStr?: string) => {
        if (!dateStr || !dateStr.includes('-')) return dateStr || '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    const taxInvoiceMap = new Map<string, TaxInvoiceType>();
    taxInvoices.forEach(ti => {
        if (ti.referensi) {
            const existing = taxInvoiceMap.get(ti.referensi);
            if (!existing || new Date(ti.tanggalFaktur) > new Date(existing.tanggalFaktur)) {
                 taxInvoiceMap.set(ti.referensi, ti);
            }
        }
    });
    
    const hasPoNumber = selectedSale.poNumber && selectedSale.poNumber.trim() !== '';

    // If the selected sale has a PO number, filter all invoices by that PO number.
    // Otherwise, fall back to filtering by SO number.
    const relevantInvoices = hasPoNumber
      ? invoices.filter(inv => inv.poNumber === selectedSale.poNumber)
      : invoices.filter(inv => inv.soNumber === selectedSale.soNumber);


    return relevantInvoices.map(inv => {
            const statusMap: { [key in PaymentOverviewInvoice['status']]: DocumentType['status'] } = {
                'Paid': 'PAID', 'Unpaid': 'UNPAID', 'Pending': 'PENDING', 'Overdue': 'OVERDUE', 'Draft': 'PENDING'
            };

            const dueDate = new Date(inv.date);
            dueDate.setDate(dueDate.getDate() + 30); // Assuming 30-day due date

            const taxInfo = inv.soNumber ? taxInvoiceMap.get(inv.soNumber) : undefined;

            return {
                id: inv.id,
                soNumber: inv.soNumber,
                proformaInvoiceNumber: `${inv.soNumber || 'PI'} / ${inv.client}`,
                invoiceNumber: inv.number,
                invoiceValue: inv.amount,
                invoiceDate: formatDateForDisplay(inv.date),
                taxInvoiceNumber: inv.taxInvoiceNumber || '',
                taxInvoiceDate: formatDateForDisplay(inv.taxInvoiceDate),
                taxInvoiceStatus: taxInfo?.statusFaktur,
                status: statusMap[inv.status],
                dueDate: formatDateForDisplay(dueDate.toISOString().split('T')[0]),
                paymentValue: inv.status === 'Paid' ? inv.amount : 0,
                paymentDate: inv.status === 'Paid' ? formatDateForDisplay(inv.date) : '-',
            } as DocumentType;
        });
  }, [invoices, taxInvoices, selectedSale]);


  const filteredAndSortedDocuments = useMemo(() => {
      const parseDate = (dateStr: string): Date | null => {
        if (!dateStr || dateStr === '-') return null;
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return null;
    }

    let filtered = [...documentsWithData].filter(doc => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = doc.proformaInvoiceNumber.toLowerCase().includes(searchTermLower) ||
          doc.invoiceNumber.toLowerCase().includes(searchTermLower) ||
          String(doc.invoiceValue).includes(searchTermLower) ||
          doc.invoiceDate.toLowerCase().includes(searchTermLower) ||
          (doc.taxInvoiceNumber || '').toLowerCase().includes(searchTermLower) ||
          (doc.taxInvoiceDate || '').toLowerCase().includes(searchTermLower) ||
          (doc.taxInvoiceStatus || '').toLowerCase().includes(searchTermLower) ||
          doc.status.toLowerCase().includes(searchTermLower) ||
          doc.dueDate.toLowerCase().includes(searchTermLower) ||
          String(doc.paymentValue).includes(searchTermLower) ||
          (doc.paymentDate || '').toLowerCase().includes(searchTermLower);

      if (!matchesSearch) return false;

      if (filterDateRange.start && filterDateRange.end) {
          const docDate = parseDate(doc.invoiceDate);
          if (!docDate) return false;
          const startDate = new Date(filterDateRange.start);
          const endDate = new Date(filterDateRange.end);
          startDate.setHours(0,0,0,0);
          endDate.setHours(23,59,59,999);
          return docDate >= startDate && docDate <= endDate;
      }
      return true;
    });

    filtered.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof DocumentType];
      const bVal = b[sortConfig.key as keyof DocumentType];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (['invoiceDate', 'dueDate', 'taxInvoiceDate', 'paymentDate'].includes(sortConfig.key)) {
         if (String(aVal) === '-' || String(bVal) === '-') return String(aVal) === '-' ? 1 : -1;
         const dateA = new Date(String(aVal).split('/').reverse().join('-')).getTime();
         const dateB = new Date(String(bVal).split('/').reverse().join('-')).getTime();
         return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      return sortConfig.direction === 'asc' 
        ? String(aVal).localeCompare(String(bVal)) 
        : String(bVal).localeCompare(String(aVal));
    });

    return filtered;
  }, [searchTerm, sortConfig, documentsWithData, filterDateRange]);
  
  const paginatedData = useMemo(() => {
    const totalItems = filteredAndSortedDocuments.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAndSortedDocuments.slice(indexOfFirstItem, indexOfLastItem);
    const startEntry = totalItems > 0 ? indexOfFirstItem + 1 : 0;
    const endEntry = Math.min(indexOfLastItem, totalItems);

    return {
      totalItems,
      totalPages,
      currentItems,
      startEntry,
      endEntry,
    };
  }, [filteredAndSortedDocuments, currentPage, itemsPerPage]);

  const handleSort = (key: SortableKeys) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
      setSortDropdownOpen(false);
  };

  const handleEdit = (doc: DocumentType) => {
    setDocumentToEdit(doc);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };
  
  const handleDelete = (doc: DocumentType) => {
    onDeleteDocument(doc.id);
    setOpenMenuId(null);
  };

  const handleCreateDocument = () => {
    setDocumentToEdit(null);
    setIsModalOpen(true);
  };

  const handleSaveDocument = (doc: DocumentType) => {
    onSaveDocument(doc);
    setIsModalOpen(false);
  };

  const handleEditCustomerDetails = () => {
      if (selectedSale) {
          alert(`Editing details for customer: ${selectedSale.customer}`);
      }
  };

  const formatIDR = (value: number) => value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
  const formatIDRK = (value: number) => `Rp${(value / 1000000).toFixed(1)}jt`;

  const invoiceStats = useMemo(() => {
    if (!selectedSale) {
        return {
            totalCount: 0,
            stats: []
        };
    }
    const saleInvoices = invoices.filter(inv => inv.soNumber === selectedSale.soNumber);

    const paidInvoices = saleInvoices.filter(i => i.status === 'Paid');
    const pendingInvoices = saleInvoices.filter(i => i.status === 'Pending');
    const overdueInvoices = saleInvoices.filter(i => i.status === 'Overdue');
    const draftInvoices = saleInvoices.filter(i => i.status === 'Draft');
    const unpaidInvoices = saleInvoices.filter(i => i.status === 'Unpaid');

    const sumAmount = (invs: PaymentOverviewInvoice[]) => invs.reduce((sum, i) => sum + i.amount, 0);

    const stats = [];
    if (paidInvoices.length > 0) {
        stats.push({
            label: 'PAID',
            value: formatIDRK(sumAmount(paidInvoices)),
            color: 'bg-green-500',
            count: paidInvoices.length
        });
    }
    if (pendingInvoices.length > 0) {
        stats.push({
            label: 'PENDING',
            value: formatIDRK(sumAmount(pendingInvoices)),
            color: 'bg-yellow-500',
            count: pendingInvoices.length
        });
    }
    if (overdueInvoices.length > 0) {
        stats.push({
            label: 'OVERDUE',
            value: formatIDRK(sumAmount(overdueInvoices)),
            color: 'bg-red-500',
            count: overdueInvoices.length
        });
    }
    if (draftInvoices.length > 0) {
        stats.push({
            label: 'DRAFT',
            value: formatIDRK(sumAmount(draftInvoices)),
            color: 'bg-gray-400',
            count: draftInvoices.length
        });
    }
    if (unpaidInvoices.length > 0) {
      stats.push({
          label: 'UNPAID',
          value: formatIDRK(sumAmount(unpaidInvoices)),
          color: 'bg-pink-500',
          count: unpaidInvoices.length
      });
    }

    return {
        totalCount: saleInvoices.length,
        stats: stats
    };
  }, [invoices, selectedSale]);

  const customerSales = useMemo(() => {
    if (!selectedSale || !sales) return [];
    return sales.filter(s => s.customer === selectedSale.customer);
  }, [selectedSale, sales]);

  const calculateSummaryStats = (salesData: SalesType[]) => {
    if (salesData.length === 0) {
      return { totalCount: 0, stats: [] };
    }

    const sumAmount = (arr: SalesType[]) => arr.reduce((sum, s) => sum + s.amount, 0);
    
    const statsMap: {[key in SalesType['status']]?: { label: string, color: string, data: SalesType[] }} = {
        'Paid': { label: 'ACCEPTED', color: 'bg-green-500', data: [] },
        'Pending': { label: 'PENDING', color: 'bg-yellow-500', data: [] },
        'Unpaid': { label: 'PENDING', color: 'bg-yellow-500', data: [] },
        'Overdue': { label: 'OVERDUE', color: 'bg-red-500', data: [] },
        'Draft': { label: 'PENDING', color: 'bg-yellow-500', data: [] },
    };

    salesData.forEach(sale => {
        if(statsMap[sale.status]) {
            statsMap[sale.status]!.data.push(sale);
        }
    });

    const consolidatedStats: {[label: string]: { color: string, data: SalesType[] }} = {};
    Object.values(statsMap).forEach(statInfo => {
        if (statInfo && statInfo.data.length > 0) {
            if (!consolidatedStats[statInfo.label]) {
                consolidatedStats[statInfo.label] = { color: statInfo.color, data: [] };
            }
            consolidatedStats[statInfo.label].data.push(...statInfo.data);
        }
    });

    const finalStats = Object.entries(consolidatedStats).map(([label, { color, data }]) => ({
        label: label,
        value: formatIDRK(sumAmount(data)),
        color: color,
        count: data.length
    }));

    return {
        totalCount: salesData.length,
        stats: finalStats
    };
  };
  
  const estimateStats = useMemo(() => calculateSummaryStats(customerSales), [customerSales]);
  
  const changeOrderStats = useMemo(() => {
      const changeOrders = customerSales.filter((_, index) => index % 4 === 1);
      return calculateSummaryStats(changeOrders);
  }, [customerSales]);


  if (!selectedSale) {
    return (
        <div className="p-8 text-center flex flex-col items-center justify-center h-full bg-[#F7F8FC] dark:bg-slate-900">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-100">No Sale Selected</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Please go back to the sales list and preview a sale to see its management details.</p>
            <button onClick={() => setActiveView('orders/list')} className="mt-6 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700">
                Back to Sales
            </button>
        </div>
    );
  }
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedRows(new Set(filteredAndSortedDocuments.map(d => d.id)));
    } else {
        setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
        newSelection.delete(id);
    } else {
        newSelection.add(id);
    }
    setSelectedRows(newSelection);
  };
  
  const TableHeader: React.FC<{ sortKey: SortableKeys, label: string, className?: string }> = ({ sortKey, label, className }) => (
      <th className={`p-3 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 ${className}`} onClick={() => handleSort(sortKey)}>
          <div className="flex items-center">
              <span>{label}</span>
              {sortConfig.key === sortKey && (
                  <span className="ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
              )}
          </div>
      </th>
  );

  return (
    <div className="p-6 bg-[#F7F8FC] dark:bg-slate-900/50 font-sans min-h-full">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center">
            <button onClick={() => setActiveView('consumers')} className="text-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Customers</button>
            <span className="text-lg text-gray-500 dark:text-gray-400 mx-2">/</span>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedSale.customer}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative" ref={dateDropdownRef}>
            <button onClick={() => setDatepickerOpen(prev => !prev)} className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm">
              <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span>{displayDateRange.end ? `${displayDateRange.start} - ${displayDateRange.end}` : displayDateRange.start}</span>
              <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            {isDatepickerOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl p-4 z-10 w-72">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Start Date</label>
                      <input type="date" value={tempDateRange.start} onChange={e => setTempDateRange(prev => ({...prev, start: e.target.value}))} className="w-full mt-1 p-1.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md text-sm"/>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-300">End Date</label>
                      <input type="date" value={tempDateRange.end} onChange={e => setTempDateRange(prev => ({...prev, end: e.target.value}))} className="w-full mt-1 p-1.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md text-sm"/>
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <button onClick={() => setTempDateRange({start: '', end: ''})} className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium rounded-md">Clear</button>
                    <button onClick={handleApplyDateRange} className="px-4 py-1.5 text-sm text-white font-semibold bg-teal-600 rounded-md hover:bg-teal-700">Apply</button>
                  </div>
              </div>
            )}
          </div>
          <button onClick={() => alert('Viewing statement...')} className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/50 bg-white dark:bg-slate-800 shadow-sm">
            VIEW STATEMENT
          </button>
          <button onClick={handleEditCustomerDetails} className="flex items-center space-x-2 px-3 py-2 border border-transparent rounded-md text-sm font-semibold text-white bg-gray-700 dark:bg-gray-900 hover:bg-gray-800 dark:hover:bg-black shadow-sm">
            <PencilIcon className="w-4 h-4" />
            <span>EDIT CUSTOMER DETAILS</span>
          </button>
        </div>
      </div>
      
      {/* Summary Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:space-x-6 space-y-6 md:space-y-0">
           <SummaryStat 
            title="Total Estimates"
            count={estimateStats.totalCount}
            stats={estimateStats.stats}
          />
          <div className="border-l border-gray-200 dark:border-slate-700 h-auto md:h-16 self-stretch"></div>
           <SummaryStat 
            title="Change Orders"
            count={changeOrderStats.totalCount}
            stats={changeOrderStats.stats}
          />
          <div className="border-l border-gray-200 dark:border-slate-700 h-auto md:h-16 self-stretch"></div>
          <SummaryStat 
            title="Invoices"
            count={invoiceStats.totalCount}
            stats={invoiceStats.stats}
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
          <div className="relative flex-grow sm:flex-grow-0">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search documents"
              className="w-full sm:w-80 pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-3">
             <div className="relative" ref={sortDropdownRef}>
                <button onClick={() => setSortDropdownOpen(prev => !prev)} className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                  <ArrowUpDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span>Sort by</span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                {isSortDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-10 w-48">
                        <button onClick={() => handleSort('proformaInvoiceNumber')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">Name</button>
                        <button onClick={() => handleSort('invoiceDate')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">Invoice Date</button>
                        <button onClick={() => handleSort('invoiceValue')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">Invoice Value</button>
                        <button onClick={() => handleSort('status')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">Status</button>
                    </div>
                )}
            </div>
            <div className="bg-gray-200 dark:bg-slate-700 p-1 rounded-lg flex items-center">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                <ListIcon className="w-5 h-5" />
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                <GridIcon className="w-5 h-5" />
              </button>
            </div>
            <button onClick={handleCreateDocument} className="flex items-center space-x-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 text-sm shadow-sm transition-colors">
              <PlusIcon className="w-5 h-5" />
              <span>CREATE DOCUMENT</span>
            </button>
          </div>
        </div>

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedData.currentItems.map(doc => (
                <div key={doc.id} className="relative">
                    <DocumentCard doc={doc} formatIDR={formatIDR} />
                    <div className="absolute top-2 right-2">
                        <button className="text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-full" onClick={() => setOpenMenuId(openMenuId === doc.id ? null : doc.id)}>
                            <MoreVerticalIcon className="w-5 h-5" />
                        </button>
                        {openMenuId === doc.id && (
                        <div ref={actionMenuRef} className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black dark:ring-slate-700 ring-opacity-5 z-20">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                            <button onClick={() => handleEdit(doc)} className="w-full text-left text-gray-700 dark:text-gray-300 group flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700" role="menuitem">
                                <PencilIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"/>
                                Edit
                            </button>
                            <button onClick={() => handleDelete(doc)} className="w-full text-left text-red-600 dark:text-red-400 group flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700" role="menuitem">
                                <TrashIcon className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500"/>
                                Hapus
                            </button>
                            </div>
                        </div>
                        )}
                    </div>
              </div>
            ))}
          </div>
        )}
         {viewMode === 'list' && (
            <div className="overflow-x-auto">
                <table className="w-full min-w-[2200px] text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="p-4 w-12 text-center"><input type="checkbox" onChange={handleSelectAll} checked={filteredAndSortedDocuments.length > 0 && selectedRows.size === filteredAndSortedDocuments.length} className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500" /></th>
                            <TableHeader sortKey="proformaInvoiceNumber" label="No. PROFORMA INVOICE" />
                            <TableHeader sortKey="invoiceNumber" label="NO. INVOICE" />
                            <TableHeader sortKey="invoiceValue" label="NILAI INVOICE" className="text-right" />
                            <TableHeader sortKey="invoiceDate" label="TANGGAL INVOICE" />
                            <TableHeader sortKey="taxInvoiceNumber" label="NO. FAKTUR PAJAK" />
                            <TableHeader sortKey="taxInvoiceDate" label="TANGGAL FAKTUR PAJAK" />
                            <TableHeader sortKey="status" label="STATUS" />
                            <TableHeader sortKey="dueDate" label="TGL JATUH TEMPO INVOICE" />
                            <TableHeader sortKey="paymentValue" label="NILAI PEMBAYARAN" className="text-right" />
                            <TableHeader sortKey="paymentDate" label="TANGGAL PEMBAYARAN" />
                            <th className="p-3 font-medium text-center">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {paginatedData.currentItems.map((doc) => (
                            <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <td className="p-4 w-12 text-center"><input type="checkbox" onChange={() => handleSelectRow(doc.id)} checked={selectedRows.has(doc.id)} className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500" /></td>
                                <td className="p-3 text-gray-700 dark:text-gray-100 font-semibold">{doc.proformaInvoiceNumber}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{doc.invoiceNumber}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-200 font-medium text-right">{formatIDR(doc.invoiceValue)}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{doc.invoiceDate}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{doc.taxInvoiceNumber || '-'}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{doc.taxInvoiceDate || '-'}</td>
                                <td className="p-3"><StatusBadge status={doc.status} /></td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{doc.dueDate}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-200 font-medium text-right">{doc.paymentValue > 0 ? formatIDR(doc.paymentValue) : '-'}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{doc.paymentDate}</td>
                                <td className="p-3 text-center">
                                    <div className="relative inline-block text-left" ref={openMenuId === doc.id ? actionMenuRef : null}>
                                        <button onClick={() => setOpenMenuId(doc.id === openMenuId ? null : doc.id)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-full">
                                            <MoreVerticalIcon className="w-5 h-5" />
                                        </button>
                                        {openMenuId === doc.id && (
                                            <div className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black dark:ring-slate-700 ring-opacity-5 z-10">
                                                <div className="py-1" role="menu" aria-orientation="vertical">
                                                    <button onClick={() => handleEdit(doc)} className="w-full text-left text-gray-700 dark:text-gray-300 group flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700" role="menuitem">
                                                        <PencilIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"/>
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(doc)} className="w-full text-left text-red-600 dark:text-red-400 group flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700" role="menuitem">
                                                        <TrashIcon className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500"/>
                                                        Hapus
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
        <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{`Showing ${paginatedData.startEntry} to ${paginatedData.endEntry} of ${paginatedData.totalItems} entries`}</span>
            <PaginationControls
                currentPage={currentPage}
                totalPages={paginatedData.totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
      </div>

      <DocumentFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDocument}
        documentToEdit={documentToEdit}
        nextId={`inv-${Date.now()}`}
      />
    </div>
  );
};

export default SalesManagementPage;
