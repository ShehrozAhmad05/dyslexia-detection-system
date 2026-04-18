"""
Manual Batch Processor - Process ONE folder at a time
Run this script multiple times to complete all missing folders
"""
import os
import sys
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.preprocess_data import HandwritingPreprocessor

INPUT_ROOT = r"D:\FYP\Code\Handwriting_data\children with Dyslexia handwrite recognization.v2i.folder"
OUTPUT_ROOT = r"D:\FYP\Code\dyslexia-detection-system\data\processed\handwriting\roboflow_processed"

def find_next_folder():
    """Find the next folder that needs processing."""
    splits = ['train', 'valid', 'test']
    letters = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    
    for split in splits:
        for letter in letters:
            input_path = os.path.join(INPUT_ROOT, split, letter)
            output_path = os.path.join(OUTPUT_ROOT, split, letter)
            
            if not os.path.exists(input_path):
                continue
            
            # Check if needs processing
            input_count = len(list(Path(input_path).glob("*.jpg")))
            
            if not os.path.exists(output_path):
                return split, letter, input_count
            
            output_count = len(list(Path(output_path).glob("*.jpg")))
            
            if output_count < input_count:
                return split, letter, input_count
    
    return None, None, 0


def process_one_folder(split, letter, expected_count):
    """Process a single folder."""
    input_path = os.path.join(INPUT_ROOT, split, letter)
    output_path = os.path.join(OUTPUT_ROOT, split, letter)
    
    print(f"Processing: {split}/{letter}")
    print(f"Expected: {expected_count} images")
    print("-" * 70)
    
    # Lightweight preprocessor (NO denoising)
    preprocessor = HandwritingPreprocessor(
        target_size=(640, 640),
        denoise=False,  # NO denoising to avoid crashes
        normalize=True,
        grayscale=True
    )
    
    try:
        processed, failed = preprocessor.process_dataset(
            input_dir=input_path,
            output_dir=output_path,
            preserve_structure=False
        )
        
        print("\n" + "="*70)
        print(f"SUCCESS!")
        print(f"  Processed: {processed} images")
        print(f"  Failed: {failed} images")
        print("="*70)
        
        return True
    except Exception as e:
        print("\n" + "="*70)
        print(f"ERROR: {str(e)}")
        print("="*70)
        return False


def show_progress():
    """Show overall progress."""
    output_base = Path(OUTPUT_ROOT)
    
    if not output_base.exists():
        return 0, 0
    
    images = list(output_base.rglob("*.jpg"))
    total_expected = 19862  # Total in Roboflow dataset
    
    return len(images), total_expected


def main():
    print("\n" + "="*70)
    print("MANUAL BATCH PROCESSOR")
    print("="*70)
    
    # Show current progress
    current, total = show_progress()
    print(f"\nCurrent Progress: {current}/{total} images ({current/total*100:.1f}%)")
    print()
    
    # Find next folder to process
    split, letter, count = find_next_folder()
    
    if split is None:
        print("="*70)
        print("ALL FOLDERS COMPLETE!")
        print("="*70)
        current, total = show_progress()
        print(f"Final count: {current}/{total} images")
        return
    
    print(f"Next folder: {split}/{letter} ({count} images)")
    print()
    
    # Ask for confirmation
    response = input("Process this folder? (y/n): ").strip().lower()
    
    if response != 'y':
        print("\nCancelled. Run again when ready.")
        return
    
    print("\nStarting processing...")
    print("="*70)
    
    # Process the folder
    success = process_one_folder(split, letter, count)
    
    if success:
        # Show updated progress
        current, total = show_progress()
        remaining_folders = 0
        
        # Count remaining
        splits = ['train', 'valid', 'test']
        letters = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        for s in splits:
            for l in letters:
                inp = os.path.join(INPUT_ROOT, s, l)
                out = os.path.join(OUTPUT_ROOT, s, l)
                if os.path.exists(inp):
                    inp_count = len(list(Path(inp).glob("*.jpg")))
                    out_count = len(list(Path(out).glob("*.jpg"))) if os.path.exists(out) else 0
                    if out_count < inp_count:
                        remaining_folders += 1
        
        print(f"\nUpdated Progress: {current}/{total} images ({current/total*100:.1f}%)")
        print(f"Remaining folders: {remaining_folders}")
        print()
        print("="*70)
        print("RUN THIS SCRIPT AGAIN to process the next folder")
        print("="*70)
    else:
        print("\nProcessing failed. Check the error above.")


if __name__ == "__main__":
    main()
