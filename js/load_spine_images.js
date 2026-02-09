/**
 * Virtual Bookshelf - Automatic Spine Image Loader
 * This script automatically loads spine images from the extracted_spines/spine_images directory
 */

document.addEventListener('DOMContentLoaded', function () {
    // First, ensure that spine-only view is active by default
    const viewToggle = document.getElementById('view-toggle');
    const mainBookshelf = document.getElementById('main-bookshelf');

    if (viewToggle && viewToggle.checked) {
        // Spine-only view is already checked in HTML, but we need to apply the class to the bookshelf
        mainBookshelf.classList.add('spine-only-view');
    }

    // Load spine images from the extracted_spines/spine_images directory
    loadExtractedSpineImages();

    /**
     * Automatically loads spine images from the extracted_spines/spine_images directory
     */
    function loadExtractedSpineImages() {
        // Path to the spine images directory
        const spineImagesPath = 'extracted_spines/spine_images/';

        // Use fetch to get a list of files from the directory
        fetch(spineImagesPath)
            .then(response => {
                if (!response.ok) {
                    // If we can't access the directory directly, we'll use a hardcoded list
                    console.log('Could not access directory directly. Using hardcoded file list.');
                    loadSpinesFromHardcodedList();
                    return null;
                }
                return response.text();
            })
            .then(html => {
                if (!html) return;

                // Parse HTML to extract file names
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const links = doc.querySelectorAll('a');

                // Extract file names from links
                const spineFiles = [];
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && (href.endsWith('.jpg') || href.endsWith('.jpeg') || href.endsWith('.png'))) {
                        spineFiles.push(href);
                    }
                });

                // Load spine images
                loadSpineFiles(spineFiles, spineImagesPath);
            })
            .catch(error => {
                console.error('Error loading spine images directory:', error);
                // Fallback to hardcoded list on error
                loadSpinesFromHardcodedList();
            });
    }

    /**
     * Load spine files from a hardcoded list of files
     */
    function loadSpinesFromHardcodedList() {
        const spineImagesPath = 'extracted_spines/spine_images/';

        // Generate file names based on the pattern from the directory listing
        const spineFiles = [];
        for (let i = 1; i <= 83; i++) {
            spineFiles.push(`IMG_2278_spine_${i}_20260116_150932.jpg`);
        }

        // Load spine images
        loadSpineFiles(spineFiles, spineImagesPath);
    }

    /**
     * Load spine images from a list of file names
     */
    function loadSpineFiles(files, basePath) {
        if (!files || files.length === 0) {
            console.log('No spine files to load.');
            return;
        }

        console.log(`Loading ${files.length} spine images...`);

        // Sort files by name (to ensure they're in a logical order)
        files.sort((a, b) => {
            // Extract numbers from filenames (assuming format like "spine_1_...")
            const numA = parseInt(a.match(/spine_(\d+)/)?.[1] || 0);
            const numB = parseInt(b.match(/spine_(\d+)/)?.[1] || 0);

            if (numA !== numB) {
                return numA - numB;
            }
            return a.localeCompare(b);
        });

        // Process each file and create spine elements
        files.forEach((fileName, index) => {
            // Create spine data object
            const spineData = {
                index: index,
                imageSrc: basePath + fileName,
                color: getRandomBookColor(),
                fileName: fileName,
                text: extractTextFromFileName(fileName)
            };

            // Add spine to bookshelf
            addSpineToShelf(spineData);
        });

        console.log('Spine images loaded successfully.');
    }

    /**
     * Add a spine to the bookshelf
     */
    function addSpineToShelf(spineData) {
        // First, preload the image to get its dimensions
        const tempImg = new Image();
        tempImg.onload = function () {
            // Calculate relative size based on image dimensions
            const imgWidth = this.width;
            const imgHeight = this.height;

            // Determine relative width and height
            // We'll keep a minimum size to ensure visibility
            const MIN_WIDTH = 20;
            const MAX_WIDTH = 45;
            const BASE_HEIGHT = 180;

            // Calculate width based on image aspect ratio
            // Thinner books will have narrower spines, thicker books will have wider spines
            // We'll use width/height ratio to determine this
            const aspectRatio = imgWidth / imgHeight;
            let spineWidth = Math.round(30 * (aspectRatio * 2)); // Base calculation

            // Apply min/max constraints
            spineWidth = Math.max(MIN_WIDTH, Math.min(spineWidth, MAX_WIDTH));

            // Calculate height proportionally, but maintain a minimum height
            const MIN_HEIGHT = 120;
            const MAX_HEIGHT = 250;

            // Taller images get taller spines
            const relativeHeight = BASE_HEIGHT * (imgHeight / 500); // Assuming 500px as a reference height
            const spineHeight = Math.max(MIN_HEIGHT, Math.min(relativeHeight, MAX_HEIGHT));

            // Create book element
            const book = document.createElement('div');
            book.classList.add('book');
            book.draggable = true;

            // Set custom size
            book.style.width = `${spineWidth + 120}px`; // Add cover width
            book.style.height = `${spineHeight}px`;

            // Add spine-only class since we're in spine-only view by default
            book.classList.add('spine-only');

            // Create spine element
            const spine = document.createElement('div');
            spine.classList.add('book-spine');
            spine.style.setProperty('--book-color', spineData.color);

            // Set custom spine width and height
            spine.style.width = `${spineWidth}px`;
            spine.style.height = `${spineHeight}px`;

            // Add spine text if available
            const spineText = document.createElement('div');
            spineText.classList.add('book-spine-text');
            spineText.textContent = spineData.text || `Book ${spineData.index + 1}`;
            spine.appendChild(spineText);

            // Create cover element
            const cover = document.createElement('div');
            cover.classList.add('book-cover');
            cover.style.width = `${120}px`;
            cover.style.height = `${spineHeight}px`;
            cover.style.left = `${spineWidth}px`;

            // Create image element
            const img = document.createElement('img');
            img.src = spineData.imageSrc;
            img.alt = spineData.text || `Book ${spineData.index + 1}`;
            img.onerror = function () {
                // If image fails to load, use color background instead
                this.style.display = 'none';
                this.parentElement.style.backgroundColor = spineData.color;
            };
            cover.appendChild(img);

            // Add elements to book
            book.appendChild(spine);
            book.appendChild(cover);

            // Add drag and drop event listeners
            addDragListeners(book);

            // Add to bookshelf
            const bookshelf = document.getElementById('main-bookshelf');
            if (bookshelf) {
                bookshelf.appendChild(book);
            }
        };

        // Start loading the image
        tempImg.src = spineData.imageSrc;

        // Handle error case where image doesn't load
        tempImg.onerror = function () {
            // Create a default-sized book if image fails to load
            createDefaultSizedBook(spineData);
        };
    }

    /**
     * Create a default-sized book when image loading fails
     */
    function createDefaultSizedBook(spineData) {
        const DEFAULT_WIDTH = 30;
        const DEFAULT_HEIGHT = 180;

        // Create book element
        const book = document.createElement('div');
        book.classList.add('book');
        book.draggable = true;

        // Add spine-only class since we're in spine-only view by default
        book.classList.add('spine-only');

        // Create spine element
        const spine = document.createElement('div');
        spine.classList.add('book-spine');
        spine.style.setProperty('--book-color', spineData.color);

        // Set default spine width
        spine.style.width = `${DEFAULT_WIDTH}px`;
        spine.style.height = `${DEFAULT_HEIGHT}px`;

        // Add spine text if available
        const spineText = document.createElement('div');
        spineText.classList.add('book-spine-text');
        spineText.textContent = spineData.text || `Book ${spineData.index + 1}`;
        spine.appendChild(spineText);

        // Create cover element
        const cover = document.createElement('div');
        cover.classList.add('book-cover');
        cover.style.backgroundColor = spineData.color;

        // Add elements to book
        book.appendChild(spine);
        book.appendChild(cover);

        // Add drag and drop event listeners
        addDragListeners(book);

        // Add to bookshelf
        const bookshelf = document.getElementById('main-bookshelf');
        if (bookshelf) {
            bookshelf.appendChild(book);
        }
    }

    /**
     * Add drag and drop event listeners to a book element
     */
    function addDragListeners(book) {
        book.addEventListener('dragstart', function (e) {
            this.classList.add('dragging');
            e.dataTransfer.setData('text/plain', 'book');
        });

        book.addEventListener('dragend', function () {
            this.classList.remove('dragging');
        });
    }

    /**
     * Helper function to extract text from filename
     */
    function extractTextFromFileName(fileName) {
        // Extract base name without extension and clean up
        const baseName = fileName.split('.')[0]
            .replace(/IMG_\d+_spine_\d+_\d+/, '')  // Remove "IMG_XXXX_spine_X_TIMESTAMP" pattern
            .replace(/_/g, ' ')  // Replace underscores with spaces
            .trim();

        return baseName || `Book ${fileName.match(/spine_(\d+)/)?.[1] || ''}`;
    }

    /**
     * Returns a random color for book spines
     */
    function getRandomBookColor() {
        const colors = [
            '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
            '#3498db', '#9b59b6', '#34495e', '#16a085', '#27ae60',
            '#2980b9', '#8e44ad', '#2c3e50', '#f39c12', '#d35400',
            '#c0392b', '#7f8c8d', '#bdc3c7'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
});
