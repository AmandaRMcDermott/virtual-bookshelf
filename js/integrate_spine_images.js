/**
 * Virtual Bookshelf - Spine Integration Module
 * This module handles the integration of extracted book spine images into the virtual bookshelf.
 * It works with spine images produced by the tools/spine_detection scripts.
 */

document.addEventListener('DOMContentLoaded', function () {
    // Get elements
    const importSpinesBtn = document.getElementById('import-spines-btn');
    const importSpinesModal = document.getElementById('import-spines-modal');
    const spineDirectoryInput = document.getElementById('spine-directory');
    const spinePreviewContainer = document.getElementById('spine-preview');
    const importSpinesConfirmBtn = document.getElementById('import-spines');
    const closeModalButtons = document.querySelectorAll('.close-modal');

    // Selected spine images
    let selectedSpines = [];
    let allSpines = [];

    // Add event listeners
    if (importSpinesBtn) {
        importSpinesBtn.addEventListener('click', openImportModal);
    }

    if (spineDirectoryInput) {
        spineDirectoryInput.addEventListener('change', handleFileSelection);
    }

    if (importSpinesConfirmBtn) {
        importSpinesConfirmBtn.addEventListener('click', importSelectedSpines);
    }

    // Close modal when clicking the X
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function () {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', function (event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    /**
     * Opens the spine import modal
     */
    function openImportModal() {
        importSpinesModal.style.display = 'block';
        spinePreviewContainer.innerHTML = '';
        selectedSpines = [];
        allSpines = [];
    }

    /**
     * Handles file selection from the directory input
     */
    function handleFileSelection(event) {
        spinePreviewContainer.innerHTML = '';
        selectedSpines = [];
        allSpines = [];

        const files = Array.from(event.target.files);

        // Filter for image files only
        const imageFiles = files.filter(file =>
            file.type.startsWith('image/') &&
            (file.name.includes('spine') ||
                file.name.toLowerCase().endsWith('.jpg') ||
                file.name.toLowerCase().endsWith('.jpeg') ||
                file.name.toLowerCase().endsWith('.png'))
        );

        if (imageFiles.length === 0) {
            spinePreviewContainer.innerHTML = '<p>No valid spine images found.</p>';
            return;
        }

        // Sort files by name (to ensure they're in a logical order)
        imageFiles.sort((a, b) => {
            // Extract numbers from filenames (assuming format like "spine_1_...")
            const numA = parseInt(a.name.match(/spine_(\d+)/)?.[1] || 0);
            const numB = parseInt(b.name.match(/spine_(\d+)/)?.[1] || 0);

            if (numA !== numB) {
                return numA - numB;
            }
            return a.name.localeCompare(b.name);
        });

        // Process each image file
        imageFiles.forEach((file, index) => {
            const reader = new FileReader();

            reader.onload = function (e) {
                // Create spine preview element
                const spinePreview = document.createElement('div');
                spinePreview.classList.add('spine-preview');
                spinePreview.dataset.index = index;

                // Assign a random color from our palette
                const randomColor = getRandomBookColor();
                spinePreview.style.setProperty('--spine-color', randomColor);

                // Create spine image element
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = `Spine ${index + 1}`;
                spinePreview.appendChild(img);

                // Add click handler for selection
                spinePreview.addEventListener('click', function () {
                    this.classList.toggle('selected');
                    const index = parseInt(this.dataset.index);

                    if (this.classList.contains('selected')) {
                        selectedSpines.push(allSpines[index]);
                    } else {
                        const selectedIndex = selectedSpines.findIndex(spine => spine.index === index);
                        if (selectedIndex !== -1) {
                            selectedSpines.splice(selectedIndex, 1);
                        }
                    }
                });

                // Add to preview container
                spinePreviewContainer.appendChild(spinePreview);

                // Store spine data
                allSpines.push({
                    index: index,
                    imageSrc: e.target.result,
                    color: randomColor,
                    fileName: file.name,
                    text: extractTextFromFileName(file.name)
                });
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Imports selected spine images to the bookshelf
     */
    function importSelectedSpines() {
        // If no spines selected, select all
        const spinesToImport = selectedSpines.length > 0 ? selectedSpines : allSpines;

        if (spinesToImport.length === 0) {
            alert('No spine images selected or available.');
            return;
        }

        // Get the bookshelf element
        const bookshelf = document.getElementById('main-bookshelf');
        if (!bookshelf) {
            alert('Bookshelf element not found.');
            return;
        }

        // Import each selected spine
        spinesToImport.forEach(spine => {
            addBookToShelf(spine);
        });

        // Close the modal
        importSpinesModal.style.display = 'none';

        // Show success message
        alert(`Successfully imported ${spinesToImport.length} book spines.`);
    }

    /**
     * Adds a book to the bookshelf from spine data
     */
    function addBookToShelf(spineData) {
        // Create book element
        const book = document.createElement('div');
        book.classList.add('book');
        book.draggable = true;

        // Create spine element
        const spine = document.createElement('div');
        spine.classList.add('book-spine');
        spine.style.setProperty('--book-color', spineData.color);

        // Add spine text if available
        const spineText = document.createElement('div');
        spineText.classList.add('book-spine-text');
        spineText.textContent = spineData.text || `Book ${spineData.index + 1}`;
        spine.appendChild(spineText);

        // Create cover element
        const cover = document.createElement('div');
        cover.classList.add('book-cover');

        // Add spine image to the cover
        const img = document.createElement('img');
        img.src = spineData.imageSrc;
        img.alt = spineData.text || `Book ${spineData.index + 1}`;
        cover.appendChild(img);

        // Add elements to book
        book.appendChild(spine);
        book.appendChild(cover);

        // Add drag and drop event listeners
        addDragListeners(book);

        // Add to bookshelf
        const bookshelf = document.getElementById('main-bookshelf');
        bookshelf.appendChild(book);

        // If we're in spine-only view, add the class
        if (document.getElementById('view-toggle').checked) {
            book.classList.add('spine-only');
            bookshelf.classList.add('spine-only-view');
        }
    }

    /**
     * Add drag and drop capabilities to a book element
     */
    function addDragListeners(book) {
        // Use centralized drag and drop manager if available
        if (typeof DragManager !== 'undefined') {
            DragManager.makeBookDraggable(book);
        } else {
            // Fallback to basic drag functionality
            book.draggable = true;
            book.addEventListener('dragstart', function (e) {
                this.classList.add('dragging');
                e.dataTransfer.setData('text/plain', 'book');
            });

            book.addEventListener('dragend', function () {
                this.classList.remove('dragging');
            });

            console.warn('DragManager not found - using limited drag functionality');
        }
    }

    /**
     * Helper function to extract text from filename
     */
    function extractTextFromFileName(fileName) {
        // Try to extract metadata from CSV if available

        // For now, just extract base name without extension and cleanup
        const baseName = fileName.split('.')[0]
            .replace(/spine_\d+_\d+/, '')  // Remove "spine_X_TIMESTAMP" pattern
            .replace(/_/g, ' ')            // Replace underscores with spaces
            .trim();

        return baseName || fileName;
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
