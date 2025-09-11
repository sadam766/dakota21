
import type React from 'react';

export interface NavItemType {
  id: string;
  name:string;
  icon?: React.ReactNode;
  subItems?: NavItemType[];
}

export interface StatCardType {
  title: string;
  value: string;
  trend: React.ReactNode;
  icon: React.ReactNode;
}

export interface DocumentType {
  id: string;
  soNumber?: string;
  proformaInvoiceNumber: string;
  invoiceNumber: string;
  invoiceValue: number;
  invoiceDate: string;
  taxInvoiceNumber: string;
  taxInvoiceDate: string;
  taxInvoiceStatus?: TaxInvoiceType['statusFaktur'];
  status: 'PAID' | 'UNPAID' | 'PENDING' | 'OVERDUE';
  dueDate: string;
  paymentValue: number;
  paymentDate: string;
}

export interface InvoiceType {
  id:string;
  clientName: string;
  clientAvatar: string;
  total: number;
  issuedDate: string;
  balance: number;
  status: 'Paid' | 'Pending' | 'Unpaid' | 'Draft' | 'Downloaded';
}

export interface PaymentOverviewInvoice {
  id: string;
  number: string;
  soNumber?: string;
  poNumber?: string;
  paymentTerms?: string;
  client: string;
  billToAddress?: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Unpaid' | 'Overdue' | 'Draft';
  printType?: 'Original' | 'Copy';
  taxInvoiceNumber?: string;
  taxInvoiceDate?: string;
}

export interface TaxInvoiceType {
  id: string;
  npwpPembeli: string;
  namaPembeli: string;
  kodeTransaksi: string;
  nomorFaktur: string;
  tanggalFaktur: string;
  masaPajak: number;
  tahun: number;
  statusFaktur: 'APPROVED' | 'Dibatalkan';
  hargaJualDpp: number;
  dppNilaiLain: number;
  ppn: number;
  referensi: string;
}


export interface ActivityType {
  icon: React.ReactNode;
  text: string;
  time: string;
}

export interface ProductType {
  id: string;
  image: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  unit?: string;
}

export interface SalesOrderType {
  id: string;
  soNumber: string;
  name: string;
  category: string;
  quantity: number;
  satuan: string;
  price: number;
}

export interface OrderType {
  id: string;
  customer: string;
  customer_avatar: string;
  date: string;
  total: number;
  status: 'Paid' | 'Pending' | 'Shipping' | 'Delivered' | 'Cancelled';
}

export interface ConsumerType {
  id: string;
  name: string;
  alamat: string;
  alamatSpd: string;
}

export type CalendarEventCategory = 'personal' | 'business' | 'family' | 'holiday';

export interface CalendarEventType {
  id: number;
  title: string;
  category: CalendarEventCategory;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  allDay: boolean;
  description?: string;
  time?: string; // Kept for display purposes if needed
}

export interface SalesType {
  id: string;
  soNumber: string;
  poNumber: string;
  customer: string;
  salesPerson: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Unpaid' | 'Overdue' | 'Draft';
}

export interface InvoiceItem {
  id: number;
  item: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface SearchableSalesOrder {
    id: string;
    soNumber: string;
    orderDate: string;
    referenceA?: string;
    customerId: string; 
}
export interface EstimateDocumentType {
  id: string;
  title: string;
  status: 'ACCEPTED' | 'PENDING' | 'OVERDUE';
  balanceDue: number;
  value: number;
  documentType: string;
  documentNumber: string;
  sentDate: string;
  dueDate: string;
}

// New types for the new dashboard
export interface DashboardStat {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
}

export interface SalesOverviewDataPoint {
  month: string;
  revenue: number;
  sales: number;
}

export interface RecentSale {
  id: string;
  customer: string;
  avatar: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Unpaid';
  date: string;
}

export interface TopProduct {
    id: string;
    name: string;
    image: string;
    sales: number;
    revenue: number;
}

export interface InvoicePreviewProps {
  invoiceData: PaymentOverviewInvoice | null;
  items: InvoiceItem[];
  setActiveView: (view: string) => void;
}

export interface InvoicePreviewData {
    invoice: PaymentOverviewInvoice;
    items: InvoiceItem[];
    negotiationValue: number;
    dpValue: number;
    dpPercentage: number;
    pelunasanValue: number;
    pelunasanPercentage: number;
}