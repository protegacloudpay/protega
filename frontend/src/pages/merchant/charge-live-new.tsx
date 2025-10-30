import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

/**
 * Merchant Charge Terminal with Real-Time WebSocket Updates
 * 
 * Merchant edits on this screen broadcast to customer screen in real-time
 */

export default function MerchantChargeLive() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [chargeId, setChargeId] = useState('');
  const [customerUrl, setCustomerUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (chargeId) {
      const wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace('https://', 'wss://').replace('http://', 'ws://') || 'ws://localhost:8000';
      const ws = new WebSocket(`${wsUrl}/ws/merchant/1`); // Using merchant ID 1 for now
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected');
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current = ws;
      
      return () => {
        ws.close();
      };
    }
  }, [chargeId]);

  const handleAmountChange = async (newAmount: string) => {
    setAmount(newAmount);
    
    if (chargeId && isConnected) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchant/charge/${chargeId}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: newAmount })
        });
        console.log('Update sent:', await response.json());
      } catch (error) {
        console.error('Failed to update charge:', error);
      }
    }
  };

  const handleDescriptionChange = async (newDescription: string) => {
    setDescription(newDescription);
    
    if (chargeId && isConnected) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchant/charge/${chargeId}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: newDescription })
        });
        console.log('Update sent:', await response.json());
      } catch (error) {
        console.error('Failed to update charge:', error);
      }
    }
  };

  const handleCreateCharge = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchant/create-charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: Math.round(parseFloat(amount) * 100),
          description: description || 'Payment requested'
        })
      });
      
      const data = await response.json();
      const newId = data.charge_id;
      setChargeId(newId);
      
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      setCustomerUrl(`${baseUrl}/customer/accept-charge-live?charge_id=${newId}`);
    } catch (error) {
      console.error('Failed to create charge:', error);
    }
  };

  return (
    <>
      <Head>
        <title>Merchant Charge Terminal</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Merchant Charge Terminal</h1>
                <p className="text-gray-600">Edit here - customer sees updates in real-time</p>
              </div>
              <div className={`px-4 py-2 rounded-lg font-semibold ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
            </div>

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
              <p className="text-xs text-gray-500 mt-1">
                Changes update customer view instantly
              </p>
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
              />
              <p className="text-xs text-gray-500 mt-1">
                Description syncs in real-time
              </p>
            </div>

            {/* Create Charge */}
            <button
              onClick={handleCreateCharge}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg mb-6"
            >
              {chargeId ? 'Update Charge' : 'Create New Charge'}
            </button>

            {/* Charge Info */}
            {chargeId && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">📋 Charge Created!</h3>
                
                <div className="mb-4">
                  <div className="text-sm text-blue-700 mb-1">Charge ID:</div>
                  <div className="text-2xl font-bold text-blue-900 font-mono">{chargeId}</div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-blue-700 mb-2">Customer URL:</div>
                  <div className="bg-white p-3 rounded border border-blue-300">
                    <div className="text-xs font-mono text-gray-800 break-all mb-2">
                      {customerUrl}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(customerUrl)}
                      className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>

                <div className="bg-blue-200 rounded-lg p-3 text-sm text-blue-900">
                  ✅ Open this URL on another screen/device to see the customer view update live as you edit!
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-white bg-opacity-90 rounded-xl p-6">
            <h3 className="font-bold text-white mb-2">📱 How to Use:</h3>
            <ol className="text-sm text-white space-y-1 ml-4 list-decimal">
              <li>Enter amount and description above</li>
              <li>Click "Create New Charge"</li>
              <li>Copy the Customer URL</li>
              <li>Open it on another screen/device</li>
              <li>Edit the amount or description here - watch it update instantly on the customer screen!</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}

