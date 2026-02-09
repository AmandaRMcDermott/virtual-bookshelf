#!/usr/bin/env python3
import os
import sys
from PIL import Image
import json

def analyze_spine_images(directory_path):
    """
    Analyze the spine images in the given directory and return their dimensions.
    """
    results = []
    
    # List all files in the directory
    try:
        files = [f for f in os.listdir(directory_path) if f.endswith(('.jpg', '.jpeg', '.png'))]
        files.sort(key=lambda x: int(x.split('_')[2]) if x.split('_')[2].isdigit() else 0)  # Sort by spine number
    except Exception as e:
        print(f"Error listing directory: {e}")
        return []
        
    # Process a sample of files (using 10 files)
    sample_files = files[:20]  # Using first 20 files as a sample
    
    for filename in sample_files:
        try:
            file_path = os.path.join(directory_path, filename)
            with Image.open(file_path) as img:
                width, height = img.size
                
                # Extract spine number from filename
                parts = filename.split('_')
                spine_number = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 0
                
                results.append({
                    'filename': filename,
                    'width': width,
                    'height': height,
                    'spine_number': spine_number
                })
                print(f"{filename}: {width} x {height}")
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    # Save results to JSON file
    with open('spine_dimensions.json', 'w') as f:
        json.dump(results, f, indent=2)
        
    return results

if __name__ == "__main__":
    directory_path = "extracted_spines/spine_images"
    if len(sys.argv) > 1:
        directory_path = sys.argv[1]
    
    print(f"Analyzing images in {directory_path}...")
    analyze_spine_images(directory_path)
    print(f"Results saved to spine_dimensions.json")
