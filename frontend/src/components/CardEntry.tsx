import React from 'react';
import { loadStripe, StripeCardElement } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Initialize Stripe (use your publishable key from environment variables)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51');

interface CardEntryProps {
  onTokenGenerated: (token: string) => void;
}

function CardEntryForm({ onTokenGenerated }: CardEntryProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setError('Stripe not loaded yet. Please wait...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create a payment method from the card details
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setError(error.message || 'Failed to process card');
        setLoading(false);
        return;
      }

      if (!paymentMethod) {
        setError('No payment method returned');
        setLoading(false);
        return;
      }

      // Pass the payment method ID to the parent
      onTokenGenerated(paymentMethod.id);
      
      // Don't redirect, just stay on the page
      setLoading(false);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border-2 border-gray-300 rounded-lg bg-white">
        <CardElement options={cardElementOptions} />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}
      
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!stripe || loading}
        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
      >
        {loading ? 'Processing...' : 'Save Card'}
      </button>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          🔒 <strong>Secure:</strong> Your card details are processed directly by Stripe. We never see your full card number.
        </p>
      </div>
    </div>
  );
}

export default function CardEntry({ onTokenGenerated }: CardEntryProps) {
  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51';
  
  return (
    <Elements stripe={stripePromise}>
      <CardEntryForm onTokenGenerated={onTokenGenerated} />
    </Elements>
  );
}

