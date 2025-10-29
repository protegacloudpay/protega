import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { enrollUser, EnrollRequest } from '@/lib/api';

export default function Enroll() {
  const [formData, setFormData] = useState<EnrollRequest>({
    email: '',
    full_name: '',
    fingerprint_sample: '',
    consent_text: 'I consent to the processing and storage of my biometric data for payment authentication purposes.',
    stripe_payment_method_token: '',
    set_default: true,
  });
  
  const [consentChecked, setConsentChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    maskedEmail: string;
    brand?: string;
    last4?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!consentChecked) {
      setError('You must accept the consent agreement to continue.');
      return;
    }

    setLoading(true);

    try {
      const response = await enrollUser(formData);
      setSuccess({
        maskedEmail: response.masked_email,
        brand: response.brand,
        last4: response.last4,
      });
    } catch (err: any) {
      setError(err.message || 'Enrollment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Enroll - Protega CloudPay</title>
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
            <Link href="/" className="text-protega-teal hover:text-protega-teal-dark transition-colors">
              ← Back to Home
            </Link>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Enroll Your Fingerprint</h1>
          <p className="text-gray-600 mb-8">
            Link your fingerprint to your payment method for secure, device-free payments.
          </p>

          {success ? (
            <div className="card">
              <div className="success-banner mb-6">
                ✅ Enrollment Successful!
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Enrolled Email</p>
                  <p className="text-lg font-semibold">{success.maskedEmail}</p>
                </div>
                {success.brand && success.last4 && (
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="text-lg font-semibold">
                      {success.brand.toUpperCase()} •••• {success.last4}
                    </p>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">
                    Your fingerprint has been securely hashed and linked to your payment method.
                    You can now make payments at any Protega-enabled terminal!
                  </p>
                  <p className="text-xs text-protega-teal mb-4">
                    💡 Tip: You can add more cards later via the Customer Methods page.
                  </p>
                  <Link href="/kiosk" className="btn-primary inline-block">
                    Try a Payment →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fingerprint Sample
                  </label>
                  <textarea
                    required
                    className="input"
                    rows={3}
                    value={formData.fingerprint_sample}
                    onChange={(e) => setFormData({ ...formData, fingerprint_sample: e.target.value })}
                    placeholder="DEMO-FINGER-001 (for testing - use consistent string)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 For demo: Use a consistent string like "DEMO-FINGER-001". In production, this would be captured from a real fingerprint scanner.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stripe Payment Method Token
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.stripe_payment_method_token}
                    onChange={(e) => setFormData({ ...formData, stripe_payment_method_token: e.target.value })}
                    placeholder="pm_card_visa"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Test tokens: <code className="bg-gray-100 px-1 rounded">pm_card_visa</code>, <code className="bg-gray-100 px-1 rounded">pm_card_mastercard</code>
                  </p>
                  
                  <div className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      id="setDefault"
                      checked={formData.set_default}
                      onChange={(e) => setFormData({ ...formData, set_default: e.target.checked })}
                      className="mr-2 h-4 w-4 text-protega-teal focus:ring-protega-teal border-gray-300 rounded"
                    />
                    <label htmlFor="setDefault" className="text-sm text-gray-700 font-medium">
                      Set as default payment method
                    </label>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-1 mr-3 h-4 w-4 text-protega-teal focus:ring-protega-teal border-gray-300 rounded"
                    />
                    <label htmlFor="consent" className="text-sm text-gray-700">
                      I consent to the processing and storage of my biometric data for payment 
                      authentication purposes. I understand that my raw fingerprint will never be 
                      stored, only an irreversible cryptographic hash.
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enrolling...' : 'Enroll Now'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
