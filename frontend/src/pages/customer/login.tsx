import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { verifyBiometric, getBiometricCapabilities } from '@/lib/webauthn';

export default function CustomerLogin() {
  const router = useRouter();
  const [fingerprint, setFingerprint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [deviceType, setDeviceType] = useState('');

  useEffect(() => {
    async function checkBiometric() {
      const capabilities = await getBiometricCapabilities();
      setBiometricAvailable(capabilities.available);
      setDeviceType(capabilities.deviceType);
    }
    checkBiometric();
  }, []);

  const handleFingerprintScan = async () => {
    setLoading(true);
    setError('');

    try {
      const storedCredential = localStorage.getItem('protega_fingerprint_credential');
      if (!storedCredential) {
        throw new Error('No biometric credential found. Please enroll first.');
      }

      await verifyBiometric(storedCredential);
      setFingerprint(storedCredential);
      
      // Identify user by fingerprint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/identify-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fingerprint_sample: storedCredential,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not identify customer');
      }

      const data = await response.json();
      
      // Store customer ID and user info in session
      if (typeof window !== 'undefined') {
        localStorage.setItem('customer_id', data.user_id.toString());
        localStorage.setItem('protega_user_id', data.user_id.toString());
        if (data.email) {
          localStorage.setItem('customer_email', data.email);
        }
        if (data.full_name) {
          localStorage.setItem('customer_name', data.full_name);
        }
        if (data.phone) {
          localStorage.setItem('customer_phone', data.phone);
        }
      }

      // Redirect to customer profile
      router.push(`/customer/profile`);
    } catch (err: any) {
      setError(err.message || 'Biometric verification failed');
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Manual fingerprint entry
      if (!fingerprint.trim()) {
        throw new Error('Please enter your fingerprint identifier');
      }

      // Identify user by fingerprint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/identify-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fingerprint_sample: fingerprint,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not identify customer');
      }

      const data = await response.json();
      
      // Store customer ID and user info in session
      if (typeof window !== 'undefined') {
        localStorage.setItem('customer_id', data.user_id.toString());
        localStorage.setItem('protega_user_id', data.user_id.toString());
        if (data.email) {
          localStorage.setItem('customer_email', data.email);
        }
        if (data.full_name) {
          localStorage.setItem('customer_name', data.full_name);
        }
        if (data.phone) {
          localStorage.setItem('customer_phone', data.phone);
        }
      }

      // Redirect to customer profile
      router.push(`/customer/profile`);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Customer Login - Protega CloudPay</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full mx-auto flex items-center justify-center text-5xl mb-4">
                👆
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Customer Login
              </h1>
              <p className="text-gray-600">
                Sign in with your biometric identifier
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {biometricAvailable && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleFingerprintScan}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3"
                >
                  <span className="text-3xl">👆</span>
                  <span>{loading ? 'Verifying...' : `Scan with ${deviceType}`}</span>
                </button>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center mb-4 text-gray-500 text-sm">
                {biometricAvailable ? 'Or enter manually:' : 'Enter your fingerprint identifier:'}
              </div>

              <input
                type="text"
                value={fingerprint}
                onChange={(e) => setFingerprint(e.target.value)}
                placeholder={biometricAvailable ? "Manual entry..." : "Enter fingerprint (e.g., test123)"}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />

              <button
                type="submit"
                disabled={loading || !fingerprint.trim()}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <Link
                href="/customer"
                className="text-teal-600 hover:text-teal-700 text-sm font-semibold"
              >
                New customer? Enroll here →
              </Link>
              <br />
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

