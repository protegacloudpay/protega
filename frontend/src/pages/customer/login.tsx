import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function CustomerLogin() {
  const router = useRouter();
  const [fingerprint, setFingerprint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate test fingerprint helper
  const generateTestFingerprint = () => {
    const random = Math.floor(Math.random() * 10000);
    const sample = `TEST-FINGERPRINT-${random}`;
    setFingerprint(sample);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Fingerprint entry (SDK-based in production)
      if (!fingerprint.trim()) {
        throw new Error('Please enter your fingerprint identifier');
      }

      // Use new biometric login endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/biometric-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fingerprint_sample: fingerprint,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Fingerprint not recognized');
      }

      const data = await response.json();
      
      // Store JWT token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('customer_id', data.user_id.toString());
        localStorage.setItem('protega_user_id', data.user_id.toString());
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

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center mb-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6">
                  <div className="text-6xl mb-4">👆</div>
                  <p className="font-semibold text-gray-900 mb-3">
                    Scan Your Fingerprint
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={fingerprint}
                  onChange={(e) => setFingerprint(e.target.value)}
                  placeholder="Enter fingerprint (e.g., TEST-FINGERPRINT-1234)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={generateTestFingerprint}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
                >
                  Generate
                </button>
              </div>
              <p className="text-xs text-gray-500">
                📱 In production, this would be captured by a hardware fingerprint reader
              </p>

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

