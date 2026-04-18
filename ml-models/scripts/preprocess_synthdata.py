"""
Preprocess Synthdata (Reversal Detection Dataset)
Handles YOLO format with labels
"""
import os
import sys
from pathlib import Path
import shutil

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.preprocess_data import HandwritingPreprocessor

# Paths
INPUT_ROOT = r"D:\FYP\Code\Handwriting_data\14852659\synthdata_handwriting\kaggle\working\synthdata"
OUTPUT_ROOT = r"D:\FYP\Code\dyslexia-detection-system\data\processed\handwriting\synthdata_processed"

def preprocess_synthdata():
    """Preprocess Synthdata with YOLO labels."""
    print("="*70)
    print("SYNTHDATA PREPROCESSING")
    print("="*70)
    print(f"Input: {INPUT_ROOT}")
    print(f"Output: {OUTPUT_ROOT}")
    print()
    
    # Check if input exists
    if not os.path.exists(INPUT_ROOT):
        print(f"ERROR: Input directory not found!")
        return False
    
    # Create preprocessor (NO denoising, like Roboflow)
    preprocessor = HandwritingPreprocessor(
        target_size=(640, 640),
        denoise=False,
        normalize=True,
        grayscale=True
    )
    
    # Process each split (train and val)
    splits = ['train', 'val']
    total_processed = 0
    
    for split in splits:
        print(f"\nProcessing {split.upper()} split...")
        print("-" * 70)
        
        input_images = os.path.join(INPUT_ROOT, 'images', split)
        output_images = os.path.join(OUTPUT_ROOT, 'images', split)
        
        if not os.path.exists(input_images):
            print(f"  WARNING: {input_images} not found, skipping...")
            continue
        
        # Preprocess images
        processed, failed = preprocessor.process_dataset(
            input_dir=input_images,
            output_dir=output_images,
            preserve_structure=False
        )
        
        print(f"  Processed: {processed} images")
        print(f"  Failed: {failed} images")
        total_processed += processed
        
        # Copy labels
        input_labels = os.path.join(INPUT_ROOT, 'labels', split)
        output_labels = os.path.join(OUTPUT_ROOT, 'labels', split)
        
        if os.path.exists(input_labels):
            print(f"  Copying labels...")
            preprocessor.copy_labels(input_labels, output_labels)
            label_count = len(list(Path(output_labels).glob("*.txt")))
            print(f"  Labels copied: {label_count} files")
    
    # Copy data.yaml
    yaml_input = os.path.join(INPUT_ROOT, 'data.yaml')
    yaml_output = os.path.join(OUTPUT_ROOT, 'data.yaml')
    
    if os.path.exists(yaml_input):
        print(f"\nCopying data.yaml...")
        shutil.copy2(yaml_input, yaml_output)
        
        # Update paths in data.yaml to point to processed images
        with open(yaml_output, 'r') as f:
            content = f.read()
        
        # Update paths
        content = content.replace('/kaggle/working/synthdata', str(OUTPUT_ROOT).replace('\\', '/'))
        
        with open(yaml_output, 'w') as f:
            f.write(content)
        
        print(f"  data.yaml copied and paths updated")
    
    print("\n" + "="*70)
    print(f"PREPROCESSING COMPLETE!")
    print(f"  Total images processed: {total_processed}")
    print(f"  Output location: {OUTPUT_ROOT}")
    print("="*70)
    
    return True


if __name__ == "__main__":
    success = preprocess_synthdata()
    if success:
        print("\nReady for Step 1.2: Data Augmentation")
    else:
        print("\nPreprocessing failed. Check errors above.")
