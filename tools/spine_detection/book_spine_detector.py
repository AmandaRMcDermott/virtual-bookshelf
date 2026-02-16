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

class BookSpineDetector:
    def __init__(self, output_dir="extracted_spines"):
        """Initialize the book spine detector"""
        self.output_dir = output_dir
        # Create output directories if they don't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        self.spine_images_dir = os.path.join(output_dir, "spine_images")
        if not os.path.exists(self.spine_images_dir):
            os.makedirs(self.spine_images_dir)
        
        # CSV file to store extracted text
        self.csv_file = os.path.join(output_dir, "spine_text.csv")
        
        # Parameters for detection - adjusted for real bookshelf images
        self.min_height = 80   # Minimum height for a spine
        self.min_width = 8     # Minimum width for a spine
        self.max_width = 200   # Maximum width for a spine
        self.min_area = 1000   # Minimum contour area
    
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
    
    def preprocess_image(self, image):
        """Preprocess the image for contour detection"""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply adaptive thresholding to get binary image
        binary = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 11, 2
        )
        
        # Apply morphological operations to enhance book edges
        kernel = np.ones((3, 3), np.uint8)
        morph = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)
        
        return morph
    
    def detect_edges(self, preprocessed_image):
        """Detect edges in the preprocessed image"""
        # Apply Canny edge detection
        edges = cv2.Canny(preprocessed_image, 50, 150)
        
        # Dilate to connect nearby edges
        kernel = np.ones((3, 3), np.uint8)
        dilated_edges = cv2.dilate(edges, kernel, iterations=2)
        
        return dilated_edges
    
    def find_contours(self, edge_image):
        """Find contours in the edge image"""
        # Find contours
        contours, _ = cv2.findContours(
            edge_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        
        print(f"Found {len(contours)} initial contours")
        
        # Filter contours by size and shape
        valid_contours = []
        for contour in contours:
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            area = cv2.contourArea(contour)
            
            # Check if contour could be a book spine
            if (h > self.min_height and 
                self.min_width < w < self.max_width and 
                area > self.min_area and
                h/w > 1.5):  # Height should be at least 1.5 times the width for a spine
                valid_contours.append(contour)
        
        print(f"Found {len(valid_contours)} valid book spine contours")
        return valid_contours
    
    def filter_overlapping_contours(self, contours):
        """Filter out overlapping contours, keeping the larger one"""
        if not contours:
            return []
        
        # Sort contours by area in descending order
        sorted_contours = sorted(contours, key=cv2.contourArea, reverse=True)
        
        filtered_contours = []
        for i, contour in enumerate(sorted_contours):
            x1, y1, w1, h1 = cv2.boundingRect(contour)
            is_overlapping = False
            
            # Check if this contour overlaps with any already filtered contour
            for filtered_contour in filtered_contours:
                x2, y2, w2, h2 = cv2.boundingRect(filtered_contour)
                
                # Check for intersection
                if (x1 < x2 + w2 and x1 + w1 > x2 and 
                    y1 < y2 + h2 and y1 + h1 > y2):
                    # Calculate overlap area
                    overlap_width = min(x1 + w1, x2 + w2) - max(x1, x2)
                    overlap_height = min(y1 + h1, y2 + h2) - max(y1, y2)
                    overlap_area = overlap_width * overlap_height
                    
                    # If significant overlap, consider it overlapping
                    if overlap_area > (w1 * h1) * 0.3:
                        is_overlapping = True
                        break
            
            if not is_overlapping:
                filtered_contours.append(contour)
        
        return filtered_contours
    
    def extract_spines(self, image, contours):
        """Extract individual spines from the image based on contours"""
        spine_images = []
        spine_coords = []
        
        for i, contour in enumerate(contours):
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Extract the spine image
            spine_img = image[y:y+h, x:x+w]
            spine_images.append(spine_img)
            spine_coords.append((x, y, w, h))
        
        return spine_images, spine_coords
    
    def draw_boundaries(self, image, contours):
        """Draw boundaries around detected book spines"""
        # Create a copy of the image
        result_img = image.copy()
        
        # Draw contours on the image
        for i, contour in enumerate(contours):
            x, y, w, h = cv2.boundingRect(contour)
            cv2.rectangle(result_img, (x, y), (x+w, y+h), (0, 255, 0), 2)
            # Add index number near the rectangle
            cv2.putText(
                result_img, str(i+1), (x, y-10), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2
            )
        
        return result_img
    
    def extract_text(self, spine_image):
        """Extract text from a spine image using OCR"""
        # Convert from NumPy array to PIL Image for pytesseract
        pil_image = Image.fromarray(spine_image)
        
        # Extract text using pytesseract
        text = pytesseract.image_to_string(pil_image, config='--psm 6').strip()
        return text
    
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
    
    def process_image(self, image_path, show_result=True, save=True):
        """Process a single image to detect and extract book spines"""
        # Load the image
        image = self.load_image(image_path)
        if image is None:
            return None, None, None
        
        # Preprocess the image
        preprocessed = self.preprocess_image(image)
        
        # Detect edges
        edges = self.detect_edges(preprocessed)
        
        # Find contours
        contours = self.find_contours(edges)
        
        # Filter overlapping contours
        filtered_contours = self.filter_overlapping_contours(contours)
        
        # Sort contours from left to right (as books typically appear on a shelf)
        filtered_contours = sorted(
            filtered_contours, 
            key=lambda c: cv2.boundingRect(c)[0]
        )
        
        # Draw boundaries on the image
        result_img = self.draw_boundaries(image, filtered_contours)
        
        # Extract individual spine images
        spine_images, spine_coords = self.extract_spines(image, filtered_contours)
        
        # Extract text from spine images
        spine_texts = []
        for spine_img in spine_images:
            text = self.extract_text(spine_img)
            spine_texts.append(text)
        
        # Save results if requested
        if save and spine_images:
            self.save_results(spine_images, spine_texts, image_path)
        
        # Show result if requested
        if show_result:
            plt.figure(figsize=(15, 10))
            plt.imshow(result_img)
            plt.title(f"Detected Spines: {len(spine_images)}")
            plt.axis('off')
            plt.show()
        
        return result_img, spine_images, spine_texts
    
    def verify_boundaries(self, image_path):
        """Interactive verification of detected boundaries"""
        # Load the image
        image = self.load_image(image_path)
        if image is None:
            return
        
        # Process the image but don't save yet
        result_img, spine_images, _ = self.process_image(image_path, show_result=False, save=False)
        
        if spine_images:
            print(f"Detected {len(spine_images)} book spines.")
            
            # Display the result image with detected boundaries
            plt.figure(figsize=(15, 10))
            plt.imshow(result_img)
            plt.title("Verify Detected Book Spines")
            plt.axis('off')
            
            # Save the figure to a temporary file to show in terminal or notebook
            temp_img_path = os.path.join(self.output_dir, "temp_verification.png")
            plt.savefig(temp_img_path)
            plt.close()
            
            print(f"Verification image saved to: {temp_img_path}")
            print("Please review the detected book spines in the saved image.")
            print("If the detection looks good, you can proceed with extraction.")
            
            return temp_img_path
        else:
            print("No book spines were detected in the image.")
            return None


def main():
    parser = argparse.ArgumentParser(description='Detect and extract book spines from bookshelf images')
    parser.add_argument('image_path', help='Path to the bookshelf image')
    parser.add_argument('--verify', action='store_true', help='Verify detected boundaries before extraction')
    parser.add_argument('--output', default='extracted_spines', help='Output directory for extracted spines')
    parser.add_argument('--show', action='store_true', help='Show results in a matplotlib window')
    
    args = parser.parse_args()
    
    detector = BookSpineDetector(output_dir=args.output)
    
    if args.verify:
        detector.verify_boundaries(args.image_path)
        proceed = input("Proceed with extraction? (y/n): ").strip().lower()
        if proceed != 'y':
            print("Extraction cancelled.")
            return
    
    detector.process_image(args.image_path, show_result=args.show, save=True)


if __name__ == "__main__":
    main()
