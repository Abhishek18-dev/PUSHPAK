"""
Reward Interface Boundary.

Per PRD Section 10.3 and API_CONTRACT.md, the reward is calculated by the Backend
using the formula:
r(t) = w1*D(t) + w2*P(t)*D(t) - w3*L(t) - w4*F(t) - w5*C(t) - w6*M(t)

AI-ML-1 DOES NOT compute this reward. It receives the calculated scalar value 
via the `/internal/learn` endpoint.

This module provides the validation boundary for the scalar reward 
consumed by the ML algorithms.
"""

def validate_reward(reward: float) -> float:
    """
    Validates that the received reward is a scalar float.
    
    Args:
        reward: The scalar reward from the Backend.
        
    Returns:
        The validated float reward.
        
    Raises:
        TypeError: If the reward is not a number.
    """
    if not isinstance(reward, (int, float)):
        raise TypeError(f"Reward must be a scalar float, got {type(reward)}")
    
    return float(reward)
