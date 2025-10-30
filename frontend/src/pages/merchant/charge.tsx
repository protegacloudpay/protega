import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

/**
 * Merchant Charge Terminal
 * 
 * Allows merchants to:
 * - Set charge amount for a customer
 * - Create a pending charge that customers can accept
 * - View charge status
 */

export default function MerchantCharge() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chargeCreated, setChargeCreated] = useState<any>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchant/create-charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount_cents: amountCents,
          description: description || 'Payment requested',
          currency: 'usd',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create charge');
      }

      const data = await response.json();
      setChargeCreated(data);
    } catch (err: any) {
      setError(err.message || 'Failed to create charge');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <>
      <Head>
        <title>Create Charge - Merchant Terminal</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-4xl mb-4">
                💳
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create Charge
              </h1>
              <p className="text-gray-600">
                Set the amount for a customer payment
              </p>
            </div>

            {chargeCreated ? (
              <div className="space-y-6">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
                  <div className="text-5xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-green-900 mb-2">
                    Charge Created!
                  </h2>
                  <p className="text-green-700 mb-4">
                    Share this charge ID with your customer
                  </p>
                  
                  <div className="bg-white rounded-lg p-6 mb-4">
                    <div className="text-sm text-gray-600 mb-2">Charge ID</div>
                    <div className="text-4xl font-bold text-gray-900 mb-4 font-mono">
                      {chargeCreated.charge_id}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Amount</div>
                        <div className="text-3xl font-bold text-gray-900">
                          ${formatAmount(chargeCreated.amount_cents)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Status</div>
                        <div className="text-xl font-bold text-blue-600">
                          {chargeCreated.status}
                        </div>
                      </div>
                    </div>
                    
                    {chargeCreated.description && (
                      <div className="mt-4">
                        <div className="text-sm text-gray-600">Description</div>
                        <div className="text-lg text-gray-800">
                          {chargeCreated.description}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-600">
                    Customer code: <span className="font-mono font-bold">{chargeCreated.customer_code}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setChargeCreated(null);
                      setAmount('');
                      setDescription('');
                      setError('');
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Create Another
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateCharge} className="space-y-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-2xl font-bold text-gray-600">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-4 text-3xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Coffee and pastry"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !amount}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg"
                >
                  {loading ? 'Creating Charge...' : 'Create Charge'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="text-gray-600 hover:text-gray-900 text-sm"
                  >
                    ← Back to Home
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

