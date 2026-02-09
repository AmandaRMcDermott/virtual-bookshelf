// Book data and management
let books = [];
const colors = [
    '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
    '#3498db', '#9b59b6', '#8e44ad', '#2c3e50', '#16a085'
];

// DOM Elements
const mainBookshelf = document.getElementById('main-bookshelf');
const addBookBtn = document.getElementById('add-book-btn');
const addBookModal = document.getElementById('add-book-modal');
const closeModal = document.querySelector('.close-modal');
const addBookForm = document.getElementById('add-book-form');
const isbnInput = document.getElementById('isbn-input');
const fetchIsbnBtn = document.getElementById('fetch-isbn');
const bookDetails = document.getElementById('book-details');
const saveBookBtn = document.getElementById('save-book');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const viewToggle = document.getElementById('view-toggle');
const exportBtn = document.getElementById('export-btn');

// Load html2canvas library dynamically
function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
        if (window.html2canvas) {
            resolve(window.html2canvas);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => resolve(window.html2canvas);
        script.onerror = () => reject(new Error('Failed to load html2canvas'));
        document.head.appendChild(script);
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadInitialBooks();
    setupDragAndDrop();
    setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
    addBookBtn.addEventListener('click', () => {
        openModal();
    });

    closeModal.addEventListener('click', () => {
        closeModalWindow();
    });

    window.addEventListener('click', (e) => {
        if (e.target === addBookModal) {
            closeModalWindow();
        }
    });

    fetchIsbnBtn.addEventListener('click', () => {
        const isbn = isbnInput.value.trim();
        if (isbn) {
            fetchBookByISBN(isbn);
        } else {
            alert('Please enter a valid ISBN');
        }
    });

    addBookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const bookData = JSON.parse(bookDetails.dataset.bookData || '{}');
        if (Object.keys(bookData).length > 0) {
            addBookToShelf(bookData);
            closeModalWindow();
            addBookForm.reset();
            bookDetails.innerHTML = '';
            bookDetails.dataset.bookData = '';
        } else {
            alert('Please fetch book data first');
        }
    });

    searchBtn.addEventListener('click', () => {
        searchBooks(searchInput.value.trim());
    });

    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchBooks(searchInput.value.trim());
        }
    });

    viewToggle.addEventListener('change', toggleViewMode);

    exportBtn.addEventListener('click', exportBookshelfImage);
}

// Export bookshelf as image
async function exportBookshelfImage() {
    // Show loading state
    exportBtn.textContent = "Generating...";
    exportBtn.disabled = true;

    try {
        // Load the html2canvas library
        const html2canvas = await loadHtml2Canvas();

        // Get the bookshelf container
        const bookshelfContainer = document.querySelector('.bookshelf-container');

        // Capture the bookshelf as an image
        const canvas = await html2canvas(bookshelfContainer, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher resolution
            logging: false,
            useCORS: true // To handle external images
        });

        // Convert the canvas to a data URL
        const imageData = canvas.toDataURL('image/png');

        // Create a download link
        const downloadLink = document.createElement('a');
        downloadLink.href = imageData;
        downloadLink.download = 'my-virtual-bookshelf.png';

        // Trigger the download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (error) {
        console.error('Error generating bookshelf image:', error);
        alert('Failed to generate the bookshelf image. Please try again.');
    } finally {
        // Reset button state
        exportBtn.textContent = "Export Image";
        exportBtn.disabled = false;
    }
}

// Toggle between full view and spine-only view
function toggleViewMode() {
    const books = document.querySelectorAll('.book');

    if (viewToggle.checked) {
        // Spine-only view
        mainBookshelf.classList.add('spine-only-view');
        books.forEach(book => {
            book.classList.add('spine-only');
        });
    } else {
        // Full view
        mainBookshelf.classList.remove('spine-only-view');
        books.forEach(book => {
            book.classList.remove('spine-only');
        });
    }
}

// Open modal window
function openModal() {
    addBookModal.style.display = 'block';
    isbnInput.focus();
}

// Close modal window
function closeModalWindow() {
    addBookModal.style.display = 'none';
    addBookForm.reset();
    bookDetails.innerHTML = '';
    bookDetails.dataset.bookData = '';
}

// Fetch book data from Open Library API by ISBN
async function fetchBookByISBN(isbn) {
    bookDetails.innerHTML = '<p>Loading book data...</p>';

    try {
        const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
        const data = await response.json();
        const bookKey = `ISBN:${isbn}`;

        if (data[bookKey]) {
            const book = data[bookKey];
            displayBookDetails(book, isbn);
        } else {
            bookDetails.innerHTML = '<p>Book not found. Please check the ISBN and try again.</p>';
        }
    } catch (error) {
        console.error('Error fetching book data:', error);
        bookDetails.innerHTML = '<p>Failed to fetch book data. Please try again later.</p>';
    }
}

// Display book details in the modal
function displayBookDetails(book, isbn) {
    // Prepare book data for storage
    const bookData = {
        isbn: isbn,
        title: book.title || 'Unknown Title',
        authors: book.authors ? book.authors.map(author => author.name).join(', ') : 'Unknown Author',
        publishDate: book.publish_date || 'Unknown',
        publisher: book.publishers ? book.publishers[0].name : 'Unknown Publisher',
        cover: book.cover ? book.cover.medium : null
    };

    // Store book data in the form for submission
    bookDetails.dataset.bookData = JSON.stringify(bookData);

    // Create display elements
    let detailsHTML = '<div class="details-grid">';

    if (bookData.cover) {
        detailsHTML += `<img src="${bookData.cover}" alt="${bookData.title}" class="details-img">`;
    }

    detailsHTML += `
        <div>
            <strong>Title:</strong> ${bookData.title}
        </div>
        <div>
            <strong>Author(s):</strong> ${bookData.authors}
        </div>
        <div>
            <strong>Publisher:</strong> ${bookData.publisher}
        </div>
        <div>
            <strong>Published:</strong> ${bookData.publishDate}
        </div>
    </div>`;

    bookDetails.innerHTML = detailsHTML;
}

// Add book to bookshelf
function addBookToShelf(bookData) {
    // Assign a random color to the book spine
    const colorIndex = books.length % colors.length;
    const bookColor = colors[colorIndex];

    // Add to books array
    books.push({
        ...bookData,
        id: `book-${Date.now()}`,
        color: bookColor
    });

    // Save to local storage
    saveBooks();

    // Render books
    renderBooks();
}

// Render all books on the bookshelf
function renderBooks() {
    mainBookshelf.innerHTML = '';

    books.forEach(book => {
        const bookElement = createBookElement(book);
        mainBookshelf.appendChild(bookElement);
    });

    // Re-initialize drag events
    setupDragAndDrop();
}

// Create book DOM element
function createBookElement(book) {
    const bookElement = document.createElement('div');
    bookElement.className = 'book';
    bookElement.id = book.id;
    bookElement.draggable = true;

    // Add data attributes for search functionality
    bookElement.dataset.title = book.title.toLowerCase();
    bookElement.dataset.authors = book.authors.toLowerCase();
    bookElement.dataset.isbn = book.isbn;

    const bookSpine = document.createElement('div');
    bookSpine.className = 'book-spine';
    bookSpine.style.setProperty('--book-color', book.color);

    const spineText = document.createElement('div');
    spineText.className = 'book-spine-text';
    spineText.textContent = book.title;
    bookSpine.appendChild(spineText);

    const bookCover = document.createElement('div');
    bookCover.className = 'book-cover';

    if (book.cover) {
        const coverImg = document.createElement('img');
        coverImg.src = book.cover;
        coverImg.alt = book.title;
        bookCover.appendChild(coverImg);
    } else {
        // Create a placeholder cover with title and author
        bookCover.innerHTML = `
            <div style="padding: 10px; text-align: center;">
                <h3 style="font-size: 0.8rem;">${book.title}</h3>
                <p style="font-size: 0.7rem;">${book.authors}</p>
            </div>
        `;
    }

    bookElement.appendChild(bookSpine);
    bookElement.appendChild(bookCover);

    // Add event listener for book details
    bookElement.addEventListener('dblclick', () => {
        alert(`
            Title: ${book.title}
            Author(s): ${book.authors}
            ISBN: ${book.isbn}
            Publisher: ${book.publisher}
            Published: ${book.publishDate}
        `);
    });

    return bookElement;
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const bookElements = document.querySelectorAll('.book');

    bookElements.forEach(book => {
        book.addEventListener('dragstart', dragStart);
        book.addEventListener('dragend', dragEnd);
    });

    mainBookshelf.addEventListener('dragover', dragOver);
    mainBookshelf.addEventListener('dragenter', dragEnter);
    mainBookshelf.addEventListener('dragleave', dragLeave);
    mainBookshelf.addEventListener('drop', drop);
}

// Drag and drop event handlers
function dragStart() {
    this.classList.add('dragging');
}

function dragEnd() {
    this.classList.remove('dragging');
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function dragLeave() {
    this.classList.remove('drag-over');
}

function drop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const draggable = document.querySelector('.dragging');
    if (draggable) {
        // Get mouse position to determine where to insert the book
        const afterElement = getDragAfterElement(this, e.clientX);

        if (afterElement) {
            this.insertBefore(draggable, afterElement);
        } else {
            this.appendChild(draggable);
        }

        // Update books array to match the new order
        updateBooksOrder();
    }
}

// Helper function to determine where to insert the dragged book
function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('.book:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Update books array to match the new order after drag and drop
function updateBooksOrder() {
    const bookElements = document.querySelectorAll('.book');
    const newOrder = [];

    bookElements.forEach(element => {
        const bookId = element.id;
        const book = books.find(b => b.id === bookId);
        if (book) {
            newOrder.push(book);
        }
    });

    books = newOrder;
    saveBooks();
}

// Search functionality
function searchBooks(query) {
    if (!query) {
        renderBooks(); // Show all books if query is empty
        return;
    }

    query = query.toLowerCase();
    const bookElements = document.querySelectorAll('.book');

    bookElements.forEach(book => {
        const title = book.dataset.title;
        const authors = book.dataset.authors;
        const isbn = book.dataset.isbn;

        if (title.includes(query) || authors.includes(query) || isbn.includes(query)) {
            book.style.display = 'block';
        } else {
            book.style.display = 'none';
        }
    });
}

// Save books to local storage
function saveBooks() {
    localStorage.setItem('virtualBookshelf', JSON.stringify(books));
}

// Load books from local storage
function loadBooks() {
    const savedBooks = localStorage.getItem('virtualBookshelf');
    if (savedBooks) {
        books = JSON.parse(savedBooks);
    }
}

// Load initial books (provided ISBNs)
async function loadInitialBooks() {
    loadBooks(); // First load any books from localStorage

    // If no books are loaded, fetch the initial ones
    if (books.length === 0) {
        const initialISBNs = ['9780670023486', '9781619635180', '9781836200062'];

        for (const isbn of initialISBNs) {
            try {
                const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
                const data = await response.json();
                const bookKey = `ISBN:${isbn}`;

                if (data[bookKey]) {
                    const book = data[bookKey];
                    const bookData = {
                        isbn: isbn,
                        title: book.title || 'Unknown Title',
                        authors: book.authors ? book.authors.map(author => author.name).join(', ') : 'Unknown Author',
                        publishDate: book.publish_date || 'Unknown',
                        publisher: book.publishers ? book.publishers[0].name : 'Unknown Publisher',
                        cover: book.cover ? book.cover.medium : null
                    };

                    // Assign a random color to the book spine
                    const colorIndex = books.length % colors.length;
                    const bookColor = colors[colorIndex];

                    // Add to books array
                    books.push({
                        ...bookData,
                        id: `book-${Date.now()}-${isbn}`,
                        color: bookColor
                    });

                    // Small delay to ensure unique IDs
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                console.error(`Error fetching book data for ISBN ${isbn}:`, error);
            }
        }

        // Save and render the fetched books
        saveBooks();
    }

    renderBooks();
}
