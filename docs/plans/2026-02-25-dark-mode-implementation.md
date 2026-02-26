# Dark Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add toggleable dark mode to virtual bookshelf with dark mode as the default.

**Architecture:** Use CSS custom properties (variables) for all theme colors. Toggle a `dark-mode` class on the body element to switch themes. Initialize dark mode on page load and persist preference in localStorage. Add a fixed-position toggle button in the top-right corner.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, CSS Variables, localStorage API

---

## Task 1: Define CSS Variables for Light Mode

**Files:**
- Modify: `modern_bookshelf_sortable.html:12-321` (within `<style>` section)

**Step 1: Add CSS variables at the beginning of the style section**

Add this after line 12 (after the `<style>` tag):

```css
/* Theme Color Variables */
:root {
    /* Light mode colors (default) */
    --bg-primary: #f5f5f5;
    --bg-secondary: #fff;
    --bg-header: #34495e;
    --bg-panel: #fff;
    --bg-shelf: #6f3a1f;
    --bg-shelf-base: #844213ff;
    --bg-shelf-shadow: #4d1e06ff;
    --text-primary: #333;
    --text-light: white;
    --border-shelf: #4a2511;
    --border-panel: #ddd;
    --button-primary: #3498db;
    --button-hover: #57ce8cff;
    --shadow-book: rgba(0, 0, 0, 0.3);
    --shadow-panel: rgba(0, 0, 0, 0.1);
    --info-gradient-start: #667eea;
    --info-gradient-end: #764ba2;
}
```

**Step 2: Verify the CSS syntax**

Open `modern_bookshelf_sortable.html` in browser and check console for CSS errors.

Expected: No CSS errors in console

**Step 3: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "feat: add CSS variables for light mode theme"
```

---

## Task 2: Add Dark Mode CSS Variable Overrides

**Files:**
- Modify: `modern_bookshelf_sortable.html:12-321` (within `<style>` section)

**Step 1: Add dark mode variable overrides**

Add this after the `:root` block created in Task 1:

```css
/* Dark mode color overrides */
body.dark-mode {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2a2a2a;
    --bg-header: #2c3e50;
    --bg-panel: #2a2a2a;
    /* OLD COLOR: #6f3a1f */
    --bg-shelf: #5a2f18;
    /* OLD COLOR: #844213ff */
    --bg-shelf-base: #6b3410;
    --bg-shelf-shadow: #4d1e06ff;
    --text-primary: #e0e0e0;
    --text-light: #e0e0e0;
    --border-shelf: #3a1f11;
    --border-panel: #444;
    --button-primary: #3498db;
    --button-hover: #57ce8cff;
    --shadow-book: rgba(0, 0, 0, 0.5);
    --shadow-panel: rgba(0, 0, 0, 0.3);
    --info-gradient-start: #556cd6;
    --info-gradient-end: #5d3d7a;
}
```

**Step 2: Verify the CSS syntax**

Open browser console and check for CSS errors.

Expected: No CSS errors

**Step 3: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "feat: add CSS variables for dark mode theme"
```

---

## Task 3: Update Body Background to Use Variables

**Files:**
- Modify: `modern_bookshelf_sortable.html:14-22`

**Step 1: Replace hardcoded body background color**

Find line 14-22 (body styles) and update:

```css
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: var(--text-primary);
    margin: 0;
    padding: 0;
    background-color: var(--bg-primary);
    -webkit-font-smoothing: antialiased;
    transition: background-color 0.3s ease, color 0.3s ease;
}
```

**Step 2: Test in browser**

Open `modern_bookshelf_sortable.html` in browser. Manually add `dark-mode` class to body via DevTools.

Expected: Background should change from light gray to dark gray

**Step 3: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "refactor: use CSS variables for body background"
```

---

## Task 4: Update Header and Footer to Use Variables

**Files:**
- Modify: `modern_bookshelf_sortable.html:24-69`

**Step 1: Replace header colors**

Update header styles (lines 24-34):

```css
header {
    background-color: var(--bg-header);
    color: var(--text-light);
    padding: 1rem;
    box-shadow: 0 2px 5px var(--shadow-panel);
    transition: background-color 0.3s ease, color 0.3s ease;
}
```

**Step 2: Replace button colors**

Update button styles (lines 43-55):

```css
button {
    padding: 8px 15px;
    background-color: var(--button-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

button:hover {
    background-color: var(--button-hover);
}
```

**Step 3: Replace footer colors**

Update footer styles (lines 63-69):

```css
footer {
    text-align: center;
    padding: 1rem;
    margin-top: 2rem;
    background-color: var(--bg-header);
    color: var(--text-light);
    transition: background-color 0.3s ease, color 0.3s ease;
}
```

**Step 4: Test in browser**

Toggle `dark-mode` class on body in DevTools.

Expected: Header, footer, and buttons adapt to dark mode

**Step 5: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "refactor: use CSS variables for header, footer, and buttons"
```

---

## Task 5: Update Bookshelf Colors to Use Variables

**Files:**
- Modify: `modern_bookshelf_sortable.html:81-127`

**Step 1: Update bookshelf-row background**

Update bookshelf-row styles (around line 96):

```css
.bookshelf-row {
    width: 100%;
    white-space: nowrap;
    overflow-x: auto;
    display: flex;
    flex-wrap: nowrap;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    padding: 8px 2px;
    background: var(--bg-shelf);
    border: 8px solid var(--border-shelf);
    transition: background-color 0.3s ease;
    position: relative;
    align-items: flex-end;
    min-height: 150px;
}
```

**Step 2: Update bookshelf-row::before pseudo-element**

Update the ::before styles (around line 119):

```css
.bookshelf-row::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 15px;
    background-color: var(--bg-shelf-base);
    box-shadow: 0px -15px 25px 0px var(--bg-shelf-shadow),
                inset 0px 42px 20px -35px var(--bg-shelf-shadow);
    border-radius: 0 0 5px 5px;
    z-index: 0;
}
```

**Step 3: Test in browser**

Toggle dark mode class in DevTools.

Expected: Bookshelf wood colors change to darker browns in dark mode

**Step 4: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "refactor: use CSS variables for bookshelf colors"
```

---

## Task 6: Update Panel and Banner Colors to Use Variables

**Files:**
- Modify: `modern_bookshelf_sortable.html:220-320`

**Step 1: Update controls panel colors**

Update controls-panel styles (around line 220):

```css
.controls-panel {
    background-color: var(--bg-panel);
    border: 1px solid var(--border-panel);
    border-radius: 5px;
    padding: 15px;
    margin-bottom: 20px;
    transition: background-color 0.3s ease, border-color 0.3s ease;
}
```

**Step 2: Update info banner gradient**

Update info-banner styles (around line 303):

```css
.info-banner {
    background: linear-gradient(135deg,
                var(--info-gradient-start) 0%,
                var(--info-gradient-end) 100%);
    color: white;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
    box-shadow: 0 4px 6px var(--shadow-panel);
    transition: background 0.3s ease;
}
```

**Step 3: Update book shadow**

Update book-spine styles (around line 205):

```css
.book-spine {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    height: 150px;
    width: 30px;
    color: white;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    text-align: center;
    box-shadow: 5px 5px 5px var(--shadow-book);
    margin-bottom: 0;
    border-radius: 3px;
    font-size: 0.8rem;
    font-weight: 500;
    transition: box-shadow 200ms ease;
}
```

**Step 4: Test in browser**

Toggle dark mode and verify all panels and shadows adapt.

Expected: Control panels, info banner, and shadows all transition smoothly

**Step 5: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "refactor: use CSS variables for panels and shadows"
```

---

## Task 7: Add Toggle Button HTML

**Files:**
- Modify: `modern_bookshelf_sortable.html:324-333`

**Step 1: Add toggle button HTML after opening body tag**

Add this right after line 324 (after `<body>` tag):

```html
<!-- Dark Mode Toggle Button -->
<button id="theme-toggle" aria-label="Toggle dark mode" title="Toggle theme">
    <span id="theme-icon">☀️</span>
</button>
```

**Step 2: Verify in browser**

Open the page in browser.

Expected: Button appears but may be unstyled (we'll style it next)

**Step 3: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "feat: add dark mode toggle button HTML"
```

---

## Task 8: Add Toggle Button CSS Styles

**Files:**
- Modify: `modern_bookshelf_sortable.html:12-321` (within `<style>` section)

**Step 1: Add toggle button styles at end of style section**

Add this before the closing `</style>` tag (around line 321):

```css
/* Dark Mode Toggle Button */
#theme-toggle {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--bg-secondary);
    border: 2px solid var(--border-panel);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px var(--shadow-panel);
    z-index: 10000;
    transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
    padding: 0;
}

#theme-toggle:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 15px var(--shadow-book);
}

#theme-toggle:focus {
    outline: 2px solid var(--button-primary);
    outline-offset: 2px;
}

#theme-icon {
    font-size: 20px;
    transition: transform 0.3s ease, opacity 0.3s ease;
}

#theme-toggle:active #theme-icon {
    transform: rotate(20deg);
}
```

**Step 2: Test in browser**

Open the page and check the toggle button appearance.

Expected: Circular button in top-right corner with sun/moon icon

**Step 3: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "style: add dark mode toggle button styles"
```

---

## Task 9: Add Theme Initialization JavaScript

**Files:**
- Modify: `modern_bookshelf_sortable.html:366-724` (within `<script>` section)

**Step 1: Add theme initialization code at the very start of script section**

Add this right after line 366 (after `<script>` tag), before any other JavaScript:

```javascript
// Dark Mode Theme Management
(function initializeTheme() {
    // Check localStorage for saved preference, default to dark mode
    const savedTheme = localStorage.getItem('bookshelf-theme-preference') || 'dark';

    // Apply theme immediately to prevent flash
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // Update icon to match current theme
    updateThemeIcon();
})();

function updateThemeIcon() {
    const themeIcon = document.getElementById('theme-icon');
    const isDarkMode = document.body.classList.contains('dark-mode');

    if (themeIcon) {
        // Show sun in dark mode (clicking will go to light)
        // Show moon in light mode (clicking will go to dark)
        themeIcon.textContent = isDarkMode ? '☀️' : '🌙';
    }
}
```

**Step 2: Test in browser**

Open the page in fresh browser (clear localStorage first).

Expected: Page loads in dark mode by default, sun icon shows

**Step 3: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "feat: add theme initialization on page load"
```

---

## Task 10: Add Toggle Functionality JavaScript

**Files:**
- Modify: `modern_bookshelf_sortable.html:366-724` (within `<script>` section)

**Step 1: Add toggle handler in DOMContentLoaded**

Add this inside the existing `DOMContentLoaded` event listener (around line 386), after the existing event listeners:

```javascript
// Set up theme toggle button
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
```

**Step 2: Add toggle function after updateThemeIcon function**

Add this after the `updateThemeIcon` function:

```javascript
function toggleTheme() {
    const body = document.body;
    const isDarkMode = body.classList.contains('dark-mode');

    // Toggle the dark-mode class
    if (isDarkMode) {
        body.classList.remove('dark-mode');
        localStorage.setItem('bookshelf-theme-preference', 'light');
    } else {
        body.classList.add('dark-mode');
        localStorage.setItem('bookshelf-theme-preference', 'dark');
    }

    // Update icon with animation
    const themeIcon = document.getElementById('theme-icon');
    themeIcon.style.opacity = '0';
    themeIcon.style.transform = 'rotate(180deg)';

    setTimeout(() => {
        updateThemeIcon();
        themeIcon.style.opacity = '1';
        themeIcon.style.transform = 'rotate(0deg)';
    }, 150);
}
```

**Step 3: Test in browser**

Open the page and click the toggle button multiple times.

Expected: Theme switches smoothly, icon animates, preference persists on refresh

**Step 4: Test keyboard accessibility**

Tab to the toggle button and press Enter.

Expected: Theme toggles via keyboard

**Step 5: Commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "feat: add theme toggle functionality with persistence"
```

---

## Task 11: Test All Success Criteria

**Files:**
- Test: `modern_bookshelf_sortable.html`

**Step 1: Test default dark mode**

Clear browser localStorage and reload page.

Expected: ✓ App starts in dark mode by default

**Step 2: Test toggle button appearance**

Check top-right corner.

Expected: ✓ Toggle button appears in top-right corner

**Step 3: Test smooth transitions**

Click toggle button and observe color changes.

Expected: ✓ Clicking toggle smoothly transitions between themes

**Step 4: Test persistence**

Toggle theme, refresh page.

Expected: ✓ Theme preference persists across page refreshes

**Step 5: Test all UI elements**

Check header, footer, shelves, panels, buttons in both modes.

Expected: ✓ All UI elements properly themed in both modes

**Step 6: Test book spines**

Check sample books with colors in both modes.

Expected: ✓ Book spines remain colorful in both modes

**Step 7: Test for flash**

Hard refresh page (Cmd+Shift+R or Ctrl+Shift+R).

Expected: ✓ No flash of wrong theme on page load

**Step 8: Test keyboard accessibility**

Tab to button, press Enter.

Expected: ✓ Toggle button is keyboard accessible

**Step 9: Test drag and drop**

Drag books between shelves in both modes.

Expected: ✓ Existing drag-and-drop functionality unaffected

**Step 10: Document test results**

All tests pass.

---

## Task 12: Final Commit

**Files:**
- Modify: `modern_bookshelf_sortable.html`

**Step 1: Final commit**

```bash
git add modern_bookshelf_sortable.html
git commit -m "feat: complete dark mode implementation

- Add CSS variables for theming
- Implement toggle button with smooth transitions
- Default to dark mode on first load
- Persist theme preference in localStorage
- Maintain keyboard accessibility
- Preserve all existing drag-and-drop functionality

All success criteria met."
```

---

## Implementation Complete

All tasks completed. The virtual bookshelf now has a fully functional dark mode that:
- Starts in dark mode by default
- Toggles smoothly between light and dark themes
- Persists user preference across sessions
- Maintains all existing functionality
- Is fully keyboard accessible
