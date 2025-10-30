import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

/**
 * Customer Charge Acceptance - Live Version
 * Receives real-time updates from merchant via WebSocket
 */

export default function CustomerAcceptChargeLive() {
  const router = useRouter();
  const { charge_id } = router.query;
  
  const [chargeId, setChargeId] = useState('');
  const [amount, setAmount] = useState('0.00');
  const [description, setDescription] = useState('Payment requested');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  
  const apiUrl = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    : 'http://localhost:8000';

  // Load initial charge data
  useEffect(() => {
    if (charge_id && typeof charge_id === 'string') {
      setChargeId(charge_id);
      loadChargeData(charge_id);
    }
  }, [charge_id]);

  // Setup WebSocket connection for live updates
  useEffect(() => {
    if (chargeId && !loading) {
      setupWebSocket(chargeId);
      
      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, [chargeId, loading]);

  const loadChargeData = async (cid: string) => {
    try {
      const response = await fetch(`${apiUrl}/customer/charge/${cid}`);
      
      if (!response.ok) {
        throw new Error('Charge not found');
      }

      const data = await response.json();
      setAmount((data.amount_cents / 100).toFixed(2));
      setDescription(data.description || 'Payment requested');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load charge');
      setLoading(false);
    }
  };

  const setupWebSocket = (cid: string) => {
    const wsProtocol = apiUrl.startsWith('https') ? 'wss://' : 'ws://';
    const wsHost = apiUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}${wsHost}/ws/charge/${cid}`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected successfully');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
        
        if (data.type === 'charge_update') {
          setAmount(data.data.amount);
          setDescription(data.data.description);
          console.log('Charge updated:', data.data);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    wsRef.current = ws;
  };

  return (
    <>
      <Head>
        <title>Accept Charge - Customer</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Status Indicator */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Payment Request
                </h1>
                <p className="text-gray-600">
                  Review and accept the charge
                </p>
              </div>
              <div className={`px-4 py-2 rounded-lg font-semibold ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isConnected ? '🟢 Live' : '🔴 Offline'}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 animate-spin">⏳</div>
                <p className="text-gray-600 text-lg">Loading charge details...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            ) : chargeId ? (
              <>
                {/* Charge Details */}
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6 mb-6">
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
                      <span className="font-mono font-semibold text-xs">{chargeId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className="text-blue-600 font-semibold">Pending</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method (Sample) */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                  <div className="bg-teal-50 border-2 border-teal-300 rounded-lg p-4">
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
                </div>

                {/* Accept Button */}
                <button className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg mb-4">
                  Accept & Pay
                </button>

                {/* Live Status */}
                {isConnected && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-semibold">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Connected - Updates appear instantly
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💳</div>
                <p className="text-gray-600 text-lg">
                  No charge ID provided
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
