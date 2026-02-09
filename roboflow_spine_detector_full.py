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
import supervision as sv
from roboflow import Roboflow
import sys

class RoboflowSpineDetector:
    """Book spine detector using Roboflow model"""
    
    def __init__(self, output_dir="extracted_spines", api_key="bpJypKut1hXTKzMnGwEM", 
                 confidence_threshold=20, overlap_threshold=30):
        """Initialize the Roboflow-based book spine detector"""
        self.output_dir = output_dir
        self.confidence_threshold = confidence_threshold
        self.overlap_threshold = overlap_threshold
        self.api_key = api_key
        
        # Create output directories if they don't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        self.spine_images_dir = os.path.join(output_dir, "spine_images")
        if not os.path.exists(self.spine_images_dir):
            os.makedirs(self.spine_images_dir)
            
        # CSV file to store extracted text
        self.csv_file = os.path.join(output_dir, "spine_text.csv")
        
        # Initialize Roboflow model
        print("Loading Roboflow model...")
        try:
            rf = Roboflow(api_key=api_key)
            self.project = rf.workspace().project("book-spines-fi8nq")
            self.model = self.project.version(1).model
            print("Roboflow model loaded successfully!")
        except Exception as e:
            print(f"Error loading Roboflow model: {e}")
            sys.exit(1)

    def load_image(self, image_path):
        """Load an image from the given path"""
        print(f"Loading image: {image_path}")
        # Check if file exists
        if not os.path.exists(image_path):
            print(f"Error: Image file {image_path} does not exist.")
            return None
        
        # Try to load with OpenCV
        image = cv2.imread(image_path)
        if image is None:
            print(f"Error: Could not load image {image_path}")
            return None
            
        # Convert to RGB (OpenCV uses BGR)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        return image_rgb, image

    def detect_spines(self, image_path):
        """Detect book spines in the image using Roboflow model"""
        # Run Roboflow prediction on the image
        try:
            result = self.model.predict(
                image_path, 
                confidence=self.confidence_threshold, 
                overlap=self.overlap_threshold
            ).json()
            
            # Extract labels and create supervision Detections object
            labels = [item["class"] for item in result["predictions"]]
            detections = sv.Detections.from_inference(result)
            
            return result, detections, labels
        except Exception as e:
            print(f"Error during detection: {e}")
            return None, None, None
    
    def process_detections(self, image, detections):
        """Process detection results to extract book spines"""
        spine_images = []
        spine_coords = []
        
        # Check if detections exist
        if not detections or len(detections.xyxy) == 0:
            print("No books detected in the image.")
            return [], []
        
        print(f"Detected {len(detections.xyxy)} potential book spines.")
        
        # Process each detected box
        for i, box in enumerate(detections.xyxy):
            # Get box coordinates
            x1, y1, x2, y2 = map(int, box)
            
            # Extract the book spine image
            spine_img = image[y1:y2, x1:x2]
            spine_images.append(spine_img)
            spine_coords.append((x1, y1, x2-x1, y2-y1))  # (x, y, width, height)
            
            # Print information about the detection
            confidence = detections.confidence[i] if detections.confidence is not None else 'N/A'
            conf_str = f"{confidence:.2f}" if isinstance(confidence, float) else f"{confidence}"
            print(f"  Spine {i+1}: Confidence={conf_str}, "
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
    
    def draw_detections(self, image, detections, labels=None):
        """Draw the detection results on the image"""
        # Create annotation objects
        label_annotator = sv.LabelAnnotator()
        bounding_box_annotator = sv.BoxAnnotator()
        
        # Draw bounding boxes
        annotated_image = bounding_box_annotator.annotate(scene=image, detections=detections)
        
        # Draw labels if provided
        if labels and len(labels) > 0:
            annotated_image = label_annotator.annotate(
                scene=annotated_image, 
                detections=detections, 
                labels=labels
            )
        
        return annotated_image
    
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
    
    def verify_detections(self, image_path, detections, labels=None, image_rgb=None):
        """Interactive verification of detected book spines"""
        if image_rgb is None:
            # Load the image if not provided
            image_rgb, _ = self.load_image(image_path)
            if image_rgb is None:
                return None
        
        # Draw detections on the image
        result_img = self.draw_detections(image_rgb, detections, labels)
        
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
    
    def process_image(self, image_path, save=True):
        """Process a single image to detect and extract book spines"""
        # Load the image
        image_rgb, image_cv = self.load_image(image_path)
        if image_rgb is None:
            return None, None, None
        
        # Run Roboflow detection
        result, detections, labels = self.detect_spines(image_path)
        
        if detections is None:
            print("Detection failed.")
            return None, None, None
        
        # Process detections to extract spine images
        spine_images, spine_coords = self.process_detections(image_rgb, detections)
        
        # Extract text from spine images
        spine_texts = []
        for spine_img in spine_images:
            text = self.extract_text(spine_img)
            spine_texts.append(text)
        
        # Draw detections on image
        result_img = self.draw_detections(image_rgb, detections, labels)
        
        # Save results if requested
        if save and spine_images:
            self.save_results(spine_images, spine_texts, image_path)
        
        return result_img, spine_images, spine_texts


def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Detect book spines using Roboflow model')
    parser.add_argument('--image', help='Path to the bookshelf image')
    parser.add_argument('--images', help='Directory containing bookshelf images')
    parser.add_argument('--output', default='extracted_spines', help='Output directory')
    parser.add_argument('--verify', action='store_true', help='Verify detections before extraction')
    parser.add_argument('--conf', type=float, default=30, help='Detection confidence threshold (0-100)')
    parser.add_argument('--overlap', type=float, default=30, help='Detection overlap threshold (0-100)')
    parser.add_argument('--show', action='store_true', help='Show result images')
    parser.add_argument('--auto-yes', action='store_true', help='Automatically proceed with extraction')
    parser.add_argument('--api-key', default="bpJypKut1hXTKzMnGwEM", help='Roboflow API key')
    
    args = parser.parse_args()
    
    # Create detector
    detector = RoboflowSpineDetector(
        output_dir=args.output, 
        api_key=args.api_key,
        confidence_threshold=args.conf,
        overlap_threshold=args.overlap
    )
    
    # Process single image or directory
    if args.image:
        # Process a single image
        image_path = args.image
        
        # Run detection first
        result, detections, labels = detector.detect_spines(image_path)
        image_rgb, _ = detector.load_image(image_path)
        
        if detections is None or image_rgb is None:
            print("Detection failed or image could not be loaded.")
            return
        
        if args.verify:
            verification_img_path = detector.verify_detections(
                image_path, detections, labels, image_rgb
            )
            
            if verification_img_path:
                # Check if user wants to proceed with extraction
                if args.auto_yes:
                    proceed = 'y'
                else:
                    proceed = input("Proceed with extraction? (y/n): ").strip().lower()
                
                if proceed == 'y':
                    # Process the image with the already performed detection
                    spine_images, spine_coords = detector.process_detections(image_rgb, detections)
                    spine_texts = []
                    
                    for spine_img in spine_images:
                        text = detector.extract_text(spine_img)
                        spine_texts.append(text)
                        
                    detector.save_results(spine_images, spine_texts, image_path)
                    
                    # Print extracted texts
                    print(f"Successfully extracted {len(spine_images)} book spines from {image_path}")
                    for i, text in enumerate(spine_texts):
                        preview = text[:30] + '...' if len(text) > 30 else text
                        print(f"  Spine {i+1}: {preview}")
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
            
            # Run detection first
            result, detections, labels = detector.detect_spines(img_path)
            image_rgb, _ = detector.load_image(img_path)
            
            if detections is None or image_rgb is None:
                print(f"Detection failed or image could not be loaded for {img_path}.")
                continue
                
            if args.verify:
                # Verify boundaries before processing
                verification_img_path = detector.verify_detections(
                    img_path, detections, labels, image_rgb
                )
                
                if verification_img_path:
                    # Check if user wants to proceed with extraction
                    if args.auto_yes:
                        proceed = 'y'
                    else:
                        proceed = input("Proceed with extraction? (y/n): ").strip().lower()
                    
                    if proceed != 'y':
                        print("Skipping this image.")
                        continue
                        
            # Process the image (use the already performed detection)
            spine_images, spine_coords = detector.process_detections(image_rgb, detections)
            spine_texts = []
            
            for spine_img in spine_images:
                text = detector.extract_text(spine_img)
                spine_texts.append(text)
                
            detector.save_results(spine_images, spine_texts, img_path)
            
            # Print extracted texts
            if spine_images:
                print(f"Successfully extracted {len(spine_images)} book spines from {img_path}")
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
