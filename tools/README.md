# Virtual Bookshelf Tools

This directory contains utility tools and scripts that support the Virtual Bookshelf application.

## Spine Detection

The `spine_detection` directory contains Python scripts for detecting and extracting book spines from bookshelf images:

- **detect_spines.py** - Main script to detect and extract book spines from images
- **book_spine_detector.py** - Core spine detection class implementation
- **interactive_spine_detector.py** - Interactive version for manual adjustments
- **yolo_spine_detector.py** - YOLO-based detection implementation
- **roboflow_spine_detector.py** - Roboflow-based detection implementation
- **roboflow_spine_detector_full.py** - Enhanced Roboflow detection
- **analyze_spine_images.py** - Script for analyzing extracted spine images

### YOLO Models
- **yolov8n.pt** - YOLOv8 nano model
- **yolo26n.pt** - Custom trained YOLO model for spine detection

### Usage

To detect book spines in images:

```bash
cd tools/spine_detection
./detect_spines.py --images ../../images --output ../../extracted_spines
```

For more options:

```bash
./detect_spines.py --help
```