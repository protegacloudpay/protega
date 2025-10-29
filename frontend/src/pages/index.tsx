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
              <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-protega-teal transition-colors">
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
              <span className="text-3xl">👤</span> For Customers
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/customer" className="block">
                <div className="card hover:shadow-xl transition-shadow bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">✨ Customer App</h3>
                  <p className="text-gray-600 mb-4">
                    Clean interface to enroll and manage your payment cards. One-time setup!
                  </p>
                  <span className="text-teal-600 font-semibold">
                    Get Started →
                  </span>
                </div>
              </Link>

              <Link href="/enroll" className="block">
                <div className="card hover:shadow-xl transition-shadow">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">🔐 Enroll (Advanced)</h3>
                  <p className="text-gray-600 mb-4">
                    Advanced enrollment interface with all options visible.
                  </p>
                  <span className="text-protega-teal font-semibold">
                    Advanced Mode →
                  </span>
                </div>
              </Link>

              <Link href="/kiosk" className="block">
                <div className="card hover:shadow-xl transition-shadow">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">💳 Test Payment</h3>
                  <p className="text-gray-600 mb-4">
                    Try making a payment with your enrolled fingerprint.
                  </p>
                  <span className="text-protega-teal font-semibold">
                    Make Payment →
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Merchant Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="text-3xl">🏪</span> For Merchants
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/terminal" className="block">
                <div className="card hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">💻 Payment Terminal</h3>
                  <p className="text-gray-600 mb-4">
                    Simple terminal for processing customer payments. Production-ready UI.
                  </p>
                  <span className="text-blue-600 font-semibold">
                    Open Terminal →
                  </span>
                </div>
              </Link>

              <Link href="/kiosk-demo" className="block">
                <div className="card hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">🖥️ Kiosk Mode</h3>
                  <p className="text-gray-600 mb-4">
                    Fullscreen demo mode for pilots and presentations. Auto-reset after payment.
                  </p>
                  <span className="text-purple-600 font-semibold">
                    Launch Kiosk →
                  </span>
                </div>
              </Link>

              <Link href="/merchant/dashboard" className="block">
                <div className="card hover:shadow-xl transition-shadow">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">📊 Dashboard</h3>
                  <p className="text-gray-600 mb-4">
                    View transactions, revenue, and manage your terminal.
                  </p>
                  <span className="text-protega-teal font-semibold">
                    View Dashboard →
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Start Guide */}
          <div className="card bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">🚀</span> Quick Start Guide
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">As a Customer:</h4>
                <ol className="text-slate-700 space-y-1 list-decimal list-inside">
                  <li>Go to <strong>Customer App</strong></li>
                  <li>Enter your info and fingerprint: <code className="bg-white px-2 py-1 rounded">test123</code></li>
                  <li>Save your Customer ID</li>
                  <li>Done! You can now pay anywhere</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">As a Merchant:</h4>
                <ol className="text-slate-700 space-y-1 list-decimal list-inside">
                  <li>Go to <strong>Merchant Login</strong> → Sign up</li>
                  <li>Get your Terminal API Key</li>
                  <li>Open <strong>Payment Terminal</strong></li>
                  <li>Accept payments from enrolled customers!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
