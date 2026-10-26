import React, { useState, useEffect } from 'react';
import { invoiceApi } from '../api/client.ts';
import { Invoice } from '../types/index.ts';
import {
  Printer,
  ArrowLeft,
  Building2,
  FileCheck,
  AlertCircle
} from 'lucide-react';

interface InvoiceViewPageProps {
  invoiceId: string;
  onBack: () => void;
}

export const InvoiceViewPage: React.FC<InvoiceViewPageProps> = ({ invoiceId, onBack }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoice() {
      try {
        setLoading(true);
        setError(null);
        const res = await invoiceApi.getInvoiceById(invoiceId);
        if (res.success && res.invoice) {
          setInvoice(res.invoice);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent"></div>
        <p className="mt-2 text-slate-500 text-xs">Generating printable invoice view...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="font-bold text-rose-800">Invoice Not Found</h3>
          <p className="text-xs text-rose-600 mt-1">{error || 'Could not locate invoice.'}</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top action controls (hidden on print) */}
      <div className="mb-6 flex items-center justify-between no-print">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow flex items-center space-x-2 transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Invoice Document Canvas */}
      <div className="bg-white border border-slate-300 rounded-2xl shadow-xl p-8 sm:p-12 text-slate-800 print:border-none print:shadow-none print:p-0">
        {/* Header: Company & Invoice Metadata */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b-2 border-slate-900">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-black text-sm">
                AW
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                APEX WHOLESALE LLC
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Industrial Machinery & Equipment Distribution<br />
              400 Distribution Way, Suite 800<br />
              Chicago, IL 60607 • Tax EIN: 36-9921044<br />
              support@apexwholesale.example.com • +1 (800) 555-APEX
            </p>
          </div>

          <div className="text-left sm:text-right">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-wide font-mono">
              COMMERCIAL INVOICE
            </h1>
            <div className="mt-2 text-xs space-y-1">
              <div>
                <span className="text-slate-400 font-semibold uppercase">Invoice #: </span>
                <strong className="font-mono text-slate-900">{invoice.invoiceNumber}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase">Order #: </span>
                <span className="font-mono text-slate-800">{invoice.orderNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase">Date Issued: </span>
                <span>{new Date(invoice.issueDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase">Payment Terms: </span>
                <strong>Net 30 Days</strong> (Due: {new Date(invoice.dueDate).toLocaleDateString()})
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase">Status: </span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                  invoice.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To & Ship To Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
          <div>
            <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[10px] mb-2 flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Billed Customer (Account)</span>
            </h4>
            <div className="space-y-0.5 text-slate-700">
              <p className="font-bold text-slate-900 text-sm">{invoice.companyName}</p>
              <p>Attention: {invoice.customerFullName}</p>
              <p>{invoice.customerEmail}</p>
              {invoice.customerPhone && <p>{invoice.customerPhone}</p>}
              {invoice.poReference && (
                <p className="mt-1 font-mono text-slate-900">
                  Customer PO: <strong>{invoice.poReference}</strong>
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[10px] mb-2">
              Freight Shipping Destination
            </h4>
            <div className="space-y-0.5 text-slate-700">
              <p className="font-bold text-slate-900">{invoice.shippingName || invoice.companyName}</p>
              <p>{invoice.shippingAddress}</p>
              <p>
                {invoice.shippingCity}, {invoice.shippingPostalCode}
              </p>
              <p>{invoice.shippingCountry}</p>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Line Item Description</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Amount (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-4 font-semibold text-slate-900">{item.productTitle}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{item.sku}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800">{item.quantity}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    ${parseFloat(String(item.unitPrice)).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ${parseFloat(String(item.lineTotal)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="pt-4 border-t-2 border-slate-900 flex flex-col sm:flex-row justify-between items-start gap-6">
          <div className="text-xs text-slate-500 max-w-sm">
            <h5 className="font-bold text-slate-700 uppercase text-[10px] mb-1">
              Wire Transfer & Payment Remittance
            </h5>
            <p>
              Bank: Global Commercial Wholesale Bank, N.A.<br />
              Routing / ABA: 071000033 • Account: 9812-4401-2091<br />
              Beneficiary: Apex Wholesale LLC<br />
              Payment Due: Net 30 days from issuance.
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Item Subtotal</span>
              <span className="font-mono font-bold">${parseFloat(String(invoice.subtotal)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Wholesale State Tax (8.00%)</span>
              <span className="font-mono font-bold">${parseFloat(String(invoice.taxAmount)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-300">
              <span>Total Due</span>
              <span className="font-mono">${parseFloat(String(invoice.totalAmount)).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
          <FileCheck className="w-4 h-4 mx-auto mb-1 text-slate-400 inline" />
          <p>
            Official Commercial Tax Invoice generated by Apex Wholesale B2B Platform • Verified ACID Database Transaction
          </p>
        </div>
      </div>
    </div>
  );
};
