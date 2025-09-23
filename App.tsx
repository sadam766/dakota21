



import React, { useState, useEffect, useMemo } from 'react';
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
import SpdPage from './components/SpdPage.tsx';
import SpdPreviewPage from './components/SpdPreviewPage.tsx';
import type { PaymentOverviewInvoice, SalesType, InvoiceItem, ProductType, SalesOrderType, ConsumerType, TaxInvoiceType, DocumentType, InvoicePreviewData } from './types';
import AddSalePage from './components/AddSalePage.tsx';
import InvoicePreviewPage from './components/InvoicePreviewPage.tsx';
import LoginPage from './components/LoginPage.tsx';
import AddSpdModal from './components/AddSpdModal.tsx';
import MonitoringPage from './components/MonitoringPage.tsx';

export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxfE7lZgkXkmhY47B8Q-Vnzcu7dnqeSBm991sdm6kbtu7h9pB5ZLCg-vFOZu7NfD6OvzA/exec';

const findValueByKey = (obj: any, targetKey: string): any => {
    if (!obj || typeof obj !== 'object') return undefined;
    const normalize = (str: string) => (str || '').toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const normalizedTargetKey = normalize(targetKey);
    const key = Object.keys(obj).find(k => normalize(k) === normalizedTargetKey);
    return key ? obj[key] : undefined;
};

const mapSheetDataToInvoice = (sheetRow: any): PaymentOverviewInvoice => ({
    id: sheetRow.id,
    number: String(sheetRow['NUMBER'] || ''),
    client: String(sheetRow['CLIENT'] || ''),
    soNumber: String(findValueByKey(sheetRow, 'SO Number') || findValueByKey(sheetRow, 'SO') || findValueByKey(sheetRow, 'sales order') || ''),
    date: parseSheetDate(sheetRow['DATE']),
    amount: Number(sheetRow['AMOUNT']) || 0,
    status: String(sheetRow['STATUS'] || 'Draft') as PaymentOverviewInvoice['status'],
    billToAddress: String(sheetRow['ALAMAT'] || ''),
    poNumber: String(sheetRow.poNumber || ''),
    paymentTerms: String(sheetRow.paymentTerms || ''),
    printType: String(sheetRow.printType || 'Original') as 'Original' | 'Copy',
    taxInvoiceNumber: String(sheetRow.taxInvoiceNumber || ''),
    taxInvoiceDate: parseSheetDate(sheetRow.taxInvoiceDate),
    createdBy: String(findValueByKey(sheetRow, 'PEMBUAT INVOICE') || findValueByKey(sheetRow, 'PEMBUAT') || ''),
    spdNumber: String(sheetRow['Nomor SPD'] || ''),
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
    'Nomor SPD': invoice.spdNumber,
    'SO Number': invoice.soNumber,
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
    spdNumber: String(sheetRow['Nomor SPD'] || ''),
});

const mapNomorFakturToSheetData = (invoice: PaymentOverviewInvoice) => ({
    id: invoice.id,
    'NOMOR FAKTUR': invoice.number,
    'PELANGGAN': invoice.client,
    'SALES ORDER/SO': invoice.soNumber,
    'TANGGAL': invoice.date,
    'JUMLAH': invoice.amount,
    'PEMBUAT INVOICE': invoice.createdBy,
    'Nomor SPD': invoice.spdNumber,
});

const mapSheetDataToSpd = (sheetRow: any): PaymentOverviewInvoice => ({
    id: sheetRow.id || `spd-${Date.now()}-${Math.random()}`,
    number: String(sheetRow['SPD'] || sheetRow['NOMOR SPD'] || ''),
    client: String(sheetRow['customer'] || sheetRow['PELANGGAN'] || ''),
    date: parseSheetDate(sheetRow['Tanggal']),
    sales: String(sheetRow['sales'] || ''),
    invoiceNumber: String(sheetRow['No Invoice'] || ''),
    invoiceDate: parseSheetDate(sheetRow['Tanggal Invoice']),
    customerReceiptDate: parseSheetDate(sheetRow['Tanggal Terima Customer']),
    dueDate: parseSheetDate(sheetRow['Tanggal Jatuh Tempo']),
    totalPiutang: Number(sheetRow['Total Piutang'] || sheetRow['JUMLAH'] || 0),
    keterangan: String(sheetRow['Keterangan'] || ''),
    soNumber: String(sheetRow['SO'] || sheetRow['SALES ORDER/SO'] || sheetRow['No. SO.'] || ''),
    amount: Number(sheetRow['JUMLAH'] || sheetRow['Total Piutang'] || 0),
    status: 'Draft',
    createdBy: String(findValueByKey(sheetRow, 'PEMBUAT') || ''),
    noKuitansi: String(sheetRow['NO. KUITANSI'] || ''),
    noFakturPajak: String(sheetRow['NO. FAKTUR PAJAK'] || ''),
    suratJalan: String(sheetRow['SURAT JALAN'] || sheetRow['NO. SURAT JALAN'] || ''),
});

const mapSpdToSheetData = (spd: PaymentOverviewInvoice) => ({
    id: spd.id,
    'Tanggal': spd.date,
    'SO': spd.soNumber,
    'sales': spd.sales,
    'customer': spd.client,
    'SPD': spd.number,
    'No Invoice': spd.invoiceNumber,
    'Tanggal Invoice': spd.invoiceDate,
    'Tanggal Terima Customer': spd.customerReceiptDate,
    'Tanggal Jatuh Tempo': spd.dueDate,
    'Total Piutang': spd.totalPiutang,
    'Keterangan': spd.keterangan,
    'NO. KUITANSI': spd.noKuitansi,
    'NO. FAKTUR PAJAK': spd.noFakturPajak,
    'SURAT JALAN': spd.suratJalan,
    'PEMBUAT': spd.createdBy,
});

const parseSheetDate = (sheetDate: any): string => {
    if (sheetDate === null || sheetDate === undefined || sheetDate === '') return '';
    if (typeof sheetDate === 'number') {
        const jsTimestamp = (sheetDate - 25569) * 86400 * 1000 + (12 * 60 * 60 * 1000);
        const serialDate = new Date(jsTimestamp);
        const day = String(serialDate.getUTCDate()).padStart(2, '0');
        const month = String(serialDate.getUTCMonth() + 1).padStart(2, '0');
        const year = serialDate.getUTCFullYear();
        return `${year}-${month}-${day}`;
    }
    const d = new Date(sheetDate);
    if (isNaN(d.getTime())) {
        return String(sheetDate);
    }
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
    if (masaPajak === undefined && tanggalFakturStr) {
        const dateParts = tanggalFakturStr.split('-');
        if (dateParts.length === 3) {
            const monthFromDate = parseInt(dateParts[1], 10);
            if (!isNaN(monthFromDate)) {
                masaPajak = monthFromDate;
            }
        }
    }
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
        image: '',
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
    date: parseSheetDate(sheetRow.date) || new Date().toISOString().split('T')[0],
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

const mapDocumentToSalesManagementSheetData = (doc: DocumentType & { customer?: string, salesPerson?: string }) => ({
    id: doc.id,
    'NUMBER SO': doc.soNumber || '',
    'CUSTOMER': doc.customer || '',
    'SALES': doc.salesPerson || '',
    'NO. PO': doc.poNumber || '',
    'NO INVOICE': doc.invoiceNumber || '',
    'NILAI INVOICE': doc.invoiceValue || 0,
    'TANGGAL INVOICE': doc.invoiceDate || '',
    'NO. FAKTUR PAJAK': doc.taxInvoiceNumber || '',
    'TANGGAL FAKTUR PAJAK': doc.taxInvoiceDate || '',
    'STATUS': doc.status || '',
    'JATUH TEMPO INVOICE': doc.dueDate || '',
    'NILAI PEMBAYARAN': doc.paymentValue || 0,
    'TANGGAL PEMBAYARAN': doc.paymentDate || '',
});

const mapSheetDataToSalesManagementDocument = (sheetRow: any): DocumentType => ({
    id: findValueByKey(sheetRow, 'id') || '',
    soNumber: findValueByKey(sheetRow, 'NUMBER SO') || '',
    poNumber: findValueByKey(sheetRow, 'NO. PO') || '',
    invoiceNumber: findValueByKey(sheetRow, 'NO INVOICE') || '',
    invoiceValue: Number(findValueByKey(sheetRow, 'NILAI INVOICE')) || 0,
    invoiceDate: parseSheetDate(findValueByKey(sheetRow, 'TANGGAL INVOICE')),
    taxInvoiceNumber: findValueByKey(sheetRow, 'NO. FAKTUR PAJAK') || '',
    taxInvoiceDate: parseSheetDate(findValueByKey(sheetRow, 'TANGGAL FAKTUR PAJAK')),
    status: (findValueByKey(sheetRow, 'STATUS') || 'PENDING') as DocumentType['status'],
    dueDate: parseSheetDate(findValueByKey(sheetRow, 'JATUH TEMPO INVOICE')),
    paymentValue: Number(findValueByKey(sheetRow, 'NILAI PEMBAYARAN')) || 0,
    paymentDate: parseSheetDate(findValueByKey(sheetRow, 'TANGGAL PEMBAYARAN')),
    proformaInvoiceNumber: '', // Not in sheet, default to empty
});

const saleToInitialDocument = (sale: SalesType): DocumentType => {
    const statusMap: { [key in SalesType['status']]: DocumentType['status'] } = {
        'Paid': 'PAID',
        'Unpaid': 'UNPAID',
        'Pending': 'PENDING',
        'Overdue': 'OVERDUE',
        'Draft': 'PENDING'
    };

    return {
        id: sale.id,
        soNumber: sale.soNumber,
        poNumber: sale.poNumber,
        proformaInvoiceNumber: '',
        invoiceNumber: '',
        invoiceValue: 0,
        invoiceDate: '',
        taxInvoiceNumber: '',
        taxInvoiceDate: '',
        status: statusMap[sale.status] || 'PENDING',
        dueDate: '',
        paymentValue: 0,
        paymentDate: '',
    };
};


// FIX: Corrected the component declaration to be a valid functional component.
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

  const [products, setProducts] = useState<ProductType[]>([]);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [salesOrders, setSalesOrders] = useState<SalesOrderType[]>([]);
  const [consumers, setConsumers] = useState<ConsumerType[]>([]);
  const [editingConsumer, setEditingConsumer] = useState<ConsumerType | null>(null);
  const [invoices, setInvoices] = useState<PaymentOverviewInvoice[]>([]);
  const [nomorFakturInvoices, setNomorFakturInvoices] = useState<PaymentOverviewInvoice[]>([]);
  const [taxInvoices, setTaxInvoices] = useState<TaxInvoiceType[]>([]);
  const [sales, setSales] = useState<SalesType[]>([]);
  const [spdDocs, setSpdDocs] = useState<PaymentOverviewInvoice[]>([]);
  const [salesManagementDocs, setSalesManagementDocs] = useState<DocumentType[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // SPD Modal State
  const [isSpdModalOpen, setIsSpdModalOpen] = useState(false);
  const [invoicesForSpd, setInvoicesForSpd] = useState<PaymentOverviewInvoice[]>([]);
  const [editingSpd, setEditingSpd] = useState<PaymentOverviewInvoice | null>(null);
  const [previewingSpdDocs, setPreviewingSpdDocs] = useState<PaymentOverviewInvoice[] | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };


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
            const productsPromise = fetchData('Products');
            const salesOrdersPromise = fetchData('SalesOrders');
            const consumersPromise = fetchData('Customers');
            const taxInvoicesPromise = fetchData('TaxInvoices');
            const nomorFakturPromise = fetchData('NOMOR FAKTUR');
            const spdPromise = fetchData('NOMOR SPD');
            const salesManagementPromise = fetchData('Sales Management');

            const salesPromise = fetchData('Sales').catch(error => {
                console.error("Failed to fetch Sales data. The app will continue without it.", error);
                return []; 
            });
            
            const invoicesPromise = fetchData('Invoices').catch(error => {
                console.error("Failed to fetch Invoices data. The app will continue without it.", error);
                return []; 
            });

            const [
                productsData, 
                salesOrdersData, 
                consumersData, 
                invoicesData, 
                taxInvoicesData, 
                salesData, 
                nomorFakturData, 
                spdData,
                salesManagementData
            ] = await Promise.all([
                productsPromise,
                salesOrdersPromise,
                consumersPromise,
                invoicesPromise,
                taxInvoicesPromise,
                salesPromise,
                nomorFakturPromise,
                spdPromise,
                salesManagementPromise,
            ]);

            const mappedInvoices = invoicesData.map(mapSheetDataToInvoice);
            const mappedSpds = spdData.map(mapSheetDataToSpd).filter((doc: PaymentOverviewInvoice) => doc.number || doc.client);

            setProducts(productsData.map(mapSheetDataToProduct));
            setSalesOrders(salesOrdersData.map(mapSheetDataToSalesOrder));
            setConsumers(consumersData.map(mapSheetDataToConsumer));
            setInvoices(mappedInvoices);
            setNomorFakturInvoices(nomorFakturData.map(mapSheetDataToNomorFaktur));
            setTaxInvoices(taxInvoicesData.map(mapSheetDataToTaxInvoice));
            setSales(salesData.map(mapSheetDataToSale));
            setSpdDocs(mappedSpds);
            setSalesManagementDocs(salesManagementData.map(mapSheetDataToSalesManagementDocument));


        } catch (err: any) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    fetchAllData();
  }, []);

  const postData = async (payload: object) => {
    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  };


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
        status: 'Unpaid', // New sales are Unpaid by default
    };

    // [PERBAIKAN] Buat entri dasar untuk Sales Management
    const initialManagementDoc = saleToInitialDocument(newSale);

    // Optimistic UI updates
    setSales(prev => [newSale, ...prev]);
    setSalesManagementDocs(prev => [initialManagementDoc, ...prev]);

    try {
        // 1. Simpan ke sheet 'Sales'
        const salePromise = postData({
            action: 'create',
            sheetName: 'Sales',
            data: mapSaleToSheetData(newSale)
        });

        // 2. Simpan entri dasar ke sheet 'Sales Management'
        const managementPromise = postData({
            action: 'create',
            sheetName: 'Sales Management',
            data: mapDocumentToSalesManagementSheetData({
                ...initialManagementDoc,
                customer: newSale.customer,
                salesPerson: newSale.salesPerson
            })
        });

        await Promise.all([salePromise, managementPromise]);
        
    } catch (err) {
        alert('Gagal menyimpan data penjualan ke semua sheet. Mengembalikan perubahan.');
        // Revert both states on failure
        setSales(prev => prev.filter(s => s.id !== newSale.id));
        setSalesManagementDocs(prev => prev.filter(d => d.id !== initialManagementDoc.id));
    }
};


const handleUpdateSale = async (updatedSale: SalesType) => {
    const originalSales = [...sales];
    const originalSalesManagementDocs = [...salesManagementDocs];
    
    // Optimistically update the main sales list
    setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));

    const salePromise = postData({ 
        action: 'update', 
        sheetName: 'Sales', 
        id: updatedSale.id, 
        data: mapSaleToSheetData(updatedSale) 
    });

    const managementDoc = originalSalesManagementDocs.find(d => d.id === updatedSale.id);
    const promises = [salePromise];

    // ONLY if a corresponding record already exists in Sales Management, update it too.
    // This will NOT create a new record in Sales Management from this page.
    if (managementDoc) {
        const updatedDocForSheet = {
            ...managementDoc,
            soNumber: updatedSale.soNumber,
            poNumber: updatedSale.poNumber,
            customer: updatedSale.customer, 
            salesPerson: updatedSale.salesPerson 
        };
        
        // Optimistically update the UI for the management doc
        setSalesManagementDocs(prev => prev.map(d => d.id === updatedSale.id ? updatedDocForSheet : d));
        
        const managementPromise = postData({
            action: 'update',
            sheetName: 'Sales Management',
            id: updatedSale.id,
            data: mapDocumentToSalesManagementSheetData(updatedDocForSheet),
        });
        promises.push(managementPromise);
    }

    try {
        await Promise.all(promises);
    } catch (err) {
        alert('Gagal memperbarui penjualan. Mengembalikan perubahan.');
        setSales(originalSales);
        // Only revert management docs if they were part of the update attempt
        if (managementDoc) {
            setSalesManagementDocs(originalSalesManagementDocs);
        }
    }
};


const handleSaveInvoice = async (invoiceData: PaymentOverviewInvoice, items: InvoiceItem[]) => {
    const finalInvoiceData = {
        ...invoiceData,
        billToAddress: invoiceData.client && consumers.find(c => c.name === invoiceData.client)?.alamat || invoiceData.billToAddress || '',
    };

    const isNew = finalInvoiceData.id.startsWith('new-');
    const tempId = isNew ? `inv-${Date.now()}` : finalInvoiceData.id;

    const optimisticInvoice = {
        ...finalInvoiceData,
        id: tempId,
        number: isNew ? 'Generating...' : finalInvoiceData.number,
    };

    const originalInvoices = [...invoices];
    const originalSalesOrders = [...salesOrders];

    if (isNew) {
        setInvoices(prev => [optimisticInvoice, ...prev]);
    } else {
        setInvoices(prev => prev.map(inv => inv.id === optimisticInvoice.id ? optimisticInvoice : inv));
    }

    let newSOItemsForState: SalesOrderType[] = [];
    if (finalInvoiceData.soNumber) {
      const otherSOItems = originalSalesOrders.filter(so => so.soNumber !== finalInvoiceData.soNumber);
      newSOItemsForState = items.map(item => ({
          id: `so-${Date.now()}-${Math.random()}`,
          soNumber: finalInvoiceData.soNumber!,
          name: item.item,
          category: products.find(p => p.name === item.item)?.category || 'Unknown',
          quantity: item.quantity,
          satuan: item.unit,
          price: item.price
      }));
      setSalesOrders([...otherSOItems, ...newSOItemsForState]);
    }

    try {
        const payloadForBackend = {
            ...finalInvoiceData,
            id: tempId,
            number: isNew ? 'AUTO_GENERATE' : finalInvoiceData.number,
        };
        
        const response = await postData({ 
            action: isNew ? 'create' : 'update', 
            sheetName: 'Invoices', 
            id: payloadForBackend.id, 
            data: mapInvoiceToSheetData(payloadForBackend) 
        });

        if (!response.success) throw new Error(response.message || 'Backend error on saving invoice');

        let finalInvoice = payloadForBackend;
        if (isNew && response.data) {
            finalInvoice = mapSheetDataToInvoice(response.data);
            setInvoices(prev => prev.map(inv => inv.id === tempId ? { ...finalInvoice, id: tempId } : inv));
        }
        
        let invoiceWithId = { ...finalInvoice, id: tempId };
        let soNumberToUse = invoiceWithId.soNumber;

        if (soNumberToUse) {
            await postData({ action: 'deleteBySoNumber', sheetName: 'SalesOrders', soNumber: soNumberToUse });
            const createPromises = newSOItemsForState.map(soItem => 
                postData({ action: 'create', sheetName: 'SalesOrders', data: mapSalesOrderToSheetData(soItem) })
            );
            await Promise.all(createPromises);
        }
        
        // Continue with Sales Management update logic
        if (soNumberToUse) {
            const originalSalesManagementDocs = [...salesManagementDocs];
            const saleForManagement = sales.find(s => s.soNumber === soNumberToUse);

            if (saleForManagement) {
                const managementDoc = originalSalesManagementDocs.find(d => d.id === saleForManagement.id);
                const action = managementDoc ? 'update' : 'create';
                const statusMap: { [key in PaymentOverviewInvoice['status']]: DocumentType['status'] } = {
                    'Paid': 'PAID', 'Unpaid': 'UNPAID', 'Pending': 'PENDING', 'Overdue': 'OVERDUE', 'Draft': 'PENDING'
                };
                const baseDoc = managementDoc || saleToInitialDocument(saleForManagement);
                const updatedManagementDoc: DocumentType = {
                    ...baseDoc,
                    poNumber: saleForManagement.poNumber || invoiceWithId.poNumber || baseDoc.poNumber,
                    invoiceNumber: invoiceWithId.number,
                    invoiceValue: invoiceWithId.amount,
                    invoiceDate: invoiceWithId.date,
                    taxInvoiceNumber: invoiceWithId.taxInvoiceNumber || baseDoc.taxInvoiceNumber || '',
                    taxInvoiceDate: invoiceWithId.taxInvoiceDate || baseDoc.taxInvoiceDate || '',
                    status: statusMap[invoiceWithId.status] || baseDoc.status,
                    paymentValue: invoiceWithId.status === 'Paid' ? invoiceWithId.amount : (baseDoc.paymentValue || 0),
                    paymentDate: invoiceWithId.status === 'Paid' ? invoiceWithId.date : (baseDoc.paymentDate || ''),
                };
                
                if (action === 'update') {
                    setSalesManagementDocs(prev => prev.map(doc => doc.id === updatedManagementDoc.id ? updatedManagementDoc : doc));
                } else {
                    setSalesManagementDocs(prev => [...prev, updatedManagementDoc]);
                }
                
                try {
                    await postData({
                        action: action,
                        sheetName: 'Sales Management',
                        id: updatedManagementDoc.id,
                        data: mapDocumentToSalesManagementSheetData({
                            ...updatedManagementDoc,
                            customer: saleForManagement.customer,
                            salesPerson: saleForManagement.salesPerson,
                        }),
                    });
                } catch (err) {
                    alert('Invoice saved, but failed to automatically update Sales Management record. Reverting changes.');
                    setSalesManagementDocs(originalSalesManagementDocs);
                }
            } else {
                console.warn(`Could not find a matching sale for SO: ${soNumberToUse}. Sales Management was not updated.`);
            }
        }

    } catch (err) {
        alert('Failed to save invoice and/or item details. Reverting changes.');
        setInvoices(originalInvoices);
        setSalesOrders(originalSalesOrders);
    }
};

    // FIX: Changed the type of `invoiceData` to be less restrictive to avoid a subtle type error.
    const handleSaveInvoiceNumber = async (invoiceData: Partial<PaymentOverviewInvoice>, editingInvoiceId: string | null) => {
        if (editingInvoiceId) {
            const originalNomorFakturInvoices = [...nomorFakturInvoices];
            const originalInvoices = [...invoices];
    
            const oldInvoice = nomorFakturInvoices.find(inv => inv.id === editingInvoiceId);
            if (!oldInvoice) {
                alert("Error: could not find invoice to update.");
                return;
            }
    
            const updatedInvoice: PaymentOverviewInvoice = {
                ...oldInvoice,
                ...invoiceData,
                // FIX: Replaced non-null assertion `!` with a safer access pattern using `??` to avoid potential runtime errors and resolve a complex type inference issue.
                billToAddress: consumers.find(c => c.name === (invoiceData.client ?? oldInvoice.client))?.alamat || oldInvoice.billToAddress || '',
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
            const tempId = `inv-num-${Date.now()}`;
            // FIX: The `billToAddress` property was potentially being assigned `undefined`, which caused a type error.
            // By using the nullish coalescing operator `??` and providing a fallback `''`, we ensure it's always a string, satisfying the type.
            const optimisticInvoice: PaymentOverviewInvoice = {
                id: tempId,
                status: 'Draft',
                ...invoiceData,
                client: invoiceData.client ?? '',
                number: 'Generating...',
                billToAddress: consumers.find(c => c.name === (invoiceData.client ?? ''))?.alamat ?? (invoiceData.billToAddress ?? ''),
                createdBy: 'System (Nomor Faktur)',
                date: invoiceData.date ?? new Date().toISOString().split('T')[0],
                amount: invoiceData.amount ?? 0,
            };
            
            setNomorFakturInvoices(prev => [optimisticInvoice, ...prev]);
            setInvoices(prev => [optimisticInvoice, ...prev]);
    
            try {
                const payloadForBackend = { ...optimisticInvoice, number: 'AUTO_GENERATE' };
                const response1 = await postData({ action: 'create', sheetName: 'NOMOR FAKTUR', data: mapNomorFakturToSheetData(payloadForBackend) });
                if (!response1.success || !response1.data) throw new Error("Failed to create in NOMOR FAKTUR");
                
                const createdFakturInvoice = mapSheetDataToNomorFaktur(response1.data);
                
                const response2 = await postData({ action: 'create', sheetName: 'Invoices', data: mapInvoiceToSheetData({ ...createdFakturInvoice, id: tempId }) });
                 if (!response2.success || !response2.data) throw new Error("Failed to create in Invoices");

                const createdMainInvoice = mapSheetDataToInvoice(response2.data);
                
                setNomorFakturInvoices(prev => prev.map(inv => inv.id === tempId ? { ...createdFakturInvoice, id: tempId } : inv));
                setInvoices(prev => prev.map(inv => inv.id === tempId ? { ...createdMainInvoice, id: tempId } : inv));
                
            } catch (err) {
                alert('Failed to add invoice number to both sheets. Reverting changes.');
                setNomorFakturInvoices(prev => prev.filter(inv => inv.id !== tempId));
                setInvoices(prev => prev.filter(inv => inv.id !== tempId));
            }
        }
    };
  
    const handleBulkAddInvoices = async (newInvoices: any[]) => {
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
              number: 'AUTO_GENERATE', // Let backend handle numbering
              client: saleInfo.customer,
              soNumber: saleInfo.soNumber,
              date: saleInfo.date,
              amount: saleInfo.amount,
              status: 'Draft',
              billToAddress: consumers.find(c => c.name === saleInfo.customer)?.alamat || '',
              createdBy: 'Bulk Import',
          };
          processedInvoices.push(newInvoice);
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
        
        // Optimistically add with a placeholder number
        const optimisticInvoices = processedInvoices.map(p => ({ ...p, number: "Importing..." }));
        setNomorFakturInvoices(prev => [...optimisticInvoices, ...prev]);
        setInvoices(prev => [...optimisticInvoices, ...prev]);
    
        try {
            for (const invoice of processedInvoices) {
                // The backend will generate the number and save to both sheets.
                // NOTE: This assumes backend logic is updated to write to BOTH sheets when receiving a 'NOMOR FAKTUR' action.
                // A safer, more explicit approach would be two separate calls, using the result from the first to inform the second.
                // However, for minimal changes, we'll keep the two calls as they were.
                await postData({ action: 'create', sheetName: 'NOMOR FAKTUR', data: mapNomorFakturToSheetData(invoice) });
                await postData({ action: 'create', sheetName: 'Invoices', data: mapInvoiceToSheetData(invoice) });
            }
            let successMessage = `${processedInvoices.length} invoices were sent for creation! Please refresh to see the generated numbers.`;
            if (unprocessedSOs.length > 0) {
                successMessage += `\nCould not process the following SOs (not found): ${unprocessedSOs.join(', ')}.`;
            }
            alert(successMessage);
            // Since we can't easily update the UI with specific numbers in a bulk operation without a more complex backend response,
            // we'll just clear the optimistic placeholders. A full refresh would be better, but this avoids showing "Importing..." forever.
            setNomorFakturInvoices(prev => prev.filter(p => !p.number.includes("Importing...")));
            setInvoices(prev => prev.filter(p => !p.number.includes("Importing...")));

        } catch (err) {
            console.error('Failed to save bulk invoices:', err);
            alert('An error occurred while saving the invoices. Reverting changes.');
            setNomorFakturInvoices(originalNomorFakturInvoices);
            setInvoices(originalInvoices);
        }
    };

    const handleSaveDocument = async (doc: DocumentType) => {
    const toStorageDate = (dateStr: string) => {
        if (!dateStr || !dateStr.includes('/')) return dateStr;
        const parts = dateStr.split('/');
        if (parts.length === 3) {
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
            poNumber: doc.poNumber,
            soNumber: doc.soNumber,
          } 
        : {
            id: doc.id,
            number: doc.invoiceNumber,
            client: selectedSale?.customer || '',
            soNumber: doc.soNumber,
            poNumber: doc.poNumber,
            date: toStorageDate(doc.invoiceDate),
            amount: doc.invoiceValue,
            status: statusMap[doc.status],
            taxInvoiceNumber: doc.taxInvoiceNumber,
            taxInvoiceDate: toStorageDate(doc.taxInvoiceDate),
            createdBy: 'System (Document Save)',
        };

      const isNewInvoice = !existingInvoice;
      const originalInvoices = [...invoices];
      const originalSalesManagementDocs = [...salesManagementDocs];

      if (isNewInvoice) {
          setInvoices(prev => [finalInvoice, ...prev]);
      } else {
          setInvoices(prev => prev.map(inv => inv.id === finalInvoice.id ? finalInvoice : inv));
      }
      
      const salesManagementData: DocumentType & { customer?: string, salesPerson?: string } = {
          ...doc,
          customer: selectedSale?.customer || '',
          salesPerson: selectedSale?.salesPerson || '',
      };
      
      const salesManagementRecordExists = salesManagementDocs.some(d => d.id === finalInvoice.id);

      if (salesManagementRecordExists) {
        setSalesManagementDocs(prev => prev.map(d => d.id === finalInvoice.id ? salesManagementData : d));
      } else {
        setSalesManagementDocs(prev => [...prev, salesManagementData]);
      }

      try {
          // Save to Invoices sheet
          await postData({ action: isNewInvoice ? 'create' : 'update', sheetName: 'Invoices', id: finalInvoice.id, data: mapInvoiceToSheetData(finalInvoice) });
          
          // Save to Sales Management sheet
          await postData({
              action: salesManagementRecordExists ? 'update' : 'create',
              sheetName: 'Sales Management',
              id: finalInvoice.id,
              data: mapDocumentToSalesManagementSheetData(salesManagementData),
          });

      } catch (err) {
          alert('Failed to save document to all sheets. Reverting changes.');
          setInvoices(originalInvoices);
          setSalesManagementDocs(originalSalesManagementDocs);
      }
  };

    const handleDeleteInvoice = async (invoiceId: string, sheetName: 'Invoices' | 'NOMOR FAKTUR') => {
        const originalInvoices = [...invoices];
        const originalNomorFakturInvoices = [...nomorFakturInvoices];
        const originalSalesManagementDocs = [...salesManagementDocs];
    
        let invoiceToDelete: PaymentOverviewInvoice | undefined;
        let correspondingInvoice: PaymentOverviewInvoice | undefined;
        let correspondingSheet: 'Invoices' | 'NOMOR FAKTUR';
        let mainSheet: 'Invoices' | 'NOMOR FAKTUR';
    
        if (sheetName === 'Invoices') {
            invoiceToDelete = invoices.find(inv => inv.id === invoiceId);
            mainSheet = 'Invoices';
            correspondingSheet = 'NOMOR FAKTUR';
        } else {
            invoiceToDelete = nomorFakturInvoices.find(inv => inv.id === invoiceId);
            mainSheet = 'NOMOR FAKTUR';
            correspondingSheet = 'Invoices';
        }

        if (!invoiceToDelete) return;

        if (sheetName === 'Invoices') {
            correspondingInvoice = nomorFakturInvoices.find(inv => inv.number === invoiceToDelete!.number);
        } else {
            correspondingInvoice = invoices.find(inv => inv.number === invoiceToDelete!.number);
        }

        // Optimistic UI updates
        setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete?.id && inv.id !== correspondingInvoice?.id));
        setNomorFakturInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete?.id && inv.id !== correspondingInvoice?.id));

        const managementDocToDelete = salesManagementDocs.find(doc => doc.id === invoiceToDelete?.id || doc.invoiceNumber === invoiceToDelete?.number);
        if(managementDocToDelete) {
            setSalesManagementDocs(prev => prev.filter(d => d.id !== managementDocToDelete.id));
        }
        
        try {
            const deletePromises = [];
            if (invoiceToDelete) {
                deletePromises.push(postData({ action: 'delete', sheetName: mainSheet, id: invoiceToDelete.id }));
            }
            if (correspondingInvoice) {
                deletePromises.push(postData({ action: 'delete', sheetName: correspondingSheet, id: correspondingInvoice.id }));
            }
            if (managementDocToDelete) {
                deletePromises.push(postData({ action: 'delete', sheetName: 'Sales Management', id: managementDocToDelete.id }));
            }
            
            await Promise.all(deletePromises);
        } catch (err: any) {
            console.error("Delete invoice failed:", err);
            alert(`Failed to delete invoice: ${err.message}. Reverting changes.`);
            setInvoices(originalInvoices);
            setNomorFakturInvoices(originalNomorFakturInvoices);
            setSalesManagementDocs(originalSalesManagementDocs);
        }
    };
    
// FIX: Add missing handler functions and render logic
    const handleDeleteSpd = async (spdId: string) => {
        const originalSpds = [...spdDocs];
        const spdToDel = originalSpds.find(s => s.id === spdId);
        if (!spdToDel || !spdToDel.number) {
            alert("SPD to delete not found or has no number.");
            return;
        }
        const originalInvoices = [...invoices];
        const relatedInvoicesToUpdate = originalInvoices.filter(inv => inv.spdNumber === spdToDel.number);

        setSpdDocs(prev => prev.filter(s => s.id !== spdId));
        setInvoices(prev => prev.map(inv => inv.spdNumber === spdToDel.number ? {...inv, spdNumber: ''} : inv));

        try {
            const deletePromise = postData({ action: 'delete', sheetName: 'NOMOR SPD', id: spdId });
            const updatePromises = relatedInvoicesToUpdate.map(inv => {
                const updatedInv = {...inv, spdNumber: ''};
                return postData({
                    action: 'update',
                    sheetName: 'Invoices',
                    id: inv.id,
                    data: mapInvoiceToSheetData(updatedInv)
                });
            });
            await Promise.all([deletePromise, ...updatePromises]);
        } catch (err: any) {
            console.error("Delete SPD failed:", err);
            alert(`Failed to delete SPD: ${err.message}. Reverting changes.`);
            setSpdDocs(originalSpds);
            setInvoices(originalInvoices);
        }
    };

    const handleUpdateSpd = async (updatedSpd: PaymentOverviewInvoice) => {
        const originalSpds = [...spdDocs];
        setSpdDocs(prev => prev.map(s => s.id === updatedSpd.id ? updatedSpd : s));
        try {
            await postData({ action: 'update', sheetName: 'NOMOR SPD', id: updatedSpd.id, data: mapSpdToSheetData(updatedSpd) });
        } catch (err) {
            alert('Failed to update SPD. Reverting changes.');
            setSpdDocs(originalSpds);
        }
    };

    const handleSaveSpdBatch = async (commonData: Partial<PaymentOverviewInvoice>, relatedInvoices: PaymentOverviewInvoice[]) => {
        const originalSpds = [...spdDocs];
        const originalInvoices = [...invoices];

        const newSpdDocs: PaymentOverviewInvoice[] = relatedInvoices.map(inv => {
            const saleInfo = sales.find(s => s.soNumber === inv.soNumber);
            const invoiceDate = new Date(inv.date);
            const dueDate = new Date(invoiceDate.setDate(invoiceDate.getDate() + 30)).toISOString().split('T')[0];

            return {
                ...commonData,
                id: `spd-${Date.now()}-${Math.random()}`,
                client: inv.client,
                soNumber: inv.soNumber,
                invoiceNumber: inv.number,
                invoiceDate: inv.date,
                totalPiutang: inv.amount,
                amount: inv.amount,
                dueDate: dueDate,
                sales: saleInfo?.salesPerson || commonData.sales,
                createdBy: 'System (SPD Batch)',
                status: 'Draft',
            } as PaymentOverviewInvoice;
        });

        const updatedInvoices: PaymentOverviewInvoice[] = relatedInvoices.map(inv => ({ ...inv, spdNumber: commonData.number || '' }));
        
        setSpdDocs(prev => [...newSpdDocs, ...prev]);
        setInvoices(prev => prev.map(inv => updatedInvoices.find(u => u.id === inv.id) || inv));

        try {
            const createSpdPromises = newSpdDocs.map(spd => postData({ action: 'create', sheetName: 'NOMOR SPD', data: mapSpdToSheetData(spd) }));
            const updateInvoicePromises = updatedInvoices.map(inv => postData({ action: 'update', sheetName: 'Invoices', id: inv.id, data: mapInvoiceToSheetData(inv) }));
            await Promise.all([...createSpdPromises, ...updateInvoicePromises]);
        } catch (err) {
            alert('Failed to save SPDs and update invoices. Reverting changes.');
            setSpdDocs(originalSpds);
            setInvoices(originalInvoices);
        }
    };
    
    const handleDeleteDocument = async (docId: string) => {
      const originalDocs = [...salesManagementDocs];
      setSalesManagementDocs(prev => prev.filter(d => d.id !== docId));
      try {
          await postData({ action: 'delete', sheetName: 'Sales Management', id: docId });
      } catch (err) {
          alert('Failed to delete document. Reverting changes.');
          setSalesManagementDocs(originalDocs);
      }
    };

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                return <Dashboard invoices={invoices} salesOrders={salesOrders} products={products} consumers={consumers} />;
            case 'calendar':
                return <CalendarPage invoices={invoices} sales={sales} setActiveView={setActiveView} setSelectedSale={setSelectedSale} />;
            case 'products/list':
                return <ProductListPage products={products} setActiveView={setActiveView} setEditingProduct={setEditingProduct} onDeleteProduct={handleDeleteProduct} loading={loading} error={error} />;
            case 'products/add':
                return <AddProductPage setActiveView={setActiveView} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} productToEdit={editingProduct} setEditingProduct={setEditingProduct} onAddSalesOrder={handleAddSalesOrder} salesOrders={salesOrders} />;
            case 'products/sales-order':
                return <SalesOrderPage salesOrders={salesOrders} onDeleteSalesOrder={handleDeleteSalesOrder} loading={loading} error={error} />;
            case 'consumers':
                return <ConsumerPage setActiveView={setActiveView} consumers={consumers} setEditingConsumer={setEditingConsumer} onDeleteConsumer={handleDeleteConsumer} loading={loading} error={error} />;
            case 'consumers/add':
                return <AddConsumerPage setActiveView={setActiveView} onAddConsumer={handleAddConsumer} onUpdateConsumer={handleUpdateConsumer} consumerToEdit={editingConsumer} setEditingConsumer={setEditingConsumer} />;
            case 'orders/list':
                return <OrderListPage sales={sales} salesManagementDocs={salesManagementDocs} setActiveView={setActiveView} setSelectedSale={setSelectedSale} setEditingSale={setEditingSale} loading={loading} error={error} />;
            case 'orders/add':
                return <AddSalePage setActiveView={setActiveView} saleToEdit={editingSale} setEditingSale={setEditingSale} onAddSale={handleAddSale} onUpdateSale={handleUpdateSale} consumers={consumers} sales={sales} salesOrders={salesOrders} />;
            case 'orders/detail':
                return <SalesManagementPage sales={sales} selectedSale={selectedSale} setActiveView={setActiveView} taxInvoices={taxInvoices} invoices={invoices} onSaveDocument={handleSaveDocument} onDeleteDocument={handleDeleteDocument} />;
            case 'monitoring':
                return <MonitoringPage sales={sales} invoices={invoices} taxInvoices={taxInvoices} spdDocs={spdDocs} setActiveView={setActiveView} setSelectedSale={setSelectedSale} />;
            case 'invoice-list':
                return <InvoiceListPage invoices={invoices} onDeleteInvoice={(id) => handleDeleteInvoice(id, 'Invoices')} setActiveView={setActiveView} setEditingInvoice={setEditingInvoice} onInitiateSpdCreation={(invoices) => { setInvoicesForSpd(invoices); setIsSpdModalOpen(true); }} loading={loading} error={error} />;
            case 'invoice/add':
                return <InvoiceAddPage invoiceToEdit={editingInvoice} setEditingInvoice={setEditingInvoice} setActiveView={setActiveView} onGoToPreview={(data) => { setPreviewingInvoice(data); setActiveView('invoice/preview'); }} onSave={handleSaveInvoice} invoices={invoices} consumers={consumers} salesOrders={salesOrders} products={products} previewData={previewingInvoice} clearPreviewData={() => setPreviewingInvoice(null)} />;
            case 'invoice/preview':
                return <InvoicePreviewPage invoiceData={previewingInvoice?.invoice || null} items={previewingInvoice?.items || []} setActiveView={setActiveView} negotiationValue={previewingInvoice?.negotiationValue} dpValue={previewingInvoice?.dpValue} dpPercentage={previewingInvoice?.dpPercentage} pelunasanValue={previewingInvoice?.pelunasanValue} pelunasanPercentage={previewingInvoice?.pelunasanPercentage} />;
            case 'invoice/nomor-invoice':
                return <NomorInvoicePage setActiveView={setActiveView} consumers={consumers} invoices={nomorFakturInvoices} onSaveInvoice={handleSaveInvoiceNumber} onDeleteInvoice={(id) => handleDeleteInvoice(id, 'NOMOR FAKTUR')} onBulkAddInvoices={handleBulkAddInvoices} sales={sales} salesOrders={salesOrders} />;
            case 'tax-invoices':
                return <TaxInvoicePage taxInvoices={taxInvoices} loading={loading} error={error} />;
            case 'spd':
                return <SpdPage spds={spdDocs} onEditSpd={(spd) => { setEditingSpd(spd); setIsSpdModalOpen(true); }} onDeleteSpd={handleDeleteSpd} onPreviewSpd={(docs) => { setPreviewingSpdDocs(docs); setActiveView('spd/preview'); }} />;
            case 'spd/preview':
                return <SpdPreviewPage spdDocs={previewingSpdDocs || []} consumers={consumers} setActiveView={setActiveView} />;
            default:
                return <Dashboard invoices={invoices} salesOrders={salesOrders} products={products} consumers={consumers} />;
        }
    };

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
    const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'id' : 'en');
    
    if (!isAuthenticated) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-slate-900 font-sans">
            <Sidebar
                activeView={activeView}
                setActiveView={setActiveView}
                isSidebarCollapsed={isSidebarCollapsed}
                toggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
                language={language}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    setActiveView={setActiveView}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    language={language}
                    toggleLanguage={toggleLanguage}
                    onLogout={handleLogout}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    {renderContent()}
                    {isSpdModalOpen && (
                        <AddSpdModal
                            isOpen={isSpdModalOpen}
                            onClose={() => {
                                setIsSpdModalOpen(false);
                                setEditingSpd(null);
                            }}
                            onSaveBatch={handleSaveSpdBatch}
                            onSaveSingle={handleUpdateSpd}
                            consumers={consumers}
                            invoicesForCreation={invoicesForSpd}
                            spdToEdit={editingSpd}
                            sales={sales}
                            allInvoices={invoices}
                            taxInvoices={taxInvoices}
                            spds={spdDocs}
                        />
                    )}
                </main>
            </div>
        </div>
    );
// FIX: Added missing closing braces for the function and component.
};

export default App;