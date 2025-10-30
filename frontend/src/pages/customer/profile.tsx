import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { listPaymentMethods, addPaymentMethod, deletePaymentMethod, PaymentMethod, PaymentMethodCreateRequest } from '@/lib/api';
import CardBadge from '@/components/CardBadge';
import CardEntry from '@/components/CardEntry';
import Confirm from '@/components/Confirm';

export default function CustomerProfile() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add card form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCardToken, setNewCardToken] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [cardSaved, setCardSaved] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    methodId: number | null;
    brand: string;
    last4: string;
  }>({
    isOpen: false,
    methodId: null,
    brand: '',
    last4: '',
  });
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCardTokenGenerated = (token: string) => {
    setNewCardToken(token);
    setCardSaved(true);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !newCardToken) return;

    try {
      setAddingCard(true);
      const payload: PaymentMethodCreateRequest = {
        stripe_payment_method_token: newCardToken,
        set_default: setAsDefault,
      };
      await addPaymentMethod(parseInt(customerId), payload, '');
      showToast('Payment method added successfully!', 'success');
      setNewCardToken('');
      setSetAsDefault(false);
      setShowAddForm(false);
      setCardSaved(false);
      await loadPaymentMethods();
    } catch (err: any) {
      showToast(err.message || 'Failed to add payment method', 'error');
    } finally {
      setAddingCard(false);
    }
  };

  const handleDeleteRequest = (method: PaymentMethod) => {
    setDeleteConfirm({
      isOpen: true,
      methodId: method.id,
      brand: method.brand,
      last4: method.last4,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!customerId || !deleteConfirm.methodId) return;

    try {
      await deletePaymentMethod(parseInt(customerId), deleteConfirm.methodId, '');
      showToast('Payment method removed successfully!', 'success');
      setDeleteConfirm({ isOpen: false, methodId: null, brand: '', last4: '' });
      await loadPaymentMethods();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove payment method', 'error');
    }
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

          {/* Toast Notification */}
          {toast && (
            <div
              className={`mb-6 px-4 py-3 rounded-lg border ${
                toast.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {toast.message}
            </div>
          )}

          <div className="card mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Payment Methods</h2>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-protega-teal hover:bg-protega-teal-dark text-white rounded-lg font-semibold transition-colors"
                >
                  + Add Card
                </button>
              )}
            </div>

            {/* Add Card Form */}
            {showAddForm && (
              <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Add New Payment Method</h3>
                <form onSubmit={handleAddCard} className="space-y-4">
                  {!cardSaved ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        Enter your card details securely. Your card information is encrypted and processed directly by our payment provider.
                      </p>
                      <CardEntry onTokenGenerated={handleCardTokenGenerated} />
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <p className="text-green-700 font-semibold">
                        ✅ Card saved! Click "Add Card" below to complete the process.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="setAsDefault"
                      checked={setAsDefault}
                      onChange={(e) => setSetAsDefault(e.target.checked)}
                      className="mr-2 h-4 w-4 text-protega-teal focus:ring-protega-teal border-gray-300 rounded"
                    />
                    <label htmlFor="setAsDefault" className="text-sm text-gray-700 font-medium">
                      Set as default payment method
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={addingCard || !newCardToken}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingCard ? 'Adding...' : 'Add Card'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewCardToken('');
                        setSetAsDefault(false);
                        setCardSaved(false);
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

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
                    <div className="flex items-center gap-3">
                      {method.is_default && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Default
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteRequest(method)}
                        className="px-3 py-1.5 text-sm text-red-600 border border-red-600 hover:bg-red-600 hover:text-white rounded-lg font-semibold transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          <Confirm
            isOpen={deleteConfirm.isOpen}
            title="Remove Payment Method"
            message={`Are you sure you want to remove ${deleteConfirm.brand} ending in ${deleteConfirm.last4}? This action cannot be undone.`}
            confirmText="Remove"
            cancelText="Cancel"
            variant="danger"
            onConfirm={handleDeleteConfirm}
            onCancel={() =>
              setDeleteConfirm({ isOpen: false, methodId: null, brand: '', last4: '' })
            }
          />

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

