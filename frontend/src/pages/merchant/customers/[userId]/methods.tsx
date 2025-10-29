import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  listPaymentMethods,
  addPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  PaymentMethod,
  PaymentMethodCreateRequest,
} from '@/lib/api';
import { getAuthToken, isAuthenticated } from '@/lib/auth';
import CardBadge from '@/components/CardBadge';
import Confirm from '@/components/Confirm';

export default function CustomerPaymentMethods() {
  const router = useRouter();
  const { userId } = router.query;
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Add new card form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCardToken, setNewCardToken] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  
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

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/merchant/login');
      return;
    }

    if (userId && typeof userId === 'string') {
      loadPaymentMethods();
    }
  }, [userId, router]);

  const loadPaymentMethods = async () => {
    const token = getAuthToken();
    if (!token || !userId) return;

    try {
      setLoading(true);
      const response = await listPaymentMethods(parseInt(userId as string), token);
      setMethods(response.items);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token || !userId) return;

    try {
      setAddingCard(true);
      const payload: PaymentMethodCreateRequest = {
        stripe_payment_method_token: newCardToken,
        set_default: setAsDefault,
      };
      await addPaymentMethod(parseInt(userId as string), payload, token);
      showToast('Payment method added successfully!', 'success');
      setNewCardToken('');
      setSetAsDefault(false);
      setShowAddForm(false);
      await loadPaymentMethods();
    } catch (err: any) {
      showToast(err.message || 'Failed to add payment method', 'error');
    } finally {
      setAddingCard(false);
    }
  };

  const handleSetDefault = async (methodId: number) => {
    const token = getAuthToken();
    if (!token || !userId) return;

    try {
      const response = await setDefaultPaymentMethod(
        parseInt(userId as string),
        methodId,
        token
      );
      showToast(response.message, 'success');
      await loadPaymentMethods();
    } catch (err: any) {
      showToast(err.message || 'Failed to set default payment method', 'error');
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
    const token = getAuthToken();
    if (!token || !userId || !deleteConfirm.methodId) return;

    try {
      await deletePaymentMethod(
        parseInt(userId as string),
        deleteConfirm.methodId,
        token
      );
      showToast('Payment method removed successfully!', 'success');
      setDeleteConfirm({ isOpen: false, methodId: null, brand: '', last4: '' });
      await loadPaymentMethods();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove payment method', 'error');
    }
  };

  return (
    <>
      <Head>
        <title>Customer Payment Methods - Protega CloudPay</title>
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
            <Link
              href="/merchant/dashboard"
              className="text-protega-teal hover:text-protega-teal-dark transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Payment Methods</h1>
            <p className="text-gray-600">
              Manage payment methods for User ID: <span className="font-semibold">{userId}</span>
            </p>
          </div>

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

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Add Card Button */}
          {!showAddForm && (
            <div className="mb-6">
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
              >
                + Add New Card
              </button>
            </div>
          )}

          {/* Add Card Form */}
          {showAddForm && (
            <div className="card mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Payment Method</h2>
              <form onSubmit={handleAddCard} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stripe Payment Method Token
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={newCardToken}
                    onChange={(e) => setNewCardToken(e.target.value)}
                    placeholder="pm_card_visa"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Test tokens: <code className="bg-gray-100 px-1 rounded">pm_card_visa</code>,{' '}
                    <code className="bg-gray-100 px-1 rounded">pm_card_mastercard</code>,{' '}
                    <code className="bg-gray-100 px-1 rounded">pm_card_amex</code>
                  </p>
                </div>

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
                    disabled={addingCard}
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
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payment Methods List */}
          <div className="card">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Saved Cards</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-protega-teal"></div>
                <p className="mt-4 text-gray-600">Loading payment methods...</p>
              </div>
            ) : methods.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No payment methods found.</p>
                {!showAddForm && (
                  <button onClick={() => setShowAddForm(true)} className="btn-primary">
                    Add First Card
                  </button>
                )}
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
                      {!method.is_default && (
                        <button
                          onClick={() => handleSetDefault(method.id)}
                          className="px-3 py-1.5 text-sm text-protega-teal border border-protega-teal hover:bg-protega-teal hover:text-white rounded-lg font-semibold transition-colors"
                        >
                          Set Default
                        </button>
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
        </div>
      </main>

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
    </>
  );
}

