import React, { useState, useEffect } from 'react';
import { productApi } from '../api/client.ts';
import { Product } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import {
  Search,
  SlidersHorizontal,
  PackageCheck,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  ShoppingCart,
  CheckCircle2,
  Tag
} from 'lucide-react';

interface CatalogPageProps {
  onSelectProduct?: (product: Product) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ onSelectProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [stockStatus, setStockStatus] = useState<string>('all');
  const [sort, setSort] = useState<string>('title_asc');

  // Quantities for each product card
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notification, setNotification] = useState<{ id: string; message: string; isError?: boolean } | null>(null);

  const { addToCart } = useCart();

  const categories = [
    'All Categories',
    'Power Tools',
    'Welding Equipment',
    'Safety & PPE',
    'Pneumatics & Hydraulics',
    'Fasteners & Hardware'
  ];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { sort };
      if (search.trim()) params.search = search.trim();
      if (category && category !== 'All Categories') params.category = category;
      if (stockStatus !== 'all') params.stockStatus = stockStatus;

      const res = await productApi.getProducts(params);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load catalog products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, category, stockStatus, sort]);

  const handleQtyChange = (productId: string, val: number, maxStock: number) => {
    const safeVal = Math.max(1, Math.min(val, maxStock > 0 ? maxStock : 1));
    setQuantities((prev) => ({ ...prev, [productId]: safeVal }));
  };

  const handleAddToCart = (product: Product) => {
    const qty = quantities[product.id] || 1;
    const res = addToCart(product, qty);
    setNotification({
      id: product.id,
      message: res.message,
      isError: !res.success
    });

    setTimeout(() => {
      setNotification((curr) => (curr?.id === product.id ? null : curr));
    }, 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Header */}
      <div className="mb-8 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold mb-3 border border-sky-500/30">
            <Tag className="w-3.5 h-3.5" />
            <span>Commercial Wholesale Supply • Tiered Bulk Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Industrial Equipment & Hardware Catalog
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Real-time stock reservation, instant PO generation, and Net-30 commercial invoicing. Browse certified power tools, safety equipment, and pneumatic machinery below.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Keyword Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, SKU, or specification..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c === 'All Categories' ? '' : c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="md:col-span-2">
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm bg-white"
            >
              <option value="all">All Stock Levels</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock (≤10)</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm bg-white"
            >
              <option value="title_asc">Name: A to Z</option>
              <option value="title_desc">Name: Z to A</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock_desc">Highest Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between text-sm shadow-md transition-all ${
            notification.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.isError ? (
              <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-sky-500 border-t-transparent"></div>
          <p className="mt-3 text-slate-500 font-medium text-sm">Querying live wholesale inventory...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center my-8">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-rose-800 font-semibold text-lg">Unable to load catalog</h3>
          <p className="text-rose-600 text-sm mt-1">{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition"
          >
            Retry Catalog
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <SlidersHorizontal className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-800 font-bold text-lg">No Products Match Your Filter</h3>
          <p className="text-slate-500 text-sm mt-1">
            Try adjusting your search query, selecting "All Categories", or resetting the stock level filter.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setCategory('');
              setStockStatus('all');
            }}
            className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-500 transition shadow"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
            const cardQty = quantities[product.id] || 1;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container with Stock Pill */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={
                        product.imageUrl ||
                        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-slate-900/80 backdrop-blur-sm text-white">
                        {product.category}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-600 text-white shadow">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Out of Stock</span>
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-slate-950 shadow">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Low Stock ({product.stock})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow">
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>In Stock ({product.stock})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>SKU: {product.sku}</span>
                      <span>Unit Price</span>
                    </div>

                    <div className="flex items-baseline justify-between mb-2">
                      <h3
                        onClick={() => onSelectProduct?.(product)}
                        className="text-base font-bold text-slate-900 line-clamp-1 hover:text-sky-600 cursor-pointer"
                        title={product.title}
                      >
                        {product.title}
                      </h3>
                      <div className="text-xl font-extrabold text-slate-900 font-mono ml-2">
                        ${parseFloat(String(product.unitPrice)).toFixed(2)}
                      </div>
                    </div>

                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4">
                      {product.description || 'Commercial grade equipment engineered for professional distributor operations.'}
                    </p>
                  </div>
                </div>

                {/* Footer Controls: Quantity & Add to Cart */}
                <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/50 flex items-center space-x-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      disabled={isOutOfStock || cardQty <= 1}
                      onClick={() => handleQtyChange(product.id, cardQty - 1, product.stock)}
                      className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={product.stock}
                      disabled={isOutOfStock}
                      value={isOutOfStock ? 0 : cardQty}
                      onChange={(e) =>
                        handleQtyChange(product.id, parseInt(e.target.value, 10) || 1, product.stock)
                      }
                      className="w-12 text-center text-xs font-bold text-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={isOutOfStock || cardQty >= product.stock}
                      onClick={() => handleQtyChange(product.id, cardQty + 1, product.stock)}
                      className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add Button */}
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow transition"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
