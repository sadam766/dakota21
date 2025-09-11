




import React, { useState, useRef, useEffect } from 'react';
import { 
    SearchIcon, 
    BellIcon, 
    GlobeIcon, 
    SunIcon,
    MoonIcon,
    GridIcon,
    DashboardIcon,
    CalendarIcon,
    InvoiceIcon,
    ProductIcon,
    UserIcon,
    SettingsIcon,
    QuestionMarkIcon,
    DollarSignIcon,
    LogoutIcon,
} from './icons';

interface HeaderProps {
    setActiveView: (view: string) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    language: 'en' | 'id';
    toggleLanguage: () => void;
    onLogout: () => void;
}

const AppMenuItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}> = ({ icon, label, onClick }) => (
    <a
        href="#"
        onClick={(e) => {
            e.preventDefault();
            onClick();
        }}
        className="flex flex-col items-center justify-center p-4 rounded-lg text-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
    >
        <div className="p-3 bg-gray-100 dark:bg-slate-700 rounded-lg mb-2">
            {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
    </a>
);


const Header: React.FC<HeaderProps> = ({ setActiveView, theme, toggleTheme, language, toggleLanguage, onLogout }) => {
    const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const appMenuRef = useRef<HTMLDivElement>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const translations = {
        en: {
            search: "Search...",
            shortcuts: "Shortcuts",
            quickNav: "Quickly navigate to apps",
            viewAll: "View all apps",
            dashboard: "Dashboard",
            invoices: "Invoices",
            products: "Products",
            consumers: "Consumers",
            calendar: "Calendar",
            settings: "Settings",
        },
        id: {
            search: "Cari...",
            shortcuts: "Pintasan",
            quickNav: "Navigasi cepat ke aplikasi",
            viewAll: "Lihat semua aplikasi",
            dashboard: "Dasbor",
            invoices: "Faktur",
            products: "Produk",
            consumers: "Konsumen",
            calendar: "Kalender",
            settings: "Pengaturan",
        }
    };

    const t = translations[language];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (appMenuRef.current && !appMenuRef.current.contains(event.target as Node)) {
                setIsAppMenuOpen(false);
            }
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleMenuClick = (view: string) => {
        setActiveView(view);
        setIsAppMenuOpen(false);
    };

    const handleLogout = () => {
        setIsProfileMenuOpen(false);
        onLogout();
    };

    return (
        <header className="flex shrink-0 items-center justify-between bg-white dark:bg-slate-800 px-6 h-[65px] border-b border-gray-200 dark:border-slate-700">
            {/* Left side: Search */}
            <div className="flex items-center">
                <div className="relative flex items-center">
                    <SearchIcon className="absolute left-4 w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <input
                        type="text"
                        placeholder={t.search}
                        className="pl-11 pr-4 py-2 w-64 md:w-80 rounded-md bg-gray-100/70 dark:bg-slate-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition"
                    />
                </div>
            </div>


            {/* Right side: Icons & Avatar */}
            <div className="flex items-center space-x-2 md:space-x-3">
                <button onClick={toggleLanguage} className="p-2 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-white">
                    <GlobeIcon className="w-6 h-6" />
                </button>
                <button onClick={toggleTheme} className="p-2 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-white">
                    {theme === 'light' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                </button>

                <div className="relative" ref={appMenuRef}>
                    <button onClick={() => setIsAppMenuOpen(prev => !prev)} className="p-2 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-white">
                        <GridIcon className="w-6 h-6" />
                    </button>
                    {isAppMenuOpen && (
                        <div className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-20">
                           <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                               <h4 className="font-semibold text-gray-800 dark:text-gray-200">{t.shortcuts}</h4>
                               <p className="text-sm text-gray-500 dark:text-gray-400">{t.quickNav}</p>
                           </div>
                           <div className="p-4 grid grid-cols-2 gap-2">
                               <AppMenuItem 
                                   icon={<DashboardIcon className="w-6 h-6 text-indigo-500" />} 
                                   label={t.dashboard}
                                   onClick={() => handleMenuClick('dashboard')}
                               />
                               <AppMenuItem 
                                   icon={<InvoiceIcon className="w-6 h-6 text-green-500" />} 
                                   label={t.invoices} 
                                   onClick={() => handleMenuClick('invoice-list')}
                               />
                               <AppMenuItem 
                                   icon={<ProductIcon className="w-6 h-6 text-orange-500" />} 
                                   label={t.products}
                                   onClick={() => handleMenuClick('products/list')}
                               />
                               <AppMenuItem 
                                   icon={<UserIcon className="w-6 h-6 text-red-500" />} 
                                   label={t.consumers}
                                   onClick={() => handleMenuClick('consumers')}
                               />
                               <AppMenuItem 
                                   icon={<CalendarIcon className="w-6 h-6 text-purple-500" />} 
                                   label={t.calendar}
                                   onClick={() => handleMenuClick('calendar')}
                               />
                               <AppMenuItem 
                                   icon={<SettingsIcon className="w-6 h-6 text-gray-500" />} 
                                   label={t.settings}
                                   onClick={() => handleMenuClick('settings')}
                               />
                           </div>
                           <div className="p-3 border-t border-gray-200 dark:border-slate-700 text-center">
                               <a href="#" onClick={(e) => e.preventDefault()} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">{t.viewAll}</a>
                           </div>
                        </div>
                    )}
                </div>

                <button className="relative p-2 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-white">
                    <BellIcon className="w-6 h-6" />
                    <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500"></span>
                </button>
                
                <div className="relative ml-2" ref={profileMenuRef}>
                    <button onClick={() => setIsProfileMenuOpen(prev => !prev)} className="block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full">
                        <img
                            src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                            alt="User Avatar"
                            className="w-10 h-10 rounded-full"
                        />
                        <span className="absolute bottom-0.5 right-0.5 block h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-slate-800"></span>
                    </button>

                    {isProfileMenuOpen && (
                         <div className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-20">
                            <div className="flex items-center p-4 border-b border-gray-200 dark:border-slate-700">
                                <img
                                    src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                                    alt="User Avatar"
                                    className="w-12 h-12 rounded-full"
                                />
                                <div className="ml-3">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">John Doe</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Admin</p>
                                </div>
                            </div>
                            <nav className="p-2">
                                <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md">
                                    <UserIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" /> My Profile
                                </a>
                                <a href="#" onClick={() => handleMenuClick('settings')} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md">
                                    <SettingsIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" /> Settings
                                </a>
                                <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md">
                                    <DollarSignIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" /> Pricing
                                </a>
                                <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md">
                                    <QuestionMarkIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" /> FAQ
                                </a>
                            </nav>
                            <div className="p-2 border-t border-gray-200 dark:border-slate-700">
                                <button onClick={handleLogout} className="w-full flex items-center justify-center px-3 py-2 text-white bg-red-500 hover:bg-red-600 rounded-md font-semibold">
                                    Logout <LogoutIcon className="w-5 h-5 ml-2" />
                                </button>
                            </div>
                         </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;