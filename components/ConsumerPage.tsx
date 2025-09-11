import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ConsumerType } from '../types';
import { ChevronDownIcon, ExportIcon, PlusIcon, ImportIcon, SearchIcon } from './icons';
import PaginationControls from './PaginationControls';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxfE7lZgkXkmhY47B8Q-Vnzcu7dnqeSBm991sdm6kbtu7h9pB5ZLCg-vFOZu7NfD6OvzA/exec";

declare const XLSX: any;

interface ConsumerPageProps {
  setActiveView: (view: string) => void;
  consumers: ConsumerType[];
  setEditingConsumer: (consumer: ConsumerType) => void;
  onDeleteConsumer: (consumerId: string) => void;
  loading: boolean;
  error: string | null;
}

const ConsumerPage: React.FC<ConsumerPageProps> = ({ setActiveView, consumers, setEditingConsumer, onDeleteConsumer, loading, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredConsumers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return consumers;
    return consumers.filter(consumer => 
      consumer.name.toLowerCase().includes(term) ||
      consumer.alamat.toLowerCase().includes(term) ||
      consumer.alamatSpd.toLowerCase().includes(term)
    );
  }, [searchTerm, consumers]);

  const paginatedData = useMemo(() => {
    const totalItems = filteredConsumers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredConsumers.slice(indexOfFirstItem, indexOfLastItem);
    const startEntry = totalItems > 0 ? indexOfFirstItem + 1 : 0;
    const endEntry = Math.min(indexOfLastItem, totalItems);

    return {
      totalItems,
      totalPages,
      currentItems,
      startEntry,
      endEntry,
    };
  }, [filteredConsumers, currentPage, itemsPerPage]);

  const handleExport = () => {
      const ws = XLSX.utils.json_to_sheet(filteredConsumers);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Consumers");
      XLSX.writeFile(wb, "ConsumerList.xlsx");
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
                if (json.length > 0 && 'name' in json[0] && 'alamat' in json[0]) {
                    // This should ideally call a function from props to update the central state
                    alert(`${json.length} consumers imported. (Note: App state not updated in this mock)`);
                } else {
                     alert("Import failed. Please check the Excel file format. Required columns: name, alamat, alamatSpd.");
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
  
  const handleEdit = (consumer: ConsumerType) => {
    setEditingConsumer(consumer);
    setActiveView('consumers/add');
  };

  const handleDelete = (consumerId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) {
        onDeleteConsumer(consumerId);
    }
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-slate-900 min-h-full">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Customer List</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your customer base.</p>

      <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search Customer"
              className="pl-10 pr-4 py-2 w-80 rounded-lg bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-3">
            <input type="file" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} accept=".xlsx, .xls" />
            <button onClick={handleImportClick} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 text-sm shadow-sm">
                <ImportIcon className="w-5 h-5" />
                <span>Import</span>
            </button>
            <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 text-sm shadow-sm">
                <ExportIcon className="w-5 h-5" />
                <span>Export</span>
            </button>
            <button onClick={() => setActiveView('consumers/add')} className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                <PlusIcon className="w-5 h-5" />
                <span>Add Customer</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50">
                <th className="p-3 font-normal">CUSTOMER</th>
                <th className="p-3 font-normal">ALAMAT</th>
                <th className="p-3 font-normal">ALAMAT SPD</th>
                <th className="p-3 font-normal text-center">TINDAKAN</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr>
                    <td colSpan={4} className="text-center p-4">
                        <div className="flex justify-center items-center space-x-2 text-gray-500 dark:text-gray-400">
                            <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Loading customers...</span>
                        </div>
                    </td>
                </tr>
              ) : error ? (
                 <tr>
                    <td colSpan={4} className="text-center p-4 text-red-500">{error}</td>
                </tr>
              ) : (
                paginatedData.currentItems.map((consumer) => (
                  <tr key={consumer.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="p-3">
                      <div className="font-semibold text-gray-800 dark:text-gray-100">{consumer.name}</div>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{consumer.alamat}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{consumer.alamatSpd}</td>
                    <td className="p-3 text-center space-x-4">
                      <button onClick={() => handleEdit(consumer)} className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 hover:opacity-80 transition-opacity">Edit</button>
                      <button onClick={() => onDeleteConsumer(consumer.id)} className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-80 transition-opacity">Hapus</button>
                    </td>
                  </tr>
                ))
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

export default ConsumerPage;