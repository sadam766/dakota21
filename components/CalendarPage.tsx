import React, { useState, useMemo, FC, useEffect } from 'react';
import type { CalendarEventType, CalendarEventCategory } from '../types';
import { PlusIcon, ChevronLeftIcon } from './icons';
import AddEventDrawer from './AddEventDrawer';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxfE7lZgkXkmhY47B8Q-Vnzcu7dnqeSBm991sdm6kbtu7h9pB5ZLCg-vFOZu7NfD6OvzA/exec";

export const eventCategories: { id: CalendarEventCategory; label: string; color: string; dot: string }[] = [
    { id: 'business', label: 'Business', color: 'bg-blue-600', dot: 'bg-blue-500' },
    { id: 'personal', label: 'Personal', color: 'bg-red-500', dot: 'bg-red-500' },
    { id: 'family', label: 'Family', color: 'bg-yellow-500', dot: 'bg-yellow-500' },
    { id: 'holiday', label: 'Holiday', color: 'bg-green-500', dot: 'bg-green-500' },
];

const eventColorClasses: Record<CalendarEventCategory, string> = {
    personal: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
    business: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
    family: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
    holiday: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
};


const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarPage: FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEventType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEventType | null>(null);
    const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState(new Date());

    useEffect(() => {
        setLoading(true);
        // Mock fetching events
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth();
        const mockEvents: CalendarEventType[] = [
            { id: 1, title: 'Team Meeting', category: 'business', startDate: `${y}-${String(m+1).padStart(2,'0')}-15`, endDate: `${y}-${String(m+1).padStart(2,'0')}-15`, allDay: false, time: '10:00 AM' },
            { id: 2, title: 'Doctor Appointment', category: 'personal', startDate: `${y}-${String(m+1).padStart(2,'0')}-18`, endDate: `${y}-${String(m+1).padStart(2,'0')}-18`, allDay: true },
            { id: 3, title: 'Family Dinner', category: 'family', startDate: `${y}-${String(m+1).padStart(2,'0')}-20`, endDate: `${y}-${String(m+1).padStart(2,'0')}-20`, allDay: false, time: '7:00 PM' },
            { id: 4, title: 'National Holiday', category: 'holiday', startDate: `${y}-${String(m+1).padStart(2,'0')}-04`, endDate: `${y}-${String(m+1).padStart(2,'0')}-04`, allDay: true },
            { id: 5, title: 'Project Deadline', category: 'business', startDate: `${y}-${String(m+1).padStart(2,'0')}-25`, endDate: `${y}-${String(m+1).padStart(2,'0')}-25`, allDay: true },
        ];
        setEvents(mockEvents);
        setLoading(false);
    }, []);

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

    const handleAddEvent = (date: Date) => {
        setSelectedEvent(null);
        setSelectedDateForNewEvent(date);
        setIsDrawerOpen(true);
    };

    const handleEventClick = (event: CalendarEventType) => {
        setSelectedEvent(event);
        setIsDrawerOpen(true);
    };

    const handleSaveEvent = (eventData: Omit<CalendarEventType, 'id'> & { id?: number }) => {
        if (eventData.id) { // Editing existing event
            setEvents(events.map(e => e.id === eventData.id ? { ...e, ...eventData } as CalendarEventType : e));
        } else { // Adding new event
            const newEvent: CalendarEventType = {
                ...eventData,
                id: Date.now()
            };
            setEvents([...events, newEvent]);
        }
        setIsDrawerOpen(false);
        setSelectedEvent(null);
    };
    
    const handleDeleteEvent = (eventId: number) => {
        setEvents(events.filter(e => e.id !== eventId));
        setIsDrawerOpen(false);
        setSelectedEvent(null);
    };

    const getEventsForDay = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.startDate <= dateStr && e.endDate >= dateStr);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 dark:bg-slate-900/50 min-h-full font-sans">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Calendar</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your schedule and events.</p>
                </div>
                <button onClick={() => handleAddEvent(new Date())} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 text-sm shadow-sm">
                    <PlusIcon className="w-5 h-5" />
                    <span>Create Event</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200/80 dark:border-slate-700">
                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-2">
                        <button onClick={handlePrevMonth} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300">
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                         <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 w-40 text-center">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={handleNextMonth} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300">
                            <ChevronLeftIcon className="w-6 h-6 rotate-180" />
                        </button>
                        <button onClick={handleToday} className="px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50">Today</button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-slate-700 border-t border-l border-gray-200 dark:border-slate-700">
                    {/* Weekday headers */}
                    {weekdays.map(day => (
                        <div key={day} className="text-center py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50">
                            {day}
                        </div>
                    ))}
                    {/* Day cells */}
                    {calendarGrid.map(({ key, day, date }) => (
                        <div key={key} className="relative bg-white dark:bg-slate-800 min-h-[120px] p-2 flex flex-col">
                            {day && (
                                <>
                                    <span className={`text-sm font-semibold ${new Date().toDateString() === date?.toDateString() ? 'bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {day}
                                    </span>
                                    <div className="mt-1 space-y-1 overflow-y-auto">
                                        {getEventsForDay(day).map(event => (
                                            <button 
                                                key={event.id} 
                                                onClick={() => handleEventClick(event)} 
                                                className={`w-full text-left text-xs p-1.5 rounded-md border-l-4 truncate ${eventColorClasses[event.category]}`}
                                            >
                                                <span className="font-semibold">{event.title}</span>
                                                {!event.allDay && <span className="ml-1 opacity-80">{event.time}</span>}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <AddEventDrawer 
                isOpen={isDrawerOpen}
                onClose={() => { setIsDrawerOpen(false); setSelectedEvent(null); }}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                event={selectedEvent}
                selectedDate={selectedDateForNewEvent}
            />
        </div>
    );
};

export default CalendarPage;