#!/usr/bin/env python3

import os
import argparse
from book_spine_detector import BookSpineDetector

def main():
    parser = argparse.ArgumentParser(description='Detect and extract book spines from bookshelf images')
    parser.add_argument('--images', default='images', help='Directory containing bookshelf images')
    parser.add_argument('--output', default='extracted_spines', help='Output directory for extracted spines')
    parser.add_argument('--verify', action='store_true', help='Verify detected boundaries before extraction')
    parser.add_argument('--show', action='store_true', help='Show results using matplotlib (may not work in all environments)')
    parser.add_argument('--auto-yes', action='store_true', help='Automatically proceed with extraction without confirmation')
    
    args = parser.parse_args()
    
    # Create the detector
    detector = BookSpineDetector(output_dir=args.output)
    
    # Check if the images directory exists
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
            verification_img_path = detector.verify_boundaries(img_path)
            if verification_img_path:
                print(f"Verification image saved to: {verification_img_path}")
                print("Please review the detected book spines in the saved image.")
                
                # Check if we should auto-proceed
                proceed = 'y' if args.auto_yes else input("Proceed with extraction? (y/n): ").strip().lower()
                if proceed != 'y':
                    print("Skipping this image.")
                    continue
        
        # Process the image
        _, spine_images, spine_texts = detector.process_image(
            img_path, show_result=args.show, save=True
        )
        
        if spine_images:
            print(f"Successfully extracted {len(spine_images)} book spines from {img_path}")
            # Print first few characters of extracted text for each spine
            for i, text in enumerate(spine_texts):
                preview = text[:30] + '...' if len(text) > 30 else text
                print(f"  Spine {i+1}: {preview}")
        else:
            print(f"No book spines were detected in {img_path}")
    
    print("\nAll images processed.")
    print(f"Results saved to {args.output} directory.")
    print(f"Spine images saved to {os.path.join(args.output, 'spine_images')}")
    print(f"Extracted text saved to {os.path.join(args.output, 'spine_text.csv')}")
    
    # Additional instructions for the user
    print("\nTo integrate these extracted spines with your Virtual Bookshelf:")
    print("1. Copy the extracted spine images to your bookshelf application's image directory")
    print("2. Use the extracted text from the CSV file to populate book metadata")
    print("3. Update your app.js to load these local spine images instead of fetching from API")


if __name__ == "__main__":
    main()
