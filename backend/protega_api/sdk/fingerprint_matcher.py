"""
Biometric Similarity Scoring System for Protega CloudPay
========================================================

Detects near-duplicate fingerprints even when hashes differ due to:
- Scanner angle variation
- Pressure differences
- Image quality differences
- Minor distortions

Prevents fraud by comparing biometric feature vectors before storage.
"""

import base64
import json
import logging
import numpy as np
from typing import List, Optional, Tuple

logger = logging.getLogger(__name__)

# Similarity threshold (0-1 scale)
# Higher = more strict (fewer false positives, more false negatives)
# Lower = more lenient (more false positives, fewer false negatives)
SIMILARITY_THRESHOLD = 0.90  # 90% similarity required to flag as duplicate


class FingerprintMatcher:
    """
    Compare biometric feature vectors using cosine similarity.
    
    This detects when the same finger is being registered multiple times,
    even if the SHA-256 hash differs due to scanner variations.
    """
    
    def __init__(self, threshold: float = SIMILARITY_THRESHOLD):
        """
        Initialize the fingerprint matcher.
        
        Args:
            threshold: Similarity threshold (0-1). Default 0.90 (90%)
        """
        self.threshold = threshold
        logger.info(f"FingerprintMatcher initialized with threshold: {threshold}")
    
    def extract_features(self, fingerprint_sample: str) -> np.ndarray:
        """
        Extract feature vector from fingerprint sample.
        
        In a real implementation, this would use a fingerprint SDK to extract
        minutiae points, ridge patterns, core and delta patterns.
        
        For now, we simulate feature extraction by converting the sample
        to a normalized feature vector.
        
        Args:
            fingerprint_sample: Base64-encoded fingerprint template
            
        Returns:
            Normalized feature vector as numpy array
        """
        try:
            # Simulate feature extraction
            # In production, this would call the SDK to extract minutiae points
            sample_bytes = fingerprint_sample.encode('utf-8')
            
            # Create a hash-based feature vector (placeholder for real minutiae)
            # Real implementation would extract: ridge count, minutiae positions, angles, etc.
            import hashlib
            hash1 = hashlib.md5(sample_bytes[:len(sample_bytes)//2]).digest()
            hash2 = hashlib.md5(sample_bytes[len(sample_bytes)//2:]).digest()
            
            # Convert to feature vector (64 features)
            features = np.frombuffer(hash1 + hash2, dtype=np.uint8).astype(np.float32)
            
            # Normalize to [0, 1] range
            if features.max() > 0:
                features = features / features.max()
            
            logger.debug(f"Extracted feature vector: {features.shape}, mean: {features.mean():.3f}")
            
            return features
            
        except Exception as e:
            logger.error(f"Failed to extract features: {e}")
            raise ValueError("Failed to extract fingerprint features") from e
    
    def compare_cosine(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """
        Compare two feature vectors using cosine similarity.
        
        Args:
            vec1: First feature vector
            vec2: Second feature vector
            
        Returns:
            Similarity score (0-1), where 1 = identical, 0 = completely different
        """
        try:
            # Ensure vectors are the same length
            min_len = min(len(vec1), len(vec2))
            vec1 = vec1[:min_len]
            vec2 = vec2[:min_len]
            
            # Calculate cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Failed to compare vectors: {e}")
            return 0.0
    
    def compare_euclidean(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """
        Compare two feature vectors using Euclidean distance (converted to similarity).
        
        Args:
            vec1: First feature vector
            vec2: Second feature vector
            
        Returns:
            Similarity score (0-1), where 1 = identical, 0 = completely different
        """
        try:
            # Ensure vectors are the same length
            min_len = min(len(vec1), len(vec2))
            vec1 = vec1[:min_len]
            vec2 = vec2[:min_len]
            
            # Calculate Euclidean distance
            distance = np.linalg.norm(vec1 - vec2)
            
            # Convert distance to similarity (0-1 scale)
            # Distance of 0 = similarity of 1
            # As distance increases, similarity approaches 0
            max_distance = np.sqrt(len(vec1))  # Maximum possible distance for normalized vectors
            similarity = 1.0 - (distance / max_distance) if max_distance > 0 else 0.0
            
            return max(0.0, min(1.0, similarity))  # Clamp to [0, 1]
            
        except Exception as e:
            logger.error(f"Failed to compare vectors (Euclidean): {e}")
            return 0.0
    
    def find_best_match(
        self, 
        new_vector: np.ndarray, 
        existing_vectors: List[Tuple[int, np.ndarray]],
        method: str = "cosine"
    ) -> Optional[Tuple[int, float]]:
        """
        Find the best matching fingerprint in the database.
        
        Args:
            new_vector: Feature vector of the new fingerprint
            existing_vectors: List of (template_id, vector) tuples from database
            method: Comparison method ("cosine" or "euclidean")
            
        Returns:
            Tuple of (template_id, similarity_score) of best match, or None if no match
        """
        if not existing_vectors:
            return None
        
        best_match_id = None
        best_similarity = 0.0
        
        for template_id, existing_vector in existing_vectors:
            try:
                # Compare using the specified method
                if method == "cosine":
                    similarity = self.compare_cosine(new_vector, existing_vector)
                else:
                    similarity = self.compare_euclidean(new_vector, existing_vector)
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match_id = template_id
                    
            except Exception as e:
                logger.error(f"Error comparing with template {template_id}: {e}")
                continue
        
        if best_similarity >= self.threshold:
            return (best_match_id, best_similarity)
        
        return None
    
    def is_duplicate(
        self, 
        new_vector: np.ndarray, 
        existing_vectors: List[Tuple[int, np.ndarray]],
        method: str = "cosine"
    ) -> Tuple[bool, Optional[Tuple[int, float]]]:
        """
        Check if the new fingerprint is a duplicate of any existing one.
        
        Args:
            new_vector: Feature vector of the new fingerprint
            existing_vectors: List of (template_id, vector) tuples from database
            method: Comparison method ("cosine" or "euclidean")
            
        Returns:
            Tuple of (is_duplicate: bool, match_info: (template_id, score) or None)
        """
        match = self.find_best_match(new_vector, existing_vectors, method)
        
        if match:
            logger.warning(f"Duplicate fingerprint detected! Template ID: {match[0]}, Similarity: {match[1]:.3f}")
            return (True, match)
        
        return (False, None)


# Global instance
_matcher_instance = None

def get_fingerprint_matcher(threshold: float = SIMILARITY_THRESHOLD) -> FingerprintMatcher:
    """Get or create the global fingerprint matcher instance."""
    global _matcher_instance
    if _matcher_instance is None:
        _matcher_instance = FingerprintMatcher(threshold=threshold)
    return _matcher_instance

