"""
Test script to verify preprocessing works correctly.
Tests with a single image before processing entire datasets.
"""

import os
import sys
import cv2
import numpy as np
from pathlib import Path

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.preprocess_data import HandwritingPreprocessor


def test_preprocessing():
    """Test preprocessing on a single image."""
    print("="*70)
    print("PREPROCESSING TEST")
    print("="*70)
    
    # Find a test image from Roboflow dataset
    test_image_search = Path(r"D:\FYP\Code\Handwriting_data\children with Dyslexia handwrite recognization.v2i.folder\train")
    
    if not test_image_search.exists():
        print("❌ Test dataset not found at expected location")
        print(f"   Expected: {test_image_search}")
        return False
    
    # Find first image in any subfolder
    test_images = list(test_image_search.rglob("*.jpg"))[:3]  # Get first 3 images
    
    if not test_images:
        print("❌ No test images found")
        return False
    
    print(f"✅ Found {len(test_images)} test images")
    print()
    
    # Initialize preprocessor
    preprocessor = HandwritingPreprocessor(
        target_size=(640, 640),
        denoise=True,
        normalize=True,
        grayscale=True
    )
    
    # Test each image
    success_count = 0
    for i, test_img in enumerate(test_images, 1):
        print(f"Test {i}/{len(test_images)}: {test_img.name}")
        print("-" * 50)
        
        # Read original
        original = cv2.imread(str(test_img))
        if original is None:
            print(f"   ❌ Could not read original image")
            continue
        
        print(f"   Original shape: {original.shape}")
        
        # Preprocess
        processed = preprocessor.preprocess_image(str(test_img))
        
        if processed is None:
            print(f"   ❌ Preprocessing failed")
            continue
        
        print(f"   Processed shape: {processed.shape}")
        print(f"   Processed dtype: {processed.dtype}")
        print(f"   Value range: [{processed.min():.3f}, {processed.max():.3f}]")
        
        # Validate
        checks = {
            "Shape is 640x640": processed.shape == (640, 640),
            "Is grayscale": len(processed.shape) == 2,
            "Is normalized": processed.min() >= 0 and processed.max() <= 1.0,
            "Data type is float32": processed.dtype == np.float32
        }
        
        all_pass = all(checks.values())
        
        for check_name, passed in checks.items():
            status = "✅" if passed else "❌"
            print(f"   {status} {check_name}")
        
        if all_pass:
            success_count += 1
            print(f"   ✅ Test {i} PASSED")
        else:
            print(f"   ❌ Test {i} FAILED")
        print()
    
    # Summary
    print("="*70)
    print(f"RESULT: {success_count}/{len(test_images)} tests passed")
    print("="*70)
    
    if success_count == len(test_images):
        print("✅ All tests passed! Preprocessing is working correctly.")
        print("\nYou can now run:")
        print("  python scripts\\run_preprocessing.py")
        return True
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return False


if __name__ == "__main__":
    test_preprocessing()
