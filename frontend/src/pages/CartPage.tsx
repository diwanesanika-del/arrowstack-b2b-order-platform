import React, { useState } from 'react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { orderApi } from '../api/client.ts';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Truck,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface CartPageProps {
  setCurrentTab: (tab: string) => void;
  setSelectedOrderId: (id: string) => void;
  setSelectedInvoiceId: (id: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  setCurrentTab,
  setSelectedOrderId,
  setSelectedInvoiceId
}) => {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, taxAmount, totalAmount } = useCart();
  const { user, isCustomer } = useAuth();

  const [shipping, setShipping] = useState({
    name: user?.fullName || '',
    address: '450 Industrial Boulevard, Gate 4',
    city: 'Chicago',
    postalCode: '60601',
    country: 'United States',
    phone: user?.phone || '+1-555-0199'
  });

  const [poReference, setPoReference] = useState('PO-2026-' + Math.floor(1000 + Math.random() * 9000));
  const [notes, setNotes] = useState('Deliver to loading bay. Forklift required for heavy freight.');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('Please sign in or register a customer distributor account to place wholesale orders.');
      return;
    }

    if (!isCustomer) {
      setError('Administrator accounts are for platform management. Please log in as a customer buyer to place orders.');
      return;
    }

    if (cart.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity
        })),
        shipping,
        poReference: poReference.trim() || undefined,
        notes: notes.trim() || undefined
      };

      const res = await orderApi.createOrder(payload);
      if (res.success && res.data) {
        clearCart();
        setPlacedOrder(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  // If order was placed successfully, display confirmation view
  if (placedOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Order Confirmed & Inventory Reserved
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-3">
            Wholesale Purchase Order Received!
          </h2>
          <p className="text-slate-600 text-sm mt-2 max-w-lg mx-auto">
            Your bulk order has been processed with atomic stock lock. A commercial tax invoice has been automatically generated with Net-30 wholesale payment terms.
          </p>

          {/* Order Details Card */}
          <div className="mt-8 bg-slate-50 rounded-xl p-6 border border-slate-200 text-left max-w-xl mx-auto">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block font-semibold uppercase">Order Number</span>
                <span className="font-mono font-bold text-slate-900">{placedOrder.order.orderNumber}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-semibold uppercase">Invoice Number</span>
                <span className="font-mono font-bold text-sky-600">{placedOrder.invoice.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-semibold uppercase">Grand Total (Inc. 8% Tax)</span>
                <span className="font-mono font-extrabold text-slate-900">${placedOrder.order.totalAmount}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-semibold uppercase">Order Status</span>
                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                  {placedOrder.order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                setSelectedOrderId(placedOrder.order.id);
                setCurrentTab('order-detail');
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow transition"
            >
              <Truck className="w-4 h-4" />
              <span>Track Order Status</span>
            </button>

            <button
              onClick={() => {
                setSelectedInvoiceId(placedOrder.invoice.id);
                setCurrentTab('invoice-detail');
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow transition"
            >
              <FileText className="w-4 h-4" />
              <span>View & Print Commercial Invoice</span>
            </button>

            <button
              onClick={() => setCurrentTab('catalog')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
            >
              Return to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart view
  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your wholesale cart is empty</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
          Explore our certified industrial catalog to add power tools, welding units, and hardware fasteners to your purchase requisition.
        </p>
        <button
          onClick={() => setCurrentTab('catalog')}
          className="mt-6 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm inline-flex items-center space-x-2 shadow-lg transition"
        >
          <span>Browse Product Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Wholesale Purchase Cart</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Review item line pricing, adjust order quantities, and confirm freight shipping address.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center space-x-1"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-sm text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Order Validation Error</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Cart Items Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
              <span>Item & Specification</span>
              <span>Line Subtotal</span>
            </div>

            <div className="divide-y divide-slate-100">
              {cart.map(({ product, quantity }) => {
                const unitPrice = parseFloat(String(product.unitPrice));
                const lineTotal = +(unitPrice * quantity).toFixed(2);

                return (
                  <div key={product.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={product.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80'}
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                      />
                      <div>
                        <span className="text-[10px] font-mono font-bold text-sky-600 uppercase bg-sky-50 px-2 py-0.5 rounded">
                          {product.sku}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{product.title}</h4>
                        <div className="text-xs text-slate-400 mt-0.5">
                          ${unitPrice.toFixed(2)} / unit • Stock: <span className="font-bold text-slate-700">{product.stock} available</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                      {/* Stepper */}
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-sm">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-xs font-bold text-slate-900">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          disabled={quantity >= product.stock}
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[80px]">
                        <span className="font-mono font-bold text-base text-slate-900">
                          ${lineTotal.toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 flex items-center space-x-3 text-xs text-sky-900">
            <ShieldCheck className="w-5 h-5 text-sky-600 flex-shrink-0" />
            <span>
              <strong>Inventory Protection Guarantee:</strong> Stocks are atomically locked on the server when checking out to guarantee zero overselling.
            </span>
          </div>
        </div>

        {/* Right: Checkout & Address Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              Commercial Order Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Wholesale Subtotal</span>
                <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Commercial Sales Tax (8.00%)</span>
                <span className="font-mono font-medium">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Standard Freight Logistics</span>
                <span className="font-medium text-emerald-600">Free B2B Freight</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900">Total Payable</span>
                <span className="font-mono text-2xl font-extrabold text-slate-900">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Shipping Form */}
            <form onSubmit={handleCheckout} className="mt-6 pt-6 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Freight Delivery Information
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Name / Receiving Manager
                </label>
                <input
                  type="text"
                  required
                  value={shipping.name}
                  onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="e.g. Elena Rostova"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Facility Street Address
                </label>
                <input
                  type="text"
                  required
                  value={shipping.address}
                  onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="e.g. 100 Industrial Parkway, Dock 3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. Detroit"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={shipping.postalCode}
                    onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. 48201"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={shipping.phone}
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. +1-555-0144"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Order (PO #)</label>
                  <input
                    type="text"
                    value={poReference}
                    onChange={(e) => setPoReference(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                    placeholder="e.g. PO-ACM-9921"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Instructions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="Gate code, loading dock specifications, etc."
                />
              </div>

              {/* Submit Button */}
              {user && isCustomer ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-lg flex items-center justify-center space-x-2 transition"
                >
                  {submitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Locking Stock & Submitting PO...</span>
                    </div>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Place Wholesale Order (${totalAmount.toFixed(2)})</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-amber-800 font-semibold mb-2">
                    {!user
                      ? 'You must sign in with a registered business distributor account to checkout.'
                      : 'You are signed in as an Administrator. Log in as a customer buyer to place orders.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('login')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow transition"
                  >
                    Switch / Sign In as Customer
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
