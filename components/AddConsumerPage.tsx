

import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon } from './icons';
import type { ConsumerType } from '../types';

interface AddConsumerPageProps {
  setActiveView: (view: string) => void;
  onAddConsumer: (consumerData: Omit<ConsumerType, 'id'>) => void;
  onUpdateConsumer: (consumerData: ConsumerType) => void;
  consumerToEdit: ConsumerType | null;
  setEditingConsumer: (consumer: ConsumerType | null) => void;
}

const AddConsumerPage: React.FC<AddConsumerPageProps> = ({ setActiveView, onAddConsumer, onUpdateConsumer, consumerToEdit, setEditingConsumer }) => {
  const [name, setName] = useState('');
  const [alamat, setAlamat] = useState('');
  const [alamatSpd, setAlamatSpd] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const DRAFT_KEY = 'customerFormDraft';

  useEffect(() => {
    if (consumerToEdit) {
      setIsEditing(true);
      setName(consumerToEdit.name);
      setAlamat(consumerToEdit.alamat);
      setAlamatSpd(consumerToEdit.alamatSpd);
      localStorage.removeItem(DRAFT_KEY);
    } else {
      setIsEditing(false);
      const savedDraftRaw = localStorage.getItem(DRAFT_KEY);
      if (savedDraftRaw) {
        try {
          const savedDraft = JSON.parse(savedDraftRaw);
          setName(savedDraft.name || '');
          setAlamat(savedDraft.alamat || '');
          setAlamatSpd(savedDraft.alamatSpd || '');
        } catch (e) {
          console.error("Failed to parse customer draft", e);
          localStorage.removeItem(DRAFT_KEY);
          setName('');
          setAlamat('');
          setAlamatSpd('');
        }
      } else {
        setName('');
        setAlamat('');
        setAlamatSpd('');
      }
    }
  }, [consumerToEdit]);

  useEffect(() => {
    if (!isEditing) {
      const draft = { name, alamat, alamatSpd };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [name, alamat, alamatSpd, isEditing]);


  const handleCancel = () => {
    setEditingConsumer(null);
    localStorage.removeItem(DRAFT_KEY);
    setActiveView('consumers');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !alamat || !alamatSpd) {
      alert("Please fill out all fields.");
      return;
    }
    
    setIsSubmitting(true);
    try {
        if (isEditing && consumerToEdit) {
            onUpdateConsumer({ id: consumerToEdit.id, name, alamat, alamatSpd });
            alert(`Customer "${name}" has been updated.`);
        } else {
            onAddConsumer({ name, alamat, alamatSpd });
            alert(`Customer "${name}" has been added.`);
        }
        localStorage.removeItem(DRAFT_KEY);
        setActiveView('consumers');
    } catch (error) {
        alert('An error occurred. Please try again.');
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="p-8 bg-gray-50 dark:bg-slate-900 min-h-full">
      <div className="flex items-center mb-6">
        <button onClick={handleCancel} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 mr-2">
            <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{isEditing ? 'Edit Customer' : 'Add New Customer'}</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400 mt-1 mb-8 ml-10">{isEditing ? `Editing customer: ${consumerToEdit?.name}` : 'Fill in the details below to add a new customer.'}</p>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name</label>
                    <input 
                        type="text" 
                        id="customer-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200" 
                        placeholder="e.g., PT Maju Mundur" 
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="billing-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alamat (Billing Address)</label>
                    <textarea 
                        id="billing-address" 
                        rows={3}
                        value={alamat}
                        onChange={(e) => setAlamat(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200" 
                        placeholder="Enter customer's billing address"
                        required
                    ></textarea>
                </div>
                 <div>
                    <label htmlFor="shipping-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alamat SPD (Shipping Address)</label>
                    <textarea 
                        id="shipping-address" 
                        rows={3} 
                        value={alamatSpd}
                        onChange={(e) => setAlamatSpd(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200" 
                        placeholder="Enter customer's shipping address"
                        required
                    ></textarea>
                </div>

                <div className="pt-6 flex justify-end space-x-3">
                    <button type="button" onClick={handleCancel} className="px-6 py-2 rounded-md bg-gray-100 dark:bg-slate-600 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800">
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Save Customer')}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AddConsumerPage;