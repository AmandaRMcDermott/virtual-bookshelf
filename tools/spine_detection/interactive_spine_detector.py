#!/usr/bin/env python3

import os
import cv2
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import RectangleSelector
from PIL import Image
import pytesseract
import csv
import argparse
from datetime import datetime
import json
from book_spine_detector import BookSpineDetector

class InteractiveSpineDetector(BookSpineDetector):
    """Extended book spine detector with interactive boundary adjustment capabilities"""
    
    def __init__(self, output_dir="extracted_spines"):
        """Initialize the interactive book spine detector"""
        super().__init__(output_dir)
        self.current_contours = []
        self.current_image = None
        self.current_image_path = None
        self.is_selecting = False
        self.selected_index = -1
        
    def interactive_boundary_adjustment(self, image_path):
        """Interactive mode for adjusting spine boundaries"""
        # Load the image
        image = self.load_image(image_path)
        if image is None:
            return None, None
            
        self.current_image = image
        self.current_image_path = image_path
        
        # Process the image to get initial boundaries
        preprocessed = self.preprocess_image(image)
        edges = self.detect_edges(preprocessed)
        contours = self.find_contours(edges)
        filtered_contours = self.filter_overlapping_contours(contours)
        
        # Sort contours from left to right
        filtered_contours = sorted(
            filtered_contours, 
            key=lambda c: cv2.boundingRect(c)[0]
        )
        
        self.current_contours = []
        
        # Convert contours to rectangles
        for contour in filtered_contours:
            x, y, w, h = cv2.boundingRect(contour)
            self.current_contours.append((x, y, w, h))
        
        # Draw initial boundaries
        self._show_interactive_image()
        
        # Return the final contours and spine images
        spine_images = []
        for x, y, w, h in self.current_contours:
            spine_img = image[y:y+h, x:x+w]
            spine_images.append(spine_img)
            
        return self.current_contours, spine_images
    
    def _show_interactive_image(self):
        """Display the image with interactive boundary controls"""
        plt.close('all')
        self.fig, self.ax = plt.subplots(figsize=(15, 10))
        self.ax.imshow(self.current_image)
        
        # Draw current contours
        self._draw_contours()
        
        # Set up key event handlers
        self.fig.canvas.mpl_connect('key_press_event', self._on_key_press)
        self.fig.canvas.mpl_connect('button_press_event', self._on_click)
        
        # Set up rectangle selector for adding new boundaries
        self.rect_selector = RectangleSelector(
            self.ax, self._on_rectangle_select, useblit=True,
            button=[1], minspanx=5, minspany=5,
            spancoords='pixels', interactive=True
        )
        self.rect_selector.set_active(False)
        
        plt.title(
            "Interactive Spine Detection\n"
            "Click on a boundary to select it\n"
            "A: Add new boundary, D: Delete selected, E: Edit selected\n"
            "Left/Right arrows: Select previous/next, S: Save, Q: Quit"
        )
        plt.tight_layout()
        plt.show()
    
    def _draw_contours(self):
        """Draw the current contours on the image"""
        self.ax.clear()
        self.ax.imshow(self.current_image)
        
        for i, (x, y, w, h) in enumerate(self.current_contours):
            color = 'r' if i == self.selected_index else 'g'
            linewidth = 3 if i == self.selected_index else 2
            
            rect = plt.Rectangle(
                (x, y), w, h, 
                linewidth=linewidth, 
                edgecolor=color, 
                facecolor='none'
            )
            self.ax.add_patch(rect)
            self.ax.text(
                x, y-10, str(i+1), 
                color='white', fontsize=12, 
                bbox=dict(facecolor=color, alpha=0.8)
            )
        
        plt.title(
            "Interactive Spine Detection\n"
            "Click on a boundary to select it\n"
            "A: Add new boundary, D: Delete selected, E: Edit selected\n"
            "Left/Right arrows: Select previous/next, S: Save, Q: Quit"
        )
        self.fig.canvas.draw()
    
    def _on_key_press(self, event):
        """Handle key press events"""
        if event.key == 'a':
            # Add new boundary mode
            self.is_selecting = True
            self.rect_selector.set_active(True)
            plt.title("Draw a rectangle around the book spine")
            self.fig.canvas.draw()
            
        elif event.key == 'd' and self.selected_index >= 0:
            # Delete selected boundary
            del self.current_contours[self.selected_index]
            self.selected_index = -1
            self._draw_contours()
            
        elif event.key == 'e' and self.selected_index >= 0:
            # Edit selected boundary
            self.is_selecting = True
            self.rect_selector.set_active(True)
            plt.title("Draw a new rectangle for this spine")
            self.fig.canvas.draw()
            
        elif event.key == 'left':
            # Select previous boundary
            if self.current_contours:
                self.selected_index = (self.selected_index - 1) % len(self.current_contours)
                self._draw_contours()
                
        elif event.key == 'right':
            # Select next boundary
            if self.current_contours:
                self.selected_index = (self.selected_index + 1) % len(self.current_contours)
                self._draw_contours()
                
        elif event.key == 's':
            # Save and continue
            plt.close()
            
        elif event.key == 'q':
            # Quit without saving
            self.current_contours = []
            plt.close()
    
    def _on_click(self, event):
        """Handle mouse click events"""
        if self.is_selecting:
            return
            
        if event.xdata is None or event.ydata is None:
            return
            
        # Check if a rectangle was clicked
        x, y = event.xdata, event.ydata
        for i, (rx, ry, rw, rh) in enumerate(self.current_contours):
            if rx <= x <= rx+rw and ry <= y <= ry+rh:
                self.selected_index = i
                self._draw_contours()
                return
                
        # If no rectangle was clicked, deselect
        self.selected_index = -1
        self._draw_contours()
    
    def _on_rectangle_select(self, eclick, erelease):
        """Handle rectangle selection for adding or editing boundaries"""
        if not self.is_selecting:
            return
            
        x1, y1 = int(eclick.xdata), int(eclick.ydata)
        x2, y2 = int(erelease.xdata), int(erelease.ydata)
        
        # Ensure x1,y1 is the top-left and x2,y2 is the bottom-right
        x = min(x1, x2)
        y = min(y1, y2)
        w = abs(x2 - x1)
        h = abs(y2 - y1)
        
        # Add or update the rectangle
        if self.selected_index >= 0:
            # Update existing rectangle
            self.current_contours[self.selected_index] = (x, y, w, h)
        else:
            # Add new rectangle
            self.current_contours.append((x, y, w, h))
            self.selected_index = len(self.current_contours) - 1
        
        # Exit selection mode
        self.is_selecting = False
        self.rect_selector.set_active(False)
        self._draw_contours()
    
    def save_spine_data(self, spine_images, spine_texts, contours, original_image_name):
        """Save extracted spine images, texts, and boundary data"""
        # First call the parent class method to save images and texts
        super().save_results(spine_images, spine_texts, original_image_name)
        
        # Also save the contour data for future use
        base_name = os.path.splitext(os.path.basename(original_image_name))[0]
        contour_file = os.path.join(self.output_dir, f"{base_name}_contours.json")
        
        with open(contour_file, 'w') as f:
            json.dump(contours, f)
        
        print(f"Boundary data saved to {contour_file}")
        
    def process_image_interactive(self, image_path, save=True):
        """Process an image with interactive boundary adjustment"""
        print(f"\nInteractively processing image: {image_path}")
        print("Please adjust the boundaries in the interactive window.")
        
        # Launch interactive boundary adjustment
        contours, spine_images = self.interactive_boundary_adjustment(image_path)
        
        if not contours or not spine_images:
            print("No spine boundaries defined or operation cancelled.")
            return None, None, None
            
        # Extract text from spine images
        spine_texts = []
        for spine_img in spine_images:
            text = self.extract_text(spine_img)
            spine_texts.append(text)
        
        # Save results if requested
        if save:
            self.save_spine_data(spine_images, spine_texts, contours, image_path)
        
        return contours, spine_images, spine_texts


def main():
    parser = argparse.ArgumentParser(description='Interactive book spine detector')
    parser.add_argument('image_path', help='Path to the bookshelf image')
    parser.add_argument('--output', default='extracted_spines', help='Output directory for extracted spines')
    
    args = parser.parse_args()
    
    detector = InteractiveSpineDetector(output_dir=args.output)
    detector.process_image_interactive(args.image_path)


if __name__ == "__main__":
    main()
