from typing import List, Optional

def calculate_pd(detected_events: int, required_events: int) -> Optional[float]:
    """Probability of Detection (Pd). Higher is better."""
    if required_events == 0:
        return None
    return detected_events / required_events

def calculate_pfa(false_alarms: int, opportunities: int) -> Optional[float]:
    """Probability of False Alarm (Pfa). Lower is better."""
    if opportunities == 0:
        return None
    return false_alarms / opportunities

def calculate_ait(intercept_times: List[float]) -> Optional[float]:
    """Average Intercept Time (AIT). Lower is better."""
    if not intercept_times:
        return None
    return sum(intercept_times) / len(intercept_times)

def calculate_detection_latency(latencies: List[float]) -> Optional[float]:
    """Detection Latency. Time between emitter active and detection. Lower is better."""
    if not latencies:
        return None
    return sum(latencies) / len(latencies)

def calculate_hpdr(detected_hp: int, required_hp: int) -> Optional[float]:
    """High-Priority Detection Rate (HPDR). Higher is better."""
    if required_hp == 0:
        return None
    return detected_hp / required_hp
