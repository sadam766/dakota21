import React, { useState, useMemo, FC, useEffect, useRef } from 'react';
import type { InvoiceItem, PaymentOverviewInvoice, ConsumerType, SalesOrderType, ProductType, InvoicePreviewData } from '../types';
import { PlusIcon, TrashIcon, ChevronLeftIcon } from './icons';
import InvoiceActionPanel from './InvoiceActionSidebar';

const newInvoiceTemplate: PaymentOverviewInvoice = {
    id: `new-${Date.now()}`,
    number: 'SAR/25000043',
    soNumber: '',
    poNumber: '',
    paymentTerms: '',
    client: '',
    billToAddress: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    status: 'Draft',
    printType: 'Original',
};

interface InvoiceAddPageProps {
    invoiceToEdit: PaymentOverviewInvoice | null;
    setEditingInvoice: (invoice: PaymentOverviewInvoice | null) => void;
    setActiveView: (view: string) => void;
    onGoToPreview: (data: InvoicePreviewData) => void;
    onSave: (invoice: PaymentOverviewInvoice, items: InvoiceItem[]) => void;
    invoices: PaymentOverviewInvoice[];
    consumers: ConsumerType[];
    salesOrders: SalesOrderType[];
    products: ProductType[];
    previewData: InvoicePreviewData | null;
    clearPreviewData: () => void;
}

const formatNumberInput = (value: string | number): string => {
  const strValue = String(value);
  if (!strValue) return '';
  const isNegative = strValue.startsWith('-');
  const numString = strValue.replace(/[^0-9]/g, '');
  if (numString === '') return isNegative ? '-' : '';
  
  const numberValue = parseInt(numString, 10);
  if (isNaN(numberValue)) return isNegative ? '-' : '';

  return (isNegative ? '-' : '') + numberValue.toLocaleString('id-ID');
};

const parseFormattedNumber = (value: string): number => {
  const strValue = String(value);
  if (!strValue) return 0;
  const isNegative = strValue.startsWith('-');
  const numString = strValue.replace(/[^0-9]/g, '');
  if (numString === '') return 0;
  
  const numberValue = parseInt(numString, 10) || 0;
  return isNegative ? -numberValue : numberValue;
};


const InvoiceAddPage: FC<InvoiceAddPageProps> = ({
    invoiceToEdit,
    setEditingInvoice,
    setActiveView,
    onGoToPreview,
    onSave,
    invoices,
    consumers,
    salesOrders,
    products,
    previewData,
    clearPreviewData
}) => {
    
    const DRAFT_KEY = 'invoiceDraft';
    const [invoice, setInvoice] = useState<PaymentOverviewInvoice>(newInvoiceTemplate);
    const [items, setItems] = useState<InvoiceItem[]>([{ id: 1, item: '', quantity: 1, unit: 'pcs', price: 0 }]);
    
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState<ConsumerType[]>([]);
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    
    const [soSearchTerm, setSoSearchTerm] = useState('');
    const [filteredSOs, setFilteredSOs] = useState<string[]>([]);
    const [isSOSearchOpen, setIsSOSearchOpen] = useState(false);
    const soSearchRef = useRef<HTMLDivElement>(null);
    
    const [isInvoiceNumberSearchOpen, setIsInvoiceNumberSearchOpen] = useState(false);
    const invoiceNumberSearchRef = useRef<HTMLDivElement>(null);

    const [activeItemSearch, setActiveItemSearch] = useState<number | null>(null);
    const itemSearchContainerRef = useRef<HTMLTableCellElement>(null);

    const [negotiationValue, setNegotiationValue] = useState(0);
    const [dpPercentage, setDpPercentage] = useState(0);
    const [dpValue, setDpValue] = useState(0);
    const [pelunasanPercentage, setPelunasanPercentage] = useState(0);
    const [pelunasanValue, setPelunasanValue] = useState(0);
    
    // Effect to automatically save form progress to localStorage
    useEffect(() => {
        // Avoid saving the initial blank state over a potentially valid draft
        if (invoice.id && (invoice.client || items.some(i => i.item) || soSearchTerm)) {
            const draftData = {
                invoice, items, customerSearchTerm, soSearchTerm,
                negotiationValue, dpValue, dpPercentage, pelunasanValue, pelunasanPercentage
            };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        }
    }, [invoice, items, customerSearchTerm, soSearchTerm, negotiationValue, dpValue, dpPercentage, pelunasanValue, pelunasanPercentage]);


    // Effect to initialize or restore state
    useEffect(() => {
        const savedDraftRaw = localStorage.getItem(DRAFT_KEY);
        let savedDraft = null;
        if (savedDraftRaw) {
            try { savedDraft = JSON.parse(savedDraftRaw); }
            catch (e) { console.error("Failed to parse invoice draft", e); localStorage.removeItem(DRAFT_KEY); }
        }

        const loadDraft = (draft: any) => {
            setInvoice(draft.invoice);
            setItems(draft.items);
            setCustomerSearchTerm(draft.customerSearchTerm || draft.invoice.client);
            setSoSearchTerm(draft.soSearchTerm || draft.invoice.soNumber || '');
            setNegotiationValue(draft.negotiationValue || 0);
            setDpPercentage(draft.dpPercentage || 0);
            setDpValue(draft.dpValue || 0);
            setPelunasanPercentage(draft.pelunasanPercentage || 0);
            setPelunasanValue(draft.pelunasanValue || 0);
        };
        
        // Priority 1: Restore from preview data (user is coming back from preview)
        if (previewData) {
            loadDraft(previewData);
            clearPreviewData();
            return;
        }

        // Determine context: editing a specific invoice or creating a new one
        const targetId = invoiceToEdit ? invoiceToEdit.id : 'new';
        let draftMatchesContext = false;
        if (savedDraft) {
            const draftId = savedDraft.invoice?.id || '';
            if (targetId.startsWith('new') && draftId.startsWith('new')) {
                draftMatchesContext = true;
            } else if (targetId !== 'new' && targetId === draftId) {
                draftMatchesContext = true;
            }
        }

        // Priority 2: Restore from a matching draft in localStorage
        if (draftMatchesContext) {
            loadDraft(savedDraft);
        } else {
        // Priority 3: No matching draft, so initialize based on props
            if (invoiceToEdit) { // Load data for an existing invoice
                setInvoice(invoiceToEdit);
                setCustomerSearchTerm(invoiceToEdit.client);
                setSoSearchTerm(invoiceToEdit.soNumber || '');
                const soItems = salesOrders.filter(so => so.soNumber === invoiceToEdit.soNumber);
                const newItems = soItems.map((item, i) => ({
                    id: Date.now() + i,
                    item: item.name,
                    quantity: item.quantity,
                    unit: item.satuan,
                    price: item.price
                }));
                setItems(newItems.length ? newItems : [{ id: 1, item: '', quantity: 1, unit: 'pcs', price: 0 }]);
                // Reset calculation fields for a clean edit session
                setNegotiationValue(0); setDpPercentage(0); setDpValue(0); setPelunasanPercentage(0); setPelunasanValue(0);
            } else { // Start a new, blank invoice
                setInvoice(newInvoiceTemplate);
                setItems([{ id: 1, item: '', quantity: 1, unit: 'pcs', price: 0 }]);
                setCustomerSearchTerm(''); setSoSearchTerm(''); setNegotiationValue(0);
                setDpPercentage(0); setDpValue(0); setPelunasanPercentage(0); setPelunasanValue(0);
            }
        }
    }, [invoiceToEdit, previewData, salesOrders, clearPreviewData]);

    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsCustomerSearchOpen(false);
            }
            if (soSearchRef.current && !soSearchRef.current.contains(event.target as Node)) {
                setIsSOSearchOpen(false);
            }
            if (itemSearchContainerRef.current && !itemSearchContainerRef.current.contains(event.target as Node)) {
                setActiveItemSearch(null);
            }
            if (invoiceNumberSearchRef.current && !invoiceNumberSearchRef.current.contains(event.target as Node)) {
                setIsInvoiceNumberSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setCustomerSearchTerm(term);
        if (term) {
            setFilteredCustomers(
                consumers.filter(c => c.name.toLowerCase().includes(term.toLowerCase()))
            );
            setIsCustomerSearchOpen(true);
        } else {
            setFilteredCustomers([]);
            setIsCustomerSearchOpen(false);
            setInvoice(inv => ({...inv, client: '', billToAddress: ''}));
        }
    };

    const handleCustomerSelect = (customer: ConsumerType) => {
        setInvoice(inv => ({
            ...inv,
            client: customer.name,
            billToAddress: customer.alamat
        }));
        setCustomerSearchTerm(customer.name);
        setIsCustomerSearchOpen(false);
        setFilteredCustomers([]);
    };
    
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && filteredCustomers.length > 0) {
            e.preventDefault();
            handleCustomerSelect(filteredCustomers[0]);
        }
    };

    const handleSOFocus = () => {
        const uniqueSOs = [...new Set(salesOrders.map(so => so.soNumber))];
        setFilteredSOs(uniqueSOs);
        setIsSOSearchOpen(true);
    };

    const handleSOChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSoSearchTerm(term);
        setInvoice(inv => ({...inv, soNumber: term}));
        if (term) {
            const uniqueSOs = [...new Set(salesOrders.map(so => so.soNumber))];
            setFilteredSOs(
                uniqueSOs.filter(so => so.toLowerCase().includes(term.toLowerCase()))
            );
            setIsSOSearchOpen(true);
        } else {
            setFilteredSOs([]);
            setIsSOSearchOpen(false);
            setItems([{ id: 1, item: '', quantity: 1, unit: 'pcs', price: 0 }]);
        }
    };

    const handleSOSelect = (soNumber: string) => {
        setInvoice(inv => ({...inv, soNumber: soNumber}));
        setSoSearchTerm(soNumber);
        setIsSOSearchOpen(false);
        
        const soItems = salesOrders.filter(so => so.soNumber === soNumber);
        const newInvoiceItems: InvoiceItem[] = soItems.map((soItem, index) => ({
            id: index + 1,
            item: soItem.name,
            quantity: soItem.quantity,
            unit: soItem.satuan,
            price: soItem.price
        }));
        setItems(newInvoiceItems.length > 0 ? newInvoiceItems : [{ id: 1, item: '', quantity: 1, unit: 'pcs', price: 0 }]);
    };

    const handleItemChange = (id: number, field: keyof Omit<InvoiceItem, 'id'>, value: string | number) => {
        setItems(items.map(item => (item.id === id ? { ...item, [field]: value } : item)));
        if (field === 'item') {
            setActiveItemSearch(id);
        }
    };
    
    const handleProductSelect = (itemId: number, product: ProductType) => {
        setItems(items.map(item =>
            item.id === itemId
                ? { ...item, item: product.name, quantity: 1, unit: product.unit || 'pcs', price: product.price }
                : item
        ));
        setActiveItemSearch(null);
    };

    const filteredItemProducts = useMemo(() => {
        if (activeItemSearch === null) return [];
        const activeItem = items.find(i => i.id === activeItemSearch);
        if (!activeItem || !activeItem.item) {
            return products;
        }
        const searchTerm = activeItem.item.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(searchTerm));
    }, [activeItemSearch, items, products]);

    const handleAddItem = () => {
        const newItem: InvoiceItem = {
            id: items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1,
            item: '',
            quantity: 1,
            unit: 'pcs',
            price: 0,
        };
        setItems([...items, newItem]);
    };

    const handleRemoveItem = (id: number) => {
        if (items.length > 1) {
          setItems(items.filter(item => item.id !== id));
        }
    };
    
    const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0), [items]);
    
    const handleDpPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const percentage = parseFloat(e.target.value) || 0;
        setDpPercentage(percentage);
        setDpValue(subtotal * (percentage / 100));
    };

    const handleDpValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFormattedNumber(e.target.value);
        setDpValue(value);
        setDpPercentage(0); // Decouple by clearing percentage
    };
    
    const handlePelunasanPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const percentage = parseFloat(e.target.value) || 0;
        setPelunasanPercentage(percentage);
        setPelunasanValue(subtotal * (percentage / 100));
    };

    const handlePelunasanValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFormattedNumber(e.target.value);
        setPelunasanValue(value);
        setPelunasanPercentage(0); // Decouple by clearing percentage
    };

    const negotiatedSubtotal = useMemo(() => subtotal + negotiationValue, [subtotal, negotiationValue]);
    const goods = useMemo(() => negotiatedSubtotal - dpValue - pelunasanValue, [negotiatedSubtotal, dpValue, pelunasanValue]);
    const dppVat = useMemo(() => Math.round(goods * 11 / 12), [goods]);
    const vat12 = useMemo(() => Math.round(dppVat * 12 / 100), [dppVat]);
    const totalRp = useMemo(() => goods + vat12, [goods, vat12]);


    const handleSave = () => {
        const finalInvoiceData = {
            ...invoice,
            amount: totalRp,
        };
        onSave(finalInvoiceData, items);
        localStorage.removeItem(DRAFT_KEY);
        setActiveView('invoice-list');
    };
    
    const handlePreview = () => {
        const previewInvoiceData: InvoicePreviewData = {
            invoice: {
                ...invoice,
                amount: totalRp,
            },
            items,
            negotiationValue,
            dpValue,
            dpPercentage,
            pelunasanValue,
            pelunasanPercentage
        };
        onGoToPreview(previewInvoiceData);
    };

    const handleBack = () => {
        setEditingInvoice(null);
        localStorage.removeItem(DRAFT_KEY);
        setActiveView('invoice-list');
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // --- New functionality for Invoice Number Search ---

    const handleInvoiceNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setInvoice(prev => ({ ...prev, number: term }));
        setIsInvoiceNumberSearchOpen(true);
    };

    const filteredInvoices = useMemo(() => {
        if (!invoice.number) return [];
        return invoices.filter(inv => inv.number.toLowerCase().includes(invoice.number.toLowerCase()));
    }, [invoice.number, invoices]);

    const handleInvoiceNumberSelect = (selectedInvoice: PaymentOverviewInvoice) => {
        const customer = consumers.find(c => c.name === selectedInvoice.client);
        
        setInvoice({
            ...selectedInvoice,
            billToAddress: customer ? customer.alamat : selectedInvoice.billToAddress || ''
        });
        
        setCustomerSearchTerm(selectedInvoice.client);
        setSoSearchTerm(selectedInvoice.soNumber || '');
        
        setIsInvoiceNumberSearchOpen(false);
        
        if (selectedInvoice.soNumber) {
            const soItems = salesOrders.filter(so => so.soNumber === selectedInvoice.soNumber);
            const newInvoiceItems: InvoiceItem[] = soItems.map((soItem, index) => ({
                id: index + 1,
                item: soItem.name,
                quantity: soItem.quantity,
                unit: soItem.satuan,
                price: soItem.price
            }));
            setItems(newInvoiceItems.length > 0 ? newInvoiceItems : [{ id: 1, item: '', quantity: 1, unit: 'pcs', price: 0 }]);
        } else {
            setItems([{ id: 1, item: '', quantity: 1, unit: 'pcs', price: 0 }]);
        }
    };


    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-slate-900/50 min-h-full">
        <div className="flex items-center mb-6">
          <button onClick={handleBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 mr-2">
            <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {invoiceToEdit ? `Edit Invoice #${invoiceToEdit.number}` : 'Create Invoice'}
          </h1>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div ref={invoiceNumberSearchRef} className="relative">
                        <label htmlFor="invoice-no" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice No.</label>
                        <input type="text" id="invoice-no" value={invoice.number} onChange={handleInvoiceNumberChange} onFocus={() => setIsInvoiceNumberSearchOpen(true)} className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm"/>
                        {isInvoiceNumberSearchOpen && filteredInvoices.length > 0 && (
                            <ul className="absolute z-20 w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                {filteredInvoices.map(inv => (
                                    <li key={inv.id} onClick={() => handleInvoiceNumberSelect(inv)} className="p-3 hover:bg-indigo-50 dark:hover:bg-slate-600 cursor-pointer text-sm">
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{inv.number}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{inv.client} - {formatCurrency(inv.amount)}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div ref={soSearchRef} className="relative">
                        <label htmlFor="so-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SO/Sales Order</label>
                         <input
                            type="text"
                            id="so-number"
                            value={soSearchTerm}
                            onChange={handleSOChange}
                            onFocus={handleSOFocus}
                            placeholder="Search an SO..."
                            autoComplete="off"
                            className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm"
                         />
                        {isSOSearchOpen && filteredSOs.length > 0 && (
                            <ul className="absolute z-20 w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                {filteredSOs.map(soNum => (
                                    <li key={soNum} onClick={() => handleSOSelect(soNum)} className="p-3 hover:bg-indigo-50 dark:hover:bg-slate-600 cursor-pointer text-sm text-gray-800 dark:text-gray-200">
                                        {soNum}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div>
                        <label htmlFor="po-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. PO</label>
                        <input type="text" id="po-number" value={invoice.poNumber || ''} onChange={(e) => setInvoice({...invoice, poNumber: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label htmlFor="payment-terms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment</label>
                        <input type="text" id="payment-terms" value={invoice.paymentTerms || ''} onChange={(e) => setInvoice({...invoice, paymentTerms: e.target.value})} placeholder="e.g. Bank Transfer" className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm"/>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="relative" ref={searchRef}>
                        <label htmlFor="customer-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bill To</label>
                        <input
                            id="customer-search"
                            type="text"
                            value={customerSearchTerm}
                            onChange={handleCustomerSearchChange}
                            onFocus={() => { if(customerSearchTerm) setIsCustomerSearchOpen(true); }}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search for a customer..."
                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:disabled:bg-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                            autoComplete="off"
                        />
                        {isCustomerSearchOpen && filteredCustomers.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                {filteredCustomers.map(customer => (
                                    <li
                                        key={customer.id}
                                        onClick={() => handleCustomerSelect(customer)}
                                        className="p-3 hover:bg-indigo-50 dark:hover:bg-slate-600 cursor-pointer"
                                    >
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{customer.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{customer.alamat}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                         {invoice.billToAddress && !isCustomerSearchOpen && (
                            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-md border border-gray-200 dark:border-slate-600">
                                <p className="whitespace-pre-wrap">{invoice.billToAddress}</p>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="invoice-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Date</label>
                            <input type="date" id="invoice-date" value={invoice.date} onChange={(e) => setInvoice({...invoice, date: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm"/>
                        </div>
                         <div>
                            <label htmlFor="due-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                            <input type="date" id="due-date" className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm"/>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-gray-200 dark:border-slate-700 text-left text-gray-500 dark:text-gray-400">
                                <th className="p-2 font-medium">Item</th>
                                <th className="p-2 font-medium w-24">Qty</th>
                                <th className="p-2 font-medium w-28">Unit</th>
                                <th className="p-2 font-medium w-32">Price</th>
                                <th className="p-2 font-medium w-32 text-right">Total</th>
                                <th className="p-2 font-medium w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id} className="border-b border-gray-100 dark:border-slate-700">
                                    <td className="p-2 relative" ref={activeItemSearch === item.id ? itemSearchContainerRef : null}>
                                        <input
                                            type="text"
                                            value={item.item}
                                            onChange={e => handleItemChange(item.id, 'item', e.target.value)}
                                            onFocus={() => setActiveItemSearch(item.id)}
                                            placeholder="Search for a product..."
                                            className="w-full p-1 rounded-md bg-transparent dark:text-gray-200 border border-transparent hover:border-gray-300 dark:hover:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-600"
                                            autoComplete="off"
                                        />
                                        {activeItemSearch === item.id && (
                                            <ul className="absolute z-30 w-full min-w-[300px] bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                                {filteredItemProducts.length > 0 ? filteredItemProducts.map(product => (
                                                    <li
                                                        key={product.id}
                                                        onClick={() => handleProductSelect(item.id, product)}
                                                        className="p-3 hover:bg-indigo-50 dark:hover:bg-slate-600 cursor-pointer"
                                                    >
                                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{product.name}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Stock: {product.stock} - {formatCurrency(product.price)}</p>
                                                    </li>
                                                )) : (
                                                    <li className="p-3 text-sm text-gray-500 dark:text-gray-400">No products found.</li>
                                                )}
                                            </ul>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        <input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))} className="w-full p-1 rounded-md bg-transparent dark:text-gray-200 border border-transparent hover:border-gray-300 dark:hover:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-600" />
                                    </td>
                                     <td className="p-2">
                                        <input type="text" value={item.unit} onChange={e => handleItemChange(item.id, 'unit', e.target.value)} className="w-full p-1 rounded-md bg-transparent dark:text-gray-200 border border-transparent hover:border-gray-300 dark:hover:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-600" />
                                    </td>
                                    <td className="p-2">
                                        <input type="text" inputMode="numeric" value={item.price ? formatNumberInput(String(item.price)) : ''} onChange={e => handleItemChange(item.id, 'price', parseFormattedNumber(e.target.value))} className="w-full p-1 rounded-md bg-transparent dark:text-gray-200 border border-transparent hover:border-gray-300 dark:hover:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-600" />
                                    </td>
                                    <td className="p-2 text-right text-gray-800 dark:text-gray-100 font-medium">
                                        {formatCurrency((item.quantity || 0) * (item.price || 0))}
                                    </td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed" disabled={items.length <= 1}>
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button onClick={handleAddItem} className="mt-4 flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900 text-sm font-semibold">
                        <PlusIcon className="w-4 h-4 mr-2" /> Add item
                    </button>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <div>{/* This space can be used for notes in the future */}</div>
                    <div className="w-full max-w-sm space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Subtotal:</span>
                            <span className="font-medium text-gray-800 dark:text-gray-100">{formatCurrency(subtotal)}</span>
                        </div>
                        
                        <div className="space-y-2 py-2">
                            <div className="flex justify-between items-center">
                                <label htmlFor="negotiation" className="text-gray-500 dark:text-gray-400">A/Negotiation:</label>
                                <input
                                    id="negotiation"
                                    type="text"
                                    inputMode="decimal"
                                    value={negotiationValue ? formatNumberInput(String(negotiationValue)) : ''}
                                    onChange={(e) => setNegotiationValue(parseFormattedNumber(e.target.value))}
                                    className="w-36 p-1 rounded-md bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-right text-gray-800 dark:text-gray-200"
                                    placeholder="e.g. -10.000"
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <label htmlFor="dpPercent" className="text-gray-500 dark:text-gray-400">DP (%):</label>
                                <input
                                    id="dpPercent"
                                    type="number"
                                    value={dpPercentage || ''}
                                    onChange={handleDpPercentageChange}
                                    className="w-36 p-1 rounded-md bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-right text-gray-800 dark:text-gray-200"
                                    placeholder="e.g. 20"
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <label htmlFor="dpValue" className="text-gray-500 dark:text-gray-400">DP Value:</label>
                                <input
                                    id="dpValue"
                                    type="text"
                                    inputMode="numeric"
                                    value={dpValue ? formatNumberInput(String(dpValue)) : ''}
                                    onChange={handleDpValueChange}
                                    className="w-36 p-1 rounded-md bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-right text-gray-800 dark:text-gray-200"
                                    placeholder="Override value"
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <label htmlFor="pelunasanPercent" className="text-gray-500 dark:text-gray-400">DP Pelunasan (%):</label>
                                <input
                                    id="pelunasanPercent"
                                    type="number"
                                    value={pelunasanPercentage || ''}
                                    onChange={handlePelunasanPercentageChange}
                                    className="w-36 p-1 rounded-md bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-right text-gray-800 dark:text-gray-200"
                                    placeholder="e.g. 10"
                                />
                            </div>
                             <div className="flex justify-between items-center">
                                <label htmlFor="pelunasanValue" className="text-gray-500 dark:text-gray-400">Pelunasan:</label>
                                <input
                                    id="pelunasanValue"
                                    type="text"
                                    inputMode="numeric"
                                    value={pelunasanValue ? formatNumberInput(String(pelunasanValue)) : ''}
                                    onChange={handlePelunasanValueChange}
                                    className="w-36 p-1 rounded-md bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-right text-gray-800 dark:text-gray-200"
                                    placeholder="e.g. 50.000"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Goods:</span>
                            <span className="font-medium text-gray-800 dark:text-gray-100">{formatCurrency(goods)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">DPP VAT (11/12):</span>
                            <span className="font-medium text-gray-800 dark:text-gray-100">{formatCurrency(dppVat)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">VAT 12 %:</span>
                            <span className="font-medium text-gray-800 dark:text-gray-100">{formatCurrency(vat12)}</span>
                        </div>
                        
                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-slate-700">
                            <span className="font-bold text-base text-gray-900 dark:text-gray-100">Total:</span>
                            <span className="font-bold text-base text-gray-900 dark:text-gray-100">{formatCurrency(totalRp)}</span>
                        </div>
                    </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-1">
              <InvoiceActionPanel
                invoice={invoice}
                onStatusChange={(newStatus) => setInvoice(prev => ({...prev, status: newStatus}))}
                onPrintTypeChange={(newPrintType) => setInvoice(prev => ({ ...prev, printType: newPrintType }))}
                onCreatedByChange={(newName) => setInvoice(prev => ({ ...prev, createdBy: newName }))}
                onSave={handleSave}
                onPreview={handlePreview}
                onSend={() => console.log('Send')}
              />
            </div>
        </div>
      </div>
    );
};

export default InvoiceAddPage;