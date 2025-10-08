import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, query, where, getDocs, runTransaction, setDoc, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { db, auth } from './firebase'; // <-- DIIMPOR DARI FILE AMAN
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

const COLLECTIONS = {
    PRODUCTS: 'Products',
    SALES_ORDERS: 'SalesOrders',
    CUSTOMERS: 'Customers',
    INVOICES: 'Invoices',
    TAX_INVOICES: 'TaxInvoices',
    SALES: 'Sales',
    NOMOR_FAKTUR: 'InvoiceNumbers',
    NOMOR_SPD: 'nomorSPD',
    SALES_MANAGEMENT: 'salesManagement'
};

const mapDocToData = (doc: any) => {
  // This is a simpler and more robust way to handle data mapping.
  const data = doc.data() || {};
  for (const key of Object.keys(data)) {
      const value = data[key];
      if (value && typeof value.toDate === 'function') {
          data[key] = value.toDate().toISOString().split('T')[0];
      }
  }
  return { id: doc.id, ...data };
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
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
  
  const [isSpdModalOpen, setIsSpdModalOpen] = useState(false);
  const [invoicesForSpd, setInvoicesForSpd] = useState<PaymentOverviewInvoice[]>([]);
  const [editingSpd, setEditingSpd] = useState<PaymentOverviewInvoice | null>(null);
  const [previewingSpdDocs, setPreviewingSpdDocs] = useState<PaymentOverviewInvoice[] | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthenticated(!!user);
      if (user) {
        setActiveView('dashboard');
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);


  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out.");
    }
  };

  useEffect(() => {
    if (!currentUser) {
        // Clear all data on logout
        setProducts([]);
        setSalesOrders([]);
        setConsumers([]);
        setInvoices([]);
        setTaxInvoices([]);
        setSales([]);
        setNomorFakturInvoices([]);
        setSpdDocs([]);
        setSalesManagementDocs([]);
        setLoading(false);
        return;
    }
    
    setLoading(true);
    setError(null);

    const commonErrorHandler = (err: any, collectionName: string) => {
        const errorCode = err.code ? String(err.code) : 'unknown';
        const errorMessage = err.message ? String(err.message) : 'An unexpected error occurred.';

        console.error(`Error fetching ${collectionName}. Code: ${errorCode}. Message: ${errorMessage}`);
        
        if (errorCode === 'failed-precondition' && errorMessage.includes('index')) {
            console.error(
                `*********************************************************************************\n` +
                `** TINDAKAN DIPERLUKAN: Ada indeks Firestore yang hilang. **\n` +
                `** Untuk memperbaiki ini, cari pesan error dari Firebase di konsol di atas ini     **\n` +
                `** yang berisi URL panjang (dimulai dengan https://console.firebase.google.com...). **\n` +
                `** KLIK LINK TERSEBUT. Tab baru akan terbuka. Klik tombol "Create Index".      **\n` +
                `** Setelah beberapa menit, indeks akan dibuat dan data Anda akan muncul.     **\n` +
                `*********************************************************************************`
            );
             setError(`Gagal memuat data: Indeks Firestore tidak ditemukan. Buka konsol browser (F12) dan klik link dari Firebase untuk memperbaikinya.`);
        } else if (errorCode === 'permission-denied') {
            console.error(`** PERMISSION DENIED ** Periksa aturan keamanan Firestore Anda untuk koleksi '${collectionName}'.`);
             setError(`Gagal memuat data dari ${collectionName} karena masalah perizinan. Periksa aturan keamanan Firestore Anda.`);
        } else {
            setError(`Gagal memuat data dari ${collectionName}. Lihat konsol browser untuk detail. Kode: ${errorCode}`);
        }
        setLoading(false);
    };

    // Use onSnapshot for all collections for consistency and real-time updates
    const collectionsForSnapshot = Object.values(COLLECTIONS);
    const unsubscribers = collectionsForSnapshot.map(collectionName => {
        let q;
        const collectionsToOrderByDate = [
            COLLECTIONS.INVOICES,
            COLLECTIONS.SALES,
            COLLECTIONS.NOMOR_SPD,
            COLLECTIONS.NOMOR_FAKTUR,
        ];

        if (collectionName === COLLECTIONS.TAX_INVOICES) {
            // This query is missing a userId filter which might be a problem later, but leaving as is for now.
            q = query(collection(db, collectionName), orderBy("tanggalFaktur", "desc"));
        } else if (collectionsToOrderByDate.includes(collectionName)) {
            q = query(collection(db, collectionName), where("userId", "==", currentUser.uid), orderBy("date", "desc"));
        } else {
            q = query(collection(db, collectionName), where("userId", "==", currentUser.uid));
        }

        return onSnapshot(q, (querySnapshot) => {
            const data = querySnapshot.docs.map(mapDocToData);
            switch(collectionName) {
                case COLLECTIONS.PRODUCTS: setProducts(data as ProductType[]); break;
                case COLLECTIONS.SALES_ORDERS: setSalesOrders(data as SalesOrderType[]); break;
                case COLLECTIONS.CUSTOMERS: setConsumers(data as ConsumerType[]); break;
                case COLLECTIONS.INVOICES: setInvoices(data as PaymentOverviewInvoice[]); break;
                case COLLECTIONS.TAX_INVOICES: setTaxInvoices(data as TaxInvoiceType[]); break;
                case COLLECTIONS.SALES: setSales(data as SalesType[]); break;
                case COLLECTIONS.NOMOR_FAKTUR: setNomorFakturInvoices(data as PaymentOverviewInvoice[]); break;
                case COLLECTIONS.NOMOR_SPD: setSpdDocs(data as PaymentOverviewInvoice[]); break;
                case COLLECTIONS.SALES_MANAGEMENT: setSalesManagementDocs(data as DocumentType[]); break;
            }
            setLoading(false);
        }, (err: any) => {
            commonErrorHandler(err, collectionName);
        });
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [currentUser]);

  const handleAddProduct = async (productData: Omit<ProductType, 'id' | 'image' | 'status'>): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to add a product.");
        return false;
    }
    const newProductData = {
        ...productData,
        userId: user.uid
    };
    try {
        await addDoc(collection(db, COLLECTIONS.PRODUCTS), newProductData);
        return true;
    } catch (err: any) {
        console.error("Failed to save product:", err);
        return false;
    }
  };
  
  const handleUpdateProduct = async (updatedProduct: ProductType) => {
    const user = auth.currentUser;
    if (!user) { alert("You must be logged in."); return; }
    const { id, ...productData } = updatedProduct;
    try {
        await updateDoc(doc(db, COLLECTIONS.PRODUCTS, id), { ...productData, userId: user.uid });
    } catch (err) {
        alert('Failed to update product.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
        await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
    } catch (err) {
        alert('Failed to delete product.');
    }
  };

  const handleAddSalesOrder = async (newSalesOrder: SalesOrderType) => {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to add a sales order.");
        return;
    }
    const { id, ...data } = newSalesOrder;
    try {
        await addDoc(collection(db, COLLECTIONS.SALES_ORDERS), { ...data, userId: user.uid });
    } catch (err) {
        alert('Failed to save sales order.');
    }
  };
  
  const handleDeleteSalesOrder = async (salesOrderId: string) => {
    try {
        await deleteDoc(doc(db, COLLECTIONS.SALES_ORDERS, salesOrderId));
    } catch (err) {
        alert('Failed to delete sales order.');
    }
  };

  const handleAddConsumer = async (newConsumerData: Omit<ConsumerType, 'id'>) => {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to add a customer.");
        return;
    }
    try {
        await addDoc(collection(db, COLLECTIONS.CUSTOMERS), { ...newConsumerData, userId: user.uid });
    } catch (err) {
        alert('Failed to add consumer.');
    }
  };
  
  const handleUpdateConsumer = async (updatedConsumer: ConsumerType) => {
    const user = auth.currentUser;
    if (!user) { alert("You must be logged in."); return; }
    const { id, ...data } = updatedConsumer;
    try {
        await updateDoc(doc(db, COLLECTIONS.CUSTOMERS, id), { ...data, userId: user.uid });
    } catch (err) {
        alert('Failed to update consumer.');
    }
  };

  const handleDeleteConsumer = async (consumerId: string) => {
    try {
        await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, consumerId));
    } catch (err) {
        alert('Failed to delete consumer.');
    }
  };

  const handleAddSale = async (saleData: Omit<SalesType, 'id'>) => {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to add a sale.");
        return;
    }
    
    const dataToAdd = {
        ...saleData,
        status: 'Unpaid' as SalesType['status'],
        userId: user.uid,
        date: new Date(saleData.date),
    };

    const initialManagementDoc: Omit<DocumentType, 'id'> = {
        soNumber: saleData.soNumber,
        poNumber: saleData.poNumber,
        proformaInvoiceNumber: '',
        invoiceNumber: '',
        invoiceValue: 0,
        invoiceDate: '',
        taxInvoiceNumber: '',
        taxInvoiceDate: '',
        status: 'PENDING',
        dueDate: '',
        paymentValue: 0,
        paymentDate: '',
        userId: user.uid,
    };

    try {
        const saleRef = await addDoc(collection(db, COLLECTIONS.SALES), dataToAdd);
        await addDoc(collection(db, COLLECTIONS.SALES_MANAGEMENT), { ...initialManagementDoc, id: saleRef.id });
    } catch (err) {
        alert('Failed to save sale.');
    }
  };

  const handleUpdateSale = async (updatedSale: SalesType) => {
    const user = auth.currentUser;
    if (!user) { alert("You must be logged in."); return; }
    const { id, ...data } = updatedSale;
    const dataToUpdate = {
        ...data,
        userId: user.uid,
        date: new Date(data.date),
    };
    try {
        await updateDoc(doc(db, COLLECTIONS.SALES, id), dataToUpdate);
    } catch (err) {
        alert('Failed to update sale.');
    }
  };

  const handleSaveInvoice = async (invoiceData: PaymentOverviewInvoice, items: InvoiceItem[]) => {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to save an invoice.");
        return;
    }

    const isNew = !invoiceData.id || invoiceData.id.startsWith('new-');
    const { id, ...dataToSave } = invoiceData;
    
    const finalDataToSave = {
        ...dataToSave,
        date: new Date(dataToSave.date),
    };

    try {
        await runTransaction(db, async (transaction) => {
            const invoiceRef = isNew 
                ? doc(collection(db, COLLECTIONS.INVOICES)) 
                : doc(db, COLLECTIONS.INVOICES, id);

            if (finalDataToSave.soNumber) {
                const soQuery = query(collection(db, COLLECTIONS.SALES_ORDERS), where("soNumber", "==", finalDataToSave.soNumber));
                const soSnapshot = await getDocs(soQuery); 

                if (isNew && soSnapshot.empty && items.length > 0) {
                    throw new Error("This Sales Order has just been processed by another user. Please refresh and try again to avoid creating a duplicate invoice.");
                }

                soSnapshot.forEach(doc => transaction.delete(doc.ref));

                items.forEach(item => {
                    const newSoRef = doc(collection(db, COLLECTIONS.SALES_ORDERS));
                    transaction.set(newSoRef, {
                        soNumber: finalDataToSave.soNumber,
                        name: item.item,
                        quantity: item.quantity,
                        unit: item.unit,
                        price: item.price,
                        userId: user.uid
                    });
                });
            }

            if (isNew) {
                transaction.set(invoiceRef, { ...finalDataToSave, userId: user.uid });
            } else {
                const originalDoc = await transaction.get(invoiceRef);
                if (!originalDoc.exists()) {
                    throw new Error("Document to update does not exist.");
                }
                const originalData = originalDoc.data();
                const updatedData = { ...originalData, ...finalDataToSave, userId: user.uid };
                transaction.update(invoiceRef, updatedData);
            }
        });
        alert('Invoice saved successfully!');
    } catch (err: any) {
        console.error("Error saving invoice via transaction:", err);
        if (err.message.includes("This Sales Order has just been processed")) {
             alert(err.message);
        } else {
            alert('Failed to save invoice. The data may have been modified by another user. Please try again.');
        }
    }
};

const handleDeleteInvoice = async (invoiceId: string, sheetName: 'Invoices' | 'InvoiceNumbers') => {
    const collectionName = sheetName === 'Invoices' ? COLLECTIONS.INVOICES : COLLECTIONS.NOMOR_FAKTUR;
    try {
        await deleteDoc(doc(db, collectionName, invoiceId));
    } catch (err) {
        alert(`Failed to delete invoice from ${sheetName}.`);
    }
};

const handleSaveInvoiceNumber = async (invoiceData: Partial<PaymentOverviewInvoice>, editingInvoiceId: string | null) => {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to save an invoice number.");
        return;
    }
    const { id, ...data } = invoiceData as PaymentOverviewInvoice;

    const dataWithTimestamp = {
        ...data,
        date: data.date ? new Date(data.date) : new Date()
    };

    const createSafeId = (invoiceNumber: string) => {
        return invoiceNumber.replace(/\//g, '-');
    };

    try {
        await runTransaction(db, async (transaction) => {
            const collectionRef = collection(db, COLLECTIONS.NOMOR_FAKTUR);
            
            if (!data.number || data.number.trim() === '') {
                throw new Error("Nomor faktur tidak boleh kosong.");
            }

            const newSafeId = createSafeId(data.number);
            const isNew = !editingInvoiceId;

            if (isNew) {
                const newDocRef = doc(collectionRef, newSafeId);
                const docSnap = await transaction.get(newDocRef);

                if (docSnap.exists()) {
                    const errorMessage = `Nomor faktur "${data.number}" sudah ada. Silakan gunakan nomor lain.`;
                    throw new Error(errorMessage);
                }
                
                transaction.set(newDocRef, { ...dataWithTimestamp, status: 'Draft', userId: user.uid });

            } else { 
                const oldSafeId = editingInvoiceId;
                const oldDocRef = doc(collectionRef, oldSafeId);

                if (oldSafeId === newSafeId) {
                    transaction.update(oldDocRef, { ...dataWithTimestamp, userId: user.uid });
                
                } else {
                    const newDocRef = doc(collectionRef, newSafeId);
                    const newDocSnap = await transaction.get(newDocRef);
                    if (newDocSnap.exists()) {
                        throw new Error(`Nomor faktur "${data.number}" sudah ada. Silakan gunakan nomor lain.`);
                    }
                    
                    const oldDocSnap = await transaction.get(oldDocRef);
                    if (!oldDocSnap.exists()) {
                        throw new Error("Faktur yang ingin diubah tidak ditemukan. Mungkin sudah dihapus oleh pengguna lain.");
                    }
                    const oldData = oldDocSnap.data();
                    
                    transaction.delete(oldDocRef);
                    transaction.set(newDocRef, { ...oldData, ...dataWithTimestamp, userId: user.uid });
                }
            }
        });
        alert('Nomor faktur berhasil disimpan!');
    } catch (err: any) {
        console.error("Error saving invoice number transaction:", err);
        alert(`Gagal menyimpan: ${err.message}`);
    }
};

const handleBulkAddInvoices = async (newInvoices: any[]) => { alert("Bulk add via Firebase needs implementation."); };
const handleSaveDocument = async (docData: DocumentType) => { 
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to save a document.");
        return;
    }
    const {id, ...data} = docData;
    
    // Create a copy to modify for Firestore
    const dataToSave: { [key: string]: any } = { ...data, userId: user.uid };

    // Convert all relevant date strings to Date objects
    const dateFields: (keyof DocumentType)[] = ['invoiceDate', 'taxInvoiceDate', 'dueDate', 'paymentDate'];
    dateFields.forEach(field => {
        const dateValue = data[field];
        if (dateValue && typeof dateValue === 'string') {
            const d = new Date(dateValue);
            if (!isNaN(d.getTime())) {
                dataToSave[field] = d;
            }
        }
    });

    const docRef = doc(db, COLLECTIONS.SALES_MANAGEMENT, id);
    try {
        await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(docRef);
            if (!sfDoc.exists()) {
                transaction.set(docRef, { ...docData, ...dataToSave }); // Include original docData and converted dates
            } else {
                transaction.update(docRef, dataToSave);
            }
        });
    } catch (error) {
        console.error("Failed to save document:", error);
        alert('Failed to save document.');
    }
};

const handleDeleteDocument = async (docId: string) => { await deleteDoc(doc(db, COLLECTIONS.SALES_MANAGEMENT, docId)); };
const handleDeleteSpd = async (spdId: string) => { await deleteDoc(doc(db, COLLECTIONS.NOMOR_SPD, spdId)); };
const handleUpdateSpd = async (updatedSpd: PaymentOverviewInvoice) => { 
    const user = auth.currentUser;
    if (!user) { alert("You must be logged in."); return; }
    const { id, ...data } = updatedSpd;
    
    // Create a copy to modify for Firestore
    const dataToUpdate: { [key: string]: any } = { ...data, userId: user.uid };

    // Safely convert all potential date strings to Date objects
    const dateFields: (keyof PaymentOverviewInvoice)[] = ['date', 'invoiceDate', 'customerReceiptDate', 'dueDate'];
    dateFields.forEach(field => {
        const dateValue = data[field as keyof typeof data];
        if (dateValue && typeof dateValue === 'string') {
            const d = new Date(dateValue);
            if (!isNaN(d.getTime())) {
                dataToUpdate[field] = d;
            } else {
                console.warn(`Invalid date string for field ${field} in handleUpdateSpd: ${dateValue}`);
            }
        }
    });

    try {
        await updateDoc(doc(db, COLLECTIONS.NOMOR_SPD, id), dataToUpdate);
    } catch (err) {
        console.error("Failed to update SPD:", err);
        alert('Failed to update SPD.');
    }
};
const handleSaveSpdBatch = async (commonData: Partial<PaymentOverviewInvoice>, relatedInvoices: PaymentOverviewInvoice[]) => {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to save SPDs.");
        return;
    }
    try {
        const batch = writeBatch(db);
        
        relatedInvoices.forEach(inv => {
            const newSpdRef = doc(collection(db, COLLECTIONS.NOMOR_SPD));

            const newSpdData = {
                ...inv,
                ...commonData,
                id: newSpdRef.id,
                userId: user.uid,
                invoiceNumber: inv.number,
                invoiceDate: inv.date,
                totalPiutang: inv.amount,
            };
            
            const finalSpdDataForDB: { [key: string]: any } = { ...newSpdData };
            const dateFields = ['date', 'invoiceDate', 'customerReceiptDate', 'dueDate'];
            dateFields.forEach(key => {
                if (finalSpdDataForDB[key] && typeof finalSpdDataForDB[key] === 'string') {
                    const d = new Date(finalSpdDataForDB[key]);
                    if (!isNaN(d.getTime())) {
                        finalSpdDataForDB[key] = d;
                    }
                }
            });

            batch.set(newSpdRef, finalSpdDataForDB);
            batch.update(doc(db, COLLECTIONS.INVOICES, inv.id), { spdNumber: commonData.number });
        });
        await batch.commit();
    } catch (err) {
        console.error("Failed to save SPD batch:", err);
        alert('Failed to save SPD batch.');
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
                return <NomorInvoicePage setActiveView={setActiveView} consumers={consumers} invoices={nomorFakturInvoices} onSaveInvoice={handleSaveInvoiceNumber} onDeleteInvoice={(id) => handleDeleteInvoice(id, 'InvoiceNumbers')} onBulkAddInvoices={handleBulkAddInvoices} sales={sales} salesOrders={salesOrders} loading={loading} error={error} />;
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
    
    if (loadingAuth) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-slate-900">
          <p className="text-gray-600 dark:text-gray-300">Loading application...</p>
        </div>
      );
    }
    
    if (!isAuthenticated) {
        return <LoginPage />;
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
};

export default App;