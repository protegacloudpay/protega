import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { processPayment, PayRequest } from '@/lib/api';
import SelectCardModal, { SelectablePaymentMethod } from '@/components/SelectCardModal';

// Feature flag for card selection
const ENABLE_CARD_SELECTION = true;

export default function Kiosk() {
  const [formData, setFormData] = useState<PayRequest>({
    terminal_api_key: '',
    fingerprint_sample: '',
    amount_cents: 2000,
    currency: 'usd',
    payment_method_provider_ref: undefined,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    transactionId: number;
    message: string;
    brand?: string;
    last4?: string;
  } | null>(null);
  
  // Card selection modal state
  const [showCardModal, setShowCardModal] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<SelectablePaymentMethod[]>([]);
  const [selectedCardDisplay, setSelectedCardDisplay] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await processPayment(formData);
      
      if (response.status === 'succeeded') {
        // Try to extract card info from the message or use selected card display
        setSuccess({
          transactionId: response.transaction_id!,
          message: response.message,
          brand: selectedCardDisplay.split(' ')[0] || undefined,
          last4: selectedCardDisplay.match(/\d{4}$/)?.[0] || undefined,
        });
      } else {
        setError(response.message || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCardSelection = () => {
    // In production, this would call a preview endpoint to get available methods
    // For now, we'll show a modal with test cards that the user can select
    // Merchant would need to know the actual payment method IDs
    setShowCardModal(true);
  };

  const handleCardSelect = (provider_ref: string) => {
    const selectedMethod = availableMethods.find(m => m.provider_ref === provider_ref);
    if (selectedMethod) {
      setFormData({ ...formData, payment_method_provider_ref: provider_ref });
      setSelectedCardDisplay(`${selectedMethod.brand} ••${selectedMethod.last4}`);
    }
    setShowCardModal(false);
  };

  const handleUseDefault = () => {
    setFormData({ ...formData, payment_method_provider_ref: undefined });
    setSelectedCardDisplay('');
  };

  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const resetForm = () => {
    setSuccess(null);
    setError(null);
    setSelectedCardDisplay('');
    setAvailableMethods([]);
    setFormData({
      ...formData,
      fingerprint_sample: '',
      payment_method_provider_ref: undefined,
    });
  };

  return (
    <>
      <Head>
        <title>Payment Kiosk - Protega CloudPay</title>
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

        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Payment Kiosk</h1>
          <p className="text-gray-600 mb-8">
            Demo terminal for testing biometric payments. Place your finger to pay.
          </p>

          {success ? (
            <div className="card">
              <div className="success-banner mb-6">
                ✅ Transaction Approved
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Transaction ID</p>
                  <p className="text-2xl font-bold text-protega-teal">{success.transactionId}</p>
                </div>
                {selectedCardDisplay && (
                  <div>
                    <p className="text-sm text-gray-600">Charged Card</p>
                    <p className="text-xl font-semibold">{selectedCardDisplay}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Amount Charged</p>
                  <p className="text-3xl font-bold">${formatAmount(formData.amount_cents)}</p>
                </div>
                <div className="pt-4 border-t">
                  <button onClick={resetForm} className="btn-primary w-full">
                    Process Another Payment
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card">
              {error && (
                <div className="error-banner mb-6">
                  ❌ {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Terminal API Key
                  </label>
                  <input
                    type="text"
                    required
                    className="input font-mono text-sm"
                    value={formData.terminal_api_key}
                    onChange={(e) => setFormData({ ...formData, terminal_api_key: e.target.value })}
                    placeholder="Get from merchant signup"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Create a merchant account via API docs at <code className="bg-gray-100 px-1 rounded">/docs</code> to get an API key
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border-2 border-dashed border-slate-300">
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-2">👆</div>
                    <p className="font-semibold text-slate-700">Place Your Finger Here</p>
                  </div>
                  
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fingerprint Sample
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.fingerprint_sample}
                    onChange={(e) => setFormData({ ...formData, fingerprint_sample: e.target.value })}
                    placeholder="DEMO-FINGER-001 (must match enrollment)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Use the EXACT same string you used during enrollment
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount (in cents)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      required
                      min="1"
                      className="input"
                      value={formData.amount_cents}
                      onChange={(e) => setFormData({ ...formData, amount_cents: parseInt(e.target.value) })}
                    />
                    <div className="text-3xl font-bold text-protega-teal">
                      ${formatAmount(formData.amount_cents)}
                    </div>
                  </div>
                </div>

                {/* Card Selection Section */}
                {ENABLE_CARD_SELECTION && (
                  <div className="border-t pt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Payment Method Selection (Optional)
                    </label>
                    
                    {selectedCardDisplay ? (
                      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Selected Card:</p>
                            <p className="font-semibold text-protega-teal text-lg">{selectedCardDisplay}</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleUseDefault}
                            className="text-sm text-gray-600 hover:text-gray-800 underline"
                          >
                            Use Default
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                        <p className="text-sm text-gray-600">Using default payment method</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Or enter specific Payment Method ID:
                      </label>
                      <input
                        type="text"
                        className="input text-sm"
                        value={formData.payment_method_provider_ref || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, payment_method_provider_ref: value || undefined });
                          if (value) {
                            setSelectedCardDisplay(`Custom (${value.slice(0, 10)}...)`);
                          } else {
                            setSelectedCardDisplay('');
                          }
                        }}
                        placeholder="pm_xxx (optional - for testing specific cards)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Leave empty to use default card, or enter a specific Stripe payment method ID
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-xl py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : '💳 Process Payment'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 card bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Create a merchant account at <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="underline">localhost:8000/docs</a></li>
              <li>Copy the terminal API key from the response</li>
              <li>Enroll at <Link href="/enroll" className="underline">/enroll</Link> with a fingerprint sample (e.g., "DEMO-FINGER-001")</li>
              <li>Return here and use the same fingerprint sample to make a payment</li>
              <li><strong>Multi-card testing:</strong> Add multiple payment methods via the merchant dashboard, then optionally specify which card to charge by entering its payment method ID</li>
            </ol>
          </div>
        </div>
      </main>

      {/* Card Selection Modal */}
      <SelectCardModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        methods={availableMethods}
        onSelect={handleCardSelect}
      />
    </>
  );
}
