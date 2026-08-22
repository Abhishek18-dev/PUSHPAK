import argparse
import sys
import uuid
from pathlib import Path
from datetime import datetime

from ml.training.adapter import BackendTrainingAdapter, MockTrainingAdapter
from ml.training.train_bandit import train_bandit
from ml.training.train_q_learning import train_q_learning

def main():
    parser = argparse.ArgumentParser(description="AI-ML-1 Training Pipeline Entry Point")
    parser.add_argument("--algorithm", type=str, choices=["bandit", "q_learning", "both"], required=True)
    parser.add_argument("--output-dir", type=str, default="training_runs", help="Directory to save training artifacts")
    parser.add_argument("--episodes", type=int, default=1000, help="Number of training episodes")
    parser.add_argument("--seed", type=int, default=42, help="Global deterministic seed")
    parser.add_argument("--max-steps", type=int, default=1000, help="Max steps per episode")
    parser.add_argument("--num-bands", type=int, default=16, help="Number of configurable bands")
    
    args = parser.parse_args()
    
    output_dir = Path(args.output_dir)
    run_id = f"run_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:4]}"
    
    print(f"Starting Training Pipeline: Run {run_id}")
    print(f"Algorithm: {args.algorithm}")
    print(f"Output Directory: {output_dir.absolute()}")
    
    # In a real deployed environment, the BackendTrainingAdapter would be dynamically 
    # loaded or injected. Here we use the MockTrainingAdapter which safely fails to 
    # prevent fake physics generation unless overriden by a test environment.
    adapter = MockTrainingAdapter()
    
    try:
        results = {}
        
        if args.algorithm in ["bandit", "both"]:
            print("\n--- Training Contextual Bandit ---")
            res_bandit = train_bandit(
                adapter=adapter,
                run_id=run_id,
                output_dir=output_dir,
                episodes=args.episodes,
                seed=args.seed,
                num_bands=args.num_bands,
                max_steps_per_episode=args.max_steps
            )
            results["bandit"] = res_bandit
            
        if args.algorithm in ["q_learning", "both"]:
            print("\n--- Training Tabular Q-Learning ---")
            res_q = train_q_learning(
                adapter=adapter,
                run_id=run_id,
                output_dir=output_dir,
                episodes=args.episodes,
                seed=args.seed,
                num_bands=args.num_bands,
                max_steps_per_episode=args.max_steps
            )
            results["q_learning"] = res_q
            
        print("\n=== Training Completed Successfully ===")
        for algo, res in results.items():
            print(f"{algo.upper()} Checkpoint: {res['checkpoint_path']}")
            
    except NotImplementedError as e:
        print(f"\n[BLOCKED] Training aborted safely: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected training failure: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
