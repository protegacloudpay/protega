/**
 * Shared TypeScript types for Protega CloudPay frontend.
 */

export type PaymentMethod = {
  id?: number;
  provider_ref: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
};

export type PaymentMethodFull = {
  id: number;
  user_id: number;
  provider: string;
  provider_payment_method_id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

