import React, { useState, useEffect } from 'react';
import { invoiceApi } from '../api/client.ts';
import { Invoice } from '../types/index.ts';
import { FileText, Printer, AlertCircle } from 'lucide-react';

interface InvoicesListPageProps {
  onSelectInvoice: (id: string) => void;
}

export const InvoicesListPage: React.FC<InvoicesListPageProps> = ({ onSelectInvoice }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoices() {
      try {
        setLoading(true);
        setError(null);
        const res = await invoiceApi.getInvoices();
        if (res.success) {
          setInvoices(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Commercial Tax Invoices</h1>
        <p className="text-slate-500 text-sm mt-1">
          Review commercial invoices, download billing documentation, and verify Net-30 payment due dates.
        </p>
      </div>

      {loading && (
        <div className="py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent"></div>
          <p className="mt-2 text-slate-500 text-xs">Loading billing invoices...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center space-x-2 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && invoices.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-900 font-bold text-base">No Invoices Issued</h3>
          <p className="text-slate-500 text-xs mt-1">
            Invoices are automatically created whenever you place a wholesale purchase order.
          </p>
        </div>
      )}

      {!loading && !error && invoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Associated Order</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-slate-900">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-600">
                    {inv.orderNumber}
                  </td>
                  <td className="py-4 px-4 text-slate-600">
                    {new Date(inv.issueDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-700">
                    {new Date(inv.dueDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 font-mono font-extrabold text-slate-900">
                    ${parseFloat(String(inv.totalAmount)).toFixed(2)}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                      inv.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => onSelectInvoice(inv.id)}
                      className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold transition inline-flex items-center space-x-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>View & Print</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
