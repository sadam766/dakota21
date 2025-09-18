

import React, { useState, useEffect, useMemo } from 'react';
import { MoreVerticalIcon } from './icons';
import type { SalesOrderType } from '../types';

interface TopProductsCardProps {
  salesOrders: SalesOrderType[];
}

const TopProductsCard: React.FC<TopProductsCardProps> = ({ salesOrders }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const topProducts = useMemo(() => {
        if (!salesOrders || salesOrders.length === 0) {
            return [];
        }

        const productStats: { [key: string]: { name: string; sales: number; revenue: number } } = {};

        salesOrders.forEach(order => {
            if (!productStats[order.name]) {
                productStats[order.name] = {
                    name: order.name,
                    sales: 0,
                    revenue: 0,
                };
            }
            productStats[order.name].sales += order.quantity;
            productStats[order.name].revenue += order.quantity * order.price;
        });

        return Object.values(productStats)
            .sort((a, b) => b.sales - a.sales) // Sort by most sales
            .slice(0, 4); // Get top 4
    }, [salesOrders]);

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
        if (topProducts.length === 0) {
            return <p className="text-sm text-gray-500 dark:text-gray-400">No product sales data available to display.</p>;
        }
        return (
            <div className="space-y-6">
                {topProducts.map(product => (
                    <div key={product.name} className="flex items-center space-x-4">
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