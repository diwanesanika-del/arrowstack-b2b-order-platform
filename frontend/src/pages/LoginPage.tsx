import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { LogIn, Key, Mail, ShieldAlert, Sparkles } from 'lucide-react';

interface LoginPageProps {
  setCurrentTab: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ setCurrentTab }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await login({ email, password });
      setCurrentTab('catalog');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    setEmail('admin@b2bdistributors.com');
    setPassword('AdminPass123!');
  };

  const fillCustomer = () => {
    setEmail('buyer@acmeindustrial.com');
    setPassword('CustomerPass123!');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Wholesale Portal Login</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access commercial catalog pricing, order tracking, and administration.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Demo Fillers for Reviewers */}
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Demo Credentials (1-Click Fill)</span>
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillAdmin}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-slate-700 text-[11px] font-bold text-left transition shadow-sm"
            >
              <span className="text-amber-600 block">Distributor Admin</span>
              <span className="text-[10px] text-slate-400 font-mono">admin@b2bdistributors.com</span>
            </button>
            <button
              type="button"
              onClick={fillCustomer}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-400 text-slate-700 text-[11px] font-bold text-left transition shadow-sm"
            >
              <span className="text-sky-600 block">B2B Customer</span>
              <span className="text-[10px] text-slate-400 font-mono">buyer@acmeindustrial.com</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Business Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="buyer@acmeindustrial.com"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Account Password</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-sm shadow transition"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <span>New commercial distributor partner? </span>
          <button
            onClick={() => setCurrentTab('register')}
            className="font-bold text-sky-600 hover:text-sky-800"
          >
            Register Account
          </button>
        </div>
      </div>
    </div>
  );
};
