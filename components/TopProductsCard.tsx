

import React, { useState, useEffect } from 'react';
import { MoreVerticalIcon } from './icons';

const TopProductsCard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Mock data to match the image exactly
    const products = [
        { id: '1', name: 'Modern Desk Lamp', sales: 120, revenue: 60000 },
        { id: '2', name: 'Ergonomic Chair', sales: 85, revenue: 170000 },
        { id: '3', name: 'Wireless Keyboard', sales: 250, revenue: 12500 },
        { id: '4', name: '4K Monitor', sales: 50, revenue: 250000 },
    ];

    useEffect(() => {
        setLoading(false);
    }, []);

    const renderSkeleton = () => (
        <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-1/2"></div>
                    </div>
                    <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-20 animate-pulse"></div>
                </div>
            ))}
        </div>
    );

    const renderContent = () => {
        if (loading) {
            return renderSkeleton();
        }
        if (error) {
            return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
        }
        return (
            <div className="space-y-6">
                {products.map(product => (
                    <div key={product.id} className="flex items-center space-x-4">
                        <div className="flex-1">
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{product.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{product.sales} sales</p>
                        </div>
                        <p className="font-bold text-gray-800 dark:text-gray-200">Rp {product.revenue.toLocaleString('id-ID')}</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200/80 dark:border-slate-700 h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Top Products</h3>
                <button className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                    <MoreVerticalIcon className="w-5 h-5" />
                </button>
            </div>
            {renderContent()}
        </div>
    );
};

export default TopProductsCard;