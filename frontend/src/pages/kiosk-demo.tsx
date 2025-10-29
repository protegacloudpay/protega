import { useState, useEffect } from 'react';

/**
 * Kiosk Demo Mode
 * 
 * Fullscreen terminal interface for demos and pilots.
 * Big buttons, clear prompts, auto-reset after payment.
 */

type Step = 'idle' | 'amount' | 'scan' | 'processing' | 'success' | 'error';

export default function KioskDemoPage() {
  const [step, setStep] = useState<Step>('idle');
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [userId, setUserId] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [terminalKey, setTerminalKey] = useState('');
  const [merchantName, setMerchantName] = useState('Demo Store');

  // Load terminal config
  useEffect(() => {
    const key = localStorage.getItem('terminal_api_key') || '';
    const name = localStorage.getItem('merchant_name') || 'Demo Store';
    setTerminalKey(key);
    setMerchantName(name);
  }, []);

  // Auto-reset after success
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        resetTransaction();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const resetTransaction = () => {
    setStep('idle');
    setAmount('');
    setCustomAmount('');
    setUserId('');
    setFingerprint('');
    setMessage('');
    setError('');
  };

  const selectAmount = (value: string) => {
    setAmount(value);
    setStep('scan');
  };

  const handleCustomAmount = () => {
    if (customAmount && parseFloat(customAmount) > 0) {
      setAmount(customAmount);
      setStep('scan');
    }
  };

  const processPayment = async () => {
    if (!userId || !fingerprint) {
      setError('Please complete all fields');
      return;
    }

    setStep('processing');
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Terminal-Key': terminalKey || 'demo-key',
        },
        body: JSON.stringify({
          user_id: parseInt(userId),
          fingerprint_hash: fingerprint,
          amount_cents: Math.round(parseFloat(amount) * 100),
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'succeeded') {
        setMessage(data.message || 'Payment Successful!');
        setStep('success');
      } else {
        setError(data.detail || 'Payment failed');
        setStep('error');
        setTimeout(() => setStep('scan'), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      setStep('error');
      setTimeout(() => setStep('scan'), 3000);
    }
  };

  // Idle screen
  if (step === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-32 h-32 bg-white rounded-full mx-auto flex items-center justify-center text-6xl mb-6 animate-pulse">
              👆
            </div>
            <h1 className="text-6xl font-bold text-white mb-4">
              {merchantName}
            </h1>
            <p className="text-3xl text-blue-100">
              Tap to pay with your fingerprint
            </p>
          </div>

          <button
            onClick={() => setStep('amount')}
            className="bg-white text-blue-600 font-bold text-3xl py-8 px-16 rounded-3xl hover:scale-105 transition-transform shadow-2xl"
          >
            Start Payment
          </button>

          <div className="mt-12 text-white/60 text-xl">
            Powered by Protega CloudPay
          </div>
        </div>
      </div>
    );
  }

  // Amount selection
  if (step === 'amount') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-white text-center mb-12">
            Select Amount
          </h1>

          <div className="grid grid-cols-2 gap-6 mb-8">
            {['5.00', '10.00', '20.00', '50.00', '100.00', '200.00'].map((val) => (
              <button
                key={val}
                onClick={() => selectAmount(val)}
                className="bg-white hover:bg-blue-50 text-gray-900 font-bold text-5xl py-16 rounded-3xl hover:scale-105 transition-all shadow-2xl"
              >
                ${val}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="bg-white rounded-3xl p-8 mb-6">
            <label className="block text-2xl font-semibold text-gray-700 mb-4">
              Or enter custom amount:
            </label>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-16 pr-6 py-6 text-4xl font-bold border-4 border-gray-300 rounded-2xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <button
                onClick={handleCustomAmount}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-2xl px-12 rounded-2xl transition-colors"
              >
                Continue
              </button>
            </div>
          </div>

          <button
            onClick={resetTransaction}
            className="w-full text-white text-2xl py-4 hover:text-white/80 transition-colors"
          >
            ← Cancel
          </button>
        </div>
      </div>
    );
  }

  // Scan/Input screen
  if (step === 'scan') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600 to-cyan-700 p-8">
        <div className="max-w-3xl mx-auto">
          {/* Amount Display */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 text-center">
            <p className="text-2xl text-teal-100 mb-2">Payment Amount</p>
            <p className="text-8xl font-bold text-white">
              ${parseFloat(amount).toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-12 space-y-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-teal-100 rounded-full mx-auto flex items-center justify-center text-5xl mb-6">
                🆔
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                Customer Identification
              </h2>
            </div>

            {/* User ID */}
            <div>
              <label className="block text-2xl font-semibold text-gray-700 mb-4">
                Customer ID
              </label>
              <input
                type="number"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter ID..."
                className="w-full px-8 py-6 text-4xl border-4 border-gray-300 rounded-2xl focus:ring-4 focus:ring-teal-500 focus:border-teal-500 text-center font-bold"
                autoFocus
              />
            </div>

            {/* Fingerprint */}
            <div>
              <label className="block text-2xl font-semibold text-gray-700 mb-4">
                Scan Fingerprint
              </label>
              <input
                type="text"
                value={fingerprint}
                onChange={(e) => setFingerprint(e.target.value)}
                placeholder="Place finger on scanner..."
                className="w-full px-8 py-6 text-4xl border-4 border-gray-300 rounded-2xl focus:ring-4 focus:ring-teal-500 focus:border-teal-500 text-center font-bold"
              />
              <p className="text-center text-gray-500 mt-3 text-lg">
                💡 Demo: Use "test123"
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-4 border-red-200 text-red-700 px-8 py-6 rounded-2xl text-center text-2xl font-semibold">
                {error}
              </div>
            )}

            <button
              onClick={processPayment}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-4xl py-8 rounded-3xl transition-all shadow-2xl"
            >
              Complete Payment
            </button>

            <button
              onClick={resetTransaction}
              className="w-full text-gray-600 hover:text-gray-900 text-2xl py-4 font-semibold"
            >
              Cancel Transaction
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Processing
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 bg-white rounded-full mx-auto flex items-center justify-center text-6xl mb-8 animate-pulse">
            ⏳
          </div>
          <h1 className="text-6xl font-bold text-white mb-4">
            Processing...
          </h1>
          <p className="text-3xl text-blue-100">
            Please wait
          </p>
        </div>
      </div>
    );
  }

  // Success
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-40 h-40 bg-white rounded-full mx-auto flex items-center justify-center text-8xl mb-8 animate-bounce">
            ✅
          </div>
          <h1 className="text-7xl font-bold text-white mb-6">
            Payment Successful!
          </h1>
          <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-12 mb-8">
            <p className="text-3xl text-green-100 mb-4">Amount Charged</p>
            <p className="text-8xl font-bold text-white">
              ${parseFloat(amount).toFixed(2)}
            </p>
          </div>
          <p className="text-3xl text-green-100 mb-8">
            {message}
          </p>
          <p className="text-2xl text-white/60">
            Returning to home screen...
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-pink-700 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-32 h-32 bg-white rounded-full mx-auto flex items-center justify-center text-6xl mb-8">
            ❌
          </div>
          <h1 className="text-6xl font-bold text-white mb-6">
            Payment Failed
          </h1>
          <p className="text-3xl text-red-100 mb-8">
            {error}
          </p>
          <p className="text-2xl text-white/60">
            Please try again...
          </p>
        </div>
      </div>
    );
  }

  return null;
}

