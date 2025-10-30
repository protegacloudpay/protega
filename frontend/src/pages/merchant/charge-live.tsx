import { useState } from 'react';
import Head from 'next/head';

/**
 * Merchant Charge Terminal with Live Customer View
 * 
 * Shows merchant controls on the left and customer view on the right
 * All changes are live-synced
 */

export default function MerchantChargeLive() {
  const [amount, setAmount] = useState('10.00');
  const [description, setDescription] = useState('Payment for goods');
  const [chargeId, setChargeId] = useState('');
  const [customerUrl, setCustomerUrl] = useState('');

  const handleAmountChange = (newAmount: string) => {
    setAmount(newAmount);
    // If charge ID exists, update it on the customer side
    if (chargeId) {
      // Could update via API here
    }
  };

  const generateNewCharge = () => {
    const newId = `CHARGE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setChargeId(newId);
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    setCustomerUrl(`${baseUrl}/customer/accept-charge?charge_id=${newId}&amount=${amount}&description=${encodeURIComponent(description)}`);
  };

  return (
    <>
      <Head>
        <title>Live Charge Terminal</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Live Charge Terminal</h1>
            <p className="text-gray-400">Edit on the left, watch on the right in real-time</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* MERCHANT SIDE - LEFT */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-3xl">🏪</span>
                Merchant Control Panel
              </h2>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-3xl font-bold text-gray-600">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-4 text-4xl font-bold border-3 border-blue-500 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-transparent bg-blue-50"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this payment for?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Generate/Update Charge */}
              <button
                onClick={generateNewCharge}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg mb-4"
              >
                {chargeId ? 'Update Charge' : 'Create New Charge'}
              </button>

              {/* Charge Info */}
              {chargeId && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-700 mb-2">Charge ID:</div>
                  <div className="text-2xl font-bold text-blue-900 font-mono mb-3">{chargeId}</div>
                  <div className="text-xs text-blue-600 mb-3">
                    Share this URL with your customer:
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-300">
                    <div className="text-xs font-mono text-gray-800 break-all">
                      {customerUrl}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CUSTOMER SIDE - RIGHT (IFRAME/LIVE VIEW) */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-3xl">👤</span>
                Customer View (Live Preview)
              </h2>

              {chargeId ? (
                <div className="border-4 border-dashed border-teal-400 rounded-xl p-8 bg-teal-50">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-teal-100 rounded-full mx-auto flex items-center justify-center text-4xl mb-4">
                      💳
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      Payment Request
                    </h3>
                    <p className="text-gray-600">
                      Review and accept the charge
                    </p>
                  </div>

                  {/* Charge Details */}
                  <div className="bg-white rounded-lg p-6 mb-6">
                    <div className="text-center mb-4">
                      <div className="text-6xl font-bold text-gray-900 mb-2">
                        ${amount}
                      </div>
                      {description && (
                        <div className="text-lg text-gray-600">
                          {description}
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Charge ID</span>
                        <span className="font-mono font-semibold">{chargeId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status</span>
                        <span className="text-blue-600 font-semibold">Pending</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="bg-white rounded-lg p-4 border-2 border-teal-300 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">💳</div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          VISA •••• 4242
                        </div>
                        <div className="text-sm text-gray-600">
                          Default Payment Method
                        </div>
                      </div>
                      <div className="ml-auto text-2xl text-teal-600">✓</div>
                    </div>
                  </div>

                  {/* Accept Button */}
                  <button className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg">
                    Accept & Pay
                  </button>

                  <p className="text-center text-xs text-gray-500 mt-4">
                    This is a live preview of what your customer sees
                  </p>
                </div>
              ) : (
                <div className="border-4 border-dashed border-gray-300 rounded-xl p-12 text-center">
                  <div className="text-6xl mb-4">👁️</div>
                  <p className="text-gray-600 text-lg">
                    Create a charge on the left to see the customer view here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">How it works:</h3>
            <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
              <li>Set the amount and description on the left panel</li>
              <li>Click "Create New Charge" to generate a charge ID</li>
              <li>The customer view updates automatically on the right</li>
              <li>Share the charge URL with your customer</li>
              <li>As you edit the amount/description, the customer view updates in real-time</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}

