
import React, { useState, useEffect, FC } from 'react';
import type { CalendarEventType, CalendarEventCategory } from '../types';
import { eventCategories } from './CalendarPage';
import { XIcon, TrashIcon } from './icons';

interface AddEventDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<CalendarEventType, 'id'> & { id?: number }) => void;
    onDelete: (eventId: number) => void;
    event: CalendarEventType | null;
    selectedDate: Date;
}

const formatDateForInput = (date: Date) => {
    return date.toISOString().slice(0, 10);
};

const AddEventDrawer: FC<AddEventDrawerProps> = ({ isOpen, onClose, onSave, onDelete, event, selectedDate }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<CalendarEventCategory>('business');
    const [startDate, setStartDate] = useState(formatDateForInput(new Date()));
    const [endDate, setEndDate] = useState(formatDateForInput(new Date()));
    const [allDay, setAllDay] = useState(true);
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (event) {
            setTitle(event.title);
            setCategory(event.category);
            setStartDate(event.startDate);
            setEndDate(event.endDate);
            setAllDay(event.allDay);
            setDescription(event.description || '');
        } else {
            // New event, reset form
            const dateStr = formatDateForInput(selectedDate);
            setTitle('');
            setCategory('business');
            setStartDate(dateStr);
            setEndDate(dateStr);
            setAllDay(true);
            setDescription('');
        }
    }, [event, isOpen, selectedDate]);
    
    const handleSave = () => {
        if (!title) {
            alert('Title is required.');
            return;
        }
        onSave({
            id: event?.id,
            title,
            category,
            startDate,
            endDate,
            allDay,
            description
        });
    };

    const handleDelete = () => {
        if (event && window.confirm('Are you sure you want to delete this event?')) {
            onDelete(event.id);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div className={`relative w-screen max-w-md transform transition ease-in-out duration-500 sm:duration-700 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-slate-800 shadow-xl">
                        <div className="bg-gray-50 dark:bg-slate-900/50 px-4 py-4 sm:px-6 border-b border-gray-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100" id="slide-over-title">
                                    {event ? 'Edit Event' : 'Add Event'}
                                </h2>
                                <div className="ml-3 flex h-7 items-center">
                                    {event && (
                                         <button type="button" onClick={handleDelete} className="rounded-md bg-transparent text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 mr-4">
                                            <span className="sr-only">Delete</span>
                                            <TrashIcon className="h-6 w-6" />
                                        </button>
                                    )}
                                    <button type="button" onClick={onClose} className="rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <span className="sr-only">Close panel</span>
                                        <XIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="relative mt-6 flex-1 px-4 sm:px-6">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                                    <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                </div>

                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Calendar</label>
                                    <select id="category" value={category} onChange={e => setCategory(e.target.value as CalendarEventCategory)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                                        {eventCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 dark:[color-scheme:dark] shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                </div>
                                
                                <div>
                                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 dark:[color-scheme:dark] shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                </div>

                                <div className="flex items-center">
                                    <input id="all-day" type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="h-4 w-4 rounded border-gray-300 dark:border-slate-500 dark:bg-slate-600 text-indigo-600 focus:ring-indigo-500" />
                                    <label htmlFor="all-day" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">All Day</label>
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-shrink-0 justify-end px-4 py-4 border-t border-gray-200 dark:border-slate-700">
                            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Cancel</button>
                            <button type="button" onClick={handleSave} className="ml-4 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddEventDrawer;
