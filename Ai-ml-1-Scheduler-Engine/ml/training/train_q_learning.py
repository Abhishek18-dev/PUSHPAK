import os
import json
import time
from datetime import datetime
from typing import Any, Dict
from pathlib import Path
from ml.agents.q_learning_agent import QLearningAgent, QLearningConfig
from ml.training.adapter import BackendTrainingAdapter

def train_q_learning(
    adapter: BackendTrainingAdapter, 
    run_id: str,
    output_dir: Path, 
    episodes: int = 1000, 
    seed: int = 42,
    num_bands: int = 16,
    max_steps_per_episode: int = 1000
) -> Dict[str, Any]:
    
    # Initialize configuration
    config = QLearningConfig(num_bands=num_bands, seed=seed)
    agent = QLearningAgent(config)
    
    run_dir = output_dir / "q_learning" / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    
    metrics = {
        "episode_rewards": [],
        "mean_reward": 0.0,
        "update_count": 0,
        "final_epsilon": 1.0,
        "q_table_size": 0
    }
    
    print(f"Starting Q-Learning training for {episodes} episodes...")
    
    total_reward = 0.0
    update_count = 0
    
    for episode in range(episodes):
        state = adapter.reset()
        episode_reward = 0.0
        
        for step in range(max_steps_per_episode):
            action = agent.select_action(state)
            
            # Q-Learning crucially needs next_state and terminated for Bellman bootstrapping
            next_state, reward, terminated = adapter.step(action)
            
            agent.update(
                state=state, 
                action=action, 
                reward=reward, 
                next_state=next_state, 
                terminated=terminated
            )
            
            update_count += 1
            episode_reward += reward
            
            if terminated:
                break
                
            state = next_state
            
        agent.decay_epsilon()
        metrics["episode_rewards"].append(episode_reward)
        total_reward += episode_reward
        
    metrics["mean_reward"] = total_reward / episodes if episodes > 0 else 0.0
    metrics["update_count"] = update_count
    metrics["final_epsilon"] = float(agent.epsilon)
    metrics["q_table_size"] = len(agent.q_table)
    
    # Save artifacts
    checkpoint_path = run_dir / "checkpoint.json"
    agent.save(str(checkpoint_path))
    
    with open(run_dir / "config.json", "w") as f:
        json.dump(config.model_dump(), f, indent=2)
        
    with open(run_dir / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
        
    summary = {
        "run_id": run_id,
        "algorithm": "q_learning",
        "seed": seed,
        "episodes": episodes,
        "max_steps": max_steps_per_episode,
        "number_of_bands": num_bands,
        "timestamp": datetime.utcnow().isoformat(),
        "checkpoint_path": str(checkpoint_path),
        "status": "TRAINED"
    }
    
    with open(run_dir / "training_summary.json", "w") as f:
        json.dump(summary, f, indent=2)
        
    return summary
