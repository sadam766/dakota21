
import React, { useState, useMemo, FC, useEffect } from 'react';
import type { CalendarEventType, CalendarEventCategory, PaymentOverviewInvoice, SalesType } from '../types';
import { PlusIcon, ChevronLeftIcon, EyeIcon } from './icons';
import AddEventDrawer from './AddEventDrawer';

export const eventCategories: { id: CalendarEventCategory; label: string; color: string; dot: string }[] = [
    { id: 'business', label: 'Business', color: 'bg-blue-600', dot: 'bg-blue-500' },
    { id: 'personal', label: 'Personal', color: 'bg-red-500', dot: 'bg-red-500' },
    { id: 'family', label: 'Family', color: 'bg-yellow-500', dot: 'bg-yellow-500' },
    { id: 'holiday', label: 'Holiday', color: 'bg-green-500', dot: 'bg-green-500' },
];

const eventColorClasses: Record<string, string> = {
    upcoming: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
    overdue: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
    paid: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
};

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarPageProps {
    invoices: PaymentOverviewInvoice[];
    sales: SalesType[];
    setActiveView: (view: string) => void;
    setSelectedSale: (sale: SalesType | null) => void;
}

const CalendarPage: FC<CalendarPageProps> = ({ invoices, sales, setActiveView, setSelectedSale }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEventType[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEventType | null>(null);

    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const invoiceEvents = invoices.map((invoice): CalendarEventType | null => {
            if (!invoice.date) return null;

            const invoiceDate = new Date(invoice.date);
            if (isNaN(invoiceDate.getTime())) return null;

            // Asumsikan jatuh tempo 30 hari jika tidak ada
            const dueDate = new Date(invoiceDate);
            dueDate.setDate(dueDate.getDate() + 30);
            dueDate.setHours(0,0,0,0);

            let category: CalendarEventCategory = 'business'; // default
            if (invoice.status === 'Paid') {
                category = 'holiday'; // green
            } else if (dueDate < today) {
                category = 'personal'; // red
            } else {
                category = 'family'; // yellow
            }
            
            const eventStatus = invoice.status === 'Paid' ? 'paid' : (dueDate < today ? 'overdue' : 'upcoming');

            return {
                id: Math.random(), // ID unik
                title: `Jatuh Tempo: ${invoice.client}`,
                category: category,
                startDate: dueDate.toISOString().split('T')[0],
                endDate: dueDate.toISOString().split('T')[0],
                allDay: true,
                description: `Invoice: ${invoice.number}\nSO: ${invoice.soNumber}\nAmount: ${invoice.amount.toLocaleString('id-ID', {style: 'currency', currency: 'IDR'})}\nStatus: ${invoice.status}`,
                // Custom properties
                extendedProps: {
                    ...invoice,
                    eventStatus
                }
            };
        }).filter((event): event is CalendarEventType => event !== null);
        
        setEvents(invoiceEvents);
    }, [invoices]);

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({ key: `empty-${i}`, day: null, isCurrentMonth: false });
        }
        for (let day = 1; day <= daysInMonth; day++) {
            days.push({ key: `${year}-${month}-${day}`, day, isCurrentMonth: true, date: new Date(year, month, day) });
        }
        return days;
    }, [currentDate]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const handleToday = () => setCurrentDate(new Date());
    
    const handleViewDetails = (soNumber: string | undefined) => {
        if(!soNumber) {
            alert("Nomor Sales Order tidak ditemukan untuk invoice ini.");
            return;
        }
        const sale = sales.find(s => s.soNumber === soNumber);
        if(sale) {
            setSelectedSale(sale);
            setActiveView('orders/detail');
        } else {
            alert(`Data penjualan untuk SO ${soNumber} tidak ditemukan.`);
        }
    };


    const getEventsForDay = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.startDate <= dateStr && e.endDate >= dateStr);
    };
    
    const totalDueThisMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return events.filter(e => {
            const d = new Date(e.startDate);
            return d.getFullYear() === year && d.getMonth() === month && e.extendedProps.status !== 'Paid';
        }).reduce((sum, e) => sum + e.extendedProps.amount, 0);
    }, [events, currentDate]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 dark:bg-slate-900/50 min-h-full font-sans">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Kalender Keuangan</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Pantau jatuh tempo invoice secara visual.</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Jatuh Tempo Bulan Ini</p>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{totalDueThisMonth.toLocaleString('id-ID', {style: 'currency', currency: 'IDR'})}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200/80 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-2">
                        <button onClick={handlePrevMonth} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300">
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                         <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 w-40 text-center">
                            {currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={handleNextMonth} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300">
                            <ChevronLeftIcon className="w-6 h-6 rotate-180" />
                        </button>
                        <button onClick={handleToday} className="px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50">Hari Ini</button>
                    </div>
                     <div className="flex items-center space-x-4 text-xs">
                        <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>Jatuh Tempo</span>
                        <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>Terlambat</span>
                        <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>Lunas</span>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-slate-700 border-t border-l border-gray-200 dark:border-slate-700">
                    {weekdays.map(day => (
                        <div key={day} className="text-center py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50">
                            {day}
                        </div>
                    ))}
                    {calendarGrid.map(({ key, day, date }) => (
                        <div key={key} className="relative bg-white dark:bg-slate-800 min-h-[120px] p-2 flex flex-col">
                            {day && (
                                <>
                                    <span className={`text-sm font-semibold ${new Date().toDateString() === date?.toDateString() ? 'bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {day}
                                    </span>
                                    <div className="mt-1 space-y-1 overflow-y-auto">
                                        {getEventsForDay(day).map(event => (
                                            <div 
                                                key={event.id}
                                                title={event.description}
                                                className={`w-full text-left text-xs p-1.5 rounded-md border-l-4 truncate cursor-pointer ${eventColorClasses[event.extendedProps.eventStatus]}`}
                                                onClick={() => handleViewDetails(event.extendedProps.soNumber)}
                                            >
                                                <p className="font-semibold">{event.extendedProps.client}</p>
                                                <p>{event.extendedProps.amount.toLocaleString('id-ID')}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
