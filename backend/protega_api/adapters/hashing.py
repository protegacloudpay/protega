"""
Biometric template hashing adapter.

This module provides cryptographically secure, salted hashing of biometric templates.
Raw biometric samples are NEVER stored; only irreversible hashes are persisted.

Security properties:
- PBKDF2-HMAC-SHA256 with 200,000 iterations
- Per-record random 16-byte salt
- No reversibility - cannot recover original biometric data
- Rainbow table resistant
"""

import hashlib
import os
from typing import Tuple


HASH_ITERATIONS = 200_000
SALT_LENGTH = 16  # bytes


def derive_template_hash(
    fingerprint_sample: str,
    salt: str | None = None
) -> Tuple[str, str]:
    """
    Derive a salted hash from a normalized biometric template.
    
    This function takes a normalized biometric template string (output from
    hardware adapter) and produces a cryptographically secure hash with salt.
    
    Args:
        fingerprint_sample: Normalized biometric template string from hardware adapter
        salt: Optional hex-encoded salt. If None, generates a new random salt
        
    Returns:
        Tuple of (hash_hex, salt_hex) where both are hex-encoded strings
        
    Example:
        >>> hash_hex, salt_hex = derive_template_hash("NORMALIZED_TEMPLATE_001")
        >>> # Later, verify with same salt:
        >>> verify_hash, _ = derive_template_hash("NORMALIZED_TEMPLATE_001", salt_hex)
        >>> assert verify_hash == hash_hex
    """
    # Generate or decode salt
    if salt is None:
        salt_bytes = os.urandom(SALT_LENGTH)
        salt_hex = salt_bytes.hex()
    else:
        salt_hex = salt
        salt_bytes = bytes.fromhex(salt_hex)
    
    # Convert fingerprint sample to bytes
    sample_bytes = fingerprint_sample.encode('utf-8')
    
    # Derive hash using PBKDF2-HMAC-SHA256
    hash_bytes = hashlib.pbkdf2_hmac(
        'sha256',
        sample_bytes,
        salt_bytes,
        HASH_ITERATIONS
    )
    
    hash_hex = hash_bytes.hex()
    
    return hash_hex, salt_hex


def verify_template_hash(
    fingerprint_sample: str,
    stored_hash: str,
    stored_salt: str
) -> bool:
    """
    Verify a biometric sample against a stored hash.
    
    Args:
        fingerprint_sample: Normalized biometric template to verify
        stored_hash: Hex-encoded hash from database
        stored_salt: Hex-encoded salt from database
        
    Returns:
        True if sample matches stored hash, False otherwise
    """
    computed_hash, _ = derive_template_hash(fingerprint_sample, stored_salt)
    return computed_hash == stored_hash

