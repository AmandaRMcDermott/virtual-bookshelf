#!/usr/bin/env python3

import os
import cv2
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
import pytesseract
import csv
import argparse
from datetime import datetime
from ultralytics import YOLO
from inference import get_model
import torch
import shutil

class YOLOSpineDetector:
    """Book spine detector using YOLOv8 model"""
    
    def __init__(self, output_dir="extracted_spines", conf_threshold=0.25):
        """Initialize the YOLO-based book spine detector"""
        self.output_dir = output_dir
        self.conf_threshold = conf_threshold
        
        # Create output directories if they don't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        self.spine_images_dir = os.path.join(output_dir, "spine_images")
        if not os.path.exists(self.spine_images_dir):
            os.makedirs(self.spine_images_dir)
            
        # CSV file to store extracted text
        self.csv_file = os.path.join(output_dir, "spine_text.csv")
        
        # Load YOLO model
        print("Loading YOLO model...")
        self.model = YOLO("yolo26n.pt")
        # self.model = YOLO("yolov8n.pt")
        
        # Define class names for the model
        self.class_names = self.model.names

    def load_image(self, image_path):
        """Load an image from the given path"""
        print(f"Loading image: {image_path}")
        # Check if file exists
        if not os.path.exists(image_path):
            print(f"Error: Image file {image_path} does not exist.")
            return None
        
        # Try to load with PIL first (more reliable for different image formats)
        try:
            pil_img = Image.open(image_path)
            # Convert PIL image to numpy array
            image_rgb = np.array(pil_img)
            
            # If the image is in grayscale, convert to RGB
            if len(image_rgb.shape) == 2:
                image_rgb = cv2.cvtColor(image_rgb, cv2.COLOR_GRAY2RGB)
                
            # If the image is RGBA, convert to RGB
            elif image_rgb.shape[2] == 4:
                image_rgb = cv2.cvtColor(image_rgb, cv2.COLOR_RGBA2RGB)
                
            return image_rgb
            
        except Exception as e:
            print(f"Failed to load with PIL: {e}, trying OpenCV...")
            
            # Try with OpenCV as fallback
            image = cv2.imread(image_path)
            if image is None:
                print(f"Error: Could not load image {image_path}")
                return None
                
            # Convert to RGB (OpenCV uses BGR)
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            return image_rgb

    def detect_spines(self, image):
        """Detect book spines in the image using YOLO"""
        # Run YOLO detection on the image
        results = self.model(image, conf=self.conf_threshold)
        return results[0]  # Return the first result
    
    def process_detections(self, results, image):
        """Process YOLO detection results to extract book spines"""
        boxes = results.boxes
        spine_images = []
        spine_coords = []
        
        if len(boxes) == 0:
            print("No books detected in the image.")
            return [], []
        
        print(f"Detected {len(boxes)} potential objects.")
        
        # Process each detected box
        for i, box in enumerate(boxes):
            # Get box coordinates
            x1, y1, x2, y2 = box.xyxy[0]  # Get box in (top, left, bottom, right) format
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            
            # Get class and confidence
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            
            # For now, we'll consider all detections as potential book spines
            # Later, we can filter based on the specific class if we have a custom-trained model
            
            # Extract the book spine image
            spine_img = image[y1:y2, x1:x2]
            spine_images.append(spine_img)
            spine_coords.append((x1, y1, x2-x1, y2-y1))  # (x, y, width, height)
            
            print(f"  Object {i+1}: Class={self.class_names[cls]}, Confidence={conf:.2f}, "
                 f"Size={spine_img.shape[1]}x{spine_img.shape[0]}")
        
        return spine_images, spine_coords
    
    def extract_text(self, spine_image):
        """Extract text from a spine image using OCR"""
        # Apply preprocessing to improve OCR results
        # Convert to grayscale
        gray = cv2.cvtColor(spine_image, cv2.COLOR_RGB2GRAY)
        
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Convert from NumPy array to PIL Image for pytesseract
        pil_image = Image.fromarray(thresh)
        
        # Extract text using pytesseract with different PSM modes and keep best result
        psm_modes = [6, 3, 4, 5]  # Try different page segmentation modes
        texts = []
        
        for psm in psm_modes:
            text = pytesseract.image_to_string(
                pil_image, 
                config=f'--psm {psm} --oem 3'
            ).strip()
            texts.append(text)
        
        # Select the best text (the one with the most characters, if any text was found)
        text = max(texts, key=len) if any(len(t) > 0 for t in texts) else ""
        
        # Try with the original image if no text was found
        if not text:
            pil_image = Image.fromarray(spine_image)
            text = pytesseract.image_to_string(pil_image, config='--psm 6').strip()
        
        return text
    
    def draw_detections(self, image, results):
        """Draw the detection results on the image"""
        # Create a copy of the image
        result_img = image.copy()
        boxes = results.boxes
        
        for i, box in enumerate(boxes):
            # Get box coordinates
            x1, y1, x2, y2 = box.xyxy[0]
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            
            # Get class and confidence
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            class_name = self.class_names[cls]
            
            # Draw rectangle
            cv2.rectangle(result_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Add label
            label = f"{i+1}: {class_name} {conf:.2f}"
            cv2.putText(result_img, label, (x1, y1-10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        return result_img
    
    def save_results(self, spine_images, spine_texts, original_image_name):
        """Save extracted spine images and texts"""
        # Create a base filename from the original image name
        base_name = os.path.splitext(os.path.basename(original_image_name))[0]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save spine images
        saved_paths = []
        for i, spine_img in enumerate(spine_images):
            # Create a filename for this spine image
            spine_filename = f"{base_name}_spine_{i+1}_{timestamp}.jpg"
            spine_path = os.path.join(self.spine_images_dir, spine_filename)
            
            # Convert from NumPy array to PIL Image
            pil_spine = Image.fromarray(spine_img)
            pil_spine.save(spine_path)
            saved_paths.append(spine_path)
        
        # Save spine texts to CSV
        with open(self.csv_file, 'a', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            # Write header if file is empty
            if os.path.getsize(self.csv_file) == 0:
                writer.writerow(['Image', 'Spine Number', 'Text', 'Image Path'])
            
            # Write data rows
            for i, (text, path) in enumerate(zip(spine_texts, saved_paths)):
                writer.writerow([base_name, i+1, text, path])
        
        print(f"Results saved to {self.csv_file} and {self.spine_images_dir}")
    
    def verify_detections(self, image_path):
        """Interactive verification of detected book spines"""
        # Load the image
        image = self.load_image(image_path)
        if image is None:
            return None
            
        # Run detection
        results = self.detect_spines(image)
        
        # Draw detections on the image
        result_img = self.draw_detections(image, results)
        
        # Save the verification image
        base_name = os.path.splitext(os.path.basename(image_path))[0]
        verification_img_path = os.path.join(self.output_dir, f"{base_name}_verification.png")
        
        plt.figure(figsize=(15, 10))
        plt.imshow(result_img)
        plt.title("Detected Book Spines")
        plt.axis('off')
        plt.savefig(verification_img_path, dpi=300)
        plt.close()
        
        print(f"Verification image saved to: {verification_img_path}")
        print("Please review the detected book spines in the saved image.")
        
        return verification_img_path

    def custom_train_yolo(self, train_data_dir, epochs=50):
        """Train a custom YOLO model on book spine data"""
        # This is a placeholder for training functionality
        # In a complete implementation, this would:
        # 1. Prepare annotated data for book spines
        # 2. Train the YOLO model on this data
        # 3. Save and load the custom model
        
        print(f"[Training functionality not fully implemented]")
        print(f"Would train on data from: {train_data_dir} for {epochs} epochs")
        
        # For now, we'll just use the pretrained model
        return self.model
        
    def process_image(self, image_path, save=True):
        """Process a single image to detect and extract book spines"""
        # Load the image
        image = self.load_image(image_path)
        if image is None:
            return None, None, None
        
        # Run YOLO detection
        results = self.detect_spines(image)
        
        # Process detections to extract spine images
        spine_images, spine_coords = self.process_detections(results, image)
        
        # Extract text from spine images
        spine_texts = []
        for spine_img in spine_images:
            text = self.extract_text(spine_img)
            spine_texts.append(text)
        
        # Draw detections on image
        result_img = self.draw_detections(image, results)
        
        # Save results if requested
        if save and spine_images:
            self.save_results(spine_images, spine_texts, image_path)
        
        return result_img, spine_images, spine_texts


def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Detect book spines using YOLO')
    parser.add_argument('--image', help='Path to the bookshelf image')
    parser.add_argument('--images', help='Directory containing bookshelf images')
    parser.add_argument('--output', default='extracted_spines', help='Output directory')
    parser.add_argument('--verify', action='store_true', help='Verify detections before extraction')
    parser.add_argument('--conf', type=float, default=0.25, help='Detection confidence threshold')
    parser.add_argument('--show', action='store_true', help='Show result images')
    parser.add_argument('--auto-yes', action='store_true', help='Automatically proceed with extraction')
    
    args = parser.parse_args()
    
    # Create detector
    detector = YOLOSpineDetector(output_dir=args.output, conf_threshold=args.conf)
    
    # Process single image or directory
    if args.image:
        # Process a single image
        image_path = args.image
        
        if args.verify:
            verification_img_path = detector.verify_detections(image_path)
            
            if verification_img_path:
                # Check if user wants to proceed with extraction
                if args.auto_yes:
                    proceed = 'y'
                else:
                    proceed = input("Proceed with extraction? (y/n): ").strip().lower()
                
                if proceed == 'y':
                    detector.process_image(image_path)
                else:
                    print("Extraction cancelled.")
        else:
            # Process without verification
            result_img, spine_images, spine_texts = detector.process_image(image_path)
            
            # Show results if requested
            if args.show and result_img is not None:
                plt.figure(figsize=(15, 10))
                plt.imshow(result_img)
                plt.title(f"Detected Spines: {len(spine_images)}")
                plt.axis('off')
                plt.show()
                
    elif args.images:
        # Process all images in a directory
        if not os.path.exists(args.images):
            print(f"Error: Directory {args.images} does not exist.")
            return
            
        # Get all images in the directory
        image_files = []
        for file in os.listdir(args.images):
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp')):
                image_files.append(os.path.join(args.images, file))
                
        if not image_files:
            print(f"No image files found in {args.images}")
            return
            
        print(f"Found {len(image_files)} image(s) to process:")
        for img in image_files:
            print(f"  - {img}")
            
        # Process each image
        for img_path in image_files:
            print(f"\nProcessing image: {img_path}")
            
            if args.verify:
                # Verify boundaries before processing
                verification_img_path = detector.verify_detections(img_path)
                
                if verification_img_path:
                    # Check if user wants to proceed with extraction
                    if args.auto_yes:
                        proceed = 'y'
                    else:
                        proceed = input("Proceed with extraction? (y/n): ").strip().lower()
                    
                    if proceed != 'y':
                        print("Skipping this image.")
                        continue
                        
            # Process the image
            result_img, spine_images, spine_texts = detector.process_image(img_path)
            
            if spine_images:
                print(f"Successfully extracted {len(spine_images)} book spines from {img_path}")
                # Print first few characters of extracted text for each spine
                for i, text in enumerate(spine_texts):
                    preview = text[:30] + '...' if len(text) > 30 else text
                    print(f"  Spine {i+1}: {preview}")
            else:
                print(f"No book spines were detected in {img_path}")
    else:
        print("Please provide either --image or --images argument.")
        parser.print_help()

    print("\nTo integrate these extracted spines with your Virtual Bookshelf:")
    print("1. Copy the extracted spine images to your bookshelf application's image directory")
    print("2. Use the extracted text from the CSV file to populate book metadata")
    print("3. Update your app.js to load these local spine images instead of fetching from API")


if __name__ == "__main__":
    main()
