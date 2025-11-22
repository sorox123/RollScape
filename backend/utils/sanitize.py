"""
Input sanitization utilities to prevent XSS attacks.
Strips HTML tags from user input.
"""

import re
from typing import Optional


def sanitize_html(text: Optional[str]) -> Optional[str]:
    """
    Remove HTML tags from text to prevent XSS attacks.
    
    This is a simple implementation that strips all HTML tags.
    For production, consider using bleach library for more sophisticated sanitization.
    
    Args:
        text: Input text that may contain HTML
        
    Returns:
        Text with HTML tags removed, or None if input was None
    """
    if text is None:
        return None
    
    # Remove HTML tags
    clean_text = re.sub(r'<[^>]+>', '', text)
    
    # Remove script content even if tags are malformed
    clean_text = re.sub(r'(?i)<script.*?</script>', '', clean_text)
    clean_text = re.sub(r'(?i)<style.*?</style>', '', clean_text)
    
    # Remove common XSS patterns
    clean_text = re.sub(r'(?i)javascript:', '', clean_text)
    clean_text = re.sub(r'(?i)on\w+\s*=', '', clean_text)  # Remove onclick, onerror, etc.
    
    return clean_text.strip()


def sanitize_dict(data: dict, fields: list[str]) -> dict:
    """
    Sanitize specific fields in a dictionary.
    
    Args:
        data: Dictionary containing data to sanitize
        fields: List of field names to sanitize
        
    Returns:
        Dictionary with specified fields sanitized
    """
    sanitized = data.copy()
    for field in fields:
        if field in sanitized and isinstance(sanitized[field], str):
            sanitized[field] = sanitize_html(sanitized[field])
    return sanitized
