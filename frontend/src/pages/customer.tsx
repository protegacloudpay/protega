import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { enrollUser } from '../lib/api';

/**
 * Customer App Page
 * 
 * Clean interface for customers to:
 * - Enroll (one-time setup)
 * - Manage payment cards
 * - View profile
 */

type View = 'welcome' | 'enroll' | 'success';

export default function CustomerPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    fingerprint_hash: '',
    stripe_payment_method_token: '',
  });

  const [enrolledUserId, setEnrolledUserId] = useState<number | null>(null);

  // Card details for display
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [zip, setZip] = useState('');

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // In real app: Get actual Stripe token
      // For demo: Use test token
      const testToken = 'tok_visa'; // Stripe test token for 4242...

      const enrollData = {
        ...formData,
        stripe_payment_method_token: testToken,
      };

      const response = await enrollUser(enrollData);
      
      if (response.user_id) {
        setEnrolledUserId(response.user_id);
        setView('success');
        
        // Save for quick access
        localStorage.setItem('protega_user_id', response.user_id.toString());
      }
    } catch (err: any) {
      setError(err.message || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  // Welcome screen
  if (view === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full mx-auto flex items-center justify-center text-5xl mb-4">
                👆
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Protega CloudPay
              </h1>
              <p className="text-gray-600">
                Pay with just your fingerprint
              </p>
            </div>

            <div className="space-y-4 my-8">
              <div className="flex items-start gap-3 text-left">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Enroll Once</h3>
                  <p className="text-sm text-gray-600">Register your fingerprint and payment card</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Pay Anywhere</h3>
                  <p className="text-sm text-gray-600">Just scan your finger at checkout</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">That's It!</h3>
                  <p className="text-sm text-gray-600">No phone, no wallet needed</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setView('enroll')}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg mb-4"
            >
              Get Started
            </button>

            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (view === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full mx-auto flex items-center justify-center text-5xl mb-6">
              ✅
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              You're All Set!
            </h1>
            <p className="text-gray-600 mb-6">
              Your account has been created successfully
            </p>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Your Customer ID</p>
              <p className="text-4xl font-bold text-gray-900 mb-3">
                {enrolledUserId}
              </p>
              <p className="text-xs text-gray-500">
                💡 Save this ID to make payments
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push(`/merchant/customers/${enrolledUserId}/methods`)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Manage Payment Cards
              </button>

              <button
                onClick={() => router.push('/terminal')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Make a Payment
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full text-gray-600 hover:text-gray-900 py-2"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enrollment form
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your Account
            </h1>
            <p className="text-gray-600">Quick setup - takes less than 2 minutes</p>
          </div>

          <form onSubmit={handleEnroll} className="space-y-6">
            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="John"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="555-0100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>

            {/* Fingerprint */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fingerprint Registration *
              </label>
              <input
                type="text"
                value={formData.fingerprint_hash}
                onChange={(e) => setFormData({ ...formData, fingerprint_hash: e.target.value })}
                placeholder="Scan your fingerprint..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Demo: Use "test123" or any text
              </p>
            </div>

            {/* Card Info (for display - not actually used, we use Stripe test token) */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Card</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  💳 <strong>Demo Mode:</strong> Automatically using Stripe test card (4242...)
                </p>
              </div>

              <p className="text-xs text-gray-500">
                In production: Real card entry with Stripe Elements
              </p>
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
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg"
            >
              {loading ? 'Creating Account...' : 'Complete Enrollment'}
            </button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => setView('welcome')}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                ← Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

