"""
Visual comparison script - shows before/after preprocessing examples.
Saves comparison images for verification.
"""

import os
import sys
import cv2
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.preprocess_data import HandwritingPreprocessor


def create_comparison_plot(original_path: str, output_path: str):
    """Create before/after comparison plot."""
    
    # Read original
    original = cv2.imread(original_path)
    if original is None:
        print(f"Could not read {original_path}")
        return False
    
    # Preprocess
    preprocessor = HandwritingPreprocessor(
        target_size=(640, 640),
        denoise=True,
        normalize=True,
        grayscale=True
    )
    processed = preprocessor.preprocess_image(original_path)
    
    if processed is None:
        print(f"Could not preprocess {original_path}")
        return False
    
    # Create figure
    fig, axes = plt.subplots(1, 2, figsize=(12, 6))
    
    # Original
    if len(original.shape) == 3:
        original_rgb = cv2.cvtColor(original, cv2.COLOR_BGR2RGB)
    else:
        original_rgb = original
    axes[0].imshow(original_rgb, cmap='gray' if len(original.shape) == 2 else None)
    axes[0].set_title(f"Original\nShape: {original.shape}", fontsize=12, fontweight='bold')
    axes[0].axis('off')
    
    # Processed
    axes[1].imshow(processed, cmap='gray')
    axes[1].set_title(f"Preprocessed\nShape: {processed.shape}\nRange: [{processed.min():.2f}, {processed.max():.2f}]", 
                     fontsize=12, fontweight='bold')
    axes[1].axis('off')
    
    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()
    
    print(f"✅ Saved comparison: {output_path}")
    return True


def main():
    """Generate comparison images for multiple samples."""
    print("="*70)
    print("PREPROCESSING VISUAL COMPARISON")
    print("="*70)
    print()
    
    # Setup paths
    test_dirs = [
        Path(r"D:\FYP\Code\Handwriting_data\children with Dyslexia handwrite recognization.v2i.folder\train\A"),
        Path(r"D:\FYP\Code\Handwriting_data\children with Dyslexia handwrite recognization.v2i.folder\train\B"),
        Path(r"D:\FYP\Code\Handwriting_data\14852659\synthdata_handwriting\kaggle\working\synthdata\images\train"),
    ]
    
    output_dir = Path(r"D:\FYP\Code\dyslexia-detection-system\ml-models\scripts\preprocessing_samples")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Collect sample images
    samples = []
    for test_dir in test_dirs:
        if test_dir.exists():
            images = list(test_dir.glob("*.jpg")) + list(test_dir.glob("*.png"))
            if images:
                samples.append((images[0], test_dir.name))
    
    if not samples:
        print("❌ No sample images found")
        print("   Please check that dataset paths are correct")
        return
    
    print(f"Found {len(samples)} sample images to process\n")
    
    # Create comparisons
    for i, (img_path, source) in enumerate(samples, 1):
        print(f"Processing {i}/{len(samples)}: {img_path.name} (from {source})")
        output_path = output_dir / f"comparison_{i}_{source}_{img_path.stem}.png"
        create_comparison_plot(str(img_path), str(output_path))
    
    print()
    print("="*70)
    print(f"✅ Comparison images saved to: {output_dir}")
    print("="*70)
    print("\n📋 Review the comparison images to verify:")
    print("   1. Images are resized to 640×640")
    print("   2. Images are converted to grayscale")
    print("   3. Noise is reduced")
    print("   4. Pixel values are in [0, 1] range")
    print()


if __name__ == "__main__":
    main()
