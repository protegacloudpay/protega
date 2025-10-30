import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { listPaymentMethods, PaymentMethod } from '@/lib/api';
import CardBadge from '@/components/CardBadge';

export default function CustomerProfile() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get customer ID from localStorage
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('customer_id');
      if (!id) {
        router.push('/customer/login');
        return;
      }
      setCustomerId(id);
    }
  }, [router]);

  useEffect(() => {
    if (customerId) {
      loadPaymentMethods();
    }
  }, [customerId]);

  const loadPaymentMethods = async () => {
    if (!customerId) return;

    try {
      setLoading(true);
      const response = await listPaymentMethods(parseInt(customerId), '');
      setMethods(response.items);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('customer_id');
    }
    router.push('/customer/login');
  };

  if (!customerId) {
    return null;
  }

  return (
    <>
      <Head>
        <title>My Profile - Protega CloudPay</title>
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100">
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-protega-teal rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-slate-900 font-bold text-xl">Protega CloudPay</span>
            </Link>
            <div className="flex space-x-4 items-center">
              <span className="text-sm text-gray-600">Customer ID: <strong>{customerId}</strong></span>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 font-semibold text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-8">My Profile</h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="card mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Payment Methods</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-protega-teal"></div>
                <p className="mt-4 text-gray-600">Loading payment methods...</p>
              </div>
            ) : methods.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No payment methods found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {methods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-cyan-300 transition-colors"
                  >
                    <CardBadge
                      brand={method.brand}
                      last4={method.last4}
                      expMonth={method.exp_month}
                      expYear={method.exp_year}
                      isDefault={method.is_default}
                    />
                    {method.is_default && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Default
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Link href="/">
              <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold transition-colors">
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

