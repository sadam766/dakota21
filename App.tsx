



import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import CalendarPage from './components/CalendarPage.tsx';
import ProductListPage from './components/ProductListPage.tsx';
import AddProductPage from './components/AddProductPage.tsx';
import OrderListPage from './components/OrderListPage.tsx';
import SalesManagementPage from './components/SalesManagementPage.tsx';
import ConsumerPage from './components/ConsumerPage.tsx';
import InvoiceListPage from './components/InvoiceListPage.tsx';
import InvoiceAddPage from './components/InvoiceAddPage.tsx';
import NomorInvoicePage from './components/NomorInvoicePage.tsx';
import TaxInvoicePage from './components/TaxInvoicePage.tsx';
import SalesOrderPage from './components/SalesOrderPage.tsx';
import AddConsumerPage from './components/AddConsumerPage.tsx';
import type { PaymentOverviewInvoice, SalesType, InvoiceItem, ProductType, SalesOrderType, ConsumerType, TaxInvoiceType, DocumentType, InvoicePreviewData } from './types';
import AddSalePage from './components/AddSalePage.tsx';
import InvoicePreviewPage from './components/InvoicePreviewPage.tsx';
import LoginPage from './components/LoginPage.tsx';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxfE7lZgkXkmhY47B8Q-Vnzcu7dnqeSBm991sdm6kbtu7h9pB5ZLCg-vFOZu7NfD6OvzA/exec';

const findValueByKey = (obj: any, targetKey: string): any => {
    if (!obj || typeof obj !== 'object') return undefined;

    // Normalize keys by removing all non-alphanumeric characters and converting to lower case.
    // This is a very robust way to match keys that might have inconsistent spacing, slashes, or other symbols.
    const normalize = (str: string) => (str || '').toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const normalizedTargetKey = normalize(targetKey);

    const key = Object.keys(obj).find(k => normalize(k) === normalizedTargetKey);
    return key ? obj[key] : undefined;
};

const mapSheetDataToInvoice = (sheetRow: any): PaymentOverviewInvoice => ({
    id: sheetRow.id,
    number: String(sheetRow['NUMBER'] || ''),
    client: String(sheetRow['CLIENT'] || ''),
    soNumber: String(sheetRow.soNumber || ''), // Not in sheet
    date: parseSheetDate(sheetRow['DATE']),
    amount: Number(sheetRow['AMOUNT']) || 0,
    status: String(sheetRow['STATUS'] || 'Draft') as PaymentOverviewInvoice['status'],
    billToAddress: String(sheetRow['ALAMAT'] || ''),
    poNumber: String(sheetRow.poNumber || ''), // Not in sheet
    paymentTerms: String(sheetRow.paymentTerms || ''), // Not in sheet
    printType: String(sheetRow.printType || 'Original') as 'Original' | 'Copy',
    taxInvoiceNumber: String(sheetRow.taxInvoiceNumber || ''), // Not in sheet
    taxInvoiceDate: parseSheetDate(sheetRow.taxInvoiceDate), // Not in sheet
    createdBy: String(findValueByKey(sheetRow, 'PEMBUAT INVOICE') || findValueByKey(sheetRow, 'PEMBUAT') || ''),
});

const mapInvoiceToSheetData = (invoice: PaymentOverviewInvoice) => ({
    id: invoice.id,
    'NUMBER': invoice.number,
    'CLIENT': invoice.client,
    'ALAMAT': invoice.billToAddress,
    'DATE': invoice.date,
    'AMOUNT': invoice.amount,
    'STATUS': invoice.status,
    'PEMBUAT INVOICE': invoice.createdBy,
});

const mapSheetDataToNomorFaktur = (sheetRow: any): PaymentOverviewInvoice => ({
    id: sheetRow.id,
    number: String(sheetRow['NOMOR FAKTUR'] || ''),
    client: String(sheetRow['PELANGGAN'] || ''),
    soNumber: String(sheetRow['SALES ORDER/SO'] || ''),
    date: parseSheetDate(sheetRow['TANGGAL']),
    amount: Number(sheetRow['JUMLAH']) || 0,
    status: 'Draft',
    createdBy: String(findValueByKey(sheetRow, 'PEMBUAT INVOICE') || findValueByKey(sheetRow, 'PEMBUAT') || ''),
});

const mapNomorFakturToSheetData = (invoice: PaymentOverviewInvoice) => ({
    id: invoice.id,
    'NOMOR FAKTUR': invoice.number,
    'PELANGGAN': invoice.client,
    'SALES ORDER/SO': invoice.soNumber,
    'TANGGAL': invoice.date,
    'JUMLAH': invoice.amount,
    'PEMBUAT INVOICE': invoice.createdBy,
});

const parseSheetDate = (sheetDate: any): string => {
    if (sheetDate === null || sheetDate === undefined || sheetDate === '') return '';

    // Case for numeric serial dates from Sheets/Excel
    if (typeof sheetDate === 'number') {
        const jsTimestamp = (sheetDate - 25569) * 86400 * 1000 + (12 * 60 * 60 * 1000);
        const serialDate = new Date(jsTimestamp);
        const day = String(serialDate.getUTCDate()).padStart(2, '0');
        const month = String(serialDate.getUTCMonth() + 1).padStart(2, '0');
        const year = serialDate.getUTCFullYear();
        return `${day}-${month}-${year}`;
    }

    // Case for JS Date objects, strings, etc.
    const d = new Date(sheetDate);
    if (isNaN(d.getTime())) {
        return String(sheetDate); // Return original if not a valid date
    }
    
    // The problem: `new Date('2025-07-15')` creates a date at local midnight.
    // In timezones ahead of UTC, the underlying UTC date is for the day before.
    // To fix this, we extract the year, month, and day from the parsed date (which respects the local time's "wall clock" date)
    // and then construct a new date object explicitly in UTC. This neutralizes timezone effects.
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    
    const utcDate = new Date(Date.UTC(year, month, day));

    const finalDay = String(utcDate.getUTCDate()).padStart(2, '0');
    const finalMonth = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const finalYear = utcDate.getUTCFullYear();

    return `${finalDay}-${finalMonth}-${finalYear}`;
};

const mapSheetDataToTaxInvoice = (sheetRow: any): TaxInvoiceType => {
    const statusFromSheet = (findValueByKey(sheetRow, 'Status Faktur') || '').toUpperCase();
    const status: 'APPROVED' | 'Dibatalkan' = statusFromSheet === 'DIBATALKAN' ? 'Dibatalkan' : 'APPROVED';

    const tanggalFakturStr = parseSheetDate(findValueByKey(sheetRow, 'Tanggal Faktur Pajak'));
    const masaPajakStr = String(findValueByKey(sheetRow, 'Masa Pajak') || '').toLowerCase().trim();

    const monthMap: { [key: string]: number } = {
        'januari': 1, 'februari': 2, 'maret': 3, 'april': 4, 'mei': 5, 'juni': 6,
        'juli': 7, 'agustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'desember': 12
    };

    let masaPajak: number | undefined = monthMap[masaPajakStr];

    // If masaPajak is not found in the map, try to get it from the date string
    if (masaPajak === undefined && tanggalFakturStr) {
        const dateParts = tanggalFakturStr.split('-');
        if (dateParts.length === 3) {
            // Assuming DD-MM-YYYY format
            const monthFromDate = parseInt(dateParts[1], 10);
            if (!isNaN(monthFromDate)) {
                masaPajak = monthFromDate;
            }
        }
    }
    
    // If it's still undefined, try converting the original string to a number, then fallback to 0
    if (masaPajak === undefined) {
        const numVal = Number(findValueByKey(sheetRow, 'Masa Pajak'));
        masaPajak = isNaN(numVal) ? 0 : numVal;
    }

    return {
        id: sheetRow.id || `tax-${Date.now()}-${Math.random()}`,
        npwpPembeli: findValueByKey(sheetRow, 'NPWP Pembeli/Identitas lainnya') || '',
        namaPembeli: findValueByKey(sheetRow, 'Nama Pembeli') || '',
        kodeTransaksi: findValueByKey(sheetRow, 'Kode Transaksi') || '',
        nomorFaktur: findValueByKey(sheetRow, 'Nomor Faktur Pajak') || '',
        tanggalFaktur: tanggalFakturStr,
        masaPajak: masaPajak,
        tahun: Number(findValueByKey(sheetRow, 'Tahun')) || 0,
        statusFaktur: status,
        hargaJualDpp: Number(findValueByKey(sheetRow, 'Harga Jual/Penggantian/DPP')) || 0,
        dppNilaiLain: Number(findValueByKey(sheetRow, 'DPP Nilai Lain/DPP')) || 0,
        ppn: Number(findValueByKey(sheetRow, 'PPN')) || 0,
        referensi: findValueByKey(sheetRow, 'Referensi') || '',
    };
};

const mapTaxInvoiceToSheetData = (taxInvoice: TaxInvoiceType) => ({
    id: taxInvoice.id,
    'NPWP Pembeli/Identitas lainnya': taxInvoice.npwpPembeli,
    'Nama Pembeli': taxInvoice.namaPembeli,
    'Kode Transaksi': taxInvoice.kodeTransaksi,
    'Nomor Faktur Pajak': taxInvoice.nomorFaktur,
    'Tanggal Faktur Pajak': taxInvoice.tanggalFaktur,
    'Masa Pajak': taxInvoice.masaPajak,
    'Tahun': taxInvoice.tahun,
    'Status Faktur': taxInvoice.statusFaktur,
    'Harga Jual/Penggantian/DPP': taxInvoice.hargaJualDpp,
    'DPP Nilai Lain/DPP': taxInvoice.dppNilaiLain,
    'PPN': taxInvoice.ppn,
    'Referensi': taxInvoice.referensi,
});

const mapSheetDataToProduct = (sheetRow: any): ProductType => {
    const stock = Number(sheetRow.QUANTITY) || 0;
    let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'Out of Stock';
    if (stock > 0) {
        status = stock < 20 ? 'Low Stock' : 'In Stock';
    }

    return {
        id: sheetRow.id,
        name: String(sheetRow.PRODUCT || ''),
        category: String(sheetRow.CATEGORY || ''),
        price: Number(sheetRow.PRICE) || 0,
        stock: stock,
        unit: String(sheetRow.SATUAN || 'pcs'),
        image: '', // Not available in the sheet
        status: status,
    };
};

const mapProductToSheetData = (product: ProductType) => ({
    id: product.id,
    PRODUCT: product.name,
    CATEGORY: product.category,
    QUANTITY: product.stock,
    SATUAN: product.unit,
    PRICE: product.price,
});

const mapSheetDataToSalesOrder = (sheetRow: any): SalesOrderType => ({
    id: sheetRow.id || `so-${Date.now()}-${Math.random()}`,
    soNumber: String(sheetRow['SO NUMBER'] || ''),
    name: String(sheetRow['PRODUCT NAME'] || ''),
    category: String(sheetRow.CATEGORY || ''),
    quantity: Number(sheetRow.QUANTITY) || 0,
    satuan: String(sheetRow.SATUAN || 'pcs'),
    price: Number(sheetRow.PRICE) || 0,
});

const mapSalesOrderToSheetData = (salesOrder: SalesOrderType) => ({
    id: salesOrder.id,
    'SO NUMBER': salesOrder.soNumber,
    'PRODUCT NAME': salesOrder.name,
    CATEGORY: salesOrder.category,
    QUANTITY: salesOrder.quantity,
    SATUAN: salesOrder.satuan,
    PRICE: salesOrder.price,
});

const mapSheetDataToConsumer = (sheetRow: any): ConsumerType => ({
    id: sheetRow.id || `con-${Date.now()}-${Math.random()}`,
    name: String(sheetRow['CUSTOMER'] || ''),
    alamat: String(sheetRow['ALAMAT'] || ''),
    alamatSpd: String(sheetRow['ALAMAT SPD'] || ''),
});

const mapConsumerToSheetData = (consumer: ConsumerType) => ({
    id: consumer.id,
    'CUSTOMER': consumer.name,
    'ALAMAT': consumer.alamat,
    'ALAMAT SPD': consumer.alamatSpd,
});

const mapSheetDataToSale = (sheetRow: any): SalesType => ({
    id: sheetRow.id || `sale-${Date.now()}-${Math.random()}`,
    soNumber: String(sheetRow['NUMBER SO'] || ''),
    customer: String(sheetRow['CUSTOMER'] || ''),
    salesPerson: String(sheetRow['SALES'] || ''),
    poNumber: String(sheetRow['NO. PO'] || ''),
    amount: Number(sheetRow['AMOUNT']) || 0,
    status: String(sheetRow['STATUS'] || 'Draft') as SalesType['status'],
    date: parseSheetDate(sheetRow.date) || new Date().toISOString().split('T')[0], // Sheet does not have date, default to today
});

const mapSaleToSheetData = (sale: SalesType) => ({
    id: sale.id,
    'NUMBER SO': sale.soNumber,
    'CUSTOMER': sale.customer,
    'SALES': sale.salesPerson,
    'NO. PO': sale.poNumber,
    'AMOUNT': sale.amount,
    'STATUS': sale.status,
    date: sale.date,
});


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PaymentOverviewInvoice | null>(null);
  const [selectedSale, setSelectedSale] = useState<SalesType | null>(null);
  const [editingSale, setEditingSale] = useState<SalesType | null>(null);
  const [previewingInvoice, setPreviewingInvoice] = useState<InvoicePreviewData | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'en' | 'id'>('en');

  // Data states
  const [products, setProducts] = useState<ProductType[]>([]);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [salesOrders, setSalesOrders] = useState<SalesOrderType[]>([]);
  const [consumers, setConsumers] = useState<ConsumerType[]>([]);
  const [editingConsumer, setEditingConsumer] = useState<ConsumerType | null>(null);
  const [invoices, setInvoices] = useState<PaymentOverviewInvoice[]>([]);
  const [nomorFakturInvoices, setNomorFakturInvoices] = useState<PaymentOverviewInvoice[]>([]);
  const [taxInvoices, setTaxInvoices] = useState<TaxInvoiceType[]>([]);
  const [sales, setSales] = useState<SalesType[]>([]);

  // Loading and error states for initial data fetch
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- AUTH HANDLERS ---
  const handleLogin = () => {
    setIsAuthenticated(true);
    setActiveView('dashboard'); // Go to dashboard on login
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };


  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async (sheetName: string) => {
        const res = await fetch(`${SCRIPT_URL}?action=read&sheetName=${sheetName}`);
        if (!res.ok) throw new Error(`Network response was not ok for ${sheetName}`);
        const result = await res.json();
        if (!result.success) throw new Error(`Failed to fetch ${sheetName}: ${result.message}`);
        return result.data;
    };

    const fetchAllData = async () => {
        try {
            const [productsData, salesOrdersData, consumersData, invoicesData, taxInvoicesData, salesData, nomorFakturData] = await Promise.all([
                fetchData('Products'),
                fetchData('SalesOrders'),
                fetchData('Customers'),
                fetchData('Invoices'),
                fetchData('TaxInvoices'),
                fetchData('Sales'),
                fetchData('NOMOR FAKTUR'),
            ]);

            setProducts(productsData.map(mapSheetDataToProduct));
            setSalesOrders(salesOrdersData.map(mapSheetDataToSalesOrder));
            setConsumers(consumersData.map(mapSheetDataToConsumer));
            setInvoices(invoicesData.map(mapSheetDataToInvoice));
            setNomorFakturInvoices(nomorFakturData.map(mapSheetDataToNomorFaktur));
            setTaxInvoices(taxInvoicesData.map(mapSheetDataToTaxInvoice));
            setSales(salesData.map(mapSheetDataToSale));

        } catch (err: any) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    fetchAllData();
  }, []);

  // --- CRUD HELPERS ---
  const postData = async (payload: object) => {
    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  };


  // --- CRUD HANDLERS ---
  const handleAddProduct = async (productData: Omit<ProductType, 'id' | 'image' | 'status'>) => {
    const newProduct: ProductType = {
        ...productData,
        id: `product-${Date.now()}`,
        status: productData.stock > 0 ? (productData.stock < 20 ? 'Low Stock' : 'In Stock') : 'Out of Stock',
        image: '',
    };
    setProducts(prev => [newProduct, ...prev]);
    try {
        await postData({ action: 'create', sheetName: 'Products', data: mapProductToSheetData(newProduct) });
    } catch (err) {
        alert('Failed to save product. Reverting changes.');
        setProducts(prev => prev.filter(p => p.id !== newProduct.id));
    }
  };
  
  const handleUpdateProduct = async (updatedProduct: ProductType) => {
    const originalProducts = [...products];
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    try {
        await postData({ action: 'update', sheetName: 'Products', id: updatedProduct.id, data: mapProductToSheetData(updatedProduct) });
    } catch (err) {
        alert('Failed to update product. Reverting changes.');
        setProducts(originalProducts);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const originalProducts = [...products];
    setProducts(prev => prev.filter(p => p.id !== productId));
    try {
        const response = await postData({ action: 'delete', sheetName: 'Products', id: productId });
        if (response && !response.success) {
            throw new Error(response.message || 'Backend failed to delete the row.');
        }
    } catch (err: any) {
        console.error("Delete failed:", err);
        alert(`Failed to delete product: ${err.message}. Reverting changes. Please check your Google Apps Script if the issue persists.`);
        setProducts(originalProducts);
    }
  };

  const handleAddSalesOrder = async (newSalesOrder: SalesOrderType) => {
    setSalesOrders(prev => [newSalesOrder, ...prev]);
    try {
        await postData({ action: 'create', sheetName: 'SalesOrders', data: mapSalesOrderToSheetData(newSalesOrder) });
    } catch (err) {
        alert('Failed to save sales order. Reverting changes.');
        setSalesOrders(prev => prev.filter(so => so.id !== newSalesOrder.id));
    }
  };
  
  const handleDeleteSalesOrder = async (salesOrderId: string) => {
    const originalSalesOrders = [...salesOrders];
    setSalesOrders(prev => prev.filter(so => so.id !== salesOrderId));
    try {
        const response = await postData({ action: 'delete', sheetName: 'SalesOrders', id: salesOrderId });
        if (response && !response.success) {
            throw new Error(response.message || 'Backend failed to delete the row.');
        }
    } catch (err: any) {
        console.error("Delete failed:", err);
        alert(`Failed to delete sales order: ${err.message}. Reverting changes. Please check your Google Apps Script if the issue persists.`);
        setSalesOrders(originalSalesOrders);
    }
  };

  const handleAddConsumer = async (newConsumerData: Omit<ConsumerType, 'id'>) => {
    const newConsumer: ConsumerType = {
        id: `con-${Date.now()}`,
        ...newConsumerData,
    };
    setConsumers(prev => [newConsumer, ...prev]);
    try {
        await postData({ action: 'create', sheetName: 'Customers', data: mapConsumerToSheetData(newConsumer) });
    } catch (err) {
        alert('Failed to add consumer. Reverting changes.');
        setConsumers(prev => prev.filter(c => c.id !== newConsumer.id));
    }
  };
  
  const handleUpdateConsumer = async (updatedConsumer: ConsumerType) => {
    const originalConsumers = [...consumers];
    setConsumers(prev => prev.map(c => c.id === updatedConsumer.id ? updatedConsumer : c));
    try {
        await postData({ action: 'update', sheetName: 'Customers', id: updatedConsumer.id, data: mapConsumerToSheetData(updatedConsumer) });
    } catch (err) {
        alert('Failed to update consumer. Reverting changes.');
        setConsumers(originalConsumers);
    }
  };

  const handleDeleteConsumer = async (consumerId: string) => {
    const originalConsumers = [...consumers];
    setConsumers(prev => prev.filter(c => c.id !== consumerId));
    try {
        const response = await postData({ action: 'delete', sheetName: 'Customers', id: consumerId });
        if (response && !response.success) {
            throw new Error(response.message || 'Backend failed to delete the row.');
        }
    } catch (err: any) {
        console.error("Delete failed:", err);
        alert(`Failed to delete consumer: ${err.message}. Reverting changes. Please check your Google Apps Script if the issue persists.`);
        setConsumers(originalConsumers);
    }
  };

  const handleAddSale = async (saleData: Omit<SalesType, 'id'>) => {
    const newSale: SalesType = {
        id: `sale-${Date.now()}`,
        ...saleData,
    };
    setSales(prev => [newSale, ...prev]);
    try {
        await postData({ action: 'create', sheetName: 'Sales', data: mapSaleToSheetData(newSale) });
    } catch (err) {
        alert('Failed to save sale. Reverting changes.');
        setSales(prev => prev.filter(s => s.id !== newSale.id));
    }
  };

  const handleUpdateSale = async (updatedSale: SalesType) => {
    const originalSales = [...sales];
    setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
    try {
        await postData({ action: 'update', sheetName: 'Sales', id: updatedSale.id, data: mapSaleToSheetData(updatedSale) });
    } catch (err) {
        alert('Failed to update sale. Reverting changes.');
        setSales(originalSales);
    }
  };

  const handleSaveInvoice = async (invoiceData: PaymentOverviewInvoice, items: InvoiceItem[]) => {
      const finalInvoiceData = {
          ...invoiceData,
          billToAddress: invoiceData.client && consumers.find(c => c.name === invoiceData.client)?.alamat || invoiceData.billToAddress || '',
      };

      const isNew = finalInvoiceData.id.startsWith('new-');
      const invoiceWithId = isNew ? { ...finalInvoiceData, id: `inv-${Date.now()}` } : finalInvoiceData;
      
      const originalInvoices = [...invoices];

      if (isNew) {
          setInvoices(prev => [invoiceWithId, ...prev]);
      } else {
          setInvoices(prev => prev.map(inv => inv.id === invoiceWithId.id ? invoiceWithId : inv));
      }
      
      try {
          await postData({ action: isNew ? 'create' : 'update', sheetName: 'Invoices', id: invoiceWithId.id, data: mapInvoiceToSheetData(invoiceWithId) });
      } catch (err) {
          alert('Failed to save invoice. Reverting changes.');
          setInvoices(originalInvoices);
      }
  };

    const handleSaveInvoiceNumber = async (invoiceData: Omit<PaymentOverviewInvoice, 'id' | 'status' | 'billToAddress'>, editingInvoiceId: string | null) => {
        if (editingInvoiceId) {
            const originalNomorFakturInvoices = [...nomorFakturInvoices];
            const originalInvoices = [...invoices];
    
            const oldInvoice = nomorFakturInvoices.find(inv => inv.id === editingInvoiceId);
            if (!oldInvoice) {
                alert("Error: could not find invoice to update.");
                return;
            }
    
            const updatedInvoice = {
                ...oldInvoice,
                ...invoiceData,
                billToAddress: consumers.find(c => c.name === invoiceData.client)?.alamat || oldInvoice.billToAddress || '',
            };
    
            const invoiceToUpdateInMainList = invoices.find(inv => inv.number === oldInvoice.number);
    
            setNomorFakturInvoices(prev => prev.map(inv => inv.id === editingInvoiceId ? updatedInvoice : inv));
            if (invoiceToUpdateInMainList) {
                const updatedMainInvoice = { 
                    ...invoiceToUpdateInMainList, 
                    ...updatedInvoice, 
                    id: invoiceToUpdateInMainList.id
                };
                setInvoices(prev => prev.map(inv => inv.id === invoiceToUpdateInMainList.id ? updatedMainInvoice : inv));
            }
            
            try {
                await postData({ action: 'update', sheetName: 'NOMOR FAKTUR', id: editingInvoiceId, data: mapNomorFakturToSheetData(updatedInvoice) });
    
                if (invoiceToUpdateInMainList) {
                    const updatedMainInvoice = { 
                      ...invoiceToUpdateInMainList, 
                      ...updatedInvoice, 
                      id: invoiceToUpdateInMainList.id 
                    };
                    await postData({ action: 'update', sheetName: 'Invoices', id: invoiceToUpdateInMainList.id, data: mapInvoiceToSheetData(updatedMainInvoice) });
                }
            } catch (err) {
                alert('Failed to update invoice number. Reverting changes.');
                setNomorFakturInvoices(originalNomorFakturInvoices);
                setInvoices(originalInvoices);
            }
        } else {
            const newInvoice: PaymentOverviewInvoice = {
                id: `inv-num-${Date.now()}`,
                status: 'Draft',
                ...invoiceData,
                billToAddress: consumers.find(c => c.name === invoiceData.client)?.alamat || '',
                createdBy: 'System (Nomor Faktur)',
            };
            
            setNomorFakturInvoices(prev => [newInvoice, ...prev]);
            setInvoices(prev => [newInvoice, ...prev]);
    
            try {
                await postData({ action: 'create', sheetName: 'NOMOR FAKTUR', data: mapNomorFakturToSheetData(newInvoice) });
                await postData({ action: 'create', sheetName: 'Invoices', data: mapInvoiceToSheetData(newInvoice) });
            } catch (err) {
                alert('Failed to add invoice number to both sheets. Reverting changes.');
                setNomorFakturInvoices(prev => prev.filter(inv => inv.id !== newInvoice.id));
                setInvoices(prev => prev.filter(inv => inv.id !== newInvoice.id));
            }
        }
    };
  
  const calculateNextInvoiceNumber = (currentInvoices: PaymentOverviewInvoice[]) => {
    const prefix = `SAR/`;
    const sarInvoices = currentInvoices
        .filter(inv => inv.number.startsWith(prefix))
        .map(inv => parseInt(inv.number.replace(prefix, ''), 10))
        .filter(num => !isNaN(num));

    const maxNumber = sarInvoices.length > 0 ? Math.max(...sarInvoices) : 0;
    return maxNumber + 1;
  };

    const handleBulkAddInvoices = async (newInvoices: any[]) => {
        let currentInvoiceSequence = calculateNextInvoiceNumber(nomorFakturInvoices);
        const prefix = `SAR/`;
    
        const processedInvoices: PaymentOverviewInvoice[] = [];
        const unprocessedSOs: string[] = [];
    
        for (const importedInv of newInvoices) {
          const soNumber = importedInv['SALES ORDER/SO'];
          if (!soNumber) {
              console.warn('Skipping imported row without SALES ORDER/SO:', importedInv);
              continue;
          }
    
          const saleInfo = sales.find(s => s.soNumber === soNumber);
          if (!saleInfo) {
              console.warn(`No sales data found for SO Number: ${soNumber}. Skipping.`);
              unprocessedSOs.push(soNumber);
              continue;
          }
          
          const newInvoice: PaymentOverviewInvoice = {
              id: `imported-num-${Date.now()}-${Math.random()}`,
              number: `${prefix}${String(currentInvoiceSequence).padStart(8, '0')}`,
              client: saleInfo.customer,
              soNumber: saleInfo.soNumber,
              date: saleInfo.date,
              amount: saleInfo.amount,
              status: 'Draft',
              billToAddress: consumers.find(c => c.name === saleInfo.customer)?.alamat || '',
              createdBy: 'Bulk Import',
          };
          processedInvoices.push(newInvoice);
          currentInvoiceSequence++;
        }
    
        if (processedInvoices.length === 0) {
            if(unprocessedSOs.length > 0) {
                alert(`Could not find sales data for the following SOs: ${unprocessedSOs.join(', ')}. No invoices were added.`);
            } else {
                alert("No valid Sales Orders to process from the imported file.");
            }
            return;
        }
    
        const originalNomorFakturInvoices = [...nomorFakturInvoices];
        const originalInvoices = [...invoices];
    
        setNomorFakturInvoices(prev => [...prev, ...processedInvoices]);
        setInvoices(prev => [...prev, ...processedInvoices]);
    
        try {
            for (const invoice of processedInvoices) {
                await postData({ action: 'create', sheetName: 'NOMOR FAKTUR', data: mapNomorFakturToSheetData(invoice) });
                await postData({ action: 'create', sheetName: 'Invoices', data: mapInvoiceToSheetData(invoice) });
            }
            let successMessage = `${processedInvoices.length} invoices were processed and added successfully!`;
            if (unprocessedSOs.length > 0) {
                successMessage += `\nCould not process the following SOs (not found): ${unprocessedSOs.join(', ')}.`;
            }
            alert(successMessage);
        } catch (err) {
            console.error('Failed to save bulk invoices:', err);
            alert('An error occurred while saving the invoices. Reverting changes.');
            setNomorFakturInvoices(originalNomorFakturInvoices);
            setInvoices(originalInvoices);
        }
    };

    const handleSaveDocument = async (doc: DocumentType) => {
    const toStorageDate = (dateStr: string) => {
        if (!dateStr || !dateStr.includes('/')) return dateStr; // Already in YYYY-MM-DD
        const parts = dateStr.split('/');
        if (parts.length === 3) { // Is DD/MM/YYYY
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    };

    const statusMap: { [key in DocumentType['status']]: PaymentOverviewInvoice['status'] } = {
        'PAID': 'Paid', 'UNPAID': 'Unpaid', 'PENDING': 'Pending', 'OVERDUE': 'Overdue'
    };

    const existingInvoice = invoices.find(inv => inv.id === doc.id);

    const finalInvoice: PaymentOverviewInvoice = existingInvoice 
        ? { 
            ...existingInvoice,
            number: doc.invoiceNumber,
            amount: doc.invoiceValue,
            date: toStorageDate(doc.invoiceDate),
            status: statusMap[doc.status],
            taxInvoiceNumber: doc.taxInvoiceNumber,
            taxInvoiceDate: toStorageDate(doc.taxInvoiceDate),
          } 
        : {
            id: doc.id,
            number: doc.invoiceNumber,
            client: selectedSale?.customer || '', // Get client from selectedSale for context
            soNumber: doc.soNumber,
            date: toStorageDate(doc.invoiceDate),
            amount: doc.invoiceValue,
            status: statusMap[doc.status],
            taxInvoiceNumber: doc.taxInvoiceNumber,
            taxInvoiceDate: toStorageDate(doc.taxInvoiceDate),
            createdBy: 'System (Document Save)',
        };

      const isNew = !existingInvoice;
      const originalInvoices = [...invoices];

      if (isNew) {
          setInvoices(prev => [finalInvoice, ...prev]);
      } else {
          setInvoices(prev => prev.map(inv => inv.id === finalInvoice.id ? finalInvoice : inv));
      }
      
      try {
          await postData({ action: isNew ? 'create' : 'update', sheetName: 'Invoices', id: finalInvoice.id, data: mapInvoiceToSheetData(finalInvoice) });
      } catch (err) {
          alert('Failed to save document. Reverting changes.');
          setInvoices(originalInvoices);
      }
  };

    const handleDeleteInvoice = async (invoiceId: string, sheetName: 'Invoices' | 'NOMOR FAKTUR') => {
        const originalInvoices = [...invoices];
        const originalNomorFakturInvoices = [...nomorFakturInvoices];
    
        let invoiceToDelete: PaymentOverviewInvoice | undefined;
        let correspondingInvoice: PaymentOverviewInvoice | undefined;
        let correspondingSheet: 'Invoices' | 'NOMOR FAKTUR';
        let mainSheet: 'Invoices' | 'NOMOR FAKTUR';
    
        if (sheetName === 'Invoices') {
            invoiceToDelete = invoices.find(inv => inv.id === invoiceId);
            if (!invoiceToDelete) return;
            correspondingInvoice = nomorFakturInvoices.find(inv => inv.number === invoiceToDelete!.number);
            mainSheet = 'Invoices';
            correspondingSheet = 'NOMOR FAKTUR';
        } else { // sheetName === 'NOMOR FAKTUR'
            invoiceToDelete = nomorFakturInvoices.find(inv => inv.id === invoiceId);
            if (!invoiceToDelete) return;
            correspondingInvoice = invoices.find(inv => inv.number === invoiceToDelete!.number);
            mainSheet = 'NOMOR FAKTUR';
            correspondingSheet = 'Invoices';
        }
    
        // Optimistic UI update
        setInvoices(prev => prev.filter(inv => inv.id !== (mainSheet === 'Invoices' ? invoiceToDelete!.id : correspondingInvoice?.id)));
        setNomorFakturInvoices(prev => prev.filter(inv => inv.id !== (mainSheet === 'NOMOR FAKTUR' ? invoiceToDelete!.id : correspondingInvoice?.id)));
    
        try {
            await postData({ action: 'delete', sheetName, id: invoiceId });
            if (correspondingInvoice) {
                await postData({ action: 'delete', sheetName: correspondingSheet, id: correspondingInvoice.id });
            }
        } catch (err: any) {
            console.error("Delete failed:", err);
            alert(`Failed to delete invoice from both sheets: ${err.message}. Reverting changes.`);
            setInvoices(originalInvoices);
            setNomorFakturInvoices(originalNomorFakturInvoices);
            throw err; // To be caught by caller if needed
        }
    };

  const handleDeleteDocument = async (docId: string) => {
    await handleDeleteInvoice(docId, 'Invoices');
  };
    
    const splitAddressIntoLines = (address: string, maxLineLength = 45): string[] => {
        if (!address) return ['', '', '', ''];
        const words = address.split(/\s+/);
        const lines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
            if (currentLine.length + word.length + 1 > maxLineLength) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine += (currentLine.length > 0 ? ' ' : '') + word;
            }
        });
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        while (lines.length < 4) {
            lines.push('');
        }
        return lines.slice(0, 4);
    };

    const updatePreviewSheet = async (previewData: InvoicePreviewData) => {
        // Helper to format date from YYYY-MM-DD to DD-MM-YYYY
        const formatDateForSheet = (dateStr: string): string => {
            if (!dateStr || !dateStr.includes('-')) return dateStr;
            const [year, month, day] = dateStr.split('-');
            if (year && month && day) {
                return `${day}-${month}-${year}`;
            }
            return dateStr;
        };
        
        const addressLines = splitAddressIntoLines(previewData.invoice.billToAddress || '');

        // Calculations
        const subtotal = previewData.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
        const negotiatedSubtotal = subtotal + previewData.negotiationValue;
        const goods = negotiatedSubtotal - previewData.dpValue - previewData.pelunasanValue;
        const dppVat = Math.round(goods * 11 / 12);
        const vat12 = Math.round(dppVat * 12 / 100);
        const totalRp = goods + vat12;

        // Construct the main data payload to match the Apps Script structure
        const dataPayload: { [key: string]: any } = {
            invoiceNumber: previewData.invoice.number,
            customerName: previewData.invoice.client,
            customerAddressLine1: addressLines[0],
            customerAddressLine2: addressLines[1],
            customerAddressLine3: addressLines[2],
            customerAddressLine4: addressLines[3],
            salesOrder: previewData.invoice.soNumber || '',
            orderDate: '-',
            referenceA: '',
            date: [formatDateForSheet(previewData.invoice.date), null], // For L:M12
            poNumber: previewData.invoice.poNumber || '',
            printType: previewData.invoice.printType || 'Original',
            
            items: previewData.items.map((item, index) => ({
                no: index + 1,
                description: item.item,
                quantity: item.quantity,
                unit: item.unit,
                price: item.price,
                amount: [(item.quantity || 0) * (item.price || 0), null] // For L:M16
            })),

            totals: {
                subtotal,
                goods,
                dppVat,
                vat12,
                totalRp,
            },
        };

        // Add conditional top-level properties to match code.gs
        if (previewData.negotiationValue && previewData.negotiationValue !== 0) {
            dataPayload.negotiationLabel = "A/Negotiation";
            dataPayload.negotiationValue = [previewData.negotiationValue, null]; // For L:M35
        }

        if (previewData.dpValue && previewData.dpValue !== 0) {
            dataPayload.dpLabel = "DP";
            dataPayload.dpValueText = previewData.dpPercentage 
                ? `${previewData.dpPercentage}%` 
                : previewData.dpValue.toLocaleString('id-ID');
            dataPayload.dpValue = [previewData.dpValue, null]; // For L:M36
        }
        
        if (previewData.pelunasanValue && previewData.pelunasanValue !== 0) {
            dataPayload.pelunasanLabel = "Pelunasan";
            dataPayload.pelunasanValueText = previewData.pelunasanPercentage
                ? `${previewData.pelunasanPercentage}%`
                : previewData.pelunasanValue.toLocaleString('id-ID');
            dataPayload.pelunasanValue = [previewData.pelunasanValue, null]; // For L:M36
        }

        const payload = {
            action: 'updatePreviewInvoice',
            sheetName: 'Preview Invoice',
            data: dataPayload
        };

        await postData(payload);
    };

    const handleGoToPreview = async (previewData: InvoicePreviewData) => {
        try {
            await updatePreviewSheet(previewData);
            setPreviewingInvoice(previewData);
            setActiveView('invoice/preview');
        } catch (err) {
            alert('Failed to update preview sheet in Google Sheets. Please check your connection and try again.');
            console.error("Error updating preview sheet:", err);
        }
    };

  const renderContent = () => {
    if (loading && !isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-indigo-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Loading Data...</p>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                 <div className="text-center bg-red-100 dark:bg-red-900/50 p-6 rounded-lg border border-red-300 dark:border-red-700">
                    <h2 className="text-xl font-bold text-red-700 dark:text-red-300">An Error Occurred</h2>
                    <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
                 </div>
            </div>
        );
    }

    switch(activeView) {
        case 'dashboard':
            return <Dashboard invoices={invoices} />;
        case 'calendar':
            return <CalendarPage />;
        case 'products/list':
            return <ProductListPage 
                        products={products} 
                        setActiveView={setActiveView} 
                        setEditingProduct={setEditingProduct} 
                        onDeleteProduct={handleDeleteProduct} 
                        loading={loading}
                        error={error}
                    />;
        case 'products/add':
            return <AddProductPage 
                        setActiveView={setActiveView} 
                        onAddProduct={handleAddProduct} 
                        onUpdateProduct={handleUpdateProduct}
                        productToEdit={editingProduct}
                        setEditingProduct={setEditingProduct}
                        onAddSalesOrder={handleAddSalesOrder}
                        salesOrders={salesOrders}
                    />;
        case 'orders/list':
             return <OrderListPage 
                        sales={sales}
                        setActiveView={setActiveView}
                        setSelectedSale={setSelectedSale}
                        setEditingSale={setEditingSale}
                        loading={loading}
                        error={error}
                    />;
        case 'orders/detail':
            return <SalesManagementPage 
                        sales={sales}
                        selectedSale={selectedSale}
                        setActiveView={setActiveView}
                        taxInvoices={taxInvoices}
                        invoices={invoices}
                        onSaveDocument={handleSaveDocument}
                        onDeleteDocument={handleDeleteDocument}
                    />;
        case 'consumers':
            return <ConsumerPage 
                        setActiveView={setActiveView} 
                        consumers={consumers} 
                        setEditingConsumer={setEditingConsumer}
                        onDeleteConsumer={handleDeleteConsumer}
                        loading={loading}
                        error={error}
                    />;
        case 'consumers/add':
            return <AddConsumerPage 
                        setActiveView={setActiveView}
                        onAddConsumer={handleAddConsumer}
                        onUpdateConsumer={handleUpdateConsumer}
                        consumerToEdit={editingConsumer}
                        setEditingConsumer={setEditingConsumer}
                    />;
        case 'invoice-list':
            return <InvoiceListPage 
                        invoices={invoices} 
                        onDeleteInvoice={(id) => handleDeleteInvoice(id, 'Invoices')}
                        setActiveView={setActiveView}
                        setEditingInvoice={setEditingInvoice}
                        loading={loading}
                        error={error}
                    />;
        case 'invoice/add':
            return <InvoiceAddPage 
                        invoiceToEdit={editingInvoice}
                        setEditingInvoice={setEditingInvoice}
                        setActiveView={setActiveView}
                        onGoToPreview={handleGoToPreview}
                        onSave={handleSaveInvoice}
                        invoices={invoices}
                        consumers={consumers}
                        salesOrders={salesOrders}
                        products={products}
                        previewData={previewingInvoice}
                        clearPreviewData={() => setPreviewingInvoice(null)}
                    />;
        case 'invoice/preview':
            return <InvoicePreviewPage 
                        invoiceData={previewingInvoice?.invoice || null}
                        items={previewingInvoice?.items || []}
                        setActiveView={setActiveView}
                        negotiationValue={previewingInvoice?.negotiationValue}
                        dpValue={previewingInvoice?.dpValue}
                        dpPercentage={previewingInvoice?.dpPercentage}
                        pelunasanValue={previewingInvoice?.pelunasanValue}
                        pelunasanPercentage={previewingInvoice?.pelunasanPercentage}
                    />;
        case 'invoice/nomor-invoice':
            return <NomorInvoicePage 
                        setActiveView={setActiveView}
                        consumers={consumers}
                        invoices={nomorFakturInvoices}
                        onSaveInvoice={handleSaveInvoiceNumber}
                        onDeleteInvoice={(id) => handleDeleteInvoice(id, 'NOMOR FAKTUR')}
                        onBulkAddInvoices={handleBulkAddInvoices}
                        sales={sales}
                        salesOrders={salesOrders}
                    />;
        case 'tax-invoices':
            return <TaxInvoicePage taxInvoices={taxInvoices} loading={loading} error={error} />;
        case 'products/sales-order':
            return <SalesOrderPage 
                        salesOrders={salesOrders}
                        onDeleteSalesOrder={handleDeleteSalesOrder}
                        loading={loading}
                        error={error}
                    />;
        case 'orders/add':
            return <AddSalePage 
                        setActiveView={setActiveView}
                        saleToEdit={editingSale}
                        setEditingSale={setEditingSale}
                        onAddSale={handleAddSale}
                        onUpdateSale={handleUpdateSale}
                    />;
        default:
            return <Dashboard invoices={invoices} />;
    }
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className={`flex h-screen font-sans ${theme}`}>
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        language={language}
      />
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 dark:bg-slate-900">
        <Header 
          setActiveView={setActiveView}
          theme={theme}
          toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          language={language}
          toggleLanguage={() => setLanguage(language === 'en' ? 'id' : 'en')}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;