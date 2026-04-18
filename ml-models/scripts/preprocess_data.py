"""
Preprocessing Script for Handwriting Datasets
Handles resizing, grayscale conversion, denoising, and normalization
"""

import os
import cv2
import numpy as np
from pathlib import Path
from tqdm import tqdm
import argparse
import shutil
from typing import Tuple, Optional


class HandwritingPreprocessor:
    """
    Preprocesses handwriting images for ML training.
    Applies: resize, grayscale, denoise, normalize
    """
    
    def __init__(
        self,
        target_size: Tuple[int, int] = (640, 640),
        denoise: bool = True,
        normalize: bool = True,
        grayscale: bool = True
    ):
        """
        Initialize preprocessor with configuration.
        
        Args:
            target_size: Target image dimensions (width, height)
            denoise: Whether to apply denoising
            normalize: Whether to normalize pixel values to [0, 1]
            grayscale: Whether to convert to grayscale
        """
        self.target_size = target_size
        self.denoise = denoise
        self.normalize = normalize
        self.grayscale = grayscale
        
    def preprocess_image(self, image_path: str) -> Optional[np.ndarray]:
        """
        Preprocess a single image.
        
        Args:
            image_path: Path to input image
            
        Returns:
            Preprocessed image as numpy array, or None if processing fails
        """
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                print(f"Warning: Could not read image {image_path}")
                return None
            
            # Convert to grayscale if specified
            if self.grayscale:
                img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Resize to target dimensions
            img = cv2.resize(img, self.target_size, interpolation=cv2.INTER_AREA)
            
            # Apply denoising if specified
            if self.denoise:
                if self.grayscale:
                    # For grayscale images
                    img = cv2.fastNlMeansDenoising(img, None, h=10, templateWindowSize=7, searchWindowSize=21)
                else:
                    # For color images
                    img = cv2.fastNlMeansDenoisingColored(img, None, h=10, hColor=10, templateWindowSize=7, searchWindowSize=21)
            
            # Normalize pixel values to [0, 1] if specified
            if self.normalize:
                img = img.astype(np.float32) / 255.0
            
            return img
            
        except Exception as e:
            print(f"Error processing {image_path}: {str(e)}")
            return None
    
    def process_dataset(
        self,
        input_dir: str,
        output_dir: str,
        preserve_structure: bool = True,
        file_extensions: Tuple[str] = ('.jpg', '.jpeg', '.png', '.bmp')
    ):
        """
        Process entire dataset directory.
        
        Args:
            input_dir: Input directory containing images
            output_dir: Output directory for processed images
            preserve_structure: Whether to preserve subdirectory structure
            file_extensions: Tuple of valid file extensions
        """
        input_path = Path(input_dir)
        output_path = Path(output_dir)
        
        # Create output directory
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Find all image files
        image_files = []
        for ext in file_extensions:
            image_files.extend(input_path.rglob(f"*{ext}"))
        
        print(f"Found {len(image_files)} images to process")
        
        # Process images with progress bar
        processed_count = 0
        failed_count = 0
        
        for img_path in tqdm(image_files, desc="Processing images"):
            # Determine output path
            if preserve_structure:
                relative_path = img_path.relative_to(input_path)
                out_img_path = output_path / relative_path
            else:
                out_img_path = output_path / img_path.name
            
            # Create output subdirectory if needed
            out_img_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Preprocess image
            processed_img = self.preprocess_image(str(img_path))
            
            if processed_img is not None:
                # Save processed image
                # Note: If normalized, scale back to 0-255 for saving
                if self.normalize:
                    save_img = (processed_img * 255).astype(np.uint8)
                else:
                    save_img = processed_img
                
                cv2.imwrite(str(out_img_path), save_img)
                processed_count += 1
            else:
                failed_count += 1
        
        print(f"\nProcessing complete!")
        print(f"Successfully processed: {processed_count}")
        print(f"Failed: {failed_count}")
        
        return processed_count, failed_count
    
    def copy_labels(self, input_dir: str, output_dir: str):
        """
        Copy label files (for YOLO format) to output directory.
        
        Args:
            input_dir: Input directory containing labels
            output_dir: Output directory for labels
        """
        input_path = Path(input_dir)
        output_path = Path(output_dir)
        
        if not input_path.exists():
            print(f"Warning: Label directory {input_dir} does not exist")
            return
        
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Find all .txt label files
        label_files = list(input_path.rglob("*.txt"))
        
        print(f"Copying {len(label_files)} label files...")
        
        for label_path in tqdm(label_files, desc="Copying labels"):
            relative_path = label_path.relative_to(input_path)
            out_label_path = output_path / relative_path
            out_label_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(str(label_path), str(out_label_path))
        
        print("Label copying complete!")


def main():
    """Main function to run preprocessing from command line."""
    parser = argparse.ArgumentParser(description="Preprocess handwriting images for ML training")
    
    parser.add_argument(
        '--input_dir',
        type=str,
        required=True,
        help='Input directory containing images'
    )
    parser.add_argument(
        '--output_dir',
        type=str,
        required=True,
        help='Output directory for processed images'
    )
    parser.add_argument(
        '--size',
        type=int,
        default=640,
        help='Target image size (default: 640)'
    )
    parser.add_argument(
        '--no-denoise',
        action='store_true',
        help='Disable denoising'
    )
    parser.add_argument(
        '--no-normalize',
        action='store_true',
        help='Disable normalization'
    )
    parser.add_argument(
        '--no-grayscale',
        action='store_true',
        help='Keep color (do not convert to grayscale)'
    )
    parser.add_argument(
        '--flat-structure',
        action='store_true',
        help='Do not preserve directory structure'
    )
    parser.add_argument(
        '--copy-labels',
        type=str,
        default=None,
        help='Directory containing labels to copy (for YOLO format)'
    )
    
    args = parser.parse_args()
    
    # Initialize preprocessor
    preprocessor = HandwritingPreprocessor(
        target_size=(args.size, args.size),
        denoise=not args.no_denoise,
        normalize=not args.no_normalize,
        grayscale=not args.no_grayscale
    )
    
    # Process dataset
    print(f"Preprocessing images from {args.input_dir} to {args.output_dir}")
    print(f"Configuration:")
    print(f"  - Size: {args.size}x{args.size}")
    print(f"  - Denoise: {not args.no_denoise}")
    print(f"  - Normalize: {not args.no_normalize}")
    print(f"  - Grayscale: {not args.no_grayscale}")
    print()
    
    preprocessor.process_dataset(
        input_dir=args.input_dir,
        output_dir=args.output_dir,
        preserve_structure=not args.flat_structure
    )
    
    # Copy labels if specified
    if args.copy_labels:
        print(f"\nCopying labels from {args.copy_labels}")
        preprocessor.copy_labels(args.copy_labels, args.output_dir.replace('images', 'labels'))


if __name__ == "__main__":
    main()
