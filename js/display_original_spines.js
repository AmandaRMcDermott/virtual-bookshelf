/**
 * Virtual Bookshelf - Original Spine Image Display
 * This script loads spine images from the extracted_spines/spine_images directory
 * and displays them at their original dimensions (with proportional scaling)
 */

document.addEventListener('DOMContentLoaded', function () {
    // First, ensure that spine-only view is active by default
    const viewToggle = document.getElementById('view-toggle');
    const mainBookshelf = document.getElementById('main-bookshelf');
    const clearAllBtn = document.getElementById('clear-all-btn');

    if (viewToggle && viewToggle.checked) {
        // Spine-only view is already checked in HTML, but we need to apply the class to the bookshelf
        mainBookshelf.classList.add('spine-only-view');
    }

    // Add event listener for the Clear All button
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function () {
            clearBookshelf();
            // Reset any saved orders or individual settings
            localStorage.removeItem('bookshelfOrder');
            localStorage.removeItem('individualBookSettings');
            individualBookSettings = {};
        });
    }

    // Set default dimension factors
    let currentDimensions = {
        scaleFactor: 0.25, // Default scale factor
        heightFactor: 1.0, // Default height factor (no adjustment)
        widthFactor: 1.0   // Default width factor (no adjustment)
    };

    // Store individual book dimension overrides
    let individualBookSettings = {};

    // Track the currently selected book
    let selectedBook = null;

    // Current resize mode
    let currentResizeMode = 'scale'; // 'scale', 'width', 'height'

    // Reference to the book info panel
    const bookInfoPanel = document.getElementById('book-info-panel');

    // Control panel and toggle button
    const controlPanel = document.getElementById('dimensions-controls');
    const collapseToggle = document.getElementById('collapse-toggle');

    // Set up the collapse toggle functionality
    setupCollapseToggle();

    // Try to load saved dimension settings
    loadSavedDimensions();

    // Load saved individual book settings
    loadSavedIndividualSettings();

    // Listen for dimension change events
    document.addEventListener('dimensionsChanged', function (event) {
        // Update current dimensions
        currentDimensions.scaleFactor = event.detail.scaleFactor;
        currentDimensions.heightFactor = event.detail.heightFactor;
        currentDimensions.widthFactor = event.detail.widthFactor;

        // Refresh the bookshelf with new dimensions
        refreshBookshelf();
    });

    // Set up individual book controls
    setupIndividualBookControls();

    // Set up resize mode buttons
    setupResizeModeButtons();

    // Set up direct resize functionality
    setupDirectResize();

    // Set up export button functionality
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportBookshelfAsImage);
    }

    // Set up upload dialog functionality
    setupUploadDialog();

    // Set up bookshelf drag and drop
    setupBookshelfDragDrop();

    // Load spine images
    loadSampleSpineImages();

    /**
     * Set up the collapse toggle functionality for control panels
     */
    function setupCollapseToggle() {
        if (controlPanel && collapseToggle) {
            // Check if there's a saved state in localStorage
            const savedCollapsedState = localStorage.getItem('dimensionsPanelCollapsed');

            // Apply the saved state if it exists
            if (savedCollapsedState === 'true') {
                controlPanel.classList.add('collapsed');
                collapseToggle.textContent = '▲'; // Up arrow when collapsed
                collapseToggle.title = "Expand";
            }

            collapseToggle.addEventListener('click', function () {
                controlPanel.classList.toggle('collapsed');

                // Change the toggle button text/icon based on state
                if (controlPanel.classList.contains('collapsed')) {
                    collapseToggle.textContent = '▲'; // Up arrow when collapsed
                    collapseToggle.title = "Expand";
                    localStorage.setItem('dimensionsPanelCollapsed', 'true');
                } else {
                    collapseToggle.textContent = '▼'; // Down arrow when expanded
                    collapseToggle.title = "Collapse";
                    localStorage.setItem('dimensionsPanelCollapsed', 'false');
                }
            });
        }
    }

    /**
     * Set up the file upload dialog
     */
    function setupUploadDialog() {
        const uploadBtn = document.getElementById('upload-local-btn');
        const uploadDialog = document.getElementById('upload-dialog');
        const closeBtn = document.getElementById('close-upload-dialog');
        const cancelBtn = document.getElementById('cancel-upload');
        const fileInput = document.getElementById('spine-file-input');
        const selectFilesBtn = document.getElementById('select-files-btn');
        const selectedFilesList = document.getElementById('selected-files-list');
        const confirmUploadBtn = document.getElementById('confirm-upload');

        // Store file selections to prevent loss
        let selectedFiles = null;

        // Dialog state to prevent issues
        let dialogIsOpen = false;

        if (uploadBtn) {
            uploadBtn.addEventListener('click', function () {
                if (uploadDialog && !dialogIsOpen) {
                    dialogIsOpen = true;

                    // Don't reset the file input if we have stored files
                    if (fileInput && !selectedFiles) {
                        fileInput.value = '';
                        updateSelectedFilesList([], selectedFilesList);
                    } else if (selectedFiles) {
                        // Restore previously selected files UI
                        updateSelectedFilesList(selectedFiles, selectedFilesList);
                    }

                    uploadDialog.style.display = 'block';
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                uploadDialog.style.display = 'none';
                dialogIsOpen = false;
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', function () {
                uploadDialog.style.display = 'none';
                dialogIsOpen = false;
            });
        }

        if (selectFilesBtn && fileInput) {
            selectFilesBtn.addEventListener('click', function (e) {
                e.preventDefault(); // Prevent any form submission
                e.stopPropagation(); // Prevent event bubbling

                // Use a direct approach instead of a flag to prevent issues
                try {
                    fileInput.click();
                } catch (err) {
                    console.error('Error opening file dialog:', err);
                }
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', function (e) {
                e.stopPropagation(); // Prevent event bubbling

                // Store the selected files for persistence
                selectedFiles = this.files;

                // Update UI
                updateSelectedFilesList(selectedFiles, selectedFilesList);
            });

            // Prevent event bubbling
            fileInput.addEventListener('click', function (e) {
                e.stopPropagation();
            });

            // Also handle focus events to ensure proper behavior
            fileInput.addEventListener('focus', function (e) {
                e.stopPropagation();
            });

            fileInput.addEventListener('blur', function (e) {
                e.stopPropagation();
            });
        }

        if (confirmUploadBtn) {
            confirmUploadBtn.addEventListener('click', function () {
                if (selectedFiles && selectedFiles.length > 0) {
                    processLocalSpineImages(selectedFiles);
                    uploadDialog.style.display = 'none';
                    dialogIsOpen = false;

                    // Clear the selection after processing
                    selectedFiles = null;
                    if (fileInput) fileInput.value = '';
                } else {
                    console.warn('No files selected for upload');
                }
            });
        }

        // Close dialog when clicking outside of it
        window.addEventListener('click', function (event) {
            if (event.target === uploadDialog) {
                uploadDialog.style.display = 'none';
                dialogIsOpen = false;
            }
        });
    }

    /**
     * Set up drag and drop for the bookshelf
     */
    function setupBookshelfDragDrop() {
        // Get all shelf rows
        const shelfRows = document.querySelectorAll('.bookshelf-row');

        // Track the active shelf to prevent flickering between shelves
        let activeShelf = null;

        // Set a small delay before responding to shelf changes
        let shelfChangeTimeout = null;

        shelfRows.forEach(shelf => {
            // Add dragenter event for highlighting the shelf
            shelf.addEventListener('dragenter', function (e) {
                e.preventDefault();

                // Clear any pending timeouts
                if (shelfChangeTimeout) {
                    clearTimeout(shelfChangeTimeout);
                }

                // If we already have an active shelf, remove its highlight
                if (activeShelf && activeShelf !== this) {
                    activeShelf.classList.remove('drag-over');
                }

                // Set this as the active shelf
                activeShelf = this;
                this.classList.add('drag-over');
            });

            // Add dragleave event to remove highlighting
            shelf.addEventListener('dragleave', function (e) {
                // Only remove if we're actually leaving the shelf, not just entering a child element
                if (e.currentTarget.contains(e.relatedTarget)) return;

                // Set a small delay before removing the highlight to prevent flickering
                shelfChangeTimeout = setTimeout(() => {
                    this.classList.remove('drag-over');
                    if (activeShelf === this) {
                        activeShelf = null;
                    }
                }, 50);
            });

            // Track the last update time to throttle updates
            let lastIndicatorUpdate = 0;
            const updateThreshold = 50; // Update at most every 50ms for performance

            // Add dragover event listener to each shelf
            shelf.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move'; // Show move cursor

                const draggingBook = document.querySelector('.dragging');
                if (!draggingBook) return;

                // Get the current horizontal position of the mouse
                const x = e.clientX;

                // Only update the indicator if enough time has passed since the last update
                const now = Date.now();
                if (now - lastIndicatorUpdate < updateThreshold) return;

                lastIndicatorUpdate = now;

                // Find the book after which we should place the dragging book
                const afterElement = getBookAfterDragPosition(shelf, x);

                // Create or update the drop indicator using requestAnimationFrame for better performance
                window.requestAnimationFrame(() => {
                    // Check for existing indicator
                    let indicator = document.querySelector('.drop-indicator');

                    // Create indicator if it doesn't exist
                    if (!indicator) {
                        indicator = document.createElement('div');
                        indicator.className = 'drop-indicator';

                        // Add smooth animation properties
                        indicator.style.transition = 'all 0.1s ease-out';
                    }

                    // Remove the indicator from its current position if it exists in the DOM
                    if (indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }

                    // Position the indicator
                    if (afterElement) {
                        shelf.insertBefore(indicator, afterElement);
                    } else {
                        shelf.appendChild(indicator);
                    }
                });
            });

            // Add drop event listener
            shelf.addEventListener('drop', function (e) {
                e.preventDefault();
                this.classList.remove('drag-over');

                const bookId = e.dataTransfer.getData('text/plain');
                const draggingBook = document.querySelector('.dragging');

                if (draggingBook) {
                    // Get the book after which we should place the dragging book
                    const x = e.clientX;
                    const afterElement = getBookAfterDragPosition(shelf, x);

                    // Prepare all books for animation
                    const allBooks = shelf.querySelectorAll('.book');
                    allBooks.forEach(book => {
                        // Apply smooth transition to all books
                        book.style.transition = 'transform 0.25s ease-out, opacity 0.25s ease-out';
                    });

                    // Remove the book from its current position
                    if (draggingBook.parentNode) {
                        draggingBook.parentNode.removeChild(draggingBook);
                    }

                    // Make the dragged book stand out during placement
                    draggingBook.style.opacity = '1';
                    draggingBook.style.transform = 'translateY(-2px)';

                    // Add it to the new position
                    if (afterElement) {
                        shelf.insertBefore(draggingBook, afterElement);
                    } else {
                        shelf.appendChild(draggingBook);
                    }

                    // Clean up all drop indicators throughout the document
                    document.querySelectorAll('.drop-indicator').forEach(indicator => {
                        indicator.remove();
                    });

                    // Apply settle-in animation to the dropped book
                    setTimeout(() => {
                        draggingBook.style.transform = 'translateY(0)';

                        // Reset all transitions after animations complete
                        setTimeout(() => {
                            allBooks.forEach(book => {
                                book.style.transition = '';
                            });
                            draggingBook.style.transition = '';
                        }, 250);
                    }, 50);

                    // Save the new position for persistence
                    saveBookshelfOrder();
                }
            });
        });

        // Also set up the removed books container for drop events
        const removedBooksContainer = document.getElementById('removed-books-container');
        if (removedBooksContainer) {
            removedBooksContainer.addEventListener('dragenter', function (e) {
                e.preventDefault();
                this.classList.add('drag-over');
            });

            removedBooksContainer.addEventListener('dragleave', function (e) {
                if (e.currentTarget.contains(e.relatedTarget)) return;
                this.classList.remove('drag-over');
            });

            removedBooksContainer.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            removedBooksContainer.addEventListener('drop', function (e) {
                e.preventDefault();
                this.classList.remove('drag-over');

                const bookId = e.dataTransfer.getData('text/plain');
                const draggingBook = document.querySelector('.dragging');

                if (draggingBook) {
                    // Remove the book from its current position
                    draggingBook.parentNode.removeChild(draggingBook);

                    // Add it to the removed books container
                    removedBooksContainer.appendChild(draggingBook);

                    // Remove drop indicators
                    document.querySelectorAll('.drop-indicator').forEach(indicator => {
                        indicator.remove();
                    });
                }
            });
        }
    }

    /**
     * Save the order of books on the bookshelf for persistence
     */
    function saveBookshelfOrder() {
        const shelves = document.querySelectorAll('.bookshelf-row');
        const order = {};

        shelves.forEach((shelf, shelfIndex) => {
            const bookIds = [];
            const books = shelf.querySelectorAll('.book');

            books.forEach(book => {
                if (book.dataset.bookId) {
                    bookIds.push(book.dataset.bookId);
                }
            });

            order[`shelf_${shelfIndex}`] = bookIds;
        });

        // Save to localStorage for persistence
        localStorage.setItem('bookshelfOrder', JSON.stringify(order));
    }

    /**
     * Load the saved order of books on the bookshelf
     */
    function loadBookshelfOrder() {
        const savedOrder = localStorage.getItem('bookshelfOrder');

        if (!savedOrder) return false;

        try {
            // This is a placeholder for future implementation
            // Full implementation would need to track all books and their positions
            // and restore them when loading
            return true;
        } catch (error) {
            console.error('Error loading bookshelf order:', error);
            return false;
        }
    }

    /**
     * Helper function to determine the book after which to place a dragged book
     * @param {HTMLElement} shelf - The shelf element
     * @param {number} x - The horizontal position of the mouse
     * @returns {HTMLElement|null} - The element after which to place the dragged book
     */
    function getBookAfterDragPosition(shelf, x) {
        // Get all books in the shelf that aren't being dragged
        const books = [...shelf.querySelectorAll('.book:not(.dragging)')];

        // If there are no other books, return null (append to the end)
        if (books.length === 0) return null;

        // Find the first book that the cursor is positioned before
        // This creates a more natural insertion point based on cursor position
        for (const book of books) {
            const box = book.getBoundingClientRect();

            // If the cursor is before this book's right edge with a small buffer zone
            // The buffer zone (25% of book width) creates a more natural transition point
            const insertPosition = box.left + (box.width * 0.75);

            if (x < insertPosition) {
                return book;
            }
        }

        // If we're after all books, return null to place at the end
        return null;
    }

    /**
     * Update the selected files list in the upload dialog
     */
    function updateSelectedFilesList(files, container) {
        if (!files || !container) return;

        container.innerHTML = '';

        if (files.length === 0) {
            container.innerHTML = '<p>No files selected</p>';
            return;
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileItem = document.createElement('div');
            fileItem.className = 'selected-file-item';

            fileItem.innerHTML = `
                <span>${file.name}</span>
                <span>${(file.size / 1024).toFixed(1)} KB</span>
            `;

            container.appendChild(fileItem);
        }
    }

    /**
     * Process local spine images from file input
     * @param {FileList} files - Selected image files
     */
    function processLocalSpineImages(files) {
        if (!files || files.length === 0) {
            console.warn('No files to process');
            return;
        }

        console.log(`Processing ${files.length} local spine images...`);

        // Clear the existing bookshelf
        clearBookshelf();

        // Create the shelf structure
        createShelfStructure();

        // Create temporary URLs for the selected files
        const spineImages = [];

        // Process each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const objectUrl = URL.createObjectURL(file);

            spineImages.push({
                fileName: file.name,
                url: objectUrl,
                index: i
            });
        }

        // Process each image
        let processedCount = 0;
        spineImages.forEach((spineData) => {
            // Create an image object to get the dimensions
            const img = new Image();

            img.onload = function () {
                // Create spine data with dimensions
                const processedSpineData = {
                    fileName: spineData.fileName,
                    index: spineData.index,
                    imageSrc: spineData.url,
                    dimensions: {
                        width: Math.max(40, img.width / 5),  // Reasonable spine width
                        height: Math.max(120, img.height / 5), // Reasonable height
                        rawWidth: img.width / 60, // Assuming 60px per inch
                        rawHeight: img.height / 60
                    }
                };

                // Add the spine to the bookshelf
                addSpineToShelf(processedSpineData);

                // Increment counter and check if all images are processed
                processedCount++;
                if (processedCount === spineImages.length) {
                    console.log(`All ${processedCount} book spines added to the shelf`);

                    // Revoke object URLs to prevent memory leaks
                    setTimeout(() => {
                        spineImages.forEach(item => {
                            URL.revokeObjectURL(item.url);
                        });
                    }, 1000);
                }
            };

            img.onerror = function () {
                console.error(`Failed to load image: ${spineData.fileName}`);
                processedCount++;

                if (processedCount === spineImages.length) {
                    console.log('Finished processing spine images');
                }
            };

            // Start loading the image
            img.src = spineData.url;
        });
    }

    /**
     * Load saved dimension settings from localStorage
     */
    function loadSavedDimensions() {
        const savedSettings = localStorage.getItem('bookshelfDimensions');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                currentDimensions.scaleFactor = settings.scale;
                currentDimensions.heightFactor = settings.height;
                currentDimensions.widthFactor = settings.width;
                console.log('Loaded saved dimension settings:', currentDimensions);
            } catch (e) {
                console.error('Error loading saved dimensions:', e);
            }
        }
    }

    /**
     * Load saved individual book settings from localStorage
     */
    function loadSavedIndividualSettings() {
        const savedSettings = localStorage.getItem('individualBookSettings');
        if (savedSettings) {
            try {
                individualBookSettings = JSON.parse(savedSettings);
                console.log('Loaded saved individual book settings');
            } catch (e) {
                console.error('Error loading saved individual book settings:', e);
                individualBookSettings = {};
            }
        }
    }

    /**
     * Save individual book settings to localStorage
     */
    function saveIndividualBookSettings() {
        localStorage.setItem('individualBookSettings', JSON.stringify(individualBookSettings));
    }

    /**
     * Refresh the bookshelf with current dimension settings
     * and enhanced rendering effects from the reference repository
     */
    function refreshBookshelf() {
        // Get all books currently in the bookshelf
        const books = document.querySelectorAll('.book.original-size');

        // Re-apply dimensions to each book
        books.forEach(book => {
            // Find the book's spine data in the book's dataset
            const spineData = JSON.parse(book.dataset.spineData || '{}');
            if (spineData.dimensions && spineData.fileName) {
                // Check if this book has individual settings
                const bookId = getBookIdFromFileName(spineData.fileName);
                const hasIndividualSettings = individualBookSettings[bookId];

                let scaleFactor = currentDimensions.scaleFactor;
                let heightFactor = currentDimensions.heightFactor;
                let widthFactor = currentDimensions.widthFactor;

                // Apply individual settings if they exist
                if (hasIndividualSettings) {
                    scaleFactor *= (hasIndividualSettings.scale || 1);
                    heightFactor *= (hasIndividualSettings.height || 1);
                    widthFactor *= (hasIndividualSettings.width || 1);
                }

                // Calculate new scaled dimensions
                const scaledWidth = Math.round(spineData.dimensions.width * scaleFactor * widthFactor);
                const scaledHeight = Math.round(spineData.dimensions.height * scaleFactor * heightFactor);

                // Apply new dimensions to book and its spine
                book.style.width = `${scaledWidth}px`;
                book.style.height = `${scaledHeight}px`;

                // Calculate and update inches dimensions for data attributes
                if (spineData.dimensions.rawWidth && spineData.dimensions.rawHeight) {
                    const widthInches = (spineData.dimensions.rawWidth * widthFactor).toFixed(2);
                    const heightInches = (spineData.dimensions.rawHeight * heightFactor).toFixed(2);
                    book.dataset.widthInches = widthInches;
                    book.dataset.heightInches = heightInches;
                }

                // Find and update the book spine element
                const spineElement = book.querySelector('.book-spine');
                if (spineElement) {
                    spineElement.style.width = `${scaledWidth}px`;
                    spineElement.style.height = `${scaledHeight}px`;

                    // Maintain 3D perspective effect
                    spineElement.style.transform = 'perspective(1000px) rotateY(0deg)';
                }
            }
        });
    }

    /**
     * Extract book ID from filename
     */
    function getBookIdFromFileName(fileName) {
        const match = fileName.match(/spine_(\d+)_/);
        return match ? match[1] : fileName.replace(/\W+/g, '_'); // Use sanitized filename if no spine number
    }

    /**
     * Set up individual book controls
     */
    function setupIndividualBookControls() {
        // Elements in the book info panel
        const bookInfoId = document.getElementById('book-info-id');
        const bookOriginalWidth = document.getElementById('book-original-width');
        const bookOriginalHeight = document.getElementById('book-original-height');
        const bookScaleSlider = document.getElementById('book-scale');
        const bookHeightSlider = document.getElementById('book-height');
        const bookWidthSlider = document.getElementById('book-width');
        const bookScaleValue = document.getElementById('book-scale-value');
        const bookHeightValue = document.getElementById('book-height-value');
        const bookWidthValue = document.getElementById('book-width-value');
        const bookResetBtn = document.getElementById('book-reset');
        const bookApplyBtn = document.getElementById('book-apply');
        const bookCloseBtn = document.getElementById('book-info-close');
        const bookRemoveBtn = document.getElementById('book-remove');

        // Update value displays when sliders change
        bookScaleSlider.addEventListener('input', function () {
            bookScaleValue.textContent = this.value + '%';
        });

        bookHeightSlider.addEventListener('input', function () {
            bookHeightValue.textContent = this.value + '%';
        });

        bookWidthSlider.addEventListener('input', function () {
            bookWidthValue.textContent = this.value + '%';
        });

        // Reset button event
        bookResetBtn.addEventListener('click', function () {
            if (!selectedBook) return;

            const bookId = selectedBook.dataset.bookId;

            // Reset sliders to default
            bookScaleSlider.value = 100;
            bookHeightSlider.value = 100;
            bookWidthSlider.value = 100;
            bookScaleValue.textContent = '100%';
            bookHeightValue.textContent = '100%';
            bookWidthValue.textContent = '100%';

            // Remove individual settings
            delete individualBookSettings[bookId];
            saveIndividualBookSettings();

            // Update display
            refreshBookshelf();
        });

        // Remove button event
        if (bookRemoveBtn) {
            bookRemoveBtn.addEventListener('click', function () {
                if (!selectedBook) return;

                // Remove the book
                removeBook(selectedBook);

                // Hide the panel
                hideBookInfoPanel();
            });
        }

        // Apply button event
        bookApplyBtn.addEventListener('click', function () {
            if (!selectedBook) return;

            const bookId = selectedBook.dataset.bookId;
            const scale = parseInt(bookScaleSlider.value) / 100;
            const height = parseInt(bookHeightSlider.value) / 100;
            const width = parseInt(bookWidthSlider.value) / 100;

            // Save individual settings
            individualBookSettings[bookId] = {
                scale: scale,
                height: height,
                width: width
            };

            saveIndividualBookSettings();

            // Update display
            refreshBookshelf();
        });

        // Close button event
        bookCloseBtn.addEventListener('click', function () {
            hideBookInfoPanel();
        });

        // Click outside to close panel
        document.addEventListener('click', function (e) {
            if (!bookInfoPanel.contains(e.target) &&
                selectedBook && !selectedBook.contains(e.target)) {
                hideBookInfoPanel();
            }
        });
    }

    /**
     * Set up resize mode buttons
     */
    function setupResizeModeButtons() {
        const modeButtons = {
            scale: document.getElementById('resize-mode-scale'),
            width: document.getElementById('resize-mode-width'),
            height: document.getElementById('resize-mode-height')
        };

        // Add click event to each mode button
        for (const mode in modeButtons) {
            if (modeButtons[mode]) {
                modeButtons[mode].addEventListener('click', function () {
                    // Set current mode
                    currentResizeMode = mode;

                    // Update active state of buttons
                    for (const m in modeButtons) {
                        if (modeButtons[m]) {
                            if (m === mode) {
                                modeButtons[m].classList.add('active');
                            } else {
                                modeButtons[m].classList.remove('active');
                            }
                        }
                    }
                });
            }
        }
    }

    /**
     * Set up direct resize functionality
     */
    function setupDirectResize() {
        let isResizing = false;
        let currentResizeHandle = null;
        let currentResizeBook = null;
        let startX, startY, startWidth, startHeight;

        // Add mousedown event listener to document to catch resize handles
        document.addEventListener('mousedown', function (e) {
            if (e.target.classList.contains('resize-handle')) {
                isResizing = true;
                currentResizeHandle = e.target;
                currentResizeBook = e.target.closest('.book');

                // Mark the book as being resized
                currentResizeBook.classList.add('resizing');

                // Get the resize type from the handle
                const resizeType = currentResizeHandle.dataset.resizeType || 'scale';

                // Store initial position and dimensions
                startX = e.clientX;
                startY = e.clientY;
                startWidth = parseInt(currentResizeBook.style.width);
                startHeight = parseInt(currentResizeBook.style.height);

                // Prevent default to avoid text selection
                e.preventDefault();
            }
        });

        // Add mousemove event listener
        document.addEventListener('mousemove', function (e) {
            if (!isResizing) return;

            // Get the resize handle type
            const resizeType = currentResizeHandle.dataset.resizeType || currentResizeMode;

            // Calculate new dimensions based on resize type
            let newWidth = startWidth;
            let newHeight = startHeight;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            // Apply resize based on handle type
            switch (resizeType) {
                case 'width':
                    newWidth = Math.max(20, startWidth + deltaX);
                    break;
                case 'height':
                    newHeight = Math.max(60, startHeight + deltaY);
                    break;
                case 'scale':
                default:
                    const scaleFactor = 1 + (deltaX + deltaY) / 200;
                    newWidth = Math.max(20, Math.round(startWidth * scaleFactor));
                    newHeight = Math.max(60, Math.round(startHeight * scaleFactor));
                    break;
            }

            // Apply new dimensions
            currentResizeBook.style.width = `${newWidth}px`;
            currentResizeBook.style.height = `${newHeight}px`;

            // Update the spine element
            const spine = currentResizeBook.querySelector('.book-spine');
            if (spine) {
                spine.style.width = `${newWidth}px`;
                spine.style.height = `${newHeight}px`;
            }

            // Prevent default to avoid text selection during resize
            e.preventDefault();
        });

        // Add mouseup event listener
        document.addEventListener('mouseup', function () {
            if (isResizing) {
                // Save the new dimensions to individual settings
                if (currentResizeBook) {
                    const bookId = currentResizeBook.dataset.bookId;
                    if (!bookId) {
                        // Generate an ID based on the book's data
                        const spineData = JSON.parse(currentResizeBook.dataset.spineData || '{}');
                        if (spineData.fileName) {
                            currentResizeBook.dataset.bookId = getBookIdFromFileName(spineData.fileName);
                        }
                    }

                    // Remove resizing class
                    currentResizeBook.classList.remove('resizing');

                    // Update settings if we have a book ID
                    if (currentResizeBook.dataset.bookId) {
                        saveBookDimensions(currentResizeBook);
                    }
                }

                // Reset resizing state
                isResizing = false;
                currentResizeHandle = null;
                currentResizeBook = null;
            }
        });
    }

    /**
     * Save book dimensions after a resize
     */
    function saveBookDimensions(book) {
        if (!book) return;

        const bookId = book.dataset.bookId;
        if (!bookId) return;

        const spineData = JSON.parse(book.dataset.spineData || '{}');
        if (!spineData.dimensions) return;

        // Get current book dimensions
        const currentWidth = parseInt(book.style.width);
        const currentHeight = parseInt(book.style.height);

        // Calculate scale factors
        const widthFactor = currentWidth / (spineData.dimensions.width * currentDimensions.scaleFactor);
        const heightFactor = currentHeight / (spineData.dimensions.height * currentDimensions.scaleFactor);

        // Update individual settings
        individualBookSettings[bookId] = {
            scale: 1, // We're using direct width/height adjustments
            width: widthFactor,
            height: heightFactor
        };

        // Save to localStorage
        saveIndividualBookSettings();
    }

    /**
     * Show the book info panel for a specific book
     */
    function showBookInfoPanel(book, x, y) {
        if (!book) return;

        // Get book data
        const spineData = JSON.parse(book.dataset.spineData || '{}');
        if (!spineData.dimensions || !spineData.fileName) return;

        // Mark this book as selected
        if (selectedBook) {
            selectedBook.classList.remove('selected');
        }
        selectedBook = book;
        selectedBook.classList.add('selected');

        // Extract book ID
        const bookId = getBookIdFromFileName(spineData.fileName);
        selectedBook.dataset.bookId = bookId;

        // Fill in book info
        const bookInfoId = document.getElementById('book-info-id');
        const bookOriginalWidth = document.getElementById('book-original-width');
        const bookOriginalHeight = document.getElementById('book-original-height');
        const bookScaleSlider = document.getElementById('book-scale');
        const bookHeightSlider = document.getElementById('book-height');
        const bookWidthSlider = document.getElementById('book-width');
        const bookScaleValue = document.getElementById('book-scale-value');
        const bookHeightValue = document.getElementById('book-height-value');
        const bookWidthValue = document.getElementById('book-width-value');
        const bookRemoveBtn = document.getElementById('book-remove');

        bookInfoId.textContent = bookId;
        bookOriginalWidth.textContent = spineData.dimensions.width;
        bookOriginalHeight.textContent = spineData.dimensions.height;

        // Set slider values based on individual settings
        const settings = individualBookSettings[bookId] || { scale: 1, height: 1, width: 1 };
        bookScaleSlider.value = Math.round(settings.scale * 100);
        bookHeightSlider.value = Math.round(settings.height * 100);
        bookWidthSlider.value = Math.round(settings.width * 100);
        bookScaleValue.textContent = Math.round(settings.scale * 100) + '%';
        bookHeightValue.textContent = Math.round(settings.height * 100) + '%';
        bookWidthValue.textContent = Math.round(settings.width * 100) + '%';

        // Position and show panel
        const panel = document.getElementById('book-info-panel');

        // Calculate position - try to keep it within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const panelWidth = 280; // Width from CSS
        const panelHeight = 380; // Estimated height - increased for new buttons

        // First, check where the book is located on screen
        const bookRect = book.getBoundingClientRect();

        // Default positions - try to position to the right of the book first
        let left = bookRect.right + 10;
        let top = bookRect.top;

        // If the book is on the right side of the screen, show panel on the left
        if (left + panelWidth > viewportWidth) {
            left = bookRect.left - panelWidth - 10;
            // If still doesn't fit, center it horizontally
            if (left < 0) {
                left = Math.max(10, (viewportWidth - panelWidth) / 2);
            }
        }

        // Check vertical positioning
        // If the book is at the bottom of the screen, align panel top with the top of the book
        // If panel would go off bottom of screen, align bottom with bottom of viewport
        if (top + panelHeight > viewportHeight) {
            // First try to align to bottom of viewport
            top = viewportHeight - panelHeight - 10;

            // If that would place it above the top of viewport, then position at top
            if (top < 0) {
                top = 10;
            }
        }

        // Set position and show
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
        panel.classList.add('active');
    }

    /**
     * Hide the book info panel
     */
    function hideBookInfoPanel() {
        const panel = document.getElementById('book-info-panel');
        panel.classList.remove('active');

        if (selectedBook) {
            selectedBook.classList.remove('selected');
            selectedBook = null;
        }
    }

    /**
     * Remove a book from the shelf and place in the removed books area
     */
    function removeBook(book) {
        if (!book) return;

        // Get the removed books area or create it if it doesn't exist
        let removedBooksArea = document.getElementById('removed-books-area');
        if (!removedBooksArea) {
            // Create the removed books area container
            removedBooksArea = document.createElement('div');
            removedBooksArea.id = 'removed-books-area';
            removedBooksArea.className = 'removed-books-area';

            // Add a title to the removed books area
            const title = document.createElement('h3');
            title.textContent = 'Removed Books';
            removedBooksArea.appendChild(title);

            // Create the books container
            const booksContainer = document.createElement('div');
            booksContainer.id = 'removed-books-container';
            booksContainer.className = 'removed-books-container';
            removedBooksArea.appendChild(booksContainer);

            // Insert it after the main bookshelf
            const mainBookshelf = document.getElementById('main-bookshelf');
            mainBookshelf.parentNode.insertBefore(removedBooksArea, mainBookshelf.nextSibling);

            // Add styles for the removed books area
            const style = document.createElement('style');
            style.textContent = `
                .removed-books-area {
                    margin-top: 20px;
                    padding: 15px;
                    background-color: #f0f0f0;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                }
                
                .removed-books-area h3 {
                    margin-top: 0;
                    color: #555;
                    font-size: 1.1rem;
                }
                
                .removed-books-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    padding: 10px;
                    min-height: 150px;
                    background-color: #e8e8e8;
                    border-radius: 4px;
                }
                
                .removed-books-container .book {
                    position: relative;
                }
                
                .removed-books-container .book::after {
                    content: "↩";
                    position: absolute;
                    top: -15px;
                    right: -5px;
                    background-color: #2ecc71;
                    color: white;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    cursor: pointer;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                
                .removed-books-container .book:hover::after {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }

        // Remove the book from its current shelf
        book.parentNode.removeChild(book);

        // Clear selection
        if (selectedBook === book) {
            hideBookInfoPanel();
        }

        // Add to removed books container
        const removedBooksContainer = document.getElementById('removed-books-container');
        removedBooksContainer.appendChild(book);

        // Add click event to return the book to shelf
        book.addEventListener('click', function (e) {
            // Check if the book is in the removed books area
            if (book.parentNode.id === 'removed-books-container') {
                e.stopPropagation(); // Prevent opening the info panel

                // Find an appropriate shelf to add it to
                const topShelf = document.getElementById('top-shelf');
                if (topShelf) {
                    // Remove from removed books
                    book.parentNode.removeChild(book);
                    // Add to shelf
                    topShelf.appendChild(book);
                }
            }
        });
    }

    /**
     * Set up drag and drop functionality
     */
    function handleDragStart(e) {
        // Ensure this is a valid drag event
        if (!e.dataTransfer) {
            console.warn('Drag event without dataTransfer detected');
            return;
        }

        // Clear any existing dragging elements first
        document.querySelectorAll('.dragging').forEach(el => {
            el.classList.remove('dragging');
            el.setAttribute('aria-grabbed', 'false');
            el.style.opacity = '1';
        });

        // Remove any existing drop indicators
        document.querySelectorAll('.drop-indicator').forEach(indicator => {
            indicator.remove();
        });

        // Mark this element as being dragged
        this.classList.add('dragging');
        this.setAttribute('aria-grabbed', 'true');

        // Store the shelf this book came from
        this.dataset.sourceShelfId = this.parentNode.id;

        // Set data for drag operation - important for cross-browser compatibility
        try {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.dataset.bookId || 'book');

            // Try to set additional data - may fail in some browsers
            try {
                e.dataTransfer.setData('application/x-book', JSON.stringify({
                    id: this.dataset.bookId,
                    sourceShelf: this.parentNode.id
                }));
            } catch (err) {
                console.warn('Could not set complex data type for drag operation');
            }
        } catch (err) {
            console.error('Error setting drag data:', err);
        }

        // Set visual style for dragging
        this.style.opacity = '0.7';
        this.style.cursor = 'grabbing';

        // Create an enhanced drag image
        try {
            if (e.dataTransfer.setDragImage) {
                // Clone the element for a custom drag image
                const dragImage = this.cloneNode(true);
                dragImage.style.transform = 'scale(0.9)';
                dragImage.style.opacity = '0.8';
                dragImage.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';

                // Temporarily add it to the DOM and position offscreen
                dragImage.style.position = 'absolute';
                dragImage.style.top = '-9999px';
                dragImage.style.left = '-9999px';
                document.body.appendChild(dragImage);

                // Use it as the drag image
                e.dataTransfer.setDragImage(dragImage, 10, 10);

                // Clean up after a short delay
                setTimeout(() => {
                    if (dragImage.parentNode) {
                        document.body.removeChild(dragImage);
                    }
                }, 0);
            }
        } catch (err) {
            console.warn('Custom drag image not supported:', err);
        }

        // Add event to document to handle escape key canceling drag
        document.addEventListener('keydown', function cancelDrag(event) {
            if (event.key === 'Escape') {
                // Cancel drag operation if possible
                if (document.querySelector('.dragging')) {
                    document.querySelector('.dragging').classList.remove('dragging');
                    document.querySelector('.dragging').style.opacity = '1';
                }
                document.removeEventListener('keydown', cancelDrag);
            }
        });

        // Prevent default browser behavior for images, etc.
        e.stopPropagation();
    }

    function handleDragEnd(e) {
        // Ensure all books are reset to normal appearance with smooth transitions
        document.querySelectorAll('.book').forEach(book => {
            book.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out, box-shadow 0.3s ease-out';
            book.style.opacity = '1';
            book.style.transform = 'none';
            book.style.boxShadow = '';
            book.style.outline = '';
            book.style.outlineOffset = '';
        });

        // Remove dragging class and restore opacity
        this.classList.remove('dragging');
        this.setAttribute('aria-grabbed', 'false');
        this.style.opacity = '1';

        // Apply a more natural animation to show the book settling in place
        // This creates a small bounce effect that feels more physically realistic
        this.animate([
            { transform: 'translateY(-4px)' },
            { transform: 'translateY(1px)' },
            { transform: 'translateY(0)' }
        ], {
            duration: 300,
            easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)' // Custom easing for a bouncy effect
        });

        // Remove all drop indicators with a fade-out effect
        document.querySelectorAll('.drop-indicator').forEach(indicator => {
            // Fade out the indicator before removing it
            indicator.style.transition = 'opacity 0.2s ease-out';
            indicator.style.opacity = '0';

            // Remove after the fade-out animation
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 200);
        });

        // Remove any active shelf highlights with a smooth transition
        document.querySelectorAll('.bookshelf-row').forEach(shelf => {
            shelf.style.transition = 'background-color 0.3s ease-out, box-shadow 0.3s ease-out';
            shelf.classList.remove('drag-over');
        });

        document.querySelectorAll('.removed-books-container').forEach(container => {
            container.style.transition = 'background-color 0.3s ease-out, box-shadow 0.3s ease-out';
            container.classList.remove('drag-over');
        });

        // Reset transitions after animations complete
        setTimeout(() => {
            document.querySelectorAll('.book').forEach(book => {
                book.style.transition = '';
            });
        }, 300);
    }

    /**
     * Load spine images dynamically from the spine_images directory
     */
    function loadSampleSpineImages() {
        // Path to the spine images directory - now checking for your_bookspines folder first
        const userBookspinesPath = 'extracted_spines/your_bookspines/';
        const defaultSpineImagesPath = 'extracted_spines/spine_images/';

        // Clear the bookshelf
        clearBookshelf();

        // Create three shelf rows to match the original bookshelf
        createShelfStructure();

        // Check if we have image list in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const spineParams = urlParams.get('spines');

        if (spineParams) {
            // URL parameter contains specific spine images to load
            const spineNumbers = spineParams.split(',').map(num => parseInt(num.trim()));
            loadSpecificSpines(spineNumbers, defaultSpineImagesPath);
        } else {
            // Try to directly load specific known files from the your_bookspines directory
            // For local file access, this works better than trying to fetch directory listings

            // These are some of the book spine images we know exist in the your_bookspines folder
            const knownBookSpines = [
                'AGameofThronesASongofIceandFire1-11264999.jpeg',
                'HarryPotterandtheSorcerersStoneHarryPotter1-3.jpeg',
                'TheLordoftheRings2.png',
                'TheHobbitTheLordoftheRings0-5907-XShKF2zYba.png',
                'TheHungerGamesTheHungerGames1-7285601-9vy7crqotl.jpeg',
                '1984-40961427-VrV2ipysgz.jpeg',
                'ToKillaMockingbird-2657-DxTstjwyMl.jpeg',
                'TheCatcherintheRye-5107-2ItuQbNPww.jpeg',
                'PrideandPrejudice.jpeg'
            ];

            // Add each image to the bookshelf
            let foundAny = false;
            knownBookSpines.forEach((fileName, index) => {
                // Create an image to check if it loads
                const img = new Image();
                img.onload = function () {
                    foundAny = true;
                    // Successfully loaded image, add it to the shelf
                    addSpineToBookshelf(fileName, index, userBookspinesPath);
                };
                img.onerror = function () {
                    // Image not found, try another path or skip
                    console.log(`Book spine not found: ${fileName}`);
                };
                img.src = `${userBookspinesPath}${fileName}`;
            });

            // Also try some random numbered files from the provided list
            for (let i = 0; i < 10; i++) {
                const randomIndex = Math.floor(Math.random() * 240) + 1;
                const testImg = new Image();
                const imgNum = randomIndex.toString().padStart(2, '0');
                const fileName = `book${imgNum}.jpg`;

                testImg.onload = function () {
                    foundAny = true;
                    addSpineToBookshelf(fileName, i + knownBookSpines.length, userBookspinesPath);
                };
                testImg.src = `${userBookspinesPath}${fileName}`;
            }

            // Fallback to default spine images if none of the known files load
            setTimeout(() => {
                if (!foundAny) {
                    console.log('No custom bookspines found. Using default spine images.');
                    loadDefaultSpineImages(defaultSpineImagesPath);
                }
            }, 1000);
        }
    }

    /**
     * Load default spine images as a fallback
     */
    function loadDefaultSpineImages(spineImagesPath) {
        // Use a predefined set of spine images that we know exist
        const defaultSpines = [
            'IMG_2278_spine_1_20260121_032027.jpg',
            'IMG_2278_spine_2_20260121_032027.jpg',
            'IMG_2278_spine_3_20260121_032027.jpg',
            'IMG_2278_spine_4_20260121_032027.jpg',
            'IMG_2278_spine_5_20260121_032027.jpg',
            'IMG_2278_spine_6_20260121_032027.jpg',
            'IMG_2278_spine_7_20260121_032027.jpg',
            'IMG_2278_spine_8_20260121_032027.jpg',
            'IMG_2278_spine_9_20260121_032027.jpg',
            'IMG_2278_spine_10_20260121_032027.jpg'
        ];

        defaultSpines.forEach((fileName, index) => {
            addSpineToBookshelf(fileName, index, spineImagesPath);
        });
    }

    /**
     * Load files from the user's custom bookspines folder
     */
    function loadFilesFromUserFolder(folderPath) {
        // Get a list of files in the folder
        const customImageFiles = [];

        // Check if there are any image files in the your_bookspines folder
        fetch(folderPath)
            .then(response => response.text())
            .then(text => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                const links = doc.querySelectorAll('a');

                links.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && (href.endsWith('.jpg') || href.endsWith('.jpeg') || href.endsWith('.png') || href.endsWith('.gif'))) {
                        customImageFiles.push(href);
                    }
                });

                if (customImageFiles.length > 0) {
                    // Process custom image files
                    customImageFiles.forEach((fileName, index) => {
                        addSpineToBookshelf(fileName, index, folderPath);
                    });
                    console.log(`Loaded ${customImageFiles.length} custom spine images.`);
                } else {
                    // Fall back to default spine images
                    fetchSpineImageList('extracted_spines/spine_images/');
                }
            })
            .catch(error => {
                console.error('Error loading custom spine images:', error);
                // Fall back to default spine images
                fetchSpineImageList('extracted_spines/spine_images/');
            });
    }

    /**
     * Create the three-shelf structure to match the original bookshelf
     */
    function createShelfStructure() {
        // Create three shelf rows
        const topShelf = document.createElement('div');
        topShelf.className = 'bookshelf-row';
        topShelf.id = 'top-shelf';

        const middleShelf = document.createElement('div');
        middleShelf.className = 'bookshelf-row';
        middleShelf.id = 'middle-shelf';

        const bottomShelf = document.createElement('div');
        bottomShelf.className = 'bookshelf-row';
        bottomShelf.id = 'bottom-shelf';

        // Add shelves to the main bookshelf
        mainBookshelf.appendChild(topShelf);
        mainBookshelf.appendChild(middleShelf);
        mainBookshelf.appendChild(bottomShelf);
    }

    /**
     * Clear all books from the bookshelf
     */
    function clearBookshelf() {
        if (mainBookshelf) {
            // Remove all child elements (books and shelf rows)
            while (mainBookshelf.firstChild) {
                mainBookshelf.removeChild(mainBookshelf.firstChild);
            }
        }
    }

    /**
     * Load specific spine images by spine numbers
     */
    function loadSpecificSpines(spineNumbers, spineImagesPath) {
        // Load metadata about all available spine images
        loadSpineImageMetadata().then(imageFiles => {
            // Filter to only the requested spine numbers
            const filteredFiles = imageFiles.filter(file => {
                const match = file.name.match(/spine_(\d+)_/);
                return match && spineNumbers.includes(parseInt(match[1]));
            });

            // Load the filtered images
            filteredFiles.forEach(file => {
                addSpineToBookshelf(file.name, file.index, spineImagesPath);
            });
        });
    }

    /**
     * Add a spine to the bookshelf
     */
    function addSpineToBookshelf(fileName, index, basePath) {
        // Create an image element to get dimensions
        const img = new Image();
        img.onload = function () {
            // Create spine data
            const spineData = {
                fileName: fileName,
                index: index,
                dimensions: {
                    width: Math.max(40, img.width / 5),  // Reasonable spine width
                    height: Math.max(120, img.height / 5), // Reasonable height
                    rawWidth: img.width / 60,  // Assuming 60px per inch
                    rawHeight: img.height / 60  // Assuming 60px per inch
                }
            };

            // Add spine to shelf
            addSpineToShelf(spineData);
        };

        img.onerror = function () {
            console.error(`Failed to load image: ${fileName}`);
        };

        // Start loading the image
        img.src = `${basePath}${fileName}`;
    }

    /**
     * Add a spine to the appropriate shelf
     */
    function addSpineToShelf(spineData) {
        // Determine which shelf to add to based on the index
        // Use modulo to distribute spines across shelves
        const shelfIndex = spineData.index % 3;
        let targetShelf;

        switch (shelfIndex) {
            case 0:
                targetShelf = document.getElementById('top-shelf');
                break;
            case 1:
                targetShelf = document.getElementById('middle-shelf');
                break;
            case 2:
                targetShelf = document.getElementById('bottom-shelf');
                break;
        }

        if (!targetShelf) {
            console.error('Target shelf not found');
            return;
        }

        // Create book element
        const book = document.createElement('div');
        book.className = 'book original-size';
        book.draggable = true;
        book.dataset.spineData = JSON.stringify(spineData);
        book.dataset.bookId = getBookIdFromFileName(spineData.fileName);

        // Add necessary attributes for drag and drop
        book.setAttribute('draggable', 'true');
        book.setAttribute('aria-grabbed', 'false');

        // Enable touch-based drag and drop for mobile devices
        book.style.touchAction = 'none';

        // Calculate scaled dimensions
        const scaledWidth = Math.round(
            spineData.dimensions.width *
            currentDimensions.scaleFactor *
            currentDimensions.widthFactor
        );
        const scaledHeight = Math.round(
            spineData.dimensions.height *
            currentDimensions.scaleFactor *
            currentDimensions.heightFactor
        );

        // Apply dimensions
        book.style.width = `${scaledWidth}px`;
        book.style.height = `${scaledHeight}px`;

        // Create spine element
        const spine = document.createElement('div');
        spine.className = 'book-spine original-spine';
        spine.style.width = `${scaledWidth}px`;
        spine.style.height = `${scaledHeight}px`;

        // Create and add spine image
        const img = document.createElement('img');
        img.src = spineData.imageSrc || `extracted_spines/your_bookspines/${spineData.fileName}`;
        img.alt = `Book spine ${spineData.fileName}`;
        img.className = 'spine-image';
        img.draggable = false; // Prevent image dragging from interfering with book dragging

        // Add image to spine
        spine.appendChild(img);

        // Add spine to book
        book.appendChild(spine);

        // Add resize handles
        addResizeHandles(book);

        // Add book to shelf
        targetShelf.appendChild(book);

        // Add event listeners for interaction and drag-and-drop
        book.addEventListener('click', function (e) {
            if (e.target.classList.contains('resize-handle')) return;
            showBookInfoPanel(this, e.clientX, e.clientY);
        });

        // Set up standard drag and drop event listeners
        book.addEventListener('dragstart', handleDragStart);
        book.addEventListener('dragend', handleDragEnd);

        // Add touch event support for mobile devices
        book.addEventListener('touchstart', function(e) {
            // Mark this book as being touched
            this.classList.add('touch-active');
        }, { passive: false });

        // Add visual feedback on mouse down
        book.addEventListener('mousedown', function(e) {
            // Only respond to primary mouse button (left-click)
            if (e.button !== 0) return;

            // Add a visual effect to indicate the book is being grabbed
            this.style.cursor = 'grabbing';
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'transform 0.1s ease-out';

            // Add a class to mark this as actively being interacted with
            this.classList.add('mouse-active');
        });

        // Reset visual feedback on mouse up
        book.addEventListener('mouseup', function(e) {
            this.style.cursor = '';
            this.style.transform = '';
            this.classList.remove('mouse-active');

            // Allow a short delay before removing transition to ensure smooth animation
            setTimeout(() => {
                if (!this.classList.contains('mouse-active')) {
                    this.style.transition = '';
                }
            }, 100);
        });
    }

    /**
     * Add resize handles to a book
     */
    function addResizeHandles(book) {
        const rightHandle = document.createElement('div');
        rightHandle.className = 'resize-handle right';
        rightHandle.dataset.resizeType = 'width';

        const bottomHandle = document.createElement('div');
        bottomHandle.className = 'resize-handle bottom';
        bottomHandle.dataset.resizeType = 'height';

        const cornerHandle = document.createElement('div');
        cornerHandle.className = 'resize-handle corner';
        cornerHandle.dataset.resizeType = 'scale';

        book.appendChild(rightHandle);
        book.appendChild(bottomHandle);
        book.appendChild(cornerHandle);
    }

    /**
     * Load spine image metadata
     */
    function loadSpineImageMetadata() {
        return fetch('extracted_spines/spine_images/')
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const links = doc.querySelectorAll('a');

                // Extract file info from links
                const fileInfo = [];
                links.forEach((link, index) => {
                    const href = link.getAttribute('href');
                    if (href && href.match(/\.(jpg|jpeg|png|gif)$/i)) {
                        fileInfo.push({
                            name: href,
                            index: index
                        });
                    }
                });

                return fileInfo;
            })
            .catch(error => {
                console.error('Error loading spine image metadata:', error);
                return [];
            });
    }

    /**
     * Fetch spine image list from a directory
     * @param {string} directoryPath - Path to the directory containing spine images
     */
    function fetchSpineImageList(directoryPath) {
        if (!directoryPath) {
            console.error('Directory path is required');
            return;
        }

        // Clear the bookshelf
        clearBookshelf();

        // Create the shelf structure
        createShelfStructure();

        // Fetch the directory contents
        fetch(directoryPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch directory: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const links = doc.querySelectorAll('a');

                const imageFiles = [];

                links.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && href.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                        imageFiles.push(href);
                    }
                });

                if (imageFiles.length > 0) {
                    console.log(`Found ${imageFiles.length} image files in ${directoryPath}`);

                    // Process each image file
                    imageFiles.forEach((fileName, index) => {
                        addSpineToBookshelf(fileName, index, directoryPath);
                    });
                } else {
                    console.warn(`No image files found in ${directoryPath}`);
                }
            })
            .catch(error => {
                console.error('Error fetching spine image list:', error);
                // Try using some default spine images as a fallback
                const defaultSpines = [
                    'IMG_2278_spine_1_20260121_032027.jpg',
                    'IMG_2278_spine_2_20260121_032027.jpg',
                    'IMG_2278_spine_3_20260121_032027.jpg',
                    'IMG_2278_spine_4_20260121_032027.jpg',
                    'IMG_2278_spine_5_20260121_032027.jpg'
                ];

                defaultSpines.forEach((fileName, index) => {
                    addSpineToBookshelf(fileName, index, 'extracted_spines/spine_images/');
                });
            });
    }

    /**
     * Export bookshelf as image
     */
    function exportBookshelfAsImage() {
        // Simple implementation using html2canvas (assumes the library is loaded)
        if (typeof html2canvas === 'undefined') {
            alert('Export functionality requires html2canvas library which is not loaded.');
            return;
        }

        html2canvas(mainBookshelf).then(canvas => {
            // Convert canvas to data URL
            const imgData = canvas.toDataURL('image/png');

            // Create download link
            const link = document.createElement('a');
            link.download = 'my-virtual-bookshelf.png';
            link.href = imgData;
            link.click();
        });
    }
});
