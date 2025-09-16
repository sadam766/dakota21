
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { PaymentOverviewInvoice } from '../types';
import { SearchIcon } from './icons';
import PaginationControls from './PaginationControls';

declare const XLSX: any;

interface SpdPageProps {
  spds: PaymentOverviewInvoice[];
  onEditSpd: (spd: PaymentOverviewInvoice) => void;
  onDeleteSpd: (spdId: string) => Promise<void>;
  onPreviewSpd: (spds: PaymentOverviewInvoice[]) => void;
}

const SpdPage: React.FC<SpdPageProps> = ({ spds, onEditSpd, onDeleteSpd, onPreviewSpd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginatedData = useMemo(() => {
    let filtered: PaymentOverviewInvoice[] = spds.filter(spd => 
        (spd.number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (spd.client?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (spd.invoiceNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );

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
  }, [searchTerm, spds, currentPage, itemsPerPage]);

  const handleEdit = (spd: PaymentOverviewInvoice) => {
    onEditSpd(spd);
  };
  
  const handlePreview = (spdNumber: string | undefined) => {
    if (!spdNumber) {
        alert('Nomor SPD tidak ditemukan.');
        return;
    }
    const docsToPreview = spds.filter(s => s.number === spdNumber);
    if (docsToPreview.length > 0) {
        onPreviewSpd(docsToPreview);
    } else {
        alert('Tidak dapat menemukan dokumen terkait untuk SPD ini.');
    }
  };

  const handleDelete = async (spdId: string) => {
    if (deletingId) return; 

    if (window.confirm('Apakah Anda yakin ingin menghapus SPD ini? Tindakan ini juga akan melepaskan tautan dari invoice terkait.')) {
        setDeletingId(spdId);
        try {
            await onDeleteSpd(spdId);
        } catch (error) {
            console.error("Failed to delete SPD from page.", error);
        } finally {
            setDeletingId(null);
        }
    }
  };

  const formatCurrency = (value: number) => {
    return 'Rp ' + (value || 0).toLocaleString('id-ID', { minimumFractionDigits: 0 });
  };
  
  return (
    <div className="p-8 bg-gray-50 dark:bg-slate-900 min-h-full">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Daftar SPD</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola semua Tanda Terima Anda untuk rekapitulasi.</p>

      <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari SPD..."
              className="pl-10 pr-4 py-2 w-80 rounded-lg bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="p-3 font-medium">Tanggal</th>
                <th className="p-3 font-medium">Sales</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">SPD</th>
                <th className="p-3 font-medium">No Invoice</th>
                <th className="p-3 font-medium">Tanggal Invoice</th>
                <th className="p-3 font-medium">Tgl Terima Customer</th>
                <th className="p-3 font-medium">Tgl Jatuh Tempo</th>
                <th className="p-3 font-medium text-right">Total Piutang</th>
                <th className="p-3 font-medium">Keterangan</th>
                <th className="p-3 font-medium">No. Kuitansi</th>
                <th className="p-3 font-medium">No. Faktur Pajak</th>
                <th className="p-3 font-medium">Surat Jalan</th>
                <th className="p-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.currentItems.length > 0 ? (
                paginatedData.currentItems.map((spd) => (
                    <tr key={spd.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{spd.date || '-'}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{spd.sales || '-'}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{spd.client || '-'}</td>
                        <td className="p-3 font-semibold text-gray-800 dark:text-gray-100">{spd.number || '-'}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{spd.invoiceNumber || '-'}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{spd.invoiceDate || '-'}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{spd.customerReceiptDate || '-'}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{spd.dueDate || '-'}</td>
                        <td className="p-3 text-gray-800 dark:text-gray-100 font-semibold text-right whitespace-nowrap">{formatCurrency(spd.totalPiutang || 0)}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300 truncate max-w-xs">{spd.keterangan || '-'}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{spd.noKuitansi || '-'}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{spd.noFakturPajak || '-'}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{spd.suratJalan || '-'}</td>
                        <td className="p-3 text-center space-x-2 whitespace-nowrap">
                          <button onClick={() => handlePreview(spd.number)} className="font-semibold text-green-600 hover:underline disabled:opacity-50">Pratinjau</button>
                          <button onClick={() => handleEdit(spd)} disabled={deletingId === spd.id} className="font-semibold text-blue-600 hover:underline disabled:opacity-50">Edit</button>
                          <button onClick={() => handleDelete(spd.id)} disabled={deletingId === spd.id} className="font-semibold text-red-600 hover:underline disabled:opacity-50">
                              {deletingId === spd.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={14} className="text-center p-4 text-gray-500 dark:text-gray-400">
                      Tidak ada data SPD ditemukan.
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
    </div>
  );
};

export default SpdPage;
