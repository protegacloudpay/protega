/**
 * API client for Protega CloudPay backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  token?: string;
}

/**
 * Make an API request.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: response.statusText,
    }));
    throw new Error(error.detail || 'API request failed');
  }

  return response.json();
}

// ============================================================================
// Generic Helper Methods
// ============================================================================

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET', token });
}

export async function apiPost<T>(
  path: string,
  body: any,
  token?: string
): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export async function apiDelete<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: response.statusText,
    }));
    throw new Error(error.detail || 'API request failed');
  }

  // DELETE may return 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============================================================================
// Enrollment API
// ============================================================================

export interface EnrollRequest {
  email: string;
  full_name: string;
  phone_number?: string;
  fingerprint_sample: string;
  consent_text: string;
  stripe_payment_method_token: string;
  set_default?: boolean;
}

export interface EnrollResponse {
  user_id: number;
  masked_email: string;
  brand?: string;
  last4?: string;
  message: string;
}

export async function enrollUser(data: EnrollRequest): Promise<EnrollResponse> {
  return apiRequest<EnrollResponse>('/enroll', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// Payment API
// ============================================================================

export interface PayRequest {
  terminal_api_key: string;
  fingerprint_sample: string;
  amount_cents: number;
  currency?: string;
  merchant_ref?: string;
  payment_method_provider_ref?: string;
}

export interface PayResponse {
  status: string;
  transaction_id?: number;
  message: string;
}

export async function processPayment(data: PayRequest): Promise<PayResponse> {
  return apiRequest<PayResponse>('/pay', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// Merchant API
// ============================================================================

export interface MerchantSignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface MerchantSignupResponse {
  merchant_id: number;
  email: string;
  name: string;
  terminal_api_key: string;
  message: string;
}

export interface MerchantLoginRequest {
  email: string;
  password: string;
}

export interface MerchantLoginResponse {
  token: string;
  merchant_id: number;
  email: string;
  name: string;
  terminal_api_key: string;
}

export interface TransactionItem {
  id: number;
  amount_cents: number;
  protega_fee_cents: number;
  currency: string;
  status: string;
  created_at: string;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  merchant_ref?: string;
}

export interface TransactionsListResponse {
  items: TransactionItem[];
  total: number;
}

export async function merchantSignup(
  data: MerchantSignupRequest
): Promise<MerchantSignupResponse> {
  return apiRequest<MerchantSignupResponse>('/merchant/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function merchantLogin(
  data: MerchantLoginRequest
): Promise<MerchantLoginResponse> {
  return apiRequest<MerchantLoginResponse>('/merchant/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getTransactions(
  token: string
): Promise<TransactionsListResponse> {
  return apiRequest<TransactionsListResponse>('/merchant/transactions', {
    method: 'GET',
    token,
  });
}

// ============================================================================
// Payment Methods API
// ============================================================================

export interface PaymentMethod {
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
}

export interface PaymentMethodListResponse {
  items: PaymentMethod[];
  total: number;
}

export interface PaymentMethodCreateRequest {
  stripe_payment_method_token: string;
  set_default: boolean;
}

export interface SetDefaultPaymentMethodResponse {
  message: string;
  payment_method_id: number;
}

export async function listPaymentMethods(
  userId: number,
  token: string
): Promise<PaymentMethodListResponse> {
  return apiGet<PaymentMethodListResponse>(
    `/users/${userId}/payment-methods`,
    token
  );
}

export async function addPaymentMethod(
  userId: number,
  data: PaymentMethodCreateRequest,
  token: string
): Promise<PaymentMethod> {
  return apiPost<PaymentMethod>(
    `/users/${userId}/payment-methods`,
    data,
    token
  );
}

export async function setDefaultPaymentMethod(
  userId: number,
  paymentMethodId: number,
  token: string
): Promise<SetDefaultPaymentMethodResponse> {
  return apiPost<SetDefaultPaymentMethodResponse>(
    `/users/${userId}/payment-methods/${paymentMethodId}/default`,
    {},
    token
  );
}

export async function deletePaymentMethod(
  userId: number,
  paymentMethodId: number,
  token: string
): Promise<void> {
  return apiDelete<void>(
    `/users/${userId}/payment-methods/${paymentMethodId}`,
    token
  );
}

// ============================================================================
// Customers API
// ============================================================================

export interface CustomerListItem {
  customer_id: number;
  masked_name: string;
  masked_email?: string;
  transaction_count: number;
  total_spent_cents: number;
  first_seen: string;
  last_seen: string;
}

export interface CustomerListResponse {
  items: CustomerListItem[];
  total: number;
}

export async function listCustomers(token: string): Promise<CustomerListResponse> {
  return apiGet<CustomerListResponse>('/customers', token);
}

