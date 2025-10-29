import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getTransactions, TransactionItem } from '@/lib/api';
import { clearAuthToken, getAuthToken, getMerchantData } from '@/lib/auth';

export default function MerchantDashboard() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const merchantData = getMerchantData();
  const [userIdInput, setUserIdInput] = useState('');

  useEffect(() => {
    const token = getAuthToken();
    
    if (!token) {
      router.push('/merchant/login');
      return;
    }

    loadTransactions(token);
  }, [router]);

  const loadTransactions = async (token: string) => {
    try {
      const response = await getTransactions(token);
      setTransactions(response.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    router.push('/merchant/login');
  };

  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleManagePaymentMethods = () => {
    const userId = parseInt(userIdInput);
    if (userId && !isNaN(userId)) {
      router.push(`/merchant/customers/${userId}/methods`);
    }
  };

  return (
    <>
      <Head>
        <title>Merchant Dashboard - Protega CloudPay</title>
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
            <button
              onClick={handleLogout}
              className="text-protega-teal hover:text-protega-teal-dark transition-colors"
            >
              Logout
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Merchant Dashboard</h1>
            {merchantData && (
              <p className="text-gray-600">
                Welcome back, <span className="font-semibold">{merchantData.name}</span> ({merchantData.email})
              </p>
            )}
          </div>

          {/* Stats and Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-protega-teal to-protega-teal-dark text-white">
              <p className="text-sm opacity-90 mb-1">Total Transactions</p>
              <p className="text-4xl font-bold">{transactions.length}</p>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <p className="text-sm opacity-90 mb-1">Successful Payments</p>
              <p className="text-4xl font-bold">
                {transactions.filter(t => t.status === 'succeeded').length}
              </p>
            </div>

            <div className="card bg-gradient-to-br from-protega-gold to-yellow-500 text-white">
              <p className="text-sm opacity-90 mb-1">Total Revenue</p>
              <p className="text-4xl font-bold">
                ${formatAmount(
                  transactions
                    .filter(t => t.status === 'succeeded')
                    .reduce((sum, t) => sum + t.amount_cents, 0)
                )}
              </p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="card mb-8 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">🚀 Quick Actions</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="number"
                  className="input"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  placeholder="Enter user ID (e.g., 1)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleManagePaymentMethods();
                    }
                  }}
                />
              </div>
              <button
                onClick={handleManagePaymentMethods}
                disabled={!userIdInput || isNaN(parseInt(userIdInput))}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Manage Payment Methods →
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              💡 Enter a user ID to view and manage their saved payment methods
            </p>
          </div>

          {/* Transactions Table */}
          <div className="card">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Transactions</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-protega-teal"></div>
                <p className="mt-4 text-gray-600">Loading transactions...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No transactions yet.</p>
                <Link href="/kiosk" className="btn-primary inline-block">
                  Test a Payment →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">{txn.id}</td>
                        <td className="py-3 px-4 text-sm">{formatDate(txn.created_at)}</td>
                        <td className="py-3 px-4 text-sm">{txn.user_email || 'Anonymous'}</td>
                        <td className="py-3 px-4 font-semibold">
                          ${formatAmount(txn.amount_cents)} {txn.currency.toUpperCase()}
                        </td>
                        <td className="py-3 px-4">
                          {txn.status === 'succeeded' ? (
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              ✓ Succeeded
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                              ✗ Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
