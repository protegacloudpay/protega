import { useState } from 'react';
import { useRouter } from 'next/router';
import { enrollUser, sendOTP, verifyOTP } from '../lib/api';
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
    finger_label: 'right_index',
    stripe_token: '',
  });

  const [enrolledUserId, setEnrolledUserId] = useState<number | null>(null);
  const [cardSaved, setCardSaved] = useState(false);
  
  // Phone verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  const handleCardTokenGenerated = (token: string) => {
    setFormData({ ...formData, stripe_token: token });
    setCardSaved(true);
  };

  const handleSendOTP = async () => {
    if (!formData.phone) {
      setError('Please enter your phone number first');
      return;
    }

    setLoading(true);
    setError('');
    setPhoneVerified(false); // Reset verification status

    try {
      const response = await sendOTP(formData.phone);
      setOtpSent(true);
      // In development, show the code
      if (response.code_preview && !response.code_preview.includes('***')) {
        setOtpCode(response.code_preview);
      }
      alert(`Verification code sent to ${formData.phone}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!formData.phone || !verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await verifyOTP(formData.phone, verificationCode);
      setPhoneVerified(true);
      alert('✅ Phone verified successfully!');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
      setPhoneVerified(false);
    } finally {
      setLoading(false);
    }
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

      // Validate phone verification if OTP was sent
      if (otpSent && !phoneVerified) {
        setError('Please verify your phone number first');
        setLoading(false);
        return;
      }

      const enrollData = {
        email: formData.email,
        full_name: `${formData.first_name} ${formData.last_name}`,
        phone: formData.phone,
        otp_code: phoneVerified ? verificationCode : undefined,  // Include OTP verification code if verified
        fingerprint_sample: formData.fingerprint_sample,
        finger_label: formData.finger_label,
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
          localStorage.setItem('customer_id', response.user_id.toString());
          localStorage.setItem('customer_email', formData.email);
          localStorage.setItem('customer_phone', formData.phone);
          localStorage.setItem('customer_name', `${formData.first_name} ${formData.last_name}`);
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
                onClick={() => router.push('/customer/profile')}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Manage My Cards
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
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    // Format phone number as user types
                    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                    if (value.length > 0) {
                      if (value.length <= 1) {
                        value = '+1' + value;
                      } else if (value.length <= 4) {
                        value = '+1 (' + value.slice(1);
                      } else if (value.length <= 7) {
                        value = '+1 (' + value.slice(1, 4) + ') ' + value.slice(4);
                      } else {
                        value = '+1 (' + value.slice(1, 4) + ') ' + value.slice(4, 7) + '-' + value.slice(7, 11);
                      }
                    }
                    setFormData({ ...formData, phone: value });
                  }}
                  placeholder="+1 (555) 123-4567"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading || !formData.phone || otpSent}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
                >
                  {otpSent ? '✓ Sent' : 'Send Code'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Format: +1 (xxx) xxx-xxxx - We'll send a verification code to verify your number
              </p>
              
              {/* OTP Code Input */}
              {otpSent && (
                <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Enter Verification Code *
                  </label>
                  {otpCode && (
                    <div className="mb-2 p-2 bg-white rounded border border-blue-300">
                      <p className="text-xs text-blue-700 font-mono">
                        📱 Dev Code: {otpCode}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="flex-1 px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                      maxLength={6}
                      disabled={loading || phoneVerified}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={loading || verificationCode.length !== 6 || phoneVerified}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
                    >
                      {phoneVerified ? '✓ Verified' : 'Verify'}
                    </button>
                  </div>
                  {phoneVerified && (
                    <p className="text-xs text-green-700 mt-2 text-center font-semibold">
                      ✅ Phone number verified successfully!
                    </p>
                  )}
                  {!phoneVerified && (
                    <p className="text-xs text-blue-700 mt-2">
                      Check your SMS for the verification code (valid for 5 minutes)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Fingerprint Registration */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Fingerprint Registration</h3>
              
              {/* Finger Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which Finger? *
                </label>
                <select
                  value={formData.finger_label}
                  onChange={(e) => setFormData({ ...formData, finger_label: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="right_thumb">Right Thumb</option>
                  <option value="right_index">Right Index Finger</option>
                  <option value="right_middle">Right Middle Finger</option>
                  <option value="left_thumb">Left Thumb</option>
                  <option value="left_index">Left Index Finger</option>
                  <option value="left_middle">Left Middle Finger</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  💡 You can register up to 3 fingers. Choose your most convenient finger first.
                </p>
              </div>

              {/* Fingerprint Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fingerprint Sample *
                </label>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6 text-center">
                  <div className="text-6xl mb-4">👆</div>
                  <p className="font-semibold text-gray-900 mb-3">
                    Scan Your Fingerprint
                  </p>
                  <input
                    type="text"
                    value={formData.fingerprint_sample}
                    onChange={(e) => setFormData({ ...formData, fingerprint_sample: e.target.value })}
                    placeholder="Place finger on scanner (e.g., SAMPLE-FP-001)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
                    required
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    📱 In production, this would be captured by a hardware fingerprint reader
                  </p>
                </div>
              </div>
            </div>

            {/* Card Info */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Card Information</h3>
              
              {!cardSaved ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Enter your card details securely. Your card information is encrypted and processed directly by our payment provider. We never see your full card number.
                  </p>
                  <div className="relative">
                    <CardEntry onTokenGenerated={handleCardTokenGenerated} />
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg text-center">
                  <div className="text-5xl mb-3">✅</div>
                  <p className="text-lg font-bold text-green-800 mb-2">
                    Card Added Successfully!
                  </p>
                  <p className="text-sm text-green-700">
                    Your payment method has been securely added and is ready to use.
                  </p>
                </div>
              )}
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

