import React from 'react';

interface CardBadgeProps {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault?: boolean;
  className?: string;
  large?: boolean;
}

export default function CardBadge({
  brand,
  last4,
  expMonth,
  expYear,
  isDefault = false,
  className = '',
  large = false,
}: CardBadgeProps) {
  const brandData: { [key: string]: { color: string; icon: string; fullName: string } } = {
    visa: { 
      color: 'bg-blue-500 text-white border-blue-600', 
      icon: '💳',
      fullName: 'Visa'
    },
    mastercard: { 
      color: 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-orange-600', 
      icon: '💳',
      fullName: 'Mastercard'
    },
    amex: { 
      color: 'bg-blue-400 text-white border-blue-500', 
      icon: '💳',
      fullName: 'American Express'
    },
    discover: { 
      color: 'bg-orange-500 text-white border-orange-600', 
      icon: '💳',
      fullName: 'Discover'
    },
    default: { 
      color: 'bg-gray-600 text-white border-gray-700', 
      icon: '💳',
      fullName: 'Card'
    },
  };

  const brandInfo = brandData[brand.toLowerCase()] || brandData.default;

  if (large) {
    return (
      <div
        className={`inline-flex items-center gap-3 px-6 py-4 rounded-xl border-2 ${brandInfo.color} shadow-lg ${className}`}
      >
        <span className="text-3xl">{brandInfo.icon}</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg uppercase">{brandInfo.fullName}</span>
            {isDefault && (
              <span className="px-2 py-0.5 text-xs font-bold bg-white bg-opacity-30 rounded-full">
                Default
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 opacity-90">
            <span className="text-xl">••••</span>
            <span className="font-mono text-2xl font-bold">{last4}</span>
            <span className="text-sm ml-2">
              Exp: {String(expMonth).padStart(2, '0')}/{String(expYear).slice(-2)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${brandInfo.color} ${className}`}
    >
      <span className="text-lg">{brandInfo.icon}</span>
      <span className="font-semibold text-sm uppercase">{brand}</span>
      <span className="text-sm">••••</span>
      <span className="font-mono text-base font-semibold">{last4}</span>
      <span className="text-xs opacity-90">
        {String(expMonth).padStart(2, '0')}/{String(expYear).slice(-2)}
      </span>
      {isDefault && (
        <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-white bg-opacity-30 rounded-full">
          Default
        </span>
      )}
    </div>
  );
}

