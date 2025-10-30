import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface PaymentMethod {
  id: number;
  provider: string;
  last4: string;
  brand: string;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
}

/**
 * Customer Charge Acceptance Terminal
 * 
 * Allows customers to:
 * - View pending charge details
 * - Select payment method
 * - Accept or decline the charge
 */

export default function CustomerAcceptCharge() {
  const router = useRouter();
  const { charge_id, amount, description } = router.query;
  
  const [chargeId, setChargeId] = useState('');
  const [chargeData, setChargeData] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (charge_id && typeof charge_id === 'string') {
      setChargeId(charge_id);
      
      // If amount/description are in URL, show them directly (from merchant live view)
      if (amount && description) {
        setChargeData({
          charge_id: charge_id,
          amount_cents: Math.round(parseFloat(amount as string) * 100),
          description: description,
          merchant_name: "Merchant",
          status: "pending"
        });
      } else {
        // Otherwise load from API
        loadChargeDetails(charge_id);
      }
    }
  }, [charge_id, amount, description]);

  const loadChargeDetails = async (cid: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/charge/${cid}`);
      
      if (!response.ok) {
        throw new Error('Charge not found');
      }

      const data = await response.json();
      setChargeData(data);
      setPaymentMethods(data.payment_methods || []);
      
      // Select default payment method if available
      const defaultMethod = data.payment_methods?.find((pm: PaymentMethod) => pm.is_default);
      if (defaultMethod) {
        setSelectedMethod(defaultMethod.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load charge details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitChargeId = (e: React.FormEvent) => {
    e.preventDefault();
    if (chargeId) {
      loadChargeDetails(chargeId);
    }
  };

  const handleAcceptCharge = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/charge/${chargeId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method_id: selectedMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to process payment');
      }

      const data = await response.json();
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setLoading(false);
    }
  };

  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <>
      <Head>
        <title>Accept Charge - Customer Terminal</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-teal-100 rounded-full mx-auto flex items-center justify-center text-4xl mb-4">
                💳
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Payment Request
              </h1>
              <p className="text-gray-600">
                Review and accept the charge
              </p>
            </div>

            {success ? (
              <div className="space-y-6">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
                  <div className="text-5xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-green-900 mb-2">
                    Payment Accepted!
                  </h2>
                  <p className="text-green-700 mb-4">
                    Your payment has been processed successfully
                  </p>
                </div>

                <button
                  onClick={() => router.push('/customer/profile')}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  View My Account
                </button>
              </div>
            ) : !chargeData ? (
              <form onSubmit={handleSubmitChargeId} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Charge ID
                  </label>
                  <input
                    type="text"
                    value={chargeId}
                    onChange={(e) => setChargeId(e.target.value)}
                    placeholder="Enter charge ID from merchant"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-center font-mono"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Ask the merchant for the charge ID
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !chargeId}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg"
                >
                  {loading ? 'Loading...' : 'Load Charge'}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Charge Details */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Charge Details</h3>
                  
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-gray-900">
                      ${formatAmount(chargeData.amount_cents)}
                    </div>
                    {chargeData.description && (
                      <div className="text-gray-600 mt-2">
                        {chargeData.description}
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Charge ID</span>
                      <span className="font-mono font-semibold">{chargeData.charge_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Merchant</span>
                      <span className="font-semibold">{chargeData.merchant_name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className="text-blue-600 font-semibold">{chargeData.status}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>
                  
                  {paymentMethods.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-yellow-800">
                        No payment methods available. Please add a card first.
                      </p>
                      <button
                        onClick={() => router.push('/customer/profile')}
                        className="mt-3 text-yellow-900 font-semibold underline"
                      >
                        Add Payment Method →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedMethod(method.id)}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                            selectedMethod === method.id
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">
                                {method.brand === 'visa' && '💳'}
                                {method.brand === 'mastercard' && '💳'}
                                {method.brand === 'amex' && '💳'}
                                {!['visa', 'mastercard', 'amex'].includes(method.brand) && '💳'}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {method.brand.toUpperCase()} •••• {method.last4}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Expires {method.expiry_month}/{method.expiry_year}
                                  {method.is_default && (
                                    <span className="ml-2 text-teal-600 font-semibold">(Default)</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {selectedMethod === method.id && (
                              <div className="text-2xl">✓</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setChargeData(null);
                      setChargeId('');
                      setError('');
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAcceptCharge}
                    disabled={loading || !selectedMethod}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg"
                  >
                    {loading ? 'Processing...' : 'Accept & Pay'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

