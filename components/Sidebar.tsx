

import React, { useState, useEffect } from 'react';
import type { NavItemType } from '../types';
import { DashboardIcon, ProductIcon, OrderIcon, CalendarIcon, InvoiceIcon, SettingsIcon, UserIcon, ChevronDownIcon, ChevronLeftIcon, TaxIcon } from './icons';

const navItems: NavItemType[] = [
    { id: 'dashboard', name: 'Dashboard', icon: <DashboardIcon className="w-6 h-6" /> },
    {
        id: 'invoices', name: 'Invoices', icon: <InvoiceIcon className="w-6 h-6" />,
        subItems: [
            { id: 'invoice-list', name: 'Invoice List' },
            { id: 'invoice/add', name: 'Add Invoice' },
        ]
    },
    { id: 'invoice/nomor-invoice', name: 'Invoice Number', icon: <InvoiceIcon className="w-6 h-6" /> },
    { id: 'spd', name: 'SPD', icon: <InvoiceIcon className="w-6 h-6" /> },
    { id: 'tax-invoices', name: 'TaxInvoices', icon: <TaxIcon className="w-6 h-6" /> },
    {
        id: 'products', name: 'Products', icon: <ProductIcon className="w-6 h-6" />,
        subItems: [
            { id: 'products/list', name: 'List Product' },
            { id: 'products/add', name: 'Add Product' },
        ]
    },
    { id: 'products/sales-order', name: 'SalesOrders', icon: <OrderIcon className="w-6 h-6" /> },
    {
        id: 'customers', name: 'Customers', icon: <UserIcon className="w-6 h-6" />,
        subItems: [
            { id: 'consumers', name: 'Customer List' },
            { id: 'consumers/add', name: 'Add Customer' },
        ]
    },
    {
        id: 'sales', name: 'Sales', icon: <OrderIcon className="w-6 h-6" />,
        subItems: [
            { id: 'orders/list', name: 'Sales List' },
            { id: 'orders/add', name: 'Add Sale' },
        ]
    },
    { id: 'orders/detail', name: 'Sales Management', icon: <SettingsIcon className="w-6 h-6" /> },
    { id: 'calendar', name: 'Calendar', icon: <CalendarIcon className="w-6 h-6" /> },
    { id: 'settings', name: 'Settings', icon: <SettingsIcon className="w-6 h-6" /> },
];


const translations = {
    en: {
        dashboard: 'Dashboard',
        calendar: 'Calendar',
        customers: 'Customers',
        'consumers': 'Customer List',
        'consumers/add': 'Add Customer',
        invoices: 'Invoices',
        'invoice-list': 'Invoice List',
        'invoice/add': 'Add Invoice',
        'invoice/nomor-invoice': 'Invoice Number',
        'spd': 'SPD',
        'tax-invoices': 'TaxInvoices',
        products: 'Products',
        'products/list': 'List Product',
        'products/add': 'Add Product',
        'products/sales-order': 'SalesOrders',
        sales: 'Sales',
        'orders/list': 'Sales List',
        'orders/add': 'Add Sale',
        'orders/detail': 'Sales Management',
        settings: 'Settings',
        dakota: 'Dakota',
    },
    id: {
        dashboard: 'Dasbor',
        calendar: 'Kalender',
        customers: 'Pelanggan',
        'consumers': 'Daftar Pelanggan',
        'consumers/add': 'Tambah Pelanggan',
        invoices: 'Faktur',
        'invoice-list': 'Daftar Faktur',
        'invoice/add': 'Tambah Faktur',
        'invoice/nomor-invoice': 'Nomor Faktur',
        'spd': 'SPD',
        'tax-invoices': 'Faktur Pajak',
        products: 'Produk',
        'products/list': 'Daftar Produk',
        'products/add': 'Tambah Produk',
        'products/sales-order': 'PesananPenjualan',
        sales: 'Penjualan',
        'orders/list': 'Daftar Penjualan',
        'orders/add': 'Tambah Penjualan',
        'orders/detail': 'Manajemen Penjualan',
        settings: 'Pengaturan',
        dakota: 'Dakota',
    }
};


interface NavItemProps {
    item: NavItemType;
    activeView: string;
    setActiveView: (id: string) => void;
    isSidebarCollapsed: boolean;
    language: 'en' | 'id';
    isExpanded: boolean;
    onToggle: (id: string) => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, activeView, setActiveView, isSidebarCollapsed, language, isExpanded, onToggle }) => {
    const isParent = item.subItems && item.subItems.length > 0;
    
    // An item is active if its ID matches the active view, or if it's a parent of the active view's sub-item.
    const isActive = activeView === item.id || 
                    (isParent && item.subItems!.some(sub => sub.id === activeView)) ||
                    (item.id === 'customers' && activeView.startsWith('consumers')) ||
                    (item.id === 'spd' && activeView.startsWith('spd'));
    
    const t = translations[language];

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isParent) {
            onToggle(item.id);
        } else {
            setActiveView(item.id);
        }
    };

    return (
        <li className={`my-1 ${isSidebarCollapsed ? 'px-1' : 'px-4'}`}>
            <a href="#" onClick={handleClick} className={`flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 transition-colors duration-200 ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-semibold' : ''} ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                <div className="flex-shrink-0 w-6 h-6">{item.icon}</div>
                <span className={`ml-4 whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 absolute' : 'opacity-100'}`}>{t[item.id as keyof typeof t] || item.name}</span>
                {isParent && !isSidebarCollapsed && (
                    <ChevronDownIcon className={`ml-auto w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                )}
            </a>
            {isParent && isExpanded && !isSidebarCollapsed && (
                <ul className="pl-8 mt-1 space-y-1">
                    {item.subItems?.map(subItem => (
                        <li key={subItem.id}>
                            <a href="#" onClick={(e) => { e.preventDefault(); setActiveView(subItem.id); }} className={`block p-2 rounded-md text-sm transition-colors ${activeView === subItem.id ? 'text-indigo-600 dark:text-indigo-300 font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>
                                {t[subItem.id as keyof typeof t] || subItem.name}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
};

interface SidebarProps {
    activeView: string;
    setActiveView: (view: string) => void;
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    language: 'en' | 'id';
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isSidebarCollapsed, toggleSidebar, language }) => {
    
    const findActiveParent = (activeViewId: string) => {
        if (activeViewId.startsWith('consumers')) return 'customers';
        if (activeViewId.startsWith('spd')) return 'spd';
        const parent = navItems.find(navItem => 
            navItem.subItems && navItem.subItems.some(sub => sub.id === activeViewId)
        );
        return parent ? parent.id : null;
    }

    const [openParentId, setOpenParentId] = useState<string | null>(() => findActiveParent(activeView));

    useEffect(() => {
        setOpenParentId(findActiveParent(activeView));
    }, [activeView]);

    const handleToggleParent = (itemId: string) => {
        setOpenParentId(prevId => (prevId === itemId ? null : itemId));
    };
    
    return (
        <aside className={`bg-white dark:bg-slate-800 shadow-md flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
            <div className={`flex items-center p-4 h-[65px] border-b border-gray-200 dark:border-slate-700 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                 <div className="bg-indigo-600 rounded-full p-2 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                 </div>
                 <h1 className={`text-2xl font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap transition-opacity duration-300 ml-3 ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{translations[language].dakota}</h1>
            </div>

            <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
                <ul>
                    {navItems.map((item) => (
                        <NavItem
                            key={item.id}
                            item={item}
                            activeView={activeView}
                            setActiveView={setActiveView}
                            isSidebarCollapsed={isSidebarCollapsed}
                            language={language}
                            isExpanded={openParentId === item.id}
                            onToggle={handleToggleParent}
                        />
                    ))}
                </ul>
            </nav>
            <div className="p-2 border-t border-gray-200 dark:border-slate-700">
                <button onClick={toggleSidebar} className="w-full flex items-center justify-center p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">
                    <ChevronLeftIcon className={`w-6 h-6 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : 'rotate-0'}`} />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
