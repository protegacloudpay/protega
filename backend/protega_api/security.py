"""Security utilities for authentication and password hashing."""

import hashlib
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from protega_api.config import settings


def hash_fingerprint(sample: str) -> str:
    """
    Hash the fingerprint sample with SHA-256 for secure comparison.
    
    Args:
        sample: Raw fingerprint sample string
        
    Returns:
        Hex-encoded SHA-256 hash
    """
    return hashlib.sha256(sample.encode()).hexdigest()


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    # Convert password to bytes and hash with bcrypt
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password to verify against
        
    Returns:
        True if password matches, False otherwise
    """
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_jwt(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT token.
    
    Args:
        data: Payload data to encode
        expires_delta: Optional expiration time delta
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expires_min)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm
    )
    
    return encoded_jwt


def verify_jwt(token: str) -> Optional[dict]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token to verify
        
    Returns:
        Decoded payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError as e:
        import logging
        logging.error(f"JWT verification failed: {e}")
        return None

