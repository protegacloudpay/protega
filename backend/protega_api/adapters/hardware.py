"""
Hardware adapter layer for biometric fingerprint readers.

This module provides an abstraction layer between raw fingerprint scanner SDKs
and the Protega API hashing layer. The adapter normalizes SDK output into
deterministic string representations suitable for cryptographic hashing.

CURRENT STATE: Simulated adapter for prototype/testing
PRODUCTION TODO: Integrate real SDK (DigitalPersona U.are.U, Futronic, etc.)
"""

from typing import Protocol, runtime_checkable


@runtime_checkable
class HardwareAdapter(Protocol):
    """
    Protocol defining the interface for fingerprint hardware adapters.
    
    All hardware adapters must implement this interface to ensure consistent
    normalization of biometric templates before hashing.
    """
    
    def to_template_input(self, sample: str) -> str:
        """
        Normalize a raw biometric sample into a deterministic string.
        
        This method takes raw output from a fingerprint SDK and converts it
        into a stable, normalized string representation suitable for hashing.
        
        Args:
            sample: Raw biometric sample (format depends on SDK)
                   - For simulation: any string
                   - For DigitalPersona: FMD (Fingerprint Minutiae Data) bytes
                   - For Futronic: ANSI 378 template bytes
                   
        Returns:
            Normalized template string (deterministic, stable across captures)
            
        Requirements:
            - Must be deterministic: same finger → same output
            - Must handle minor capture variations (position, pressure)
            - Must produce consistent string encoding
        """
        ...


class SimulatedHardwareAdapter:
    """
    Simulated hardware adapter for testing and development.
    
    This adapter provides a simple string normalization for demo purposes.
    In production, this would be replaced with a real SDK integration.
    
    USAGE IN PRODUCTION:
    --------------------
    Replace this class with a real adapter, for example:
    
    ```python
    class DigitalPersonaAdapter:
        def __init__(self):
            import dpfpdd  # DigitalPersona SDK
            self.sdk = dpfpdd
            
        def to_template_input(self, sample: str) -> str:
            # sample would be raw bytes from scanner
            raw_bytes = bytes.fromhex(sample)
            
            # Extract features using SDK
            features = self.sdk.extract_features(raw_bytes)
            
            # Normalize to deterministic string
            # Option 1: Hex encode feature vector
            normalized = features.to_hex()
            
            # Option 2: Base64 encode minutiae points
            # normalized = base64.b64encode(features.minutiae).decode()
            
            return normalized.upper()
    ```
    
    SDK Integration Points:
    ----------------------
    - DigitalPersona U.are.U: Use dpfpdd library, extract FMD
    - Futronic: Use ftrScanAPI, get ANSI 378 template
    - ZKTeco: Use ZKFinger SDK, extract template bytes
    - Suprema: Use BioStar SDK, extract template
    
    Normalization Pipeline:
    ----------------------
    1. Capture: Get raw biometric data from sensor
    2. Extract: Use SDK to extract stable features (minutiae)
    3. Normalize: Convert to deterministic string representation
    4. Return: Pass to hashing layer (derive_template_hash)
    """
    
    def to_template_input(self, sample: str) -> str:
        """
        Simulate template normalization.
        
        For demo purposes, we simply normalize the input string.
        Real implementation would process SDK output.
        
        Args:
            sample: Input string (simulating raw biometric data)
            
        Returns:
            Normalized uppercase string
        """
        # Simple normalization for simulation:
        # - Strip whitespace
        # - Convert to uppercase
        # - Ensure UTF-8 encoding stability
        normalized = sample.strip().upper()
        
        # TODO: In production, replace with:
        # 1. Parse SDK-specific template format
        # 2. Extract stable minutiae points
        # 3. Sort points for deterministic ordering
        # 4. Encode to stable string representation
        
        return normalized


# Default adapter instance (swap in production)
default_adapter: HardwareAdapter = SimulatedHardwareAdapter()


def get_hardware_adapter() -> HardwareAdapter:
    """
    Get the configured hardware adapter instance.
    
    Returns:
        Hardware adapter for biometric template normalization
    """
    return default_adapter

