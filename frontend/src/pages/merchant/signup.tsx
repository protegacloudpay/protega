import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

interface SignupResponse {
  merchant_id: number;
  email: string;
  name: string;
  terminal_api_key: string;
  message: string;
}

export default function MerchantSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupRequest>({
    name: '',
    email: '',
    password: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SignupResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchant/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Signup failed');
      }

      setSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <>
        <Head>
          <title>Account Created - Protega CloudPay</title>
        </Head>

        <main className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center text-5xl mb-4">
                  ✅
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Account Created Successfully!
                </h1>
                <p className="text-gray-600">
                  Welcome to Protega CloudPay, {success.name}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔑</span> Your Terminal API Key
                </h2>
                <div className="bg-white border-2 border-blue-200 rounded-lg p-4 mb-3">
                  <code className="text-sm text-gray-800 break-all">
                    {success.terminal_api_key}
                  </code>
                </div>
                <p className="text-sm text-red-600 font-medium">
                  ⚠️ Save this key! You won't be able to see it again.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>Copy your Terminal API Key above</li>
                  <li>Go to the Payment Terminal</li>
                  <li>Enter your API Key to activate it</li>
                  <li>Start accepting payments!</li>
                </ol>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/terminal')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Go to Payment Terminal
                </button>

                <button
                  onClick={() => router.push('/merchant/login')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Go to Login
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
        </main>
      </>
    );
  }

  // Signup form
  return (
    <>
      <Head>
        <title>Merchant Signup - Protega CloudPay</title>
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-protega-teal rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-slate-900 font-bold text-xl">Protega CloudPay</span>
            </Link>
            <div className="flex space-x-4">
              <Link href="/merchant/login" className="text-protega-teal hover:text-protega-teal-dark transition-colors">
                Already have an account? Login
              </Link>
            </div>
          </div>
        </nav>

        {/* Signup Form */}
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create Merchant Account
              </h1>
              <p className="text-gray-600">
                Start accepting biometric payments
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Joe's Coffee Shop"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-protega-teal focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="joe@coffeeshop.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-protega-teal focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-protega-teal focus:border-transparent"
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-protega-teal hover:bg-protega-teal-dark disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/merchant/login" className="text-protega-teal hover:text-protega-teal-dark text-sm">
                Already have an account? Login
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

