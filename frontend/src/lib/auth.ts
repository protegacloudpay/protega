/**
 * Authentication helpers for merchant dashboard.
 */

const TOKEN_KEY = 'protega_merchant_token';
const MERCHANT_KEY = 'protega_merchant_data';

export interface MerchantData {
  merchant_id: number;
  email: string;
  name: string;
}

/**
 * Store authentication token in localStorage.
 */
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Get authentication token from localStorage.
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

/**
 * Remove authentication token from localStorage.
 */
export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MERCHANT_KEY);
  }
}

/**
 * Store merchant data in localStorage.
 */
export function setMerchantData(data: MerchantData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MERCHANT_KEY, JSON.stringify(data));
  }
}

/**
 * Get merchant data from localStorage.
 */
export function getMerchantData(): MerchantData | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(MERCHANT_KEY);
    return data ? JSON.parse(data) : null;
  }
  return null;
}

/**
 * Check if user is authenticated.
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

// Aliases for consistency with requirements
export const saveToken = setAuthToken;
export const getToken = getAuthToken;
export const clearToken = clearAuthToken;
export const isAuthed = isAuthenticated;

