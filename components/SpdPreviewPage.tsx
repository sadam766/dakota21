
import React from 'react';
import type { PaymentOverviewInvoice, ConsumerType } from '../types';
import { ChevronLeftIcon, PrintIcon, ExportIcon } from './icons';

declare const html2pdf: any;

interface SpdPreviewPageProps {
  spdDocs: PaymentOverviewInvoice[];
  consumers: ConsumerType[];
  setActiveView: (view: string) => void;
}

const SpdPreviewPage: React.FC<SpdPreviewPageProps> = ({ spdDocs, consumers, setActiveView }) => {

  if (!spdDocs || spdDocs.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-slate-900 min-h-screen p-4 flex flex-col items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">Tidak ada data SPD untuk pratinjau.</p>
        <button
          onClick={() => setActiveView('spd')}
          className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 mr-2" />
          Kembali ke Daftar SPD
        </button>
      </div>
    );
  }

  const mainSpd = spdDocs[0];
  const customer = consumers.find(c => c.name === mainSpd.client);
  const customerAddress = customer ? customer.alamatSpd.split('\n') : ['Alamat tidak ditemukan'];

  const spdNumberMatch = mainSpd.number?.match(/^PS\/(\d+)(.*)$/);
  const spdNumberMain = spdNumberMatch ? spdNumberMatch[1] : mainSpd.number;
  const spdNumberSuffix = spdNumberMatch ? spdNumberMatch[2] : '';

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-');
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '';
    return value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };
  
  const handlePrint = () => window.print();
  
  const handleExportPDF = () => {
    const element = document.getElementById('spd-paper');
    const opt = {
      margin: [0.5, 0.2, 0.5, 0.2],
      filename: `SPD-${mainSpd.number?.replace(/[\/\\?%*:|"<>]/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  const totalRowsInTable = 15;

  return (
    <div className="bg-gray-200 dark:bg-slate-900 min-h-screen p-4 font-['Calibri',_sans-serif]">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .action-bar, .action-bar * { display: none !important; }
          #spd-paper, #spd-paper * { visibility: visible; }
          #spd-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 2.5cm 2cm;
            box-shadow: none;
            border: none;
            font-size: 11pt;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center print:hidden action-bar">
        <button
          onClick={() => setActiveView('spd')}
          className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 mr-2" />
          Kembali
        </button>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">
            <ExportIcon className="w-5 h-5"/>
            <span>PDF</span>
          </button>
          <button onClick={handlePrint} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            <PrintIcon className="w-5 h-5"/>
            <span>Cetak</span>
          </button>
        </div>
      </div>

      <div id="spd-paper" className="w-full max-w-4xl mx-auto bg-white shadow-lg p-10 text-black">
        <div>
            <h1 className="text-lg font-bold">PT. JEMBO CABLE COMPANY Tbk</h1>
            <p className="text-xs">Mega Glodok Kemayoran Office Tower B 6th Floor Jl.Angkasa Kav.B-6 Kota Baru Bandar Kemayoran Jakarta Pusat</p>
        </div>
        
        <div className="text-center my-4">
            <h2 className="text-base font-bold underline decoration-1">SURAT PENGANTAR DOKUMEN</h2>
            <p className="text-sm">
              PS/ <span className="px-8">{spdNumberMain}</span> {spdNumberSuffix}
            </p>
        </div>

        <div className="flex my-8">
            <div className="w-[120px] text-sm flex-shrink-0">
                <p>KEPADA YTH:</p>
            </div>
            <div>
                <p className="font-bold text-sm">{customer?.name}</p>
                {customerAddress.map((line, i) => <p key={i} className="text-sm">{line}</p>)}
                <p className="text-sm">UP : BPK EDI FEBRIANTO ( 0877-7126-1408 )</p>
            </div>
        </div>

        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="text-center font-bold">
              <td colSpan={2} className="border border-black p-1 w-[13%]">JUMLAH</td>
              <td className="border border-black p-1 w-[10%]">TANGGAL</td>
              <td className="border border-black p-1 w-[12%]">NO. KUITANSI</td>
              <td className="border border-black p-1 w-[15%]">NO. INVOICE</td>
              <td className="border border-black p-1 w-[15%]">NILAI</td>
              <td className="border border-black p-1 w-[15%]">NO. FAKTUR PAJAK</td>
              <td className="border border-black p-1 w-[10%]">NO. SO.</td>
              <td className="border border-black p-1 w-[10%]">NO. SURAT JALAN</td>
            </tr>
          </thead>
          <tbody>
            {[...Array(totalRowsInTable)].map((_, index) => {
              const doc = spdDocs[index];
              return (
                <tr key={index}>
                  <td className="border border-black p-1 text-center w-[8%]">{doc ? '1' : ''}</td>
                  <td className="border border-black p-1 text-center w-[5%]">{doc ? 'SET' : ''}</td>
                  <td className="border border-black p-1 text-center">{doc ? formatDate(doc.invoiceDate) : ''}</td>
                  <td className="border border-black p-1 text-center">{doc?.noKuitansi || ''}</td>
                  <td className="border border-black p-1 text-center">{doc?.invoiceNumber || ''}</td>
                  <td className="border border-black p-1">
                    {doc && (
                        <div className="flex justify-between">
                            <span>Rp.</span>
                            <span className="text-right">{formatCurrency(doc.totalPiutang)}</span>
                        </div>
                    )}
                  </td>
                  <td className="border border-black p-1 text-center">{doc?.noFakturPajak || ''}</td>
                  <td className="border border-black p-1 text-center">{doc?.soNumber || ''}</td>
                  <td className="border border-black p-1 text-center">{doc?.suratJalan || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-between mt-8 text-xs">
          <div>
            <p>Diterima Oleh :</p>
            <br/><br/><br/>
            <p>( Nama Jelas )</p>
            <br/>
            <p className="font-bold">Catatan :</p>
            <p>Mohon di fax ke (021) 65701488, setelah Tanda Terima Dokumen ini diterima</p>
          </div>
          <div className="text-center">
            <p>Jakarta, {formatDate(mainSpd.date)}</p>
            <br/><br/><br/><br/><br/>
            <p>Sales Support</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpdPreviewPage;