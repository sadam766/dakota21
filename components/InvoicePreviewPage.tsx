import React from 'react';
import type { InvoicePreviewProps } from '../types'; // Assuming types.ts is in the parent directory
import { ChevronLeftIcon, PrintIcon, ExportIcon } from './icons';

declare const XLSX: any;
declare const html2pdf: any;

// Define the new props for negotiation and down payment
// This is a placeholder since I don't have access to your types file.
// You should add these to your existing InvoicePreviewProps interface.
interface ExtendedInvoicePreviewProps extends InvoicePreviewProps {
  negotiationValue?: number;
  dpValue?: number;
  dpPercentage?: number;
  pelunasanValue?: number;
  pelunasanPercentage?: number;
}

const InvoicePreviewPage: React.FC<ExtendedInvoicePreviewProps> = ({ invoiceData, items, setActiveView, negotiationValue = 0, dpValue = 0, dpPercentage = 0, pelunasanValue = 0, pelunasanPercentage = 0 }) => {

  if (!invoiceData || !items) {
    return (
      <div className="bg-gray-100 dark:bg-slate-900 min-h-screen p-4 flex flex-col items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">Tidak ada data invoice untuk pratinjau.</p>
        <button
          onClick={() => setActiveView && setActiveView('invoice/add')}
          className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 mr-2" />
          Kembali ke Editor
        </button>
      </div>
    );
  }
  
  const ITEMS_PER_PAGE = 10;
  const itemPages = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    itemPages.push(items.slice(i, i + ITEMS_PER_PAGE));
  }


  const invoiceTitle = invoiceData.number?.startsWith('KW/') ? 'PROFORMA INVOICE' : 'INVOICE/OFFICIAL RECEIPT';

  // Helper function to format currency to Indonesian locale
  const formatCurrency = (value: number) => {
    return value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Helper function to format date from YYYY-MM-DD to DD-MM-YYYY
  const formatDate = (dateString: string) => {
    if (!dateString || !dateString.includes('-')) return dateString;
    const [year, month, day] = dateString.split('-');
    if (day && month && year) {
        return `${day}-${month}-${year}`;
    }
    return dateString; // Fallback
  };

  // Corrected calculation logic, consistent with InvoiceAddPage
  const subtotalBeforeDeductions = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
  const negotiatedSubtotal = subtotalBeforeDeductions + negotiationValue;
  const goods = negotiatedSubtotal - dpValue - pelunasanValue;
  const dppVat = Math.round(goods * 11 / 12);
  const vat12 = Math.round(dppVat * 12 / 100);
  const totalRp = goods + vat12;


  // Function to handle printing
  const handlePrint = () => {
    window.print();
  };
  
  // Function to handle exporting to PDF
  const handleExportPDF = () => {
    if (!invoiceData) return;
    const element = document.getElementById('invoice-paper');
    // Options for html2pdf, adjusted for a better fit on a single A4 page
    const opt = {
      margin:       [0.5, 0.2, 0.5, 0.2], // [top, left, bottom, right] in inches
      filename:     `Invoice-${invoiceData.number?.replace('/', '-')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  // Function to handle exporting to Excel
  const handleExportExcel = () => {
    if (!invoiceData) return;

    const formatNumber = (value: number) => Number(value.toFixed(2));

    const sheetData = [
      [invoiceTitle],
      [invoiceData.number || ''],
      [], // Empty row
      ["Bill To:", invoiceData.client],
      ["", invoiceData.billToAddress],
      [],
      ["Sales Order:", invoiceData.soNumber, "Date:", formatDate(invoiceData.date)],
      ["No PO:", invoiceData.poNumber],
      [],
      ["No.", "Item", "Quantity", "Unit", "Price", "Amount"],
      ...items.map((item, index) => [
        index + 1,
        item.item,
        item.quantity,
        item.unit,
        formatNumber(item.price),
        formatNumber(item.quantity * item.price)
      ]),
      [],
      ["", "", "", "", "Subtotal:", formatNumber(subtotalBeforeDeductions)],
      negotiationValue !== 0 ? ["", "", "", "", `A/Negotiation:`, `(${formatNumber(Math.abs(negotiationValue))})`] : [],
      dpValue !== 0 ? ["", "", "", "", `DP ${dpPercentage ? `${dpPercentage}%` : ''}:`, formatNumber(dpValue)] : [],
      pelunasanValue !== 0 ? ["", "", "", "", `Pelunasan ${pelunasanPercentage ? `(${pelunasanPercentage}%)` : ''}:`, `(${formatNumber(pelunasanValue)})`] : [],
      ["", "", "", "", "Goods:", formatNumber(goods)],
      ["", "", "", "", "DPP VAT (11/12):", formatNumber(dppVat)],
      ["", "", "", "", "VAT 12 %:", formatNumber(vat12)],
      ["", "", "", "", "Total Rp :", formatNumber(totalRp)],
    ].filter(row => row.length > 0); // Filter out empty arrays from conditional rows

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws['!cols'] = [
      { wch: 5 },  // No.
      { wch: 40 }, // Item
      { wch: 10 }, // Quantity
      { wch: 10 }, // Unit
      { wch: 15 }, // Price
      { wch: 15 }  // Amount
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice");
    XLSX.writeFile(wb, `Invoice-${invoiceData.number.replace('/', '-')}.xlsx`);
  };

  return (
    <div className="bg-gray-100 dark:bg-slate-900 min-h-screen p-4">
      <style>{`
      .invoice-page {
        page-break-after: always;
      }
      .invoice-page:last-child {
        page-break-after: auto;
      }
      @media print {
        body * {
          visibility: hidden;
        }
        .action-bar {
          display: none;
        }
        #invoice-paper, #invoice-paper * {
          visibility: visible;
        }
        #invoice-paper {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          box-shadow: none;
          border: none;
        }
        .invoice-page {
          padding: 0 !important;
        }
      }
      `}</style>

      <div className="max-w-6xl mx-auto mb-4 flex justify-between items-center print:hidden action-bar">
        <button
          onClick={() => setActiveView && setActiveView('invoice/add')}
          className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 mr-2" />
          Kembali ke Editor
        </button>
        <div className="flex flex-wrap gap-2 justify-end">
            <button onClick={handleExportExcel} className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 border border-green-500 dark:border-green-600 rounded-lg font-semibold hover:bg-green-50 dark:hover:bg-slate-700/50 transition-colors">
              <ExportIcon className="w-5 h-5"/>
              <span>Excel</span>
            </button>
            <button onClick={handleExportPDF} className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-500 dark:border-red-600 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-slate-700/50 transition-colors">
              <ExportIcon className="w-5 h-5"/>
              <span>PDF</span>
            </button>
            <button onClick={handlePrint} className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-500 dark:border-blue-600 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors">
              <PrintIcon className="w-5 h-5"/>
              <span>Cetak</span>
            </button>
        </div>
      </div>

      <div id="invoice-paper" className="w-full max-w-6xl mx-auto bg-white shadow-lg">
        {itemPages.map((pageItems, pageIndex) => {
          const isLastPage = pageIndex === itemPages.length - 1;
          const pageNumber = pageIndex + 1;
          const totalPages = itemPages.length;

          return (
            <div key={pageIndex} className="invoice-page p-8 text-[11px] leading-tight relative" style={{ display: 'flex', flexDirection: 'column', minHeight: '25.4cm' }}>
              {/* Header Section */}
              <header>
                <div className="h-[70px] w-full"></div>
                <div className="text-center mb-4">
                  <p className="font-bold uppercase text-[15px] mb-1 tracking-tighter">{invoiceTitle}</p>
                  <p className="font-bold uppercase text-[15px]">{invoiceData.number || 'SAR/25000043'}</p>
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-1/2 text-left pr-4">
                    <p className="font-bold text-[12px] mb-1">{invoiceData.client}</p>
                    {invoiceData.billToAddress && <p className="font-bold text-[10px] whitespace-pre-wrap">{invoiceData.billToAddress}</p>}
                  </div>
                  <div className="w-1/2 text-right pt-2">
                    <p className="font-bold text-[13px]">{invoiceData.printType}</p>
                  </div>
                </div>
                <div className="flex justify-between items-start text-[10px] mb-2">
                  <div className="w-1/2 text-left pr-4"></div>
                  <div className="w-1/2 text-right pl-4">
                    <div className="flex justify-between py-[0px]"><div className="w-[120px] text-right">Sales Order :</div><div className="flex-1 text-left">{invoiceData.soNumber || ''}</div></div>
                    <div className="flex justify-between py-[0px]"><div className="w-[120px] text-right">Order Date :</div><div className="flex-1 text-left"></div></div>
                    <div className="flex justify-between py-[0px]"><div className="w-[120px] text-right">Reference A :</div><div className="flex-1 text-left"></div></div>
                  </div>
                </div>
                <div className="flex justify-between items-end text-[10px] mb-4">
                  <div className="w-1/2 text-left"><div className="flex"><div className="w-[120px]">Customer Code :</div><div className="flex-1 text-left"></div></div></div>
                  <div className="w-1/2 text-right"><p>Date: {formatDate(invoiceData.date)}</p></div>
                </div>
              </header>

              {/* Items Table */}
              <main>
                <table className="w-full border-collapse mb-0 text-[10px]">
                  <thead>
                    <tr>
                      <th className="text-left pb-1 w-[4%] border border-black">No.</th>
                      <th className="text-left pb-1 w-[40%] border-t border-b border-r border-black">Item</th>
                      <th className="text-center pb-1 w-[18%] border-t border-b border-r border-black">Quantity Unit</th>
                      <th className="text-right pb-1 w-[19%] border-t border-b border-r border-black">Price</th>
                      <th className="text-right pb-1 w-[19%] border-t border-b border-r border-black">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, index) => (
                      <tr key={item.id}>
                        <td className="py-1">{index + 1 + (pageIndex * ITEMS_PER_PAGE)}</td>
                        <td className="py-1">{item.item}</td>
                        <td className="py-1 text-center">{item.quantity.toLocaleString('id-ID')} {item.unit}</td>
                        <td className="py-1 text-right">{formatCurrency(item.price)}</td>
                        <td className="py-1 text-right">{formatCurrency(item.quantity * item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </main>
              
              <div style={{ flexGrow: 1 }}></div>

              {/* Footer Section */}
              <footer>
                {isLastPage ? (
                  <>
                    <div className="w-full flex justify-end mt-4 mb-0">
                      <div className="flex flex-col items-end">
                          <div className="border-t border-black w-full mb-1"></div>
                          <p className="font-bold text-[10px]">{formatCurrency(subtotalBeforeDeductions)}</p>
                      </div>
                    </div>
                    <div className="w-full flex justify-end mt-0 mb-4">
                        <div className="w-1/2 pl-4">
                            <div className="w-full text-[10px]">
                                {negotiationValue !== 0 && (<div className="flex"><div className="w-[300px] text-right">A/Negotiation :</div><div className="flex-1 text-right pr-1"><span>({formatCurrency(Math.abs(negotiationValue))})</span></div></div>)}
                                {dpValue !== 0 && (<div className="flex"><div className="w-[300px] text-right">DP {dpPercentage ? `${dpPercentage} %` : ''} :</div><div className="flex-1 text-right pr-1"><span>{formatCurrency(dpValue)}</span></div></div>)}
                                {pelunasanValue !== 0 && (<div className="flex"><div className="w-[300px] text-right">Pelunasan {pelunasanPercentage ? `(${pelunasanPercentage}%)` : ''} :</div><div className="flex-1 text-right pr-1"><span>({formatCurrency(pelunasanValue)})</span></div></div>)}
                            </div>
                        </div>
                    </div>
                    <div className="text-left mt-[-24px] mb-6"><p className="text-[10px]">No PO : {invoiceData.poNumber || ''}</p></div>
                    <div className="border-b border-black w-full mt-0 mb-4"></div>
                    <div className="flex justify-end w-full text-[10px]">
                      <div className="w-1/2 pl-4">
                        <div className="w-full">
                          <div className="flex mb-1"><div className="w-[200px] text-right">Goods :</div><div className="flex-1 text-right pr-1"><span>{formatCurrency(goods)}</span></div></div>
                          <div className="flex mb-1"><div className="w-[200px] text-right">DPP VAT (11/12) :</div><div className="flex-1 text-right pr-1"><span>{formatCurrency(dppVat)}</span></div></div>
                          <div className="flex mb-1"><div className="w-[200px] text-right">VAT 12 % :</div><div className="flex-1 text-right pr-1"><span>{formatCurrency(vat12)}</span></div></div>
                          <div className="flex"><div className="w-[200px] text-right font-normal">Total Rp :</div><div className="flex-1 text-right pr-1 font-normal"><span>{formatCurrency(totalRp)}</span></div></div>
                        </div>
                      </div>
                    </div>
                    <div className="border-b border-black w-full mt-1"></div>
                    <div className="flex mt-4 text-[10px] whitespace-pre-wrap">
                      <div className="w-1/2 pr-4 text-[9px]">
                        <div className="flex mb-1"><div className="w-[100px]">Payment :</div><div className="flex-1">{invoiceData.paymentTerms || '90 Hari setelah invoice diterima'}</div></div>
                        <div className="flex mb-1"><div className="w-[200x]">Please state with your payment :</div><div className="flex-1">{invoiceData.number || 'SAR/25003755'}</div></div>
                        <p className="mb-2">For payment, please transfer to our account:</p>
                        <div className="font-normal">
                            <p className="mb-1">PT.Jembo Cable Company Tbk</p>
                            <div className="flex mb-1"><div className="w-[30%]"><p className="mb-0">Bank Mandiri -</p><p className="mb-0">Jakarta Cabang</p><p className="mb-0">Sudirman</p></div><div className="w-[10%] min-w-[120px] text-right whitespace-nowrap"><p className="mb-0">A/C No. : 102-0100206827 (Rp)</p><p className="mb-0">A/C No. : 102-0005000218 (Rp)</p><p className="mb-0">A/C No. : 102-0005000226 (USD)</p></div></div>
                            <div className="flex justify-center mb-2"><div className="w-[10%] text-center">OR</div></div>
                            <div className="flex"><div className="w-[30%]"><p className="mb-0">Bank BCA - Jakarta</p><p className="mb-0">Cabang KEM TOWER</p></div><div className="w-[10%] min-w-[120px] text-right whitespace-nowrap"><p className="mb-0">A/C No. : 684-0198977 (Rp)</p></div></div>
                        </div>
                      </div>
                      <div className="w-1/2 pl-4 text-center">
                        <p className="font-normal mb-10">PT. JEMBO CABLE COMPANY Tbk</p>
                        <div className="mt-[130px]"><p className="font-normal">Finance</p></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 text-[10px] py-4 border-t border-dashed mt-4">
                    Halaman {pageNumber} dari {totalPages} - Bersambung...
                  </div>
                )}
              </footer>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default InvoicePreviewPage;