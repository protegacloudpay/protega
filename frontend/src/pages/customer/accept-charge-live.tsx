import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

/**
 * Customer Charge Acceptance - Live Version
 * 
 * Receives real-time updates from merchant via WebSocket
 */

export default function CustomerAcceptChargeLive() {
  const router = useRouter();
  const { charge_id } = router.query;
  
  const [chargeId, setChargeId] = useState('');
  const [amount, setAmount] = useState('0.00');
  const [description, setDescription] = useState('Payment requested');
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (charge_id && typeof charge_id === 'string') {
      setChargeId(charge_id);
      
      // Connect to WebSocket for real-time updates
      const wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace('https://', 'wss://').replace('http://', 'ws://') || 'ws://localhost:8000';
      const ws = new WebSocket(`${wsUrl}/ws/charge/${charge_id}`);
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log('Connected to charge updates');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'charge_update') {
          console.log('Received charge update:', data.data);
          setAmount(data.data.amount);
          setDescription(data.data.description);
          setLastUpdate(new Date());
        }
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        console.log('Disconnected from charge updates');
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      return () => {
        ws.close();
      };
    }
  }, [charge_id]);

  const formatAmount = (amt: string) => {
    return parseFloat(amt).toFixed(2);
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

            {chargeId ? (
              <>
                {/* Charge Details */}
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6 mb-6">
                  <div className="text-center mb-4">
                    <div className="text-6xl font-bold text-gray-900 mb-2 animate-pulse">
                      ${formatAmount(amount)}
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
                    {lastUpdate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated</span>
                        <span className="text-green-600 font-semibold text-xs">
                          {lastUpdate.toLocaleTimeString()}
                        </span>
                      </div>
                    )}
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
                      Connected to Merchant - Updates appear instantly
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💳</div>
                <p className="text-gray-600 text-lg">
                  Waiting for merchant to create a charge...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

