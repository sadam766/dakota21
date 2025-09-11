import React, { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import type { TaxInvoiceType } from '../types';

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

const TotalValueCard: React.FC<{amount: number, invoices: TaxInvoiceType[]}> = ({ amount, invoices }) => {
    // Generate simple chart data based on invoice values for visual flair
    const chartData = invoices.slice(0, 10).map(inv => ({ value: inv.hargaJualDpp + inv.ppn }));

    return (
      <div className="bg-[#E7F6FD] dark:bg-sky-900/50 p-6 rounded-2xl shadow-sm relative overflow-hidden h-full flex flex-col justify-between min-h-[196px]">
        <div>
          <p className="font-semibold text-gray-800 dark:text-sky-200">Total Nilai Faktur (Filtered)</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-sky-100 my-4">{amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p>
        </div>
        {chartData.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                      <linearGradient id="taxChartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#87CEEB" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#87CEEB" stopOpacity={0}/>
                      </linearGradient>
                  </defs>
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Area type="monotone" dataKey="value" stroke="#36A2EB" strokeWidth={3} fillOpacity={1} fill="url(#taxChartGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
};

const TaxStatCard: React.FC<{ title: string, amount: string }> = ({ title, amount }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm min-h-[92px]">
    <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
    <p className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 my-2">{amount}</p>
  </div>
);

interface TaxInvoiceOverviewProps {
  taxInvoices: TaxInvoiceType[];
}

const TaxInvoiceOverview: React.FC<TaxInvoiceOverviewProps> = ({ taxInvoices }) => {
    
    const calculateTotal = (data: TaxInvoiceType[], key: keyof TaxInvoiceType, statuses?: TaxInvoiceType['statusFaktur'][]) => {
        const targetData = statuses ? data.filter(inv => statuses.includes(inv.statusFaktur)) : data;
        return targetData.reduce((sum, inv) => sum + (Number(inv[key]) || 0), 0);
    }
    
    const totalDpp = calculateTotal(taxInvoices, 'hargaJualDpp');
    const totalPpn = calculateTotal(taxInvoices, 'ppn');
    const totalValue = totalDpp + totalPpn;

    const approvalDpp = calculateTotal(taxInvoices, 'hargaJualDpp', ['APPROVED']);
    const approvalPpn = calculateTotal(taxInvoices, 'ppn', ['APPROVED']);
    const totalApproval = approvalDpp + approvalPpn;

    const { topCode, topCodeValue } = useMemo(() => {
        if (taxInvoices.length === 0) {
            return { topCode: '-', topCodeValue: 0 };
        }

        const codeCounts: Record<string, number> = taxInvoices.reduce((acc, inv) => {
            acc[inv.kodeTransaksi] = (acc[inv.kodeTransaksi] || 0) + 1;
            return acc;
        }, {});

        const topCode = Object.keys(codeCounts).reduce((a, b) => codeCounts[a] > codeCounts[b] ? a : b, '');

        const topCodeValue = taxInvoices
            .filter(inv => inv.kodeTransaksi === topCode)
            .reduce((sum, inv) => sum + inv.hargaJualDpp + inv.ppn, 0);
        
        return { topCode, topCodeValue };
    }, [taxInvoices]);


    const formatAmount = (amount: number) => amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });

    return (
        <div className="mb-8">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Ikhtisar Faktur Pajak</h2>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-[40%]">
                    <TotalValueCard amount={totalValue} invoices={taxInvoices} />
                </div>
                <div className="lg:w-[60%] grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <TaxStatCard title="Nilai Approval" amount={formatAmount(totalApproval)} />
                    <TaxStatCard title={`Nilai (Kode ${topCode})`} amount={formatAmount(topCodeValue)} />
                    <TaxStatCard title="Total DPP" amount={formatAmount(totalDpp)} />
                    <TaxStatCard title="Total PPN" amount={formatAmount(totalPpn)} />
                </div>
            </div>
        </div>
    );
};

export default TaxInvoiceOverview;