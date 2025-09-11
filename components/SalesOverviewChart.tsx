
import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import type { PaymentOverviewInvoice } from '../types';
import { ChevronDownIcon } from './icons';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-100 dark:border-slate-700">
        <p className="font-bold text-gray-800 dark:text-gray-200">{label}</p>
        <p className="text-sm text-indigo-500 dark:text-indigo-400">{`Revenue: ${payload[0].value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}`}</p>
        <p className="text-sm" style={{color: '#26A69A'}}>{`Sales: ${payload[1].value}`}</p>
      </div>
    );
  }
  return null;
};

type FilterPeriod = 'today' | 'this_month' | 'this_year' | 'last_12_months';

const SalesOverviewChart: React.FC<{ invoices: PaymentOverviewInvoice[] }> = ({ invoices }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterPeriod>('last_12_months');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filterOptions: { id: FilterPeriod, label: string }[] = [
        { id: 'today', label: 'Hari Ini' },
        { id: 'this_month', label: 'Bulan Ini' },
        { id: 'this_year', label: 'Tahun Ini' },
        { id: 'last_12_months', label: '12 Bulan Terakhir' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setLoading(true);

        if (!invoices) {
            setData([]);
            setLoading(false);
            return;
        }

        const now = new Date();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let chartData: any[] = [];
        
        const validInvoices = invoices.filter(inv => inv.date && !isNaN(new Date(inv.date).getTime()));
        
        if (filter === 'last_12_months') {
            const monthlyData: { [key: string]: { revenue: number, sales: number } } = {};
            const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            validInvoices.forEach(invoice => {
                const date = new Date(invoice.date);
                if (date >= startDate && date <= endDate) {
                    const monthIndex = date.getMonth();
                    const year = date.getFullYear();
                    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
                    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, sales: 0 };
                    monthlyData[key].revenue += invoice.amount;
                    monthlyData[key].sales += 1;
                }
            });

            for (let i = 0; i < 12; i++) {
                const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
                const monthIndex = date.getMonth();
                const year = date.getFullYear();
                const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
                chartData.push({
                    label: monthNames[monthIndex],
                    revenue: monthlyData[key]?.revenue || 0,
                    sales: monthlyData[key]?.sales || 0,
                });
            }
        } else if (filter === 'this_year') {
            const monthlyData: { [key: string]: { revenue: number, sales: number } } = {};
            const currentYear = now.getFullYear();

            validInvoices.forEach(invoice => {
                const date = new Date(invoice.date);
                if (date.getFullYear() === currentYear) {
                    const monthIndex = date.getMonth();
                    const key = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}`;
                    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, sales: 0 };
                    monthlyData[key].revenue += invoice.amount;
                    monthlyData[key].sales += 1;
                }
            });

            for (let i = 0; i < 12; i++) {
                const key = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
                chartData.push({
                    label: monthNames[i],
                    revenue: monthlyData[key]?.revenue || 0,
                    sales: monthlyData[key]?.sales || 0,
                });
            }
        } else if (filter === 'this_month') {
            const dailyData: { [key: string]: { revenue: number, sales: number } } = {};
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

            validInvoices.forEach(invoice => {
                const date = new Date(invoice.date);
                if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
                    const day = date.getDate();
                    const key = `${day}`;
                    if (!dailyData[key]) dailyData[key] = { revenue: 0, sales: 0 };
                    dailyData[key].revenue += invoice.amount;
                    dailyData[key].sales += 1;
                }
            });
            
            for (let i = 1; i <= daysInMonth; i++) {
                chartData.push({
                    label: `${i}`,
                    revenue: dailyData[`${i}`]?.revenue || 0,
                    sales: dailyData[`${i}`]?.sales || 0,
                });
            }
        } else if (filter === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            const todaysInvoices = validInvoices.filter(inv => inv.date === todayStr);
            const totalRevenue = todaysInvoices.reduce((sum, inv) => sum + inv.amount, 0);
            const totalSales = todaysInvoices.length;

            chartData.push({
                label: 'Today',
                revenue: totalRevenue,
                sales: totalSales
            });
        }
        
        setData(chartData);
        setLoading(false);
    }, [invoices, filter]);

    const handleFilterChange = (newFilter: FilterPeriod) => {
        setFilter(newFilter);
        setIsDropdownOpen(false);
    };

    const currentFilterLabel = filterOptions.find(f => f.id === filter)?.label;

    const formatYAxis = (value: number) => {
        if (value >= 1_000_000_000) {
            return `Rp${(value / 1_000_000_000).toFixed(1)}M`;
        }
        if (value >= 1_000_000) {
            return `Rp${(value / 1_000_000).toFixed(0)}jt`;
        }
        if (value >= 1_000) {
            return `Rp${(value / 1_000).toFixed(0)}rb`;
        }
        return `Rp${value}`;
    };

    const renderContent = () => {
        if (loading) {
            return <div className="h-[350px] w-full bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>;
        }
        if (data.length === 0) {
            return <div className="h-[350px] flex items-center justify-center text-gray-500 dark:text-gray-400">No data available for this period.</div>
        }
        return (
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-slate-700" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} strokeWidth={0} className="fill-gray-500 dark:fill-gray-400" dy={10} />
                <YAxis yAxisId="left" orientation="left" strokeWidth={0} tick={{ fontSize: 12 }} tickFormatter={formatYAxis} className="fill-gray-500 dark:fill-gray-400" />
                <YAxis yAxisId="right" orientation="right" strokeWidth={0} tick={{ fontSize: 12 }} className="fill-gray-500 dark:fill-gray-400" />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(238,242,255,0.5)' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} formatter={(value, entry) => <span className="text-gray-700 dark:text-gray-300 capitalize">{value}</span>} />
                <Bar yAxisId="left" dataKey="revenue" fill="#5C6BC0" name="Revenue" barSize={30} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="sales" stroke="#26A69A" name="Sales" strokeWidth={3} dot={{ r: 5, strokeWidth: 2, stroke: '#26A69A', fill: '#fff' }} activeDot={{ r: 7 }} />
              </ComposedChart>
            </ResponsiveContainer>
        );
    }
  
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200/80 dark:border-slate-700">
        <div className="flex flex-wrap justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Sales Overview</h3>
            <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsDropdownOpen(prev => !prev)} className="flex items-center space-x-2 px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600">
                    <span>{currentFilterLabel}</span>
                    <ChevronDownIcon className="w-4 h-4" />
                </button>
                {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-10">
                        {filterOptions.map(option => (
                             <button 
                                key={option.id}
                                onClick={() => handleFilterChange(option.id)} 
                                className={`w-full text-left px-4 py-2 text-sm ${filter === option.id ? 'font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-700' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                             >
                                {option.label}
                             </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
        {renderContent()}
      </div>
    );
};

export default SalesOverviewChart;
