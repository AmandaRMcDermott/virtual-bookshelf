# Physical Bookshelf Sizing and Temporary Holding Design

**Date:** 2026-02-26
**Status:** Approved
**Approach:** Extend Existing System (Approach 1)

## Overview

This design adds two major features to the virtual bookshelf:
1. **Physical scale sizing** - Display books at their actual physical dimensions to help plan real-life bookshelves
2. **Temporary holding area** - A side panel where books can be temporarily removed from shelves for later reorganization

## Goals

- Enable users to accurately plan real bookshelf layouts by displaying books at true-to-life scale
- Allow customization of individual shelf heights to match physical bookshelf configurations
- Provide a temporary storage area for books being considered for removal or reorganization
- Maintain all existing drag-and-drop functionality and features

## Architecture

### Layout Structure

The page uses a flexbox layout with two main areas:
- **Main Bookshelf Area (Left, ~70%)**: Contains the existing bookshelf with multiple shelves
- **Side Panel (Right, ~30%)**: Fixed-width panel (300-400px) containing settings and temporary holding

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Header (existing)                                        │
├──────────────────────────────────┬──────────────────────┤
│                                  │ ⚙️ Settings          │
│  Bookshelf Area                  │ ┌──────────────────┐ │
│  ┌─────────────────────────┐    │ │ DPI: [96]        │ │
│  │ Shelf 1 (12")           │    │ │ Default Height:  │ │
│  │ [book][book][book]      │    │ │ [12] inches      │ │
│  └─────────────────────────┘    │ └──────────────────┘ │
│  ┌─────────────────────────┐    │                      │
│  │ Shelf 2 (10")           │    │ 📚 Temporary Holding │
│  │ [book][book]            │    │ ┌──────────────────┐ │
│  └─────────────────────────┘    │ │ [book]           │ │
│                                  │ │ [book]           │ │
│                                  │ └──────────────────┘ │
└──────────────────────────────────┴──────────────────────┘
```

**Bookshelf Visual Design:**
- Bookshelf has a containing frame with background (wood texture or solid color) representing the back panel
- Vertical spacing between shelves shows the bookshelf back panel (not whitespace)
- Optional vertical side panels to complete the bookcase appearance
- Gap between shelves styled to match bookshelf interior (lighter brown/tan/wood texture)

**Responsive Behavior:**
- Screens < 1024px: side panel moves below bookshelf (vertical stack)
- Screens < 768px: temporary holding becomes collapsible
- Books maintain physical scale proportions but may require horizontal scrolling

## Physical Sizing System

### DPI Configuration

**Settings Panel:**
- DPI input field (default: 96)
- Helper text: "Enter your screen's DPI for accurate physical sizing. Standard displays: 96, MacBook Retina: 109-110"
- "Calibrate" button opens calibration tool
- DPI value stored in localStorage

**Calibration Tool:**
- Modal overlay with horizontal ruler graphic (12 inches)
- Instructions: "Hold a real ruler against your screen. Adjust the slider until the on-screen ruler matches your physical ruler."
- Slider adjusts DPI in real-time, ruler resizes accordingly
- "Done" button saves calibrated DPI

### Dimension Calculation

**On Image Load:**
1. Read image pixel dimensions (width × height)
2. Calculate physical dimensions: `physicalInches = pixels ÷ DPI`
3. Store in book metadata with override flag
4. Render at calculated physical size

**Display Formula:**
```javascript
// To display at physical scale:
displayPixels = physicalInches × userDPI

// Example: Book is 5.47" wide, user DPI is 96
// displayPixels = 5.47 × 96 = 525px
```

**Manual Override:**
- Right-click on book or click edit icon opens dimension editor
- Modal shows current dimensions (calculated) and manual entry fields
- If manually edited, sets `hasManualOverride: true`
- Manual dimensions take precedence over calculated values

### Data Storage

**Book Metadata Structure:**
```javascript
{
  bookId: {
    fileName: "HarryPotter7.jpeg",
    imageUrl: "blob:...",
    pixelWidth: 525,
    pixelHeight: 2226,
    physicalWidth: 5.47,  // inches
    physicalHeight: 23.19, // inches
    hasManualOverride: false
  }
}
```

All metadata stored in localStorage and persists across sessions.

## Shelf Height Customization

### Global Default Height

**Settings Panel:**
- "Default Shelf Height" input field (default: 12 inches)
- New shelves use this default
- Changing default does NOT affect existing shelves

### Per-Shelf Height Override

**UI Elements:**
- Each shelf displays current height in badge/label (e.g., "Shelf 1 - 12″")
- Click shelf label to edit height
- Input appears inline or as popover
- Visual height adjusts immediately

**Visual Representation:**
- Shelf DOM height = `(shelfHeightInInches × userDPI)` pixels
- Books align to bottom of shelf
- Books taller than shelf show warning indicator (orange/red outline)
- Tooltip: "This book is 15″ tall but shelf is only 12″. Adjust shelf height or move to a taller shelf."

**Shelf Data Structure:**
```javascript
{
  shelfId: "shelf-1",
  heightInches: 12,
  books: ["book-1", "book-2", "book-3"]
}
```

## Temporary Holding Area

### Location & Layout

**Positioning:**
- Fixed panel on right side (300-400px wide)
- Below Settings section
- Scrollable if content overflows
- Always visible (not collapsible)

**Visual Design:**
- Header: "📚 Temporary Holding" or "Books to Sort"
- Distinct background color to differentiate from shelves
- Shows book count: "3 books temporarily removed"
- Books display in vertical stack or grid

### Drag & Drop Integration

**Functionality:**
- Part of same SortableJS group as shelves
- Books drag FROM shelves TO temporary holding
- Books drag FROM temporary holding BACK TO any shelf
- Books can be reordered within temporary area
- Same visual feedback as current shelf highlighting

**Book Display:**
- Smaller uniform thumbnails (60-80px height) OR physical scale with scrolling
- Show title/filename on hover or below
- Delete button (trash icon) for permanent removal

### Data Structure

Temporary holding is a special shelf:
```javascript
{
  shelfId: "temporary-holding",
  books: [...]
}
```

Persists in localStorage like regular shelves.

## Settings Panel UI

### Panel Design

**Layout:**
- Collapsible accordion-style
- Header: "⚙️ Settings"
- Starts collapsed by default
- Smooth expand/collapse animation
- Fixed at top of side panel when scrolling

**Settings Content:**
```
⚙️ Settings [▼]
─────────────────────────────
Display Settings:
  Screen DPI: [96] [Calibrate]

Shelf Settings:
  Default Shelf Height: [12] inches

[Reset to Defaults]
```

## Error Handling & Edge Cases

### Oversized Books
- Books taller than shelf height show warning (orange/red outline)
- Tooltip explains the issue
- Book displays but is visually flagged

### Sample vs Real Books
- Sample colored books default to 1″ × 8″
- Sample books can be edited for custom dimensions
- Visual distinction: samples show solid color, uploads show image

### Missing/Invalid Images
- Failed loads show placeholder with book icon
- Unreadable dimensions default to 1″ × 8″, flagged for manual entry
- Error messages in console for debugging

### Data Migration
- Existing books get default dimensions on first load
- Calculate dimensions for all existing books
- Set `hasManualOverride: false` for migrated books

### Performance
- Limit maximum books per shelf (100)
- Lazy-load book images if many exist
- Debounce dimension calculations on DPI changes

### Dark Mode Compatibility
- All new UI respects existing dark mode theme
- Bookshelf back panel colors adjust for dark mode
- Settings panel text readable in both modes

## Technical Considerations

### localStorage Keys
```javascript
{
  "bookshelf-dpi": 96,
  "bookshelf-default-shelf-height": 12,
  "bookshelf-books": {...},
  "bookshelf-shelves": {...}
}
```

### SortableJS Configuration
- All shelves + temporary holding in same group: `"shared-bookshelf"`
- Maintain existing animation and ghost class settings
- Add temporary holding container to sortable initialization

### CSS Structure
- New classes: `.bookshelf-container`, `.bookshelf-back-panel`, `.side-panel`, `.settings-panel`, `.temporary-holding`
- Flexbox for main layout
- CSS Grid optional for temporary holding book layout

## Implementation Notes

- Build on existing `modern_bookshelf_sortable.html`
- Preserve all current drag-and-drop functionality
- Settings persist across sessions
- Smooth animations for all interactions
- Mobile-responsive design with panel repositioning
- Maintain existing features (add book, add shelf, theme toggle, etc.)

## Success Criteria

1. Books display at accurate physical dimensions based on DPI
2. Users can calibrate DPI for their specific screen
3. Users can set global default shelf height
4. Users can customize individual shelf heights
5. Users can drag books to/from temporary holding area
6. All settings persist in localStorage
7. Oversized books are visually flagged
8. Manual dimension overrides work correctly
9. Responsive layout works on various screen sizes
10. Dark mode compatibility maintained
