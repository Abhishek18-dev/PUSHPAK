import requests
import time
import sys

BASE_URL = "http://localhost:8080/api/v1"

def print_header(title):
    print(f"\n{'='*50}")
    print(f" {title}")
    print(f"{'='*50}")

def check_health():
    print("Checking backend health...")
    try:
        resp = requests.get(f"{BASE_URL.replace('/api/v1', '')}/health")
        if resp.status_code == 200:
            print("Backend is HEALTHY \u2705")
            return True
    except requests.exceptions.ConnectionError:
        pass
    print("Backend is NOT REACHABLE \u274C")
    return False

def create_experiment():
    print_header("1. Creating Experiment (Scenario A: 80% Fixed Emitters)")
    payload = {
        "scenario": "A",
        "policies": ["baseline", "bandit"],
        "name": "Demo Experiment"
    }
    resp = requests.post(f"{BASE_URL}/experiments", json=payload)
    if resp.status_code == 201:
        exp_id = resp.json()["data"]["id"]
        print(f"Experiment created successfully with ID: {exp_id} \u2705")
        return exp_id
    else:
        print(f"Failed to create experiment: {resp.text}")
        sys.exit(1)

def start_experiment(exp_id):
    print_header("2. Starting Experiment Runs")
    resp = requests.post(f"{BASE_URL}/experiments/{exp_id}/run")
    if resp.status_code == 200:
        print("Experiment runs launched in background \u2705")
    else:
        print(f"Failed to start experiment: {resp.text}")
        sys.exit(1)

def poll_results(exp_id):
    print_header("3. Polling Simulation Progress")
    while True:
        resp = requests.get(f"{BASE_URL}/experiments/{exp_id}/results")
        data = resp.json().get("data", {})
        status = data.get("status")
        
        print(f"Experiment Status: {status.upper()}")
        if status == "completed":
            print("\nSimulation Complete \u2705")
            return data.get("results", [])
        elif status == "failed":
            print("Experiment failed! \u274C")
            sys.exit(1)
            
        time.sleep(2)

def print_results(results):
    print_header("4. Final Comparison Results")
    print(f"{'POLICY':<12} | {'Pd (Detect %)':<15} | {'Pfa (False Alarm %)':<20} | {'REWARD':<10}")
    print("-" * 65)
    
    for res in results:
        policy = res.get("policy", "unknown")
        # In a real run, metrics would be populated. Since ML is mocked in demo,
        # we might just see baseline results populated eventually.
        # This script expects the backend to eventually populate the metrics_json column.
        # Since we haven't implemented metrics extraction from the DB back into the DTO in ExperimentService,
        # (they are populated at the end of SimulationService but we need to ensure ExperimentService reads them),
        # we will print what we can.
        metrics = res.get("metrics", {})
        pd = metrics.get("pd", 0.0)
        pfa = metrics.get("pfa", 0.0)
        reward = metrics.get("cumulativeReward", 0.0)
        
        print(f"{policy:<12} | {pd:<15.4f} | {pfa:<20.4f} | {reward:<10.2f}")

if __name__ == "__main__":
    print("Starting RF Scheduler Backend Demo Script...\n")
    if not check_health():
        print("Please start the Spring Boot backend on port 8080 before running this demo.")
        sys.exit(1)
        
    exp_id = create_experiment()
    start_experiment(exp_id)
    results = poll_results(exp_id)
    print_results(results)
    print("\nDemo completed successfully. \u2728")
