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

        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-4">
              Protega CloudPay
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Device-free biometric payment platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/enroll" className="block">
              <div className="card hover:shadow-xl transition-shadow">
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Enroll</h2>
                <p className="text-gray-600 mb-4">
                  Register your fingerprint and link your payment method for secure, device-free payments.
                </p>
                <span className="text-protega-teal font-semibold">
                  Get Started →
                </span>
              </div>
            </Link>

            <Link href="/kiosk" className="block">
              <div className="card hover:shadow-xl transition-shadow">
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Demo Kiosk</h2>
                <p className="text-gray-600 mb-4">
                  Try making a payment with your enrolled fingerprint at our demo terminal.
                </p>
                <span className="text-protega-teal font-semibold">
                  Try Payment →
                </span>
              </div>
            </Link>
          </div>

          <div className="mt-12 card bg-blue-50 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Start</h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Click "Enroll" to register your fingerprint with a payment method</li>
              <li>Use test fingerprint: <code className="bg-white px-2 py-1 rounded">DEMO-FINGER-001</code></li>
              <li>Use test payment: <code className="bg-white px-2 py-1 rounded">pm_card_visa</code></li>
              <li>Go to "Demo Kiosk" and make a test payment</li>
            </ol>
          </div>
        </div>
      </main>
    </>
  );
}
