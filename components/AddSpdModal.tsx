
import React, { useState, useMemo, useEffect } from 'react';
import type { PaymentOverviewInvoice, ConsumerType, SalesType } from '../types';
import { XIcon } from './icons';

interface AddSpdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (commonData: Partial<PaymentOverviewInvoice>, invoices: PaymentOverviewInvoice[]) => void;
  onSaveSingle: (spdData: PaymentOverviewInvoice) => void;
  consumers: ConsumerType[];
  invoicesForCreation?: PaymentOverviewInvoice[];
  spdToEdit: PaymentOverviewInvoice | null;
  sales: SalesType[];
  allInvoices: PaymentOverviewInvoice[];
  spds: PaymentOverviewInvoice[];
}

const AddSpdModal: React.FC<AddSpdModalProps> = ({ isOpen, onClose, onSaveBatch, onSaveSingle, consumers, invoicesForCreation = [], spdToEdit, sales, allInvoices, spds }) => {
  const [formData, setFormData] = useState<Partial<PaymentOverviewInvoice>>({});
  const mode = spdToEdit ? 'edit' : 'create';

  const nextSpdNumberInfo = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const regex = new RegExp(`^PS/(\\d+)-J/KEU/${currentYear}/DK$`);
    const spdDocsForYear = spds.filter(doc => doc.number && doc.number.includes(`/KEU/${currentYear}/DK`));
    let currentSpdSequence = 0;
    if (spdDocsForYear.length > 0) {
        const sequences = spdDocsForYear.map(doc => {
            const match = doc.number.match(regex);
            return match ? parseInt(match[1], 10) : NaN;
        }).filter(n => !isNaN(n));
        if (sequences.length > 0) {
            currentSpdSequence = Math.max(...sequences);
        }
    }
    const nextSequence = currentSpdSequence + 1;
    const prefix = `PS/`;
    const suffix = `-J/KEU/${currentYear}/DK`;
    return {
        prefix,
        suffix,
        sequence: nextSequence,
        fullNumber: `${prefix}${nextSequence}${suffix}`
    };
  }, [spds]);

  const resetForm = (isCreateMode: boolean) => {
    let initialData: Partial<PaymentOverviewInvoice> = { date: new Date().toISOString().split('T')[0] };
    if (isCreateMode) {
      const firstInvoice = invoicesForCreation[0];
      const saleInfo = sales.find(s => s.soNumber === firstInvoice?.soNumber);
      initialData = {
        ...initialData,
        client: firstInvoice?.client || '',
        sales: saleInfo?.salesPerson || '',
        number: nextSpdNumberInfo.fullNumber,
      };
    }
    setFormData(initialData);
  };

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && spdToEdit) {
        setFormData(spdToEdit);
      } else {
        resetForm(true);
      }
    }
  }, [isOpen, spdToEdit, invoicesForCreation, nextSpdNumberInfo, sales]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };
  
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsedValue = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'edit') {
        if (!formData.number || !formData.client) {
            alert("Please fill SPD Number and Customer.");
            return;
        }
        onSaveSingle(formData as PaymentOverviewInvoice);
    } else {
        if (!formData.number || !formData.client) {
            alert("Please fill SPD Number and Customer.");
            return;
        }
        onSaveBatch(formData, invoicesForCreation);
    }
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl animate-modal-pop">
        <style>{`@keyframes modal-pop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } } .animate-modal-pop { animation: modal-pop 0.3s ease-out forwards; }`}</style>
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{mode === 'edit' ? 'Edit SPD' : 'Buat SPD dari Invoice'}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"><XIcon className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {mode === 'create' && (
                <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Membuat SPD untuk {invoicesForCreation.length} invoice:</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{invoicesForCreation.map(inv => inv.number).join(', ')}</p>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nomor SPD</label>
                <input type="text" id="number" name="number" value={formData.number || ''} onChange={handleChange} className="mt-1 block w-full input-style" required />
              </div>
              <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal SPD</label>
                  <input type="date" id="date" name="date" value={formData.date || ''} onChange={handleChange} className="mt-1 block w-full input-style" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                  <input type="text" id="client" name="client" value={formData.client || ''} onChange={handleChange} disabled={mode === 'create'} className="mt-1 block w-full input-style disabled:bg-gray-100 dark:disabled:bg-slate-600" required />
              </div>
              <div>
                  <label htmlFor="sales" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sales</label>
                  <input type="text" id="sales" name="sales" value={formData.sales || ''} onChange={handleChange} className="mt-1 block w-full input-style" placeholder="Nama Sales" />
              </div>
            </div>
            {mode === 'edit' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">No Invoice</label>
                        <input type="text" id="invoiceNumber" name="invoiceNumber" value={formData.invoiceNumber || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                    </div>
                    <div>
                        <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Invoice</label>
                        <input type="date" id="invoiceDate" name="invoiceDate" value={formData.invoiceDate || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                    </div>
                 </div>
            )}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customerReceiptDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tgl Terima Customer</label>
                  <input type="date" id="customerReceiptDate" name="customerReceiptDate" value={formData.customerReceiptDate || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                </div>
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tgl Jatuh Tempo</label>
                  <input type="date" id="dueDate" name="dueDate" value={formData.dueDate || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                      <label htmlFor="noKuitansi" className="block text-sm font-medium text-gray-700 dark:text-gray-300">No. Kuitansi</label>
                      <input type="text" id="noKuitansi" name="noKuitansi" value={formData.noKuitansi || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                  </div>
                  <div>
                      <label htmlFor="noFakturPajak" className="block text-sm font-medium text-gray-700 dark:text-gray-300">No. Faktur Pajak</label>
                      <input type="text" id="noFakturPajak" name="noFakturPajak" value={formData.noFakturPajak || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                  </div>
                  <div>
                      <label htmlFor="suratJalan" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Surat Jalan</label>
                      <input type="text" id="suratJalan" name="suratJalan" value={formData.suratJalan || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                  </div>
              </div>
               {mode === 'edit' && (
                 <div>
                    <label htmlFor="totalPiutang" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Piutang</label>
                    <input type="text" inputMode="numeric" id="totalPiutang" name="totalPiutang" value={formData.totalPiutang ? new Intl.NumberFormat('id-ID').format(formData.totalPiutang) : ''} onChange={handleNumericChange} className="mt-1 block w-full input-style" placeholder="0" />
                 </div>
               )}
              <div>
                  <label htmlFor="keterangan" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Keterangan</label>
                  <textarea id="keterangan" name="keterangan" value={formData.keterangan || ''} onChange={handleChange} rows={2} className="mt-1 block w-full input-style" placeholder="Catatan tambahan..."></textarea>
              </div>

            <div className="flex justify-end items-center pt-4 space-x-3">
              <button onClick={onClose} type="button" className="px-5 py-2.5 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-slate-600">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm">Save</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddSpdModal;
