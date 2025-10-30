import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SelectCardModal, { SelectablePaymentMethod } from '../components/SelectCardModal';
import CardBadge from '../components/CardBadge';

/**
 * Merchant Terminal Page
 * 
 * Simple interface for merchants to process payments.
 * Just enter amount and customer scans fingerprint.
 */

export default function TerminalPage() {
  const router = useRouter();
  
  // Get terminal API key from URL or localStorage
  const [terminalKey, setTerminalKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [merchantName, setMerchantName] = useState('');
  
  const [amount, setAmount] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<SelectablePaymentMethod[]>([]);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedCardDetails, setSelectedCardDetails] = useState<SelectablePaymentMethod | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);

  // Load saved config
  useEffect(() => {
    // Load saved config
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('terminal_api_key');
      const savedName = localStorage.getItem('merchant_name');
      if (savedKey) {
        setTerminalKey(savedKey);
        setIsConfigured(true);
      }
      if (savedName) {
        setMerchantName(savedName);
      }
    }
  }, []);

  // Configure terminal
  const handleConfigure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalKey.trim()) {
      setError('Please enter your Terminal API Key');
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('terminal_api_key', terminalKey);
      localStorage.setItem('merchant_name', merchantName);
    }
    setIsConfigured(true);
    setError('');
  };

  // Quick amount buttons
  const setQuickAmount = (value: string) => {
    setAmount(value);
  };

  // Fetch payment methods when fingerprint is provided
  const fetchPaymentMethods = async (fingerprintSample: string) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching payment methods for fingerprint:', fingerprintSample);
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
      
      // First, identify the user by their fingerprint
      const identifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/identify-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fingerprint_sample: fingerprintSample,
        }),
      });

      console.log('Identify response status:', identifyResponse.status);
      
      if (!identifyResponse.ok) {
        const errorData = await identifyResponse.json().catch(() => ({}));
        console.error('Identify error:', errorData);
        throw new Error(errorData.detail || 'Could not identify customer');
      }

      const userData = await identifyResponse.json();
      console.log('User data:', userData);
      setCustomerId(userData.user_id);

      // Fetch their payment methods
      const methodsUrl = `${process.env.NEXT_PUBLIC_API_URL}/users/${userData.user_id}/payment-methods`;
      console.log('Fetching methods from:', methodsUrl);
      
      const methodsResponse = await fetch(methodsUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Methods response status:', methodsResponse.status);
      
      if (!methodsResponse.ok) {
        const errorData = await methodsResponse.json().catch(() => ({}));
        console.error('Methods error:', errorData);
        throw new Error(errorData.detail || 'Could not fetch payment methods');
      }

      const methodsData = await methodsResponse.json();
      console.log('Payment methods data:', methodsData);
      
      const methods: SelectablePaymentMethod[] = methodsData.items.map((pm: any) => ({
        provider_ref: pm.provider_payment_method_id,
        brand: pm.brand,
        last4: pm.last4,
        exp_month: pm.exp_month,
        exp_year: pm.exp_year,
        is_default: pm.is_default,
      }));

      console.log('Mapped methods:', methods);
      setPaymentMethods(methods);

      // Auto-select default card
      const defaultCard = methods.find((m) => m.is_default);
      if (defaultCard) {
        setSelectedCard(defaultCard.provider_ref);
        setSelectedCardDetails(defaultCard);
      } else if (methods.length > 0) {
        setSelectedCard(methods[0].provider_ref);
        setSelectedCardDetails(methods[0]);
      }
    } catch (err: any) {
      console.error('Fetch payment methods error:', err);
      setError(err.message || 'Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  // Handle card selection from modal
  const handleCardSelect = (provider_ref: string) => {
    setSelectedCard(provider_ref);
    const card = paymentMethods.find((m) => m.provider_ref === provider_ref);
    setSelectedCardDetails(card || null);
    setShowCardModal(false);
  };

  // Process payment
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          terminal_api_key: terminalKey,
          fingerprint_sample: fingerprint,
          amount_cents: Math.round(parseFloat(amount) * 100),
          currency: 'usd',
          ...(selectedCard ? { payment_method_provider_ref: selectedCard } : {}),
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'succeeded') {
        setMessage(data.message || '✅ Payment Successful!');
        // Clear form after successful payment
        setTimeout(() => {
          setAmount('');
          setFingerprint('');
          setSelectedCard('');
          setMessage('');
        }, 3000);
      } else {
        setError(data.detail || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Reset configuration
  const handleReset = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('terminal_api_key');
      localStorage.removeItem('merchant_name');
    }
    setIsConfigured(false);
    setTerminalKey('');
    setMerchantName('');
  };

  // Configuration screen
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏪 Terminal Setup
            </h1>
            <p className="text-gray-600">Configure your payment terminal</p>
          </div>

          <form onSubmit={handleConfigure} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="e.g., Joe's Coffee Shop"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terminal API Key *
              </label>
              <input
                type="password"
                value={terminalKey}
                onChange={(e) => setTerminalKey(e.target.value)}
                placeholder="Enter your terminal API key"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Activate Terminal
            </button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                ← Back to Home
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Payment screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {merchantName || 'Payment Terminal'}
            </h1>
            <p className="text-blue-200 text-sm">Ready to accept payments</p>
          </div>
          <button
            onClick={handleReset}
            className="text-white/80 hover:text-white text-sm px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Main Terminal */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handlePayment} className="space-y-6">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-6 text-5xl font-bold border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 text-right"
                  required
                />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-3">
              {['5.00', '10.00', '20.00', '50.00'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuickAmount(val)}
                  className="py-4 px-4 bg-gray-100 hover:bg-blue-100 text-gray-900 font-semibold rounded-xl transition-colors"
                >
                  ${val}
                </button>
              ))}
            </div>

            {/* Fingerprint Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Fingerprint
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fingerprint}
                  onChange={(e) => setFingerprint(e.target.value)}
                  placeholder="Enter fingerprint (e.g., TEST-FINGERPRINT-1234)"
                  className="flex-1 px-4 py-4 text-xl border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {fingerprint && paymentMethods.length === 0 && (
                  <button
                    type="button"
                    onClick={() => fetchPaymentMethods(fingerprint)}
                    disabled={loading}
                    className="px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors"
                  >
                    Load Cards
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 Enter the customer's fingerprint ID. In production, this would be captured by a hardware reader.
              </p>
            </div>

            {/* Card Selection */}
            {fingerprint && paymentMethods.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                
                {selectedCardDetails ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <CardBadge
                        brand={selectedCardDetails.brand}
                        last4={selectedCardDetails.last4}
                        expMonth={selectedCardDetails.exp_month}
                        expYear={selectedCardDetails.exp_year}
                        isDefault={selectedCardDetails.is_default}
                        large={true}
                      />
                    </div>
                    
                    {paymentMethods.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setShowCardModal(true)}
                        className="w-full px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-semibold transition-colors"
                      >
                        Choose Different Card ({paymentMethods.length} available)
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCardModal(true)}
                    className="w-full px-4 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                  >
                    Select Payment Card
                  </button>
                )}
              </div>
            )}

            {/* Messages */}
            {message && (
              <div className="bg-green-50 border-2 border-green-200 text-green-700 px-6 py-4 rounded-xl text-center font-semibold text-lg">
                {message}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-6 px-6 rounded-2xl transition-all text-2xl shadow-lg"
            >
              {loading ? 'Processing...' : '💳 Charge Customer'}
            </button>

            <div className="flex justify-between pt-4 text-sm">
              <button
                type="button"
                onClick={() => {
                  setAmount('');
                  setFingerprint('');
                  setSelectedCard('');
                  setSelectedCardDetails(null);
                  setPaymentMethods([]);
                  setCustomerId(null);
                  setMessage('');
                  setError('');
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Clear Form
              </button>
              <button
                type="button"
                onClick={() => router.push('/merchant/dashboard')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View Dashboard →
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <h3 className="text-white font-semibold mb-2">How it works:</h3>
          <ol className="text-blue-100 text-sm space-y-1">
            <li>1. Enter payment amount or use quick buttons</li>
            <li>2. Customer scans fingerprint and clicks "Load Cards"</li>
            <li>3. Select payment method (if customer has multiple cards)</li>
            <li>4. Click "Charge Customer" - Done!</li>
          </ol>
        </div>
      </div>

      {/* Card Selection Modal */}
      <SelectCardModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        methods={paymentMethods}
        onSelect={handleCardSelect}
      />
    </div>
  );
}

