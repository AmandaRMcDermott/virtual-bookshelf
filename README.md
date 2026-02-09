# Virtual Bookshelf with Book Spine Detection

This project combines an interactive virtual bookshelf web application with a book spine detection system that can extract book spines from images of actual bookshelves. This allows users to digitize and organize their physical book collection.

## Project Structure

- **Virtual Bookshelf**: A web application for organizing books
- **Book Spine Detector**: Python scripts for detecting and extracting book spines from images
- **Integration**: JavaScript to import extracted book spines into the virtual bookshelf

## Virtual Bookshelf Features

- Interactive drag-and-drop interface to arrange books
- Toggle between full view and spine-only view
- Search functionality to find books
- Add books manually via ISBN lookup
- Export shelf as image for reference

## Book Spine Detection Features

- Detect and extract individual book spines from bookshelf photos using:
  - Traditional computer vision approach with contour detection
  - Advanced object detection with YOLOv8 (You Only Look Once)
  - Roboflow AI-powered object detection (most accurate)
- Interactive mode for manually adjusting book spine boundaries
- OCR to read text from book spines
- Save extracted spines as individual images
- Export metadata to CSV for use in the virtual bookshelf
- Visual verification of detected spine boundaries

## Prerequisites

- Modern web browser for the Virtual Bookshelf app
- Python 3.9+ for the book spine detection scripts
- Required Python libraries: OpenCV, NumPy, Pillow, pytesseract, matplotlib
- Tesseract OCR installed on your system
- libheif (for handling HEIF/HEIC image formats from iOS devices)

## Setup Instructions

### 1. Install Dependencies

```bash
# Install Python libraries
python -m pip install --user opencv-python numpy pillow pytesseract matplotlib

# Install Tesseract OCR (macOS)
brew install tesseract

# Install libheif for HEIF/HEIC support (macOS)
brew install libheif
```

### 2. Virtual Bookshelf Setup

Simply open `index.html` in a web browser to use the virtual bookshelf application.

### 3. Book Spine Detection

The spine detection system consists of two main scripts:

- `book_spine_detector.py`: Core detection and extraction functionality
- `detect_spines.py`: Command-line interface for processing images

To detect book spines from an image:

### Traditional Computer Vision Approach

```bash
# Basic usage
python detect_spines.py --images path/to/images --output extracted_spines

# With visual verification
python detect_spines.py --images path/to/images --verify

# Automatically accept all detections (batch processing)
python detect_spines.py --images path/to/images --verify --auto-yes

# Show detection results in matplotlib (visualization mode)
python detect_spines.py --images path/to/images --show
```

### Interactive Mode

```bash
# Use interactive mode for manual boundary adjustments
python interactive_spine_detector.py path/to/image.jpg
```

### YOLO-based Detection (More Accurate)

```bash
# Basic usage
python yolo_spine_detector.py --image path/to/image.jpg

# Process a directory of images
python yolo_spine_detector.py --images path/to/images

# With visual verification
python yolo_spine_detector.py --images path/to/images --verify

# Set confidence threshold (default: 0.25)
python yolo_spine_detector.py --images path/to/images --conf 0.4
```

### Roboflow-based Detection (Most Accurate)

```bash
# Basic usage
python roboflow_spine_detector_full.py --image path/to/image.jpg

# Process a directory of images
python roboflow_spine_detector_full.py --images path/to/images

# With visual verification
python roboflow_spine_detector_full.py --images path/to/images --verify

# Automatically proceed with extraction
python roboflow_spine_detector_full.py --image path/to/image.jpg --verify --auto-yes

# Set confidence threshold (default: 10)
python roboflow_spine_detector_full.py --images path/to/images --conf 20
```

If your images are in HEIF/HEIC format (common with iOS photos), you'll need to convert them first:

```bash
# Convert HEIF/HEIC to JPEG (standard quality)
mkdir -p images_converted
heif-convert original_image.HEIC images_converted/converted_image.jpg

# Convert with maximum quality for better spine detection
mkdir -p high_res_images
heif-convert -q 100 original_image.HEIC high_res_images/converted_image.jpg
```

The higher resolution conversion is recommended for better spine detection results.

### 4. Integration

To integrate extracted book spines into the virtual bookshelf:

1. Add the `integrate_spine_images.js` script to your HTML:

```html
<script src="integrate_spine_images.js"></script>
```

1. Run the spine detection to extract book spines
2. Use the "Import Spine Images" button in the bookshelf UI to import the extracted spines

## Usage Workflow

1. Take photos of your bookshelves
2. Run the book spine detector on these photos
3. Verify and extract the detected spines
4. Open the virtual bookshelf application
5. Import the extracted spine images
6. Arrange your virtual books to match your ideal organization
7. Use the virtual shelf as a reference when organizing your physical books

## File Descriptions

- `index.html`: Main HTML for the virtual bookshelf
- `css/styles.css`: Styling for the bookshelf application
- `js/app.js`: Core bookshelf functionality
- `book_spine_detector.py`: Core spine detection class (using traditional CV)
- `detect_spines.py`: CLI for spine detection with traditional methods
- `interactive_spine_detector.py`: Interactive tool for manual boundary adjustment
- `yolo_spine_detector.py`: Advanced spine detection using YOLOv8
- `roboflow_spine_detector_full.py`: AI-powered detection using Roboflow model
- `integrate_spine_images.js`: Script for importing spine images to the bookshelf

## Troubleshooting

### Image Loading Issues

If you encounter problems with image loading:

- Ensure images are in a supported format (JPG, PNG, TIFF, BMP)
- Convert HEIF/HEIC images using `heif-convert`
- Check file permissions

### OCR Quality

If text extraction quality is poor:

- Ensure images are well-lit and in focus
- Use high-resolution image conversion with `-q 100` option
- Try adjusting the detection parameters in `book_spine_detector.py`
- Use the interactive mode to manually define spine boundaries
- Try the YOLO-based detector (`yolo_spine_detector.py`) for better spine detection
- For best results, use the Roboflow-based detector (`roboflow_spine_detector_full.py`)
- Consider pre-processing images to improve contrast

### YOLO-based Detection

The YOLO-based detector offers several advantages:

- Uses a pre-trained object detection model (YOLOv8)
- Better at handling complex bookshelf arrangements
- More robust to lighting variations and shadows
- Can detect books at various angles and orientations
- Provides confidence scores for each detection

The first time you run the YOLO detector, it will automatically download the model weights (approximately 6MB).

### Roboflow-based Detection

The Roboflow-based detector provides the most accurate detection results:

- Uses a cloud-based AI model specifically trained for book spine detection
- Excellent performance even with cluttered or complicated bookshelves
- Superior detection of thin or closely packed spines
- Handles varying lighting conditions and book orientations
- Produces highly accurate boundary boxes for each spine
- Provides detailed confidence scores for all detections

This detector requires an internet connection as it uses the Roboflow API.

### Interactive Mode

The interactive mode allows you to:

1. Manually define book spine boundaries
2. Edit automatically detected boundaries
3. Delete incorrect boundaries
4. Add missed book spines

**Interactive Controls:**

- Click on a boundary to select it
- 'A' key: Add new boundary (draw a rectangle)
- 'D' key: Delete selected boundary
- 'E' key: Edit selected boundary
- Left/Right arrows: Select previous/next boundary
- 'S' key: Save and continue
- 'Q' key: Quit without saving

## Extending the Project

- Add support for more metadata fields
- Implement better OCR for book spine text
- Add server-side storage for persistent data
- Create mobile app for direct capture and processing
