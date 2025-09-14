import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { PaymentOverviewInvoice, ConsumerType, SalesType, SalesOrderType } from '../types';
import { PlusIcon, SearchIcon, ExportIcon, ImportIcon, FilterIcon } from './icons';
import AddInvoiceNumberModal from './AddInvoiceNumberModal';
import PaginationControls from './PaginationControls';

// Assuming XLSX is globally available from index.html
declare const XLSX: any;

interface NomorInvoicePageProps {
  setActiveView: (view: string) => void;
  consumers: ConsumerType[];
  invoices: PaymentOverviewInvoice[];
  onSaveInvoice: (invoiceData: Omit<PaymentOverviewInvoice, 'id' | 'status' | 'email'>, editingInvoiceId: string | null) => void;
  onDeleteInvoice: (invoiceId: string) => Promise<void>;
  onBulkAddInvoices: (invoices: any[]) => void;
  sales: SalesType[];
  salesOrders: SalesOrderType[];
}

const NomorInvoicePage: React.FC<NomorInvoicePageProps> = ({ setActiveView, consumers, invoices, onSaveInvoice, onDeleteInvoice, onBulkAddInvoices, sales, salesOrders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PaymentOverviewInvoice | null>(null);
  const [isDuplicateFilterActive, setIsDuplicateFilterActive] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const nextInvoiceNumbers = useMemo(() => {
    // SAR calculation
    const sarPrefix = `SAR/`;
    const sarInvoices = invoices
        .filter(inv => inv.number.startsWith(sarPrefix))
        .map(inv => parseInt(inv.number.replace(sarPrefix, ''), 10))
        .filter(num => !isNaN(num));
    const maxSarNumber = sarInvoices.length > 0 ? Math.max(...sarInvoices) : 0;
    const nextSarSequence = maxSarNumber + 1;

    // KW calculation
    const currentYear = new Date().getFullYear();
    const kwRegex = new RegExp(`^KW/(\\d{4})/KEU/${currentYear}$`);
    const kwInvoices = invoices
        .map(inv => {
            const match = inv.number.match(kwRegex);
            return match ? parseInt(match[1], 10) : NaN;
        })
        .filter(num => !isNaN(num));
    const maxKwNumber = kwInvoices.length > 0 ? Math.max(...kwInvoices) : 0;
    const nextKwSequence = maxKwNumber + 1;
    
    return {
        sar: {
            prefix: sarPrefix,
            sequence: nextSarSequence,
            fullNumber: `${sarPrefix}${String(nextSarSequence).padStart(8, '0')}`
        },
        kw: {
            prefix: `KW/`,
            suffix: `/KEU/${currentYear}`,
            sequence: nextKwSequence,
            fullNumber: `KW/${String(nextKwSequence).padStart(4, '0')}/KEU/${currentYear}`
        }
    };
  }, [invoices]);


  // Reset page to 1 when search term or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, isDuplicateFilterActive]);

  const paginatedData = useMemo(() => {
    let filtered: PaymentOverviewInvoice[];

    if (isDuplicateFilterActive) {
      const numberCounts = invoices.reduce((acc, invoice) => {
        acc[invoice.number] = (acc[invoice.number] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const duplicateNumbers = Object.keys(numberCounts).filter(num => numberCounts[num] > 1);
      
      filtered = invoices.filter(invoice => duplicateNumbers.includes(invoice.number))
                         .sort((a, b) => a.number.localeCompare(b.number));

    } else {
      filtered = invoices.filter(invoice => 
        (invoice.number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (invoice.client?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (invoice.soNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

    const startEntry = totalItems > 0 ? indexOfFirstItem + 1 : 0;
    const endEntry = Math.min(indexOfLastItem, totalItems);

    return {
      totalItems,
      currentItems,
      totalPages,
      startEntry,
      endEntry,
    };
  }, [searchTerm, invoices, currentPage, itemsPerPage, isDuplicateFilterActive]);

  const handleExport = () => {
      const ws = XLSX.utils.json_to_sheet(paginatedData.currentItems);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Invoices");
      XLSX.writeFile(wb, "InvoiceNumberList.xlsx");
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              const data = e.target?.result;
              try {
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                if (json.length > 0 && 'SALES ORDER/SO' in json[0]) {
                    onBulkAddInvoices(json);
                } else {
                     alert("Import failed. Please make sure your Excel file has a column named 'SALES ORDER/SO'.");
                }
              } catch(err) {
                console.error("Import error:", err);
                alert("An error occurred during import. Please ensure the file is a valid Excel file.");
              }
          };
          reader.readAsArrayBuffer(file);
          if(fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleSaveInvoice = (invoiceData: Omit<PaymentOverviewInvoice, 'id' | 'status' | 'email'>) => {
    onSaveInvoice(invoiceData, editingInvoice ? editingInvoice.id : null);
    setIsModalOpen(false);
    setEditingInvoice(null);
  };

  const handleOpenModalForAdd = () => {
    setEditingInvoice(null);
    setIsModalOpen(true);
  };

  const handleEdit = (invoice: PaymentOverviewInvoice) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };
  
  const handleDelete = async (invoiceId: string) => {
    if (deletingId) return; // Prevent multiple deletions at the same time

    setDeletingId(invoiceId);
    try {
        await onDeleteInvoice(invoiceId);
        // Success state is handled by App.tsx removing the item from the list
    } catch (error) {
        // Error is handled by App.tsx showing an alert
        console.error("Failed to delete invoice from page.", error);
    } finally {
        setDeletingId(null);
    }
  };
  
  const handleToggleDuplicateFilter = () => {
    const nextState = !isDuplicateFilterActive;
    setIsDuplicateFilterActive(nextState);
    if(nextState) {
        setSearchTerm('');
    }
  };

  const formatCurrency = (value: number) => {
    return 'Rp ' + value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  return (
    <div className="p-8 bg-gray-50 dark:bg-slate-900 min-h-full">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Daftar Nomor Faktur</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola semua nomor faktur Anda.</p>

      <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari Faktur"
              className="pl-10 pr-4 py-2 w-80 rounded-lg bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm disabled:bg-gray-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isDuplicateFilterActive}
            />
          </div>
          <div className="flex items-center space-x-3">
            <input type="file" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} accept=".xlsx, .xls" />
            <button onClick={handleImportClick} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 text-sm shadow-sm">
                <ImportIcon className="w-5 h-5" />
                <span>Impor</span>
            </button>
            <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 text-sm shadow-sm">
                <ExportIcon className="w-5 h-5" />
                <span>Ekspor</span>
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
            <button onClick={handleOpenModalForAdd} className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                <PlusIcon className="w-5 h-5" />
                <span>Add Number</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50">
                <th className="p-3 font-normal">NOMOR FAKTUR</th>
                <th className="p-3 font-normal">PELANGGAN</th>
                <th className="p-3 font-normal">SALES ORDER/SO</th>
                <th className="p-3 font-normal">TANGGAL</th>
                <th className="p-3 font-normal text-right">JUMLAH</th>
                <th className="p-3 font-normal text-center">TINDAKAN</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.currentItems.length > 0 ? (
                paginatedData.currentItems.map((invoice) => (
                  <tr key={invoice.id} className={`border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 ${isDuplicateFilterActive ? 'bg-red-50 dark:bg-red-900/40' : ''}`}>
                    <td className="p-3">
                      <div className="font-semibold text-gray-800 dark:text-gray-100">{invoice.number}</div>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{invoice.client}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{invoice.soNumber || '-'}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{invoice.date ? new Date(invoice.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'numeric', year: 'numeric'}) : ''}</td>
                    <td className="p-3 text-gray-800 dark:text-gray-100 font-semibold text-right">{formatCurrency(invoice.amount)}</td>
                    <td className="p-3 text-center space-x-4">
                      <button 
                        onClick={() => handleEdit(invoice)} 
                        disabled={deletingId === invoice.id}
                        className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">Edit</button>
                      <button 
                        onClick={() => handleDelete(invoice.id)} 
                        disabled={deletingId === invoice.id}
                        className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                          {deletingId === invoice.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={6} className="text-center p-4 text-gray-500 dark:text-gray-400">
                      {isDuplicateFilterActive ? 'Tidak ada nomor faktur duplikat.' : 'Tidak ada hasil yang ditemukan.'}
                    </td>
                </tr>
              )}
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
      <AddInvoiceNumberModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingInvoice(null); }}
        onSave={handleSaveInvoice}
        consumers={consumers}
        invoiceToEdit={editingInvoice}
        nextInvoiceNumbersInfo={nextInvoiceNumbers}
        sales={sales}
        salesOrders={salesOrders}
      />
    </div>
  );
};

export default NomorInvoicePage;