"""
Monitor preprocessing progress - shows current status
"""
import os
from pathlib import Path
import time

output_base = Path(r"D:\FYP\Code\dyslexia-detection-system\data\processed\handwriting")

print("Preprocessing Progress Monitor")
print("="*70)

expected_counts = {
    'roboflow_processed': 19862,
    'synthdata_processed': 2739
}

if not output_base.exists():
    print("Output directory doesn't exist yet. Preprocessing hasn't started.")
else:
    print(f"Output directory: {output_base}\n")
    
    for dataset_name, expected in expected_counts.items():
        dataset_path = output_base / dataset_name
        if dataset_path.exists():
            # Count all image files
            images = list(dataset_path.rglob("*.jpg")) + list(dataset_path.rglob("*.png"))
            count = len(images)
            progress = (count / expected) * 100 if expected > 0 else 0
            
            status = "COMPLETE" if count >= expected else "IN PROGRESS"
            print(f"{dataset_name}:")
            print(f"  Status: {status}")
            print(f"  Progress: {count}/{expected} ({progress:.1f}%)")
            print()
        else:
            print(f"{dataset_name}: NOT STARTED")
            print()

print("="*70)
print("\nNote: Script may still be running. Check again in a few minutes.")
