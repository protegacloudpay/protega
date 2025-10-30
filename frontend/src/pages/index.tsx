import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Protega CloudPay</title>
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100">
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
                Merchant Login
              </Link>
              <a href="https://protega-api.fly.dev/docs" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-protega-teal transition-colors">
                API Docs
              </a>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-slate-900 mb-4">
              Protega CloudPay
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Pay with just your fingerprint - no phone, no wallet needed
            </p>
          </div>

          {/* Customer Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              👤 For Customers
            </h2>
            <div className="grid md:grid-cols-1 gap-6">
              <div className="card hover:shadow-xl transition-shadow bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-protega-teal rounded-xl flex items-center justify-center">
                    <span className="text-3xl">👆</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Customer Portal</h3>
                    <p className="text-gray-600 mb-4 text-lg">
                      Create your account and register your fingerprint for biometric payments. One-time setup allows you to pay anywhere with just your finger.
                    </p>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className="px-3 py-1 bg-white border border-teal-200 rounded-full text-sm font-semibold text-teal-700">
                        Secure Biometric Authentication
                      </span>
                      <span className="px-3 py-1 bg-white border border-teal-200 rounded-full text-sm font-semibold text-teal-700">
                        Multiple Payment Methods
                      </span>
                      <span className="px-3 py-1 bg-white border border-teal-200 rounded-full text-sm font-semibold text-teal-700">
                        Universal Enrollment
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <Link href="/customer" className="flex-1 btn-primary text-center">
                        Enroll Now →
                      </Link>
                      <Link href="/customer/login" className="flex-1 px-6 py-3 bg-white border-2 border-teal-600 text-teal-600 hover:bg-teal-50 rounded-lg font-semibold transition-colors text-center">
                        Customer Login
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Merchant Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              🏪 For Merchants
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/merchant/charge-live-new" className="block">
                <div className="card hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                      <span className="text-3xl">💳</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Create Charge</h3>
                      <p className="text-gray-600 mb-4 text-lg">
                        Set an amount for a customer payment. Share the charge ID with the customer to process the payment.
                      </p>
                      <div className="flex flex-wrap gap-3 mb-4">
                        <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm font-semibold text-blue-700">
                          Set Amount
                        </span>
                        <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm font-semibold text-blue-700">
                          Share Charge ID
                        </span>
                        <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm font-semibold text-blue-700">
                          Customer Pays
                        </span>
                      </div>
                      <span className="text-blue-600 font-semibold text-lg">
                        Create Charge →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/merchant/dashboard" className="block">
                <div className="card hover:shadow-xl transition-shadow bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 h-16 bg-protega-teal rounded-xl flex items-center justify-center">
                      <span className="text-3xl">📊</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Merchant Dashboard</h3>
                      <p className="text-gray-600 mb-4 text-lg">
                        View transaction history, revenue analytics, and manage your payment terminals. Monitor your business in real-time.
                      </p>
                      <div className="flex flex-wrap gap-3 mb-4">
                        <span className="px-3 py-1 bg-white border border-teal-200 rounded-full text-sm font-semibold text-teal-700">
                          Transaction History
                        </span>
                        <span className="px-3 py-1 bg-white border border-teal-200 rounded-full text-sm font-semibold text-teal-700">
                          Revenue Analytics
                        </span>
                        <span className="px-3 py-1 bg-white border border-teal-200 rounded-full text-sm font-semibold text-teal-700">
                          Customer Management
                        </span>
                      </div>
                      <span className="text-protega-teal font-semibold text-lg">
                        View Dashboard →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* How It Works */}
          <div className="card bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              How It Works
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-lg text-slate-900 mb-3">For Customers</h4>
                <ol className="text-slate-700 space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold">1</span>
                    <span>Create your account by enrolling your fingerprint and linking a payment card</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold">2</span>
                    <span>Your biometric identity is securely stored and synced across all merchants</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold">3</span>
                    <span>Pay anywhere with Protega by scanning your fingerprint at checkout</span>
                  </li>
                </ol>
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900 mb-3">For Merchants</h4>
                <ol className="text-slate-700 space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">1</span>
                    <span>Sign up for a merchant account and get your unique Terminal API Key</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">2</span>
                    <span>Configure your payment terminal with your API key</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">3</span>
                    <span>Start accepting biometric payments from Protega customers instantly</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
