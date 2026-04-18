"""
Augment Synthdata for Reversal Detection
Applies rotation, scale, brightness, and noise
NO horizontal/vertical flips (to avoid b/d confusion)
Target: 2x expansion (2,739 → ~5,500 images)
"""
import os
import cv2
import numpy as np
from pathlib import Path
from tqdm import tqdm
import random
import shutil

# Paths
INPUT_ROOT = r"D:\FYP\Code\dyslexia-detection-system\data\processed\handwriting\synthdata_processed"
OUTPUT_ROOT = r"D:\FYP\Code\dyslexia-detection-system\data\processed\handwriting\synthdata_augmented"

# Augmentation parameters
AUGMENTATION_FACTOR = 2  # 2x expansion
ROTATION_RANGE = (-15, 15)  # degrees
SCALE_RANGE = (0.9, 1.1)    # scale factor
BRIGHTNESS_RANGE = (0.8, 1.2)  # brightness multiplier
NOISE_STDDEV = 0.02  # Gaussian noise standard deviation

def rotate_image_and_boxes(image, boxes, angle):
    """Rotate image and adjust bounding boxes."""
    h, w = image.shape[:2]
    center = (w / 2, h / 2)
    
    # Rotation matrix
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    
    # Rotate image
    rotated = cv2.warpAffine(image, M, (w, h), 
                             flags=cv2.INTER_LINEAR,
                             borderMode=cv2.BORDER_CONSTANT,
                             borderValue=(255, 255, 255))
    
    # Rotate bounding boxes
    rotated_boxes = []
    for box in boxes:
        class_id, x_center, y_center, width, height = box
        
        # Convert YOLO format to corners
        x1 = (x_center - width / 2) * w
        y1 = (y_center - height / 2) * h
        x2 = (x_center + width / 2) * w
        y2 = (y_center + height / 2) * h
        
        # Get all four corners
        corners = np.array([
            [x1, y1, 1],
            [x2, y1, 1],
            [x2, y2, 1],
            [x1, y2, 1]
        ])
        
        # Rotate corners
        rotated_corners = M.dot(corners.T).T
        
        # Get new bounding box
        x_coords = rotated_corners[:, 0]
        y_coords = rotated_corners[:, 1]
        
        new_x1 = np.clip(x_coords.min(), 0, w)
        new_y1 = np.clip(y_coords.min(), 0, h)
        new_x2 = np.clip(x_coords.max(), 0, w)
        new_y2 = np.clip(y_coords.max(), 0, h)
        
        # Convert back to YOLO format
        new_x_center = ((new_x1 + new_x2) / 2) / w
        new_y_center = ((new_y1 + new_y2) / 2) / h
        new_width = (new_x2 - new_x1) / w
        new_height = (new_y2 - new_y1) / h
        
        # Only keep if box is valid
        if new_width > 0.01 and new_height > 0.01:
            rotated_boxes.append([class_id, new_x_center, new_y_center, new_width, new_height])
    
    return rotated, rotated_boxes


def scale_image_and_boxes(image, boxes, scale_factor):
    """Scale image and adjust bounding boxes."""
    h, w = image.shape[:2]
    new_h, new_w = int(h * scale_factor), int(w * scale_factor)
    
    # Resize image
    scaled = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    
    # Pad or crop to original size
    if scale_factor > 1:
        # Crop center
        start_x = (new_w - w) // 2
        start_y = (new_h - h) // 2
        scaled = scaled[start_y:start_y+h, start_x:start_x+w]
        
        # Adjust boxes
        scaled_boxes = []
        for box in boxes:
            class_id, x_center, y_center, width, height = box
            
            # Adjust coordinates
            new_x = (x_center * new_w - start_x) / w
            new_y = (y_center * new_h - start_y) / h
            new_w_norm = (width * new_w) / w
            new_h_norm = (height * new_h) / h
            
            # Only keep if box is within bounds
            if (0 < new_x < 1 and 0 < new_y < 1 and 
                new_w_norm > 0.01 and new_h_norm > 0.01):
                scaled_boxes.append([class_id, new_x, new_y, new_w_norm, new_h_norm])
    else:
        # Pad
        pad_h = (h - new_h) // 2
        pad_w = (w - new_w) // 2
        scaled = cv2.copyMakeBorder(scaled, pad_h, h - new_h - pad_h, 
                                   pad_w, w - new_w - pad_w,
                                   cv2.BORDER_CONSTANT, value=(255, 255, 255))
        
        # Adjust boxes
        scaled_boxes = []
        for box in boxes:
            class_id, x_center, y_center, width, height = box
            
            # Adjust coordinates
            new_x = (x_center * new_w + pad_w) / w
            new_y = (y_center * new_h + pad_h) / h
            new_w_norm = (width * new_w) / w
            new_h_norm = (height * new_h) / h
            
            scaled_boxes.append([class_id, new_x, new_y, new_w_norm, new_h_norm])
    
    return scaled, scaled_boxes


def adjust_brightness(image, factor):
    """Adjust image brightness."""
    adjusted = np.clip(image * factor, 0, 255).astype(np.uint8)
    return adjusted


def add_noise(image):
    """Add Gaussian noise to image."""
    noise = np.random.normal(0, NOISE_STDDEV * 255, image.shape)
    noisy = np.clip(image + noise, 0, 255).astype(np.uint8)
    return noisy


def augment_image(image, boxes, aug_type):
    """Apply specific augmentation."""
    if aug_type == 'rotation':
        angle = random.uniform(*ROTATION_RANGE)
        return rotate_image_and_boxes(image, boxes, angle)
    
    elif aug_type == 'scale':
        scale = random.uniform(*SCALE_RANGE)
        return scale_image_and_boxes(image, boxes, scale)
    
    elif aug_type == 'brightness':
        factor = random.uniform(*BRIGHTNESS_RANGE)
        return adjust_brightness(image, factor), boxes
    
    elif aug_type == 'noise':
        return add_noise(image), boxes
    
    elif aug_type == 'combined':
        # Apply multiple augmentations
        aug_image, aug_boxes = image.copy(), boxes.copy()
        
        # Random subset of augmentations
        augs = random.sample(['rotation', 'scale', 'brightness', 'noise'], 
                            k=random.randint(2, 3))
        
        for aug in augs:
            if aug == 'rotation':
                angle = random.uniform(*ROTATION_RANGE)
                aug_image, aug_boxes = rotate_image_and_boxes(aug_image, aug_boxes, angle)
            elif aug == 'scale':
                scale = random.uniform(*SCALE_RANGE)
                aug_image, aug_boxes = scale_image_and_boxes(aug_image, aug_boxes, scale)
            elif aug == 'brightness':
                factor = random.uniform(*BRIGHTNESS_RANGE)
                aug_image = adjust_brightness(aug_image, factor)
            elif aug == 'noise':
                aug_image = add_noise(aug_image)
        
        return aug_image, aug_boxes
    
    return image, boxes


def load_yolo_labels(label_path):
    """Load YOLO format labels."""
    boxes = []
    if os.path.exists(label_path):
        with open(label_path, 'r') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) == 5:
                    class_id = int(parts[0])
                    x, y, w, h = map(float, parts[1:])
                    boxes.append([class_id, x, y, w, h])
    return boxes


def save_yolo_labels(label_path, boxes):
    """Save YOLO format labels."""
    with open(label_path, 'w') as f:
        for box in boxes:
            class_id, x, y, w, h = box
            f.write(f"{class_id} {x:.6f} {y:.6f} {w:.6f} {h:.6f}\n")


def augment_dataset():
    """Augment the entire dataset."""
    print("="*70)
    print("SYNTHDATA AUGMENTATION")
    print("="*70)
    print(f"Input: {INPUT_ROOT}")
    print(f"Output: {OUTPUT_ROOT}")
    print(f"Target: {AUGMENTATION_FACTOR}x expansion")
    print()
    
    # Augmentation strategies
    aug_strategies = ['rotation', 'scale', 'brightness', 'noise', 'combined']
    
    total_original = 0
    total_augmented = 0
    
    for split in ['train', 'val']:
        print(f"\nProcessing {split.upper()} split...")
        print("-" * 70)
        
        input_images_dir = os.path.join(INPUT_ROOT, 'images', split)
        input_labels_dir = os.path.join(INPUT_ROOT, 'labels', split)
        output_images_dir = os.path.join(OUTPUT_ROOT, 'images', split)
        output_labels_dir = os.path.join(OUTPUT_ROOT, 'labels', split)
        
        if not os.path.exists(input_images_dir):
            print(f"  WARNING: {input_images_dir} not found, skipping...")
            continue
        
        # Create output directories
        os.makedirs(output_images_dir, exist_ok=True)
        os.makedirs(output_labels_dir, exist_ok=True)
        
        # Get all images (check for both jpg and png)
        image_files = list(Path(input_images_dir).glob("*.jpg"))
        if len(image_files) == 0:
            image_files = list(Path(input_images_dir).glob("*.png"))
        print(f"  Found {len(image_files)} original images")
        
        # Copy original images first
        print("  Copying original images...")
        for img_path in tqdm(image_files, desc="  Copying"):
            img_name = img_path.name
            label_name = img_path.stem + '.txt'
            
            # Copy image
            shutil.copy2(img_path, os.path.join(output_images_dir, img_name))
            
            # Copy label
            label_path = os.path.join(input_labels_dir, label_name)
            if os.path.exists(label_path):
                shutil.copy2(label_path, os.path.join(output_labels_dir, label_name))
        
        total_original += len(image_files)
        
        # Generate augmented images
        target_augmented = len(image_files) * (AUGMENTATION_FACTOR - 1)
        print(f"  Generating {target_augmented} augmented images...")
        
        augmented_count = 0
        with tqdm(total=target_augmented, desc="  Augmenting") as pbar:
            while augmented_count < target_augmented:
                # Random image
                img_path = random.choice(image_files)
                img_name = img_path.stem
                label_path = os.path.join(input_labels_dir, img_name + '.txt')
                
                # Load image and labels
                image = cv2.imread(str(img_path))
                boxes = load_yolo_labels(label_path)
                
                if image is None:
                    continue
                
                # Random augmentation
                aug_type = random.choice(aug_strategies)
                aug_image, aug_boxes = augment_image(image, boxes, aug_type)
                
                # Skip if no valid boxes remain
                if len(aug_boxes) == 0:
                    continue
                
                # Save augmented image and label (use original extension)
                aug_name = f"{img_name}_aug{augmented_count}"
                img_ext = img_path.suffix  # .png or .jpg
                aug_img_path = os.path.join(output_images_dir, aug_name + img_ext)
                aug_label_path = os.path.join(output_labels_dir, aug_name + '.txt')
                
                cv2.imwrite(aug_img_path, aug_image)
                save_yolo_labels(aug_label_path, aug_boxes)
                
                augmented_count += 1
                total_augmented += 1
                pbar.update(1)
        
        print(f"  Split complete: {len(image_files)} original + {augmented_count} augmented")
    
    # Copy data.yaml
    yaml_input = os.path.join(INPUT_ROOT, 'data.yaml')
    yaml_output = os.path.join(OUTPUT_ROOT, 'data.yaml')
    
    if os.path.exists(yaml_input):
        print(f"\nCopying data.yaml...")
        shutil.copy2(yaml_input, yaml_output)
        
        # Update paths
        with open(yaml_output, 'r') as f:
            content = f.read()
        
        content = content.replace('synthdata_processed', 'synthdata_augmented')
        
        with open(yaml_output, 'w') as f:
            f.write(content)
        
        print(f"  data.yaml copied and paths updated")
    
    print("\n" + "="*70)
    print(f"AUGMENTATION COMPLETE!")
    print(f"  Original images: {total_original}")
    print(f"  Augmented images: {total_augmented}")
    print(f"  Total images: {total_original + total_augmented}")
    print(f"  Expansion factor: {(total_original + total_augmented) / total_original:.2f}x" if total_original > 0 else "  No images to augment")
    print(f"  Output location: {OUTPUT_ROOT}")
    print("="*70)


if __name__ == "__main__":
    random.seed(42)  # For reproducibility
    np.random.seed(42)
    augment_dataset()
    print("\nReady for Phase 2: Model Training")
