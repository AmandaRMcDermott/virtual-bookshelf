/**
 * Virtual Bookshelf - Drag and Drop Manager
 *
 * This file centralizes all drag and drop functionality to prevent conflicts
 * between different script implementations.
 */

const DragManager = (function() {
    // Private variables
    let activeShelf = null;
    let shelfChangeTimeout = null;
    let lastIndicatorUpdate = 0;
    const updateThreshold = 50; // Update at most every 50ms for performance

    // Public API
    return {
        /**
         * Initialize drag and drop functionality for the given bookshelf
         * @param {string} bookshelfSelector - CSS selector for the bookshelf element
         */
        init: function(bookshelfSelector = '#main-bookshelf') {
            // Get the bookshelf element
            const bookshelf = document.querySelector(bookshelfSelector);
            if (!bookshelf) {
                console.error('Bookshelf element not found:', bookshelfSelector);
                return;
            }

            // Get all shelf rows
            const shelfRows = bookshelf.querySelectorAll('.bookshelf-row');

            // Set up shelf row events
            shelfRows.forEach(shelf => {
                this._setupShelfEvents(shelf);
            });

            // Set up the removed books container for drop events
            const removedBooksContainer = document.getElementById('removed-books-container');
            if (removedBooksContainer) {
                this._setupRemovedBooksContainer(removedBooksContainer);
            }

            // Prevent default drag behavior for images and links
            document.addEventListener('dragstart', function(e) {
                if (e.target.tagName === 'IMG' || e.target.tagName === 'A') {
                    e.preventDefault();
                }
            });

            // Prevent unwanted drag and drop behavior at document level
            document.addEventListener('dragover', function(e) {
                // Only prevent default if not on a droppable area
                if (!e.target.closest('.bookshelf-row')) {
                    e.preventDefault();
                    e.dataTransfer.effectAllowed = 'none';
                    e.dataTransfer.dropEffect = 'none';
                }
            });

            document.addEventListener('drop', function(e) {
                // Only prevent default if not on a droppable area
                if (!e.target.closest('.bookshelf-row')) {
                    e.preventDefault();
                }
            });

            console.log('DragManager initialized for', bookshelfSelector);
        },

        /**
         * Add drag and drop capabilities to a book element
         * @param {HTMLElement} bookElement - The book element to make draggable
         */
        makeBookDraggable: function(bookElement) {
            // Set draggable attribute
            bookElement.draggable = true;
            bookElement.setAttribute('draggable', 'true');
            bookElement.setAttribute('aria-grabbed', 'false');

            // Enable touch-based drag and drop for mobile devices
            bookElement.style.touchAction = 'none';

            // Find spine images and prevent them from being draggable separately
            const images = bookElement.querySelectorAll('img');
            images.forEach(img => {
                img.draggable = false;
            });

            // Add event listeners
            bookElement.addEventListener('dragstart', this._handleDragStart);
            bookElement.addEventListener('dragend', this._handleDragEnd);

            // Prevent default on dragover to ensure drop events work
            bookElement.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
            });

            // Add touch event support
            bookElement.addEventListener('touchstart', function(e) {
                this.classList.add('touch-active');
            }, { passive: false });

            // Add visual feedback on mouse down
            bookElement.addEventListener('mousedown', function(e) {
                if (e.button !== 0) return; // Only primary button

                this.style.cursor = 'grabbing';
                this.style.transform = 'scale(1.02)';
                this.style.transition = 'transform 0.1s ease-out';
                this.classList.add('mouse-active');

                e.stopPropagation();
            });

            // Reset visual feedback on mouse up
            bookElement.addEventListener('mouseup', function(e) {
                this.style.cursor = '';
                this.style.transform = '';
                this.classList.remove('mouse-active');

                setTimeout(() => {
                    if (!this.classList.contains('mouse-active')) {
                        this.style.transition = '';
                    }
                }, 100);

                e.stopPropagation();
            });

            // Prevent text selection on double click
            bookElement.addEventListener('dblclick', function(e) {
                e.preventDefault();
            });

            return bookElement;
        },

        /**
         * Save the current order of books on the bookshelf
         */
        saveBookshelfOrder: function() {
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

            // Save to localStorage
            localStorage.setItem('bookshelfOrder', JSON.stringify(order));
            console.log('Bookshelf order saved');
        },

        // Private methods (using leading underscore by convention)

        /**
         * Set up events for shelf rows
         * @private
         */
        _setupShelfEvents: function(shelf) {
            // Dragenter event
            shelf.addEventListener('dragenter', function(e) {
                e.preventDefault();
                e.stopPropagation();

                if (shelfChangeTimeout) {
                    clearTimeout(shelfChangeTimeout);
                }

                if (activeShelf && activeShelf !== this) {
                    activeShelf.classList.remove('drag-over');
                }

                activeShelf = this;
                this.classList.add('drag-over');
            });

            // Dragleave event
            shelf.addEventListener('dragleave', function(e) {
                if (e.currentTarget.contains(e.relatedTarget)) return;

                shelfChangeTimeout = setTimeout(() => {
                    this.classList.remove('drag-over');
                    if (activeShelf === this) {
                        activeShelf = null;
                    }
                }, 50);
            });

            // Dragover event
            shelf.addEventListener('dragover', function(e) {
                e.preventDefault(); // Necessary to allow dropping
                e.stopPropagation();

                e.dataTransfer.dropEffect = 'move';

                // Log this event to help debugging
                console.log('Dragover event on shelf: ' + this.id);

                const draggingBook = document.querySelector('.dragging');
                if (!draggingBook) return;

                const x = e.clientX;

                const now = Date.now();
                if (now - lastIndicatorUpdate < updateThreshold) return;

                lastIndicatorUpdate = now;

                const afterElement = DragManager._getBookAfterDragPosition(shelf, x);

                window.requestAnimationFrame(() => {
                    let indicator = document.querySelector('.drop-indicator');

                    if (!indicator) {
                        indicator = document.createElement('div');
                        indicator.className = 'drop-indicator';
                        indicator.style.transition = 'all 0.1s ease-out';
                    }

                    if (indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }

                    if (afterElement) {
                        shelf.insertBefore(indicator, afterElement);
                    } else {
                        shelf.appendChild(indicator);
                    }
                });
            });

            // Drop event
            shelf.addEventListener('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Log the drop event
                console.log('Drop event on shelf: ' + this.id);

                // First remove the drag-over class
                this.classList.remove('drag-over');

                try {
                    // Get the book ID from dataTransfer (useful for future improvements)
                    const draggingBook = document.querySelector('.dragging');

                    if (draggingBook) {
                        const x = e.clientX;
                        const afterElement = DragManager._getBookAfterDragPosition(shelf, x);

                        const allBooks = shelf.querySelectorAll('.book');
                        allBooks.forEach(book => {
                            book.style.transition = 'transform 0.25s ease-out, opacity 0.25s ease-out';
                        });

                        if (draggingBook.parentNode) {
                            draggingBook.parentNode.removeChild(draggingBook);
                        }

                        draggingBook.style.opacity = '1';
                        draggingBook.style.transform = 'translateY(-2px)';

                        if (afterElement) {
                            shelf.insertBefore(draggingBook, afterElement);
                        } else {
                            shelf.appendChild(draggingBook);
                        }

                        document.querySelectorAll('.drop-indicator').forEach(indicator => {
                            indicator.remove();
                        });

                        setTimeout(() => {
                            draggingBook.style.transform = 'translateY(0)';

                            setTimeout(() => {
                                allBooks.forEach(book => {
                                    book.style.transition = '';
                                });
                                draggingBook.style.transition = '';
                            }, 250);
                        }, 50);

                        DragManager.saveBookshelfOrder();
                    }
                } catch (error) {
                    console.error('Error handling drop:', error);
                }
            });
        },

        /**
         * Set up events for the removed books container
         * @private
         */
        _setupRemovedBooksContainer: function(container) {
            container.addEventListener('dragenter', function(e) {
                e.preventDefault();
                this.classList.add('drag-over');
            });

            container.addEventListener('dragleave', function(e) {
                if (e.currentTarget.contains(e.relatedTarget)) return;
                this.classList.remove('drag-over');
            });

            container.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            container.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('drag-over');

                // Get the book ID from dataTransfer (may be used in future enhancements)
                const draggingBook = document.querySelector('.dragging');

                if (draggingBook) {
                    draggingBook.parentNode.removeChild(draggingBook);
                    container.appendChild(draggingBook);

                    document.querySelectorAll('.drop-indicator').forEach(indicator => {
                        indicator.remove();
                    });

                    DragManager.saveBookshelfOrder();
                }
            });
        },

        /**
         * Handle dragstart event
         * @private
         */
        _handleDragStart: function(e) {
            console.log('Drag start event triggered');

            // IMPORTANT: Do NOT preventDefault on dragstart
            // We only stop propagation to prevent conflicts
            e.stopPropagation();

            if (!e.dataTransfer) {
                console.warn('Drag event without dataTransfer detected');
                return;
            }

            // Ensure ghosting works correctly in all browsers
            e.dataTransfer.effectAllowed = 'move';

            document.querySelectorAll('.dragging').forEach(el => {
                el.classList.remove('dragging');
                el.setAttribute('aria-grabbed', 'false');
                el.style.opacity = '1';
            });

            document.querySelectorAll('.drop-indicator').forEach(indicator => {
                indicator.remove();
            });

            this.classList.add('dragging');
            this.setAttribute('aria-grabbed', 'true');

            this.dataset.sourceShelfId = this.parentNode.id;

            try {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', this.dataset.bookId || 'book');
            } catch (err) {
                console.error('Error setting drag data:', err);
            }

            this.style.opacity = '0.7';
            this.style.cursor = 'grabbing';

            try {
                if (e.dataTransfer.setDragImage) {
                    const dragImage = document.createElement('div');
                    dragImage.style.width = this.offsetWidth + 'px';
                    dragImage.style.height = this.offsetHeight + 'px';
                    dragImage.style.backgroundColor = 'rgba(52, 152, 219, 0.6)';
                    dragImage.style.border = '2px solid rgba(52, 152, 219, 0.8)';
                    dragImage.style.position = 'absolute';
                    dragImage.style.top = '-9999px';
                    dragImage.style.left = '-9999px';
                    document.body.appendChild(dragImage);

                    e.dataTransfer.setDragImage(dragImage, 10, 10);

                    setTimeout(() => {
                        document.body.removeChild(dragImage);
                    }, 10);
                }
            } catch (err) {
                console.warn('Custom drag image not supported:', err);
            }

            document.addEventListener('keydown', function cancelDrag(event) {
                if (event.key === 'Escape') {
                    const draggingEl = document.querySelector('.dragging');
                    if (draggingEl) {
                        draggingEl.classList.remove('dragging');
                        draggingEl.style.opacity = '1';
                    }
                    document.removeEventListener('keydown', cancelDrag);
                }
            });

            console.log('Drag start handled successfully');
        },

        /**
         * Handle dragend event
         * @private
         */
        _handleDragEnd: function() {
            document.querySelectorAll('.book').forEach(book => {
                book.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out, box-shadow 0.3s ease-out';
                book.style.opacity = '1';
                book.style.transform = 'none';
                book.style.boxShadow = '';
                book.style.outline = '';
                book.style.outlineOffset = '';
            });

            this.classList.remove('dragging');
            this.setAttribute('aria-grabbed', 'false');
            this.style.opacity = '1';

            this.animate([
                { transform: 'translateY(-4px)' },
                { transform: 'translateY(1px)' },
                { transform: 'translateY(0)' }
            ], {
                duration: 300,
                easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
            });

            document.querySelectorAll('.drop-indicator').forEach(indicator => {
                indicator.style.transition = 'opacity 0.2s ease-out';
                indicator.style.opacity = '0';

                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }
                }, 200);
            });

            document.querySelectorAll('.bookshelf-row').forEach(shelf => {
                shelf.style.transition = 'background-color 0.3s ease-out, box-shadow 0.3s ease-out';
                shelf.classList.remove('drag-over');
            });

            document.querySelectorAll('.removed-books-container').forEach(container => {
                container.style.transition = 'background-color 0.3s ease-out, box-shadow 0.3s ease-out';
                container.classList.remove('drag-over');
            });

            setTimeout(() => {
                document.querySelectorAll('.book').forEach(book => {
                    book.style.transition = '';
                });
            }, 300);
        },

        /**
         * Helper function to determine the book after which to place a dragged book
         * @private
         */
        _getBookAfterDragPosition: function(shelf, x) {
            const books = [...shelf.querySelectorAll('.book:not(.dragging)')];

            if (books.length === 0) return null;

            for (const book of books) {
                const box = book.getBoundingClientRect();
                const insertPosition = box.left + (box.width * 0.75);

                if (x < insertPosition) {
                    return book;
                }
            }

            return null;
        }
    };
})();

// Initialize the DragManager when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const mainBookshelf = document.querySelector('#main-bookshelf');
    if (mainBookshelf) {
        DragManager.init('#main-bookshelf');
    }
    // The test page will initialize DragManager with its own selector
});