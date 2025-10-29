import React from 'react';

interface CardBadgeProps {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault?: boolean;
  className?: string;
}

export default function CardBadge({
  brand,
  last4,
  expMonth,
  expYear,
  isDefault = false,
  className = '',
}: CardBadgeProps) {
  const brandColors: { [key: string]: string } = {
    visa: 'bg-blue-100 text-blue-800 border-blue-300',
    mastercard: 'bg-orange-100 text-orange-800 border-orange-300',
    amex: 'bg-green-100 text-green-800 border-green-300',
    discover: 'bg-purple-100 text-purple-800 border-purple-300',
    default: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const colorClass = brandColors[brand.toLowerCase()] || brandColors.default;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colorClass} ${className}`}
    >
      <span className="font-semibold text-sm uppercase">{brand}</span>
      <span className="text-sm">••••</span>
      <span className="font-mono text-sm font-semibold">{last4}</span>
      <span className="text-xs opacity-75">
        {String(expMonth).padStart(2, '0')}/{String(expYear).slice(-2)}
      </span>
      {isDefault && (
        <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-cyan-500 text-white rounded-full">
          Default
        </span>
      )}
    </div>
  );
}

