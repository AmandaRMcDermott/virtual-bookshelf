# Virtual Bookshelf with Book Spine Detection

This project combines an interactive virtual bookshelf web application with a book spine detection system that can extract book spines from images of actual bookshelves. This allows users to digitize and organize their physical book collection.

## Project Structure

The repository is organized into the following key areas:

```
virtual-bookshelf/
├── index.html              # Main application entry point
├── css/                    # CSS stylesheets
│   ├── styles.css          # Main application styles
│   └── original_spines.css # Styles for spine-only view
├── js/                     # JavaScript files
│   ├── app.js              # Core application logic
│   ├── display_original_spines.js  # Book spine display and drag/drop
│   ├── load_spine_images.js        # Automatic spine image loading
│   └── integrate_spine_images.js   # Integration of extracted spines
├── data/                   # Data directories
│   ├── images/             # Input bookshelf images
│   ├── high_res_images/    # High-resolution versions
│   └── images_converted/   # Processed images
├── docs/                   # Project documentation
│   └── GETTING_STARTED.md  # Setup and usage instructions
├── extracted_spines/       # Output directory for extracted spine images
└── tools/                  # Utility tools and scripts
    └── spine_detection/    # Python scripts for spine detection
```

## Virtual Bookshelf Features

- Interactive drag-and-drop interface to arrange books
- Toggle between full view and spine-only view
- Search functionality to find books
- Add books manually via ISBN lookup
- Export shelf as image for reference

## Book Spine Detection Features

- Automatic detection of book spines from bookshelf photos
- Multiple detection algorithms (contour-based, YOLO, Roboflow)
- Interactive verification and adjustment of detected spines
- Extraction of individual spine images
- OCR for reading titles from spines (experimental)

## Getting Started

1. Clone this repository
2. Open `index.html` in a web browser to use the virtual bookshelf
3. To detect book spines from images, see the [spine detection tools](tools/README.md)

## Prerequisites

- Modern web browser for the virtual bookshelf
- Python 3.7+ with OpenCV, NumPy, and other dependencies for spine detection
- Optional: CUDA-capable GPU for faster YOLO detection

## License

This project is licensed under the MIT License - see the LICENSE file for details.