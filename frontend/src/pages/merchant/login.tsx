import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { merchantLogin, MerchantLoginRequest } from '@/lib/api';
import { setAuthToken, setMerchantData } from '@/lib/auth';

export default function MerchantLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState<MerchantLoginRequest>({
    email: '',
    password: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await merchantLogin(formData);
      
      // Store token and merchant data
      setAuthToken(response.token);
      setMerchantData({
        merchant_id: response.merchant_id,
        email: response.email,
        name: response.name,
        terminal_api_key: response.terminal_api_key,
      });
      
      // Redirect to dashboard
      router.push('/merchant/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Merchant Login - Protega CloudPay</title>
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-protega-teal rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-slate-900 font-bold text-xl">Protega CloudPay</span>
            </Link>
            <Link href="/" className="text-protega-teal hover:text-protega-teal-dark transition-colors">
              ← Back to Home
            </Link>
          </div>
        </nav>

        <div className="max-w-md mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 text-center">Merchant Login</h1>
          <p className="text-gray-600 mb-8 text-center">
            Access your merchant dashboard and transaction history.
          </p>

          <form onSubmit={handleSubmit} className="card">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="merchant@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href="/merchant/signup" className="text-protega-teal hover:text-protega-teal-dark text-sm">
              Don't have an account? Create one →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
