# Physical Bookshelf Sizing and Temporary Holding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add physical scale sizing and temporary holding area to virtual bookshelf

**Architecture:** Extend existing modern_bookshelf_sortable.html with flexbox layout (70% bookshelf, 30% side panel), add DPI configuration, calculate physical dimensions from image pixels, customize shelf heights, enable drag-drop to temporary holding area

**Tech Stack:** HTML5, CSS3 (Flexbox), Vanilla JavaScript, SortableJS 1.15.0, localStorage

---

## Task 1: Create Layout Structure - Side Panel HTML

**Files:**
- Modify: `modern_bookshelf_sortable.html:104-123` (main section)

**Step 1: Add flexbox container and side panel HTML**

Add after line 416 (before `<main>` close tag):

```html
<!-- Right Side Panel -->
<aside id="side-panel" class="side-panel">
    <!-- Settings Section -->
    <div class="settings-section">
        <div class="settings-header" id="settings-header">
            <span>⚙️ Settings</span>
            <span class="toggle-arrow">▼</span>
        </div>
        <div class="settings-content" id="settings-content">
            <div class="setting-group">
                <label for="dpi-input">Screen DPI:</label>
                <input type="number" id="dpi-input" value="96" min="50" max="300">
                <button id="calibrate-btn" class="small-btn">Calibrate</button>
            </div>
            <div class="setting-group">
                <label for="default-shelf-height">Default Shelf Height (inches):</label>
                <input type="number" id="default-shelf-height" value="12" min="6" max="24" step="0.5">
            </div>
            <button id="reset-settings-btn" class="small-btn">Reset to Defaults</button>
        </div>
    </div>

    <!-- Temporary Holding Area -->
    <div class="temporary-holding-section">
        <div class="holding-header">
            <span>📚 Temporary Holding</span>
            <span id="holding-count" class="count-badge">0 books</span>
        </div>
        <div class="holding-area" id="temporary-holding"></div>
    </div>
</aside>
```

**Step 2: Wrap main bookshelf in flexbox container**

Replace line 417 `<main>` opening with:

```html
<main class="app-container">
    <div class="bookshelf-main-area">
```

And before `</main>` closing (line 442), add:

```html
    </div> <!-- .bookshelf-main-area -->
```

**Step 3: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "feat: add side panel HTML structure for settings and temporary holding"
```

---

## Task 2: Add Layout CSS - Flexbox and Side Panel Styling

**Files:**
- Modify: `modern_bookshelf_sortable.html:104-123` (add after line 123 in `<style>`)

**Step 1: Add flexbox layout CSS**

Add after line 123 (after `.bookshelf-container`):

```css
/* Flexbox layout for main app */
.app-container {
    display: flex;
    gap: 20px;
    align-items: flex-start;
}

.bookshelf-main-area {
    flex: 1;
    min-width: 0;
}

.side-panel {
    width: 350px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* Settings Section */
.settings-section {
    background-color: var(--bg-panel);
    border: 1px solid var(--border-panel);
    border-radius: 8px;
    overflow: hidden;
    transition: background-color 0.3s ease, border-color 0.3s ease;
}

.settings-header {
    padding: 12px 15px;
    background-color: var(--bg-header);
    color: var(--text-light);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
}

.settings-header:hover {
    opacity: 0.9;
}

.toggle-arrow {
    transition: transform 0.3s ease;
}

.settings-header.collapsed .toggle-arrow {
    transform: rotate(-90deg);
}

.settings-content {
    padding: 15px;
    max-height: 500px;
    overflow: hidden;
    transition: max-height 0.3s ease, padding 0.3s ease;
}

.settings-content.collapsed {
    max-height: 0;
    padding: 0 15px;
}

.setting-group {
    margin-bottom: 15px;
}

.setting-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    font-size: 0.9rem;
}

.setting-group input[type="number"] {
    width: 80px;
    padding: 6px 8px;
    border: 1px solid var(--border-panel);
    border-radius: 4px;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    margin-right: 10px;
}

.small-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
    background-color: var(--button-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.small-btn:hover {
    background-color: var(--button-hover);
}

/* Temporary Holding Section */
.temporary-holding-section {
    background-color: var(--bg-panel);
    border: 1px solid var(--border-panel);
    border-radius: 8px;
    overflow: hidden;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 300px;
}

.holding-header {
    padding: 12px 15px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.count-badge {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.8rem;
}

.holding-area {
    padding: 15px;
    flex: 1;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 10px;
    align-content: start;
}

/* Responsive design */
@media (max-width: 1024px) {
    .app-container {
        flex-direction: column;
    }

    .side-panel {
        width: 100%;
    }
}
```

**Step 2: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "feat: add CSS for flexbox layout and side panel styling"
```

---

## Task 3: Add Bookshelf Frame Styling

**Files:**
- Modify: `modern_bookshelf_sortable.html:119-161` (bookshelf styles)

**Step 1: Add bookshelf frame container CSS**

Replace lines 119-127 with:

```css
/* Bookshelf styles */
.bookshelf-container {
    margin-top: 20px;
}

.bookshelf {
    width: 100%;
    box-sizing: border-box;
    background-color: #d4a574;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

body.dark-mode .bookshelf {
    background-color: #8b6f47;
}

.bookshelf-row {
    width: 100%;
    white-space: nowrap;
    overflow-x: auto;
    display: flex;
    flex-wrap: nowrap;
    flex-direction: row !important;
    padding: 8px 2px;
    background: var(--bg-shelf);
    border: 8px solid var(--border-shelf);
    transition: background-color 0.3s ease;
    position: relative;
    align-items: flex-end;
    min-height: 150px;
    margin-bottom: 20px;
}

.bookshelf-row:last-child {
    margin-bottom: 0;
}
```

**Step 2: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "feat: add bookshelf frame background styling"
```

---

## Task 4: Initialize Settings and DPI State

**Files:**
- Modify: `modern_bookshelf_sortable.html:518-540` (DOMContentLoaded section)

**Step 1: Add state management variables**

Add after line 516 (after `let sortableInstances = [];`):

```javascript
// Physical sizing state
let currentDPI = 96;
let defaultShelfHeight = 12;
let booksMetadata = {};
```

**Step 2: Load settings from localStorage**

Add after line 540 (in DOMContentLoaded, after theme toggle setup):

```javascript
// Load and apply settings
loadSettings();

// Set up settings event listeners
document.getElementById('settings-header').addEventListener('click', toggleSettings);
document.getElementById('dpi-input').addEventListener('change', handleDPIChange);
document.getElementById('default-shelf-height').addEventListener('change', handleDefaultHeightChange);
document.getElementById('calibrate-btn').addEventListener('click', openCalibrationModal);
document.getElementById('reset-settings-btn').addEventListener('click', resetSettings);

// Initialize temporary holding sortable
initializeTemporaryHolding();
```

**Step 3: Add loadSettings function**

Add before `saveBookshelfOrder()` function:

```javascript
/**
 * Load settings from localStorage
 */
function loadSettings() {
    const savedDPI = localStorage.getItem('bookshelf-dpi');
    const savedHeight = localStorage.getItem('bookshelf-default-shelf-height');
    const savedMetadata = localStorage.getItem('bookshelf-books-metadata');

    if (savedDPI) {
        currentDPI = parseInt(savedDPI);
        document.getElementById('dpi-input').value = currentDPI;
    }

    if (savedHeight) {
        defaultShelfHeight = parseFloat(savedHeight);
        document.getElementById('default-shelf-height').value = defaultShelfHeight;
    }

    if (savedMetadata) {
        try {
            booksMetadata = JSON.parse(savedMetadata);
        } catch (e) {
            console.error('Failed to parse books metadata:', e);
            booksMetadata = {};
        }
    }

    console.log('Settings loaded:', { currentDPI, defaultShelfHeight });
}
```

**Step 4: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "feat: initialize settings state and load from localStorage"
```

---

## Task 5: Settings Panel Collapse Toggle

**Files:**
- Modify: `modern_bookshelf_sortable.html` (add function after loadSettings)

**Step 1: Add toggleSettings function**

```javascript
/**
 * Toggle settings panel collapse/expand
 */
function toggleSettings() {
    const header = document.getElementById('settings-header');
    const content = document.getElementById('settings-content');

    header.classList.toggle('collapsed');
    content.classList.toggle('collapsed');
}
```

**Step 2: Add DPI and height change handlers**

```javascript
/**
 * Handle DPI input change
 */
function handleDPIChange(event) {
    const newDPI = parseInt(event.target.value);
    if (newDPI >= 50 && newDPI <= 300) {
        currentDPI = newDPI;
        localStorage.setItem('bookshelf-dpi', currentDPI);
        recalculateAllBookSizes();
        console.log('DPI updated to:', currentDPI);
    }
}

/**
 * Handle default shelf height change
 */
function handleDefaultHeightChange(event) {
    const newHeight = parseFloat(event.target.value);
    if (newHeight >= 6 && newHeight <= 24) {
        defaultShelfHeight = newHeight;
        localStorage.setItem('bookshelf-default-shelf-height', defaultShelfHeight);
        console.log('Default shelf height updated to:', defaultShelfHeight);
    }
}

/**
 * Recalculate all book sizes based on current DPI
 */
function recalculateAllBookSizes() {
    document.querySelectorAll('.book').forEach(book => {
        const bookId = book.id;
        const metadata = booksMetadata[bookId];

        if (metadata && metadata.physicalWidth && metadata.physicalHeight) {
            const displayWidth = metadata.physicalWidth * currentDPI;
            const displayHeight = metadata.physicalHeight * currentDPI;

            const spine = book.querySelector('.book-spine');
            if (spine) {
                spine.style.width = `${displayWidth}px`;
                spine.style.height = `${displayHeight}px`;
            }
        }
    });
}

/**
 * Reset settings to defaults
 */
function resetSettings() {
    if (confirm('Reset all settings to defaults?')) {
        currentDPI = 96;
        defaultShelfHeight = 12;
        document.getElementById('dpi-input').value = currentDPI;
        document.getElementById('default-shelf-height').value = defaultShelfHeight;
        localStorage.setItem('bookshelf-dpi', currentDPI);
        localStorage.setItem('bookshelf-default-shelf-height', defaultShelfHeight);
        recalculateAllBookSizes();
    }
}
```

**Step 3: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "feat: add settings panel toggle and DPI/height handlers"
```

---

## Task 6: Calculate Physical Dimensions for Uploaded Images

**Files:**
- Modify: `modern_bookshelf_sortable.html:768-781` (processSpineImage function)

**Step 1: Update processSpineImage to calculate physical dimensions**

Replace lines 768-781 with:

```javascript
/**
 * Process a spine image file
 */
function processSpineImage(file) {
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = function () {
        const pixelWidth = img.width;
        const pixelHeight = img.height;

        // Calculate physical dimensions in inches
        const physicalWidth = pixelWidth / currentDPI;
        const physicalHeight = pixelHeight / currentDPI;

        // Calculate display dimensions at current DPI
        const displayWidth = physicalWidth * currentDPI;
        const displayHeight = physicalHeight * currentDPI;

        createBookWithSpineImage({
            fileName: file.name,
            url: imageUrl,
            pixelWidth,
            pixelHeight,
            physicalWidth,
            physicalHeight,
            displayWidth,
            displayHeight,
            hasManualOverride: false
        });
    };
    img.src = imageUrl;
}
```

**Step 2: Update createBookWithSpineImage to store metadata**

Replace lines 786-823 with:

```javascript
/**
 * Create a book with a spine image
 */
function createBookWithSpineImage(spineData) {
    const shelf = document.querySelector('.bookshelf-row');
    if (!shelf) return;

    const bookId = `book-${bookCounter++}-${spineData.fileName.replace(/[^a-z0-9]/gi, '-')}`;

    // Store metadata
    booksMetadata[bookId] = {
        fileName: spineData.fileName,
        imageUrl: spineData.url,
        pixelWidth: spineData.pixelWidth,
        pixelHeight: spineData.pixelHeight,
        physicalWidth: spineData.physicalWidth,
        physicalHeight: spineData.physicalHeight,
        hasManualOverride: spineData.hasManualOverride || false
    };

    saveMetadata();

    const book = document.createElement('div');
    book.className = 'book';
    book.id = bookId;
    book.setAttribute('data-physical-height', spineData.physicalHeight.toFixed(2));

    const spine = document.createElement('div');
    spine.className = 'book-spine';
    spine.style.width = `${spineData.displayWidth}px`;
    spine.style.height = `${spineData.displayHeight}px`;

    const spineImg = document.createElement('img');
    spineImg.src = spineData.url;
    spineImg.alt = `Book spine for ${spineData.fileName}`;
    spineImg.className = 'spine-image';

    spine.appendChild(spineImg);
    book.appendChild(spine);
    shelf.appendChild(book);

    // Add entrance animation
    book.style.transform = 'scale(0.8) translateY(-20px)';
    book.style.opacity = '0';
    setTimeout(() => {
        book.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease';
        book.style.transform = 'scale(1) translateY(0)';
        book.style.opacity = '1';
        setTimeout(() => {
            book.style.transition = '';
        }, 400);
    }, 10);

    saveBookshelfOrder();
}

/**
 * Save books metadata to localStorage
 */
function saveMetadata() {
    localStorage.setItem('bookshelf-books-metadata', JSON.stringify(booksMetadata));
}
```

**Step 3: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "feat: calculate and store physical dimensions for uploaded book spines"
```

---

## Task 7: Initialize Temporary Holding Sortable

**Files:**
- Modify: `modern_bookshelf_sortable.html` (add after resetSettings function)

**Step 1: Add initializeTemporaryHolding function**

```javascript
/**
 * Initialize SortableJS on temporary holding area
 */
function initializeTemporaryHolding() {
    const holdingArea = document.getElementById('temporary-holding');

    const sortable = Sortable.create(holdingArea, {
        group: 'books', // Same group as shelves for cross-dragging
        animation: 250,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        forceFallback: false,
        fallbackOnBody: true,

        onAdd: function(evt) {
            updateHoldingCount();
        },

        onRemove: function(evt) {
            updateHoldingCount();
        },

        onEnd: function(evt) {
            saveBookshelfOrder();
        }
    });

    sortableInstances.push(sortable);
    console.log('Temporary holding initialized');
}

/**
 * Update temporary holding count badge
 */
function updateHoldingCount() {
    const holdingArea = document.getElementById('temporary-holding');
    const count = holdingArea.querySelectorAll('.book').length;
    const badge = document.getElementById('holding-count');

    badge.textContent = count === 1 ? '1 book' : `${count} books`;
}
```

**Step 2: Add CSS for books in temporary holding**

Add to CSS section (after `.holding-area` styles):

```css
/* Books in temporary holding - smaller display */
.holding-area .book {
    margin: 0;
}

.holding-area .book-spine {
    width: 60px !important;
    height: 80px !important;
    font-size: 0.6rem;
}

.holding-area .spine-image {
    width: 100%;
    height: 100%;
}
```

**Step 3: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "feat: initialize temporary holding area with sortable drag-drop"
```

---

## Task 8: Add Calibration Modal

**Files:**
- Modify: `modern_bookshelf_sortable.html` (add HTML before `</body>`, add CSS, add JS)

**Step 1: Add calibration modal HTML**

Add before `</body>` tag:

```html
<!-- Calibration Modal -->
<div id="calibration-modal" class="modal" style="display: none;">
    <div class="modal-content">
        <h2>Screen DPI Calibration</h2>
        <p>Hold a real ruler against your screen. Adjust the slider until the on-screen ruler matches your physical ruler.</p>

        <div class="ruler-container">
            <div id="calibration-ruler" class="calibration-ruler">
                <div class="ruler-marks"></div>
            </div>
        </div>

        <div class="calibration-controls">
            <label for="calibration-slider">DPI: <span id="calibration-dpi-value">96</span></label>
            <input type="range" id="calibration-slider" min="50" max="300" value="96" step="1">
        </div>

        <div class="modal-actions">
            <button id="calibration-save-btn" class="button-primary">Save</button>
            <button id="calibration-cancel-btn" class="button-secondary">Cancel</button>
        </div>
    </div>
</div>
```

**Step 2: Add modal CSS**

Add to CSS section:

```css
/* Calibration Modal */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
}

.modal-content {
    background-color: var(--bg-panel);
    padding: 30px;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.modal-content h2 {
    margin-top: 0;
    color: var(--text-primary);
}

.ruler-container {
    margin: 30px 0;
    overflow-x: auto;
    padding: 20px 0;
}

.calibration-ruler {
    height: 60px;
    background: linear-gradient(to right, #f0f0f0 0%, #ffffff 100%);
    border: 2px solid #333;
    position: relative;
    width: 1152px;
}

body.dark-mode .calibration-ruler {
    background: linear-gradient(to right, #3a3a3a 0%, #4a4a4a 100%);
    border-color: #666;
}

.calibration-controls {
    margin: 20px 0;
}

.calibration-controls label {
    display: block;
    margin-bottom: 10px;
    font-weight: bold;
}

.calibration-controls input[type="range"] {
    width: 100%;
}

.modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
}

.button-primary, .button-secondary {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
}

.button-primary {
    background-color: var(--button-primary);
    color: white;
}

.button-primary:hover {
    background-color: var(--button-hover);
}

.button-secondary {
    background-color: #95a5a6;
    color: white;
}

.button-secondary:hover {
    background-color: #7f8c8d;
}
```

**Step 3: Add calibration JavaScript functions**

```javascript
/**
 * Open calibration modal
 */
function openCalibrationModal() {
    const modal = document.getElementById('calibration-modal');
    const slider = document.getElementById('calibration-slider');
    const dpiValue = document.getElementById('calibration-dpi-value');
    const ruler = document.getElementById('calibration-ruler');

    slider.value = currentDPI;
    dpiValue.textContent = currentDPI;
    updateRulerWidth(currentDPI);

    modal.style.display = 'flex';

    // Set up event listeners
    slider.oninput = function() {
        const dpi = parseInt(this.value);
        dpiValue.textContent = dpi;
        updateRulerWidth(dpi);
    };

    document.getElementById('calibration-save-btn').onclick = saveCalibration;
    document.getElementById('calibration-cancel-btn').onclick = closeCalibrationModal;
}

/**
 * Update ruler width based on DPI
 */
function updateRulerWidth(dpi) {
    const ruler = document.getElementById('calibration-ruler');
    const widthInPixels = 12 * dpi; // 12 inches
    ruler.style.width = `${widthInPixels}px`;
}

/**
 * Save calibration
 */
function saveCalibration() {
    const slider = document.getElementById('calibration-slider');
    const newDPI = parseInt(slider.value);

    currentDPI = newDPI;
    document.getElementById('dpi-input').value = currentDPI;
    localStorage.setItem('bookshelf-dpi', currentDPI);
    recalculateAllBookSizes();

    closeCalibrationModal();
}

/**
 * Close calibration modal
 */
function closeCalibrationModal() {
    document.getElementById('calibration-modal').style.display = 'none';
}
```

**Step 4: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "feat: add DPI calibration modal with visual ruler"
```

---

## Task 9: Add Per-Shelf Height Controls

**Files:**
- Modify: `modern_bookshelf_sortable.html` (update shelf creation and add controls)

**Step 1: Update addNewShelf function to include height control**

Find the `addNewShelf()` function and update it to add height controls. Add after creating `newShelf`:

```javascript
// Add shelf height control
const shelfLabel = document.createElement('div');
shelfLabel.className = 'shelf-label';
shelfLabel.innerHTML = `
    <span class="shelf-name">Shelf ${shelfCount + 1}</span>
    <span class="shelf-height-display">${defaultShelfHeight}"</span>
    <button class="edit-shelf-height-btn" data-shelf-id="shelf-${shelfCount + 1}">✏️</button>
`;
newShelf.appendChild(shelfLabel);
```

**Step 2: Add CSS for shelf labels**

```css
/* Shelf height controls */
.shelf-label {
    position: absolute;
    top: 5px;
    left: 10px;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    display: flex;
    gap: 8px;
    align-items: center;
    z-index: 10;
}

.shelf-height-display {
    font-weight: bold;
    color: #3498db;
}

.edit-shelf-height-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0;
    opacity: 0.7;
    transition: opacity 0.2s;
}

.edit-shelf-height-btn:hover {
    opacity: 1;
}
```

**Step 3: Add shelf height editing**

```javascript
/**
 * Set up shelf height editing
 */
function setupShelfHeightEditing() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-shelf-height-btn')) {
            const shelfId = e.target.dataset.shelfId;
            editShelfHeight(shelfId);
        }
    });
}

/**
 * Edit shelf height
 */
function editShelfHeight(shelfId) {
    const shelf = document.getElementById(shelfId);
    if (!shelf) return;

    const currentHeightDisplay = shelf.querySelector('.shelf-height-display');
    const currentHeight = parseFloat(currentHeightDisplay.textContent) || defaultShelfHeight;

    const newHeight = prompt(`Enter shelf height in inches (current: ${currentHeight}"):`, currentHeight);

    if (newHeight !== null) {
        const height = parseFloat(newHeight);
        if (height >= 6 && height <= 24) {
            updateShelfHeight(shelfId, height);
        } else {
            alert('Shelf height must be between 6 and 24 inches.');
        }
    }
}

/**
 * Update shelf height
 */
function updateShelfHeight(shelfId, heightInches) {
    const shelf = document.getElementById(shelfId);
    if (!shelf) return;

    const heightPixels = heightInches * currentDPI;
    shelf.style.minHeight = `${heightPixels}px`;

    const heightDisplay = shelf.querySelector('.shelf-height-display');
    if (heightDisplay) {
        heightDisplay.textContent = `${heightInches}"`;
    }

    // Check for oversized books
    checkOversizedBooks(shelf, heightInches);
}

/**
 * Check for books that are too tall for shelf
 */
function checkOversizedBooks(shelf, shelfHeightInches) {
    shelf.querySelectorAll('.book').forEach(book => {
        const bookHeight = parseFloat(book.dataset.physicalHeight) || 0;

        if (bookHeight > shelfHeightInches) {
            book.classList.add('oversized-book');
            book.title = `Warning: This book is ${bookHeight.toFixed(1)}" tall but shelf is ${shelfHeightInches}"`;
        } else {
            book.classList.remove('oversized-book');
            book.title = '';
        }
    });
}
```

**Step 4: Add CSS for oversized book warning**

```css
/* Oversized book warning */
.book.oversized-book .book-spine {
    outline: 2px solid #e74c3c;
    outline-offset: 2px;
}
```

**Step 5: Call setupShelfHeightEditing in DOMContentLoaded**

Add to DOMContentLoaded:

```javascript
setupShelfHeightEditing();
```

**Step 6: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "feat: add per-shelf height customization with oversized book warnings"
```

---

## Completion

**Plan complete!** Implementation is ready to execute.

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
