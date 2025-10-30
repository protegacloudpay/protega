import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { enrollUser } from '../lib/api';
import { 
  isPlatformAuthenticatorAvailable, 
  registerBiometric, 
  getBiometricCapabilities 
} from '../lib/webauthn';
import CardEntry from '../components/CardEntry';

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
    fingerprint_sample: '',
    stripe_token: '',
  });

  const [enrolledUserId, setEnrolledUserId] = useState<number | null>(null);
  
  // Touch ID / WebAuthn state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [deviceType, setDeviceType] = useState('');
  const [useTouchID, setUseTouchID] = useState(false);
  
  // Card entry mode
  const [cardEntryMode, setCardEntryMode] = useState<'manual' | 'stripe'>('manual');
  const [cardSaved, setCardSaved] = useState(false);

  // Check for biometric availability
  useEffect(() => {
    async function checkBiometric() {
      const capabilities = await getBiometricCapabilities();
      setBiometricAvailable(capabilities.available);
      setDeviceType(capabilities.deviceType);
    }
    checkBiometric();
  }, []);

  const handleScanTouchID = async () => {
    setLoading(true);
    setError('');

    try {
      // Prompt for Touch ID / biometric scan
      const credentialId = await registerBiometric(
        formData.email || 'user@example.com',
        `${formData.first_name} ${formData.last_name}` || 'User'
      );

      // Use the credential ID as the fingerprint sample
      setFormData({ ...formData, fingerprint_sample: credentialId });
      setUseTouchID(true);
      setError('');
      
      // Store credential for payment verification
      if (typeof window !== 'undefined') {
        localStorage.setItem('protega_fingerprint_credential', credentialId);
      }
      
      // Show success feedback
      alert('✅ Biometric scan successful! Your fingerprint has been registered.');
    } catch (err: any) {
      setError(err.message || 'Biometric scan failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCardTokenGenerated = (token: string) => {
    setFormData({ ...formData, stripe_token: token });
    setCardSaved(true);
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate that a token is provided
      if (!formData.stripe_token || !formData.stripe_token.trim()) {
        setError('Please provide a Stripe payment method token');
        setLoading(false);
        return;
      }

      const enrollData = {
        email: formData.email,
        full_name: `${formData.first_name} ${formData.last_name}`,
        phone_number: formData.phone,
        fingerprint_sample: formData.fingerprint_sample,
        consent_text: 'I consent to Protega CloudPay storing my biometric data for payment authentication',
        stripe_payment_method_token: formData.stripe_token.trim(),
      };

      const response = await enrollUser(enrollData);
      
      if (response.user_id) {
        setEnrolledUserId(response.user_id);
        setView('success');
        
        // Save for quick access
        if (typeof window !== 'undefined') {
          localStorage.setItem('protega_user_id', response.user_id.toString());
          localStorage.setItem('protega_used_touchid', useTouchID ? 'true' : 'false');
        }
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
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for account verification and payment confirmations
              </p>
            </div>

            {/* Fingerprint */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fingerprint Registration *
              </label>
              
              {/* Touch ID Available */}
              {biometricAvailable && (
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={handleScanTouchID}
                    disabled={loading || !formData.email || !formData.first_name}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3"
                  >
                    <span className="text-2xl">👆</span>
                    <span>Scan with {deviceType}</span>
                  </button>
                  {(!formData.email || !formData.first_name) && (
                    <p className="text-xs text-orange-600 mt-1">
                      💡 Fill in your name and email first
                    </p>
                  )}
                  {useTouchID && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ {deviceType} scan registered successfully!
                    </p>
                  )}
                </div>
              )}
              
              {/* Manual Input Fallback */}
              <div>
                {biometricAvailable && (
                  <p className="text-xs text-gray-500 mb-2">
                    Or enter manually (for testing):
                  </p>
                )}
                <input
                  type="text"
                  value={formData.fingerprint_sample}
                  onChange={(e) => {
                    setFormData({ ...formData, fingerprint_sample: e.target.value });
                    setUseTouchID(false);
                  }}
                  placeholder={biometricAvailable ? "Manual entry (optional)" : "Use 'test123' for demo"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                  readOnly={useTouchID}
                />
                {!biometricAvailable && (
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Demo Mode: Use "test123" or any text (no biometric sensor detected)
                  </p>
                )}
              </div>
            </div>

            {/* Card Info */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Card Information</h3>
              
              <div className="space-y-4">
                {/* Card Entry Mode Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setCardEntryMode('stripe')}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                      cardEntryMode === 'stripe'
                        ? 'bg-teal-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    💳 Enter Card Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardEntryMode('manual')}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                      cardEntryMode === 'manual'
                        ? 'bg-teal-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    🔑 Manual Token Entry
                  </button>
                </div>

                {/* Stripe Card Entry Component */}
                {cardEntryMode === 'stripe' && (
                  <div>
                    {!cardSaved ? (
                      <>
                        <p className="text-sm text-gray-600 mb-3">
                          Enter your card details securely using Stripe. Your card information is encrypted and never stored on our servers.
                        </p>
                        <div className="relative">
                          <CardEntry onTokenGenerated={handleCardTokenGenerated} />
                        </div>
                      </>
                    ) : (
                      <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg text-center">
                        <div className="text-5xl mb-3">✅</div>
                        <p className="text-lg font-bold text-green-800 mb-2">
                          Card Saved Successfully!
                        </p>
                        <p className="text-sm text-green-700 mb-4">
                          Your card token: <code className="font-mono text-xs bg-white px-2 py-1 rounded border border-green-300">{formData.stripe_token}</code>
                        </p>
                        <p className="text-sm text-green-600">
                          You can now complete enrollment by filling in your information above and clicking "Enroll Now"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Token Entry */}
                {cardEntryMode === 'manual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Your Stripe Payment Token *
                    </label>
                    <input
                      type="text"
                      id="stripe_token"
                      value={formData.stripe_token || ''}
                      onChange={(e) => setFormData({ ...formData, stripe_token: e.target.value })}
                      placeholder="Enter your Stripe payment method token here"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
                      required
                    />
                    
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800 font-semibold mb-2">📝 What is this?</p>
                      <p className="text-xs text-blue-700 mb-2">
                        For testing: Use one of these Stripe test tokens:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <code className="bg-white px-3 py-1.5 rounded border border-blue-300 text-xs font-mono cursor-pointer hover:bg-blue-50" onClick={() => setFormData({ ...formData, stripe_token: 'pm_card_visa' })}>pm_card_visa</code>
                        <code className="bg-white px-3 py-1.5 rounded border border-blue-300 text-xs font-mono cursor-pointer hover:bg-blue-50" onClick={() => setFormData({ ...formData, stripe_token: 'pm_card_mastercard' })}>pm_card_mastercard</code>
                        <code className="bg-white px-3 py-1.5 rounded border border-blue-300 text-xs font-mono cursor-pointer hover:bg-blue-50" onClick={() => setFormData({ ...formData, stripe_token: 'pm_card_amex' })}>pm_card_amex</code>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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

