/**
 * WebAuthn utility for Touch ID / biometric authentication
 * 
 * This enables real biometric scanning on MacBook Touch ID, 
 * Windows Hello, and mobile device fingerprint sensors.
 */

/**
 * Check if WebAuthn is supported by the browser
 */
export function isWebAuthnSupported(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    navigator.credentials &&
    navigator.credentials.create
  );
}

/**
 * Check if platform authenticator (Touch ID, Windows Hello, etc.) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false;
  }
  
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (err) {
    console.error('Error checking platform authenticator:', err);
    return false;
  }
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Register a new biometric credential (enrollment)
 * 
 * @param userId - User identifier (email or user ID)
 * @param userName - User's display name
 * @returns Base64-encoded credential ID that can be used as biometric template
 */
export async function registerBiometric(
  userId: string,
  userName: string
): Promise<string> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported by this browser');
  }

  const available = await isPlatformAuthenticatorAvailable();
  if (!available) {
    throw new Error('No biometric sensor available on this device');
  }

  // Generate a random challenge
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  // Create credential options
  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'Protega CloudPay',
      id: window.location.hostname, // Will be 'localhost' or 'protega.vercel.app'
    },
    user: {
      id: new TextEncoder().encode(userId),
      name: userId,
      displayName: userName,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },  // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Use built-in sensor (Touch ID, etc.)
      requireResidentKey: false,
      userVerification: 'required', // Require biometric verification
    },
    timeout: 60000,
    attestation: 'none',
  };

  try {
    // Prompt for biometric scan
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    // Extract credential ID and encode as base64
    const credentialId = arrayBufferToBase64(credential.rawId);
    
    // Store credential ID for future verification
    if (typeof window !== 'undefined') {
      localStorage.setItem(`webauthn_credential_${userId}`, credentialId);
    }

    return credentialId;
  } catch (err: any) {
    console.error('WebAuthn registration error:', err);
    
    if (err.name === 'NotAllowedError') {
      throw new Error('Biometric scan was cancelled or failed');
    } else if (err.name === 'InvalidStateError') {
      throw new Error('This device is already registered');
    } else {
      throw new Error(`Biometric registration failed: ${err.message}`);
    }
  }
}

/**
 * Verify biometric credential (payment verification)
 * 
 * @param credentialId - Base64-encoded credential ID from enrollment
 * @returns true if verification succeeded, false otherwise
 */
export async function verifyBiometric(credentialId: string): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported by this browser');
  }

  const available = await isPlatformAuthenticatorAvailable();
  if (!available) {
    throw new Error('No biometric sensor available on this device');
  }

  // Generate a random challenge
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  // Create assertion options
  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    allowCredentials: [
      {
        id: base64ToArrayBuffer(credentialId),
        type: 'public-key',
        transports: ['internal'], // Use built-in sensor
      },
    ],
    timeout: 60000,
    userVerification: 'required', // Require biometric verification
    rpId: window.location.hostname,
  };

  try {
    // Prompt for biometric scan
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    if (!assertion) {
      throw new Error('Failed to verify credential');
    }

    // If we got here, biometric verification succeeded
    return true;
  } catch (err: any) {
    console.error('WebAuthn verification error:', err);
    
    if (err.name === 'NotAllowedError') {
      throw new Error('Biometric scan was cancelled or failed');
    } else {
      throw new Error(`Biometric verification failed: ${err.message}`);
    }
  }
}

/**
 * Get capability info for the current device
 */
export async function getBiometricCapabilities(): Promise<{
  supported: boolean;
  available: boolean;
  deviceType: string;
}> {
  const supported = isWebAuthnSupported();
  const available = supported ? await isPlatformAuthenticatorAvailable() : false;
  
  let deviceType = 'Unknown';
  if (available) {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) {
      deviceType = 'Touch ID';
    } else if (userAgent.includes('win')) {
      deviceType = 'Windows Hello';
    } else if (userAgent.includes('android')) {
      deviceType = 'Android Fingerprint';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      deviceType = 'Face ID / Touch ID';
    }
  }
  
  return { supported, available, deviceType };
}


