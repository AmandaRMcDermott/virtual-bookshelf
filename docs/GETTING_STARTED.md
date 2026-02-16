# Getting Started with Virtual Bookshelf

This guide will walk you through the process of setting up and using the Virtual Bookshelf application.

## Starting the Application

The Virtual Bookshelf is a web-based application that runs in your browser. To start it:

1. Simply open the `index.html` file in any modern web browser:
   - Double-click the file in your file explorer
   - Or open your browser and use File > Open File to navigate to `index.html`
   - Or use this command in your terminal: `open index.html`

2. The application will load in your browser, showing an empty bookshelf initially.

## Complete Workflow

Here's the complete workflow to digitize and organize your physical book collection:

1. **Take photos of your bookshelf**
   - Ensure good lighting and a clear view of book spines
   - Try to avoid glare and shadows

2. **Prepare your images**
   - If your images are in HEIF/HEIC format (common from iPhones), convert them:

     ```bash
     mkdir -p high_res_images
     heif-convert -q 100 your_bookshelf.HEIC high_res_images/your_bookshelf.jpg
     ```

3. **Detect and extract book spines** (choose one method):
   - Using the Roboflow detector (most accurate):

     ```bash
     python roboflow_spine_detector_full.py --image high_res_images/your_bookshelf.jpg --verify
     ```

   - Or using the YOLO detector:

     ```bash
     python yolo_spine_detector.py --image high_res_images/your_bookshelf.jpg --verify
     ```

   - Or using the traditional computer vision approach:

     ```bash
     python detect_spines.py --image high_res_images/your_bookshelf.jpg --verify
     ```

4. **Start the Virtual Bookshelf application**
   - Open `index.html` in your web browser

5. **Import the extracted spines**
   - Click the "Import Spine Images" button in the application
   - The extracted spine images will be loaded into the virtual bookshelf

6. **Organize your virtual bookshelf**
   - Drag and drop books to rearrange them
   - Use the search function to find specific books
   - Toggle between full view and spine-only view

## Using the Application

### Main Features

- **Add Books**: Click "Add Book" to manually add books via ISBN lookup
- **Import Spine Images**: Click "Import Spine Images" to load extracted book spines
- **Search**: Use the search box to find books by title or author
- **View Modes**: Toggle between full view and spine-only view
- **Drag and Drop**: Rearrange books by dragging them to new positions
- **Book Details**: Double-click any book to see its full details

### Tips for Best Results

- Use the Roboflow-based detector for the most accurate spine detection
- Take high-quality photos of your bookshelves with good lighting
- Use the interactive mode if you need precise control over spine boundaries
- Convert HEIF/HEIC images to high-resolution JPGs for best detection results

## Troubleshooting

- **Images not detecting properly?** Try adjusting lighting or using a different detector
- **Text extraction poor?** Use the interactive mode to manually define spine boundaries
- **Import button not appearing?** Make sure you've added the integration script to your HTML
- **Browser display issues?** Try a different modern browser like Chrome, Firefox, or Safari
