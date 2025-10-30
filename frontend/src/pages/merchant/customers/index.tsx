import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { listCustomers, CustomerListItem } from '@/lib/api';
import { getAuthToken, isAuthenticated } from '@/lib/auth';

export default function CustomersList() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/merchant/login');
      return;
    }

    loadCustomers();
  }, [router]);

  const loadCustomers = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const response = await listCustomers(token);
      setCustomers(response.items);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Head>
        <title>Customers - Protega CloudPay</title>
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
            <Link
              href="/merchant/dashboard"
              className="text-protega-teal hover:text-protega-teal-dark transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Customers</h1>
            <p className="text-gray-600">
              View your customers and their transaction history (non-sensitive information only)
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="card">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-protega-teal"></div>
                <p className="mt-4 text-gray-600">Loading customers...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No customers found yet.</p>
                <p className="text-sm text-gray-500">
                  Customers will appear here after they make their first purchase.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Transactions</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Spent</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">First Seen</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Seen</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.customer_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">{customer.customer_id}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{customer.masked_name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{customer.masked_email || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">{customer.transaction_count}</td>
                        <td className="py-3 px-4 font-semibold text-green-600">
                          ${formatAmount(customer.total_spent_cents)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(customer.first_seen)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(customer.last_seen)}</td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/merchant/customers/${customer.customer_id}/methods`}
                            className="text-protega-teal hover:text-protega-teal-dark font-semibold text-sm"
                          >
                            Manage Cards →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-semibold text-blue-900 mb-2">🔒 Privacy Protection</p>
            <p>
              To protect customer privacy, we only show masked information. Full customer details are never revealed to merchants.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

