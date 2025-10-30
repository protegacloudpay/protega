import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

/**
 * Merchant Charge Terminal - Live Version
 * Creates charges and shares URL with customers for real-time viewing
 */

export default function MerchantChargeLive() {
  const [amount, setAmount] = useState('10.00');
  const [description, setDescription] = useState('');
  const [chargeId, setChargeId] = useState('');
  const [customerUrl, setCustomerUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const apiUrl = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    : 'http://localhost:8000';

  const handleCreateCharge = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      
      const response = await fetch(`${apiUrl}/merchant/create-charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: amountCents,
          description: description || 'Payment requested'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create charge');
      }

      const data = await response.json();
      const newId = data.charge_id;
      setChargeId(newId);
      
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${baseUrl}/customer/accept-charge-live?charge_id=${newId}`;
      setCustomerUrl(url);
      
      console.log('Charge created:', newId);
    } catch (err: any) {
      setError(err.message || 'Failed to create charge');
      console.error('Error creating charge:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (newAmount: string) => {
    setAmount(newAmount);
    
    // Auto-update charge if it exists
    if (chargeId && !loading) {
      updateCharge({ amount: newAmount });
    }
  };

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
    
    // Auto-update charge if it exists
    if (chargeId && !loading) {
      updateCharge({ description: newDescription });
    }
  };

  const updateCharge = async (updates: { amount?: string; description?: string }) => {
    if (!chargeId) return;

    try {
      const payload: any = {};
      if (updates.amount) {
        payload.amount = updates.amount;
      }
      if (updates.description !== undefined) {
        payload.description = updates.description;
      }

      const response = await fetch(`${apiUrl}/merchant/charge/${chargeId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('Failed to update charge');
      } else {
        console.log('Charge updated:', await response.json());
      }
    } catch (err) {
      console.error('Error updating charge:', err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(customerUrl);
    alert('Customer URL copied to clipboard!');
  };

  return (
    <>
      <Head>
        <title>Merchant Charge Terminal</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Merchant Charge Terminal</h1>
              <p className="text-gray-600">Create and manage charges for customers</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

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
                  disabled={loading}
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
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="What is this payment for?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Create Charge Button */}
            <button
              onClick={handleCreateCharge}
              disabled={loading || !amount}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg mb-6"
            >
              {loading ? 'Creating...' : (chargeId ? 'Create New Charge' : 'Create Charge')}
            </button>

            {/* Charge Info */}
            {chargeId && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  Charge Created Successfully!
                </h3>
                
                <div className="mb-4">
                  <div className="text-sm text-green-700 mb-1 font-semibold">Charge ID:</div>
                  <div className="text-2xl font-bold text-green-900 font-mono break-all">{chargeId}</div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-green-700 mb-2 font-semibold">Customer URL:</div>
                  <div className="bg-white p-3 rounded border border-green-300 mb-2">
                    <div className="text-xs font-mono text-gray-800 break-all">
                      {customerUrl}
                    </div>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg"
                  >
                    📋 Copy URL
                  </button>
                </div>

                <div className="bg-green-100 rounded-lg p-3 text-sm text-green-900 font-semibold">
                  📱 Open this URL on another screen/device to see the customer view!
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white bg-opacity-90 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3 text-lg">📱 How to Use:</h3>
            <ol className="text-sm text-gray-800 space-y-2 ml-4 list-decimal">
              <li>Enter the payment amount above</li>
              <li>(Optional) Add a description</li>
              <li>Click "Create Charge"</li>
              <li>Copy the Customer URL</li>
              <li>Open it on another screen/device or browser</li>
              <li>Edit the amount or description here - changes will sync to the customer view!</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
