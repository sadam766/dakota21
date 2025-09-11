import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import type { PaymentOverviewInvoice } from '../types';

// Simplified Tooltip for the chart
const ChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-lg border border-gray-100 dark:border-slate-700">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {payload[0].value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
        </p>
      </div>
    );
  }
  return null;
};

const TotalInvoicesCard: React.FC<{amount: number, invoices: PaymentOverviewInvoice[]}> = ({ amount, invoices }) => {
    // Generate simple chart data based on invoice amounts for visual flair
    const chartData = invoices.slice(0, 10).map(inv => ({ value: inv.amount }));

    return (
      <div className="bg-[#E7F6FD] dark:bg-sky-900/50 p-6 rounded-2xl shadow-sm relative overflow-hidden h-full flex flex-col justify-between min-h-[196px]">
        <div>
          <p className="font-semibold text-gray-800 dark:text-sky-200">Total (Filtered)</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-sky-100 my-4">{amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p>
        </div>
        {chartData.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#87CEEB" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#87CEEB" stopOpacity={0}/>
                      </linearGradient>
                  </defs>
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Area type="monotone" dataKey="value" stroke="#36A2EB" strokeWidth={3} fillOpacity={1} fill="url(#chartGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
};

const OverviewStatCard: React.FC<{ title: string, amount: string }> = ({ title, amount }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm min-h-[92px]">
    <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
    <p className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 my-2">{amount}</p>
  </div>
);

interface PaymentOverviewProps {
  invoices: PaymentOverviewInvoice[];
}

const PaymentOverview: React.FC<PaymentOverviewProps> = ({ invoices }) => {
    
    const calculateTotalAmount = (data: PaymentOverviewInvoice[], statuses?: PaymentOverviewInvoice['status'][]) => {
        const targetData = statuses ? data.filter(inv => statuses.includes(inv.status)) : data;
        return targetData.reduce((sum, inv) => sum + inv.amount, 0);
    }
    
    const totalAmount = calculateTotalAmount(invoices);
    const paidAmount = calculateTotalAmount(invoices, ['Paid']);
    const unpaidAmount = calculateTotalAmount(invoices, ['Unpaid']);
    const pendingAmount = calculateTotalAmount(invoices, ['Pending', 'Draft']);
    const overdueAmount = calculateTotalAmount(invoices, ['Overdue']);

    const formatAmount = (amount: number) => amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });

    return (
        <div className="mb-8">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Payment Overview</h2>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-[40%]">
                    <TotalInvoicesCard amount={totalAmount} invoices={invoices} />
                </div>
                <div className="lg:w-[60%] grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <OverviewStatCard title="Paid" amount={formatAmount(paidAmount)} />
                    <OverviewStatCard title="Unpaid" amount={formatAmount(unpaidAmount)} />
                    <OverviewStatCard title="Pending / Draft" amount={formatAmount(pendingAmount)} />
                    <OverviewStatCard title="Overdue" amount={formatAmount(overdueAmount)} />
                </div>
            </div>
        </div>
    );
};

export default PaymentOverview;