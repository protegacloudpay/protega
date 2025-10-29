import React, { useEffect, useState } from 'react';
import CardBadge from './CardBadge';

export interface SelectablePaymentMethod {
  provider_ref: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface SelectCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  methods: SelectablePaymentMethod[];
  onSelect: (provider_ref: string) => void;
}

export default function SelectCardModal({
  isOpen,
  onClose,
  methods,
  onSelect,
}: SelectCardModalProps) {
  const [selectedRef, setSelectedRef] = useState<string>('');
  const [autoCloseTimer, setAutoCloseTimer] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && methods.length > 0) {
      // Pre-select default card
      const defaultCard = methods.find((m) => m.is_default);
      if (defaultCard) {
        setSelectedRef(defaultCard.provider_ref);
      } else {
        setSelectedRef(methods[0].provider_ref);
      }

      // Auto-close after 15 seconds
      const timer = window.setTimeout(() => {
        handleConfirm();
      }, 15000);
      setAutoCloseTimer(timer);
    }

    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [isOpen, methods]);

  const handleConfirm = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
    }
    if (selectedRef) {
      onSelect(selectedRef);
    }
    onClose();
  };

  const handleCancel = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedRef) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="select-card-title"
      >
        <h3
          id="select-card-title"
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          Select Payment Method
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Choose which card to use for this payment
        </p>

        {methods.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No payment methods available
          </div>
        ) : (
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {methods.map((method) => (
              <button
                key={method.provider_ref}
                onClick={() => setSelectedRef(method.provider_ref)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedRef(method.provider_ref);
                  }
                }}
                className={`w-full p-4 rounded-xl border-3 text-left transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400 ${
                  selectedRef === method.provider_ref
                    ? 'border-cyan-500 bg-cyan-50 ring-4 ring-cyan-200 shadow-xl scale-105'
                    : 'border-gray-300 hover:border-cyan-400 hover:bg-gray-50 hover:scale-102'
                }`}
                aria-pressed={selectedRef === method.provider_ref}
              >
                <div className="flex items-center justify-between gap-4">
                  <CardBadge
                    brand={method.brand}
                    last4={method.last4}
                    expMonth={method.exp_month}
                    expYear={method.exp_year}
                    isDefault={method.is_default}
                    large={true}
                  />
                  {selectedRef === method.provider_ref && (
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedRef}
            className="px-4 py-2 bg-protega-teal hover:bg-protega-teal-dark text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-protega-teal disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Payment
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Auto-selecting in 15 seconds...
        </p>
      </div>
    </div>
  );
}

