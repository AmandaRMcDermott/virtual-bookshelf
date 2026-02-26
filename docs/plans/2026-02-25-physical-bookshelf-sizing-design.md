# Physical Bookshelf Sizing & Temporary Holding Design

**Date:** 2026-02-25
**Status:** Approved
**Target:** modern_bookshelf_sortable.html

## Overview

This design adds two major features to the virtual bookshelf application:
1. **Physical-scale sizing** - Display books at their real-world physical dimensions for accurate bookshelf planning
2. **Temporary holding area** - A side panel where books can be temporarily removed from shelves and later restored or permanently deleted

These features enable users to accurately plan real-world bookshelf arrangements by working with true-to-life book dimensions.

## Goals

- Display books at 1:1 physical scale on screen for realistic bookshelf planning
- Allow customization of individual shelf heights to match real furniture
- Provide a convenient way to temporarily set books aside during organization
- Maintain all existing drag-and-drop functionality and smooth animations
- Ensure settings and arrangements persist across sessions

## User Requirements

- Books display at their actual physical size (e.g., a 5.47" × 23.19" book spine displays at that size on screen)
- Configurable screen DPI for accurate physical scaling
- Global default shelf height with per-shelf override capability
- Side panel for temporarily removing books from shelves
- Manual override option for individual book dimensions
- Cohesive bookshelf appearance (no whitespace gaps between shelves)

## Approach

**Chosen: Extend Existing System**

Build on the current `modern_bookshelf_sortable.html` by adding settings panel and side panel while preserving all existing functionality. This minimizes disruption to the working drag-and-drop system and maintains the smooth animations.

## Design Details

### 1. Overall Architecture & Layout

**Layout Structure:**
- **Main Bookshelf Area (Left, ~70% width)**: Existing bookshelf with drag-and-drop functionality
- **Side Panel (Right, ~30% width, 300-400px)**: Fixed-width panel containing:
  - Settings section (collapsible) at top
  - Temporary Holding area below

**Bookshelf Frame:**
- Shelves contained within a bookshelf frame element
- Frame background represents the back panel of a real bookshelf (wood texture or solid color)
- Vertical spacing between shelves shows the bookshelf back panel, not whitespace
- Creates cohesive furniture appearance

**Responsive Behavior:**
- Screens < 1024px: Side panel moves below bookshelf (vertical stack)
- Screens < 768px: Temporary holding becomes collapsible to save space

**Layout Diagram:**
```
┌─────────────────────────────────────────────────────────┐
│ Header (existing controls + theme toggle)               │
├──────────────────────────────────┬──────────────────────┤
│ ┌──────────────────────────────┐ │ ⚙️ Settings [▼]      │
│ │░ Bookshelf Back Panel ░░░░░░ │ │ ┌──────────────────┐ │
│ │┌────────────────────────────┐│ │ │ DPI: [96]        │ │
│ ││ Shelf 1 - 12" [edit]       ││ │ │ Default Height:  │ │
│ ││ [book][book][book]         ││ │ │ [12] inches      │ │
│ │└────────────────────────────┘│ │ └──────────────────┘ │
│ │░░░░░░ (gap shows back) ░░░░░ │ │                      │
│ │┌────────────────────────────┐│ │ 📚 Temporary Holding │
│ ││ Shelf 2 - 10" [edit]       ││ │ (3 books)            │
│ ││ [book][book]               ││ │ ┌──────────────────┐ │
│ │└────────────────────────────┘│ │ │ [book thumbnail] │ │
│ └──────────────────────────────┘ │ │ [book thumbnail] │ │
│                                   │ │ [book thumbnail] │ │
└───────────────────────────────────┴──┴──────────────────┘
```

### 2. Physical Sizing System

**DPI Configuration:**
- Settings panel includes DPI input field (default: 96)
- Helper text: "Enter your screen's DPI for accurate physical sizing. Standard: 96, MacBook: 109-110"
- "Calibrate" button opens modal with on-screen ruler and adjustment slider
- User holds physical ruler to screen and adjusts slider until rulers match
- DPI stored in localStorage: `bookshelf-dpi-setting`

**Dimension Calculation:**

When book spine image loads:
1. Read image pixel dimensions: `img.width × img.height`
2. Calculate physical dimensions: `physicalInches = pixels ÷ DPI`
3. Store in book metadata object
4. Render book at calculated size

**Display Formula:**
```javascript
// Physical size to screen pixels
displayPixels = physicalInches × userDPI

// Example: Book is 5.47" wide, DPI is 96
// displayPixels = 5.47 × 96 = 525px
```

**Book Metadata Structure:**
```javascript
{
  bookId: "book-123-HarryPotter7",
  fileName: "HarryPotterandtheDeathlyHallowsHarryPotter7-136251.jpeg",
  imageUrl: "blob:...",
  pixelWidth: 525,
  pixelHeight: 2226,
  physicalWidth: 5.47,      // inches
  physicalHeight: 23.19,    // inches
  hasManualOverride: false,
  shelfId: "shelf-1"        // or "temporary-holding"
}
```

**Manual Override:**
- Right-click on book or click edit icon opens dimension editor modal
- Modal displays:
  - Current dimensions (calculated or manual)
  - Input fields for custom width/height in inches
  - "Reset to Auto-Calculate" button (if override exists)
  - "Save" and "Cancel" buttons
- When manually edited, sets `hasManualOverride: true`
- Manual dimensions always take precedence over calculated

**Sample Books:**
- Existing colored sample books default to 1" × 8" dimensions
- Can be manually edited like image-based books
- Stored with same metadata structure

### 3. Shelf Height Customization

**Global Default Height:**
- Settings panel: "Default Shelf Height" input (default: 12 inches)
- New shelves created with this default height
- Changing default does NOT affect existing shelves

**Per-Shelf Height:**
- Each shelf displays height in label: "Shelf 1 - 12″"
- Click label or edit icon to change height
- Inline input or small popover for quick editing
- Height updates immediately with visual feedback

**Visual Implementation:**
- Shelf container height: `(heightInches × userDPI) + shelfBaseHeight`
- Books align to bottom of shelf (flex-end)
- Minimum shelf height: 6 inches (prevent too-small shelves)
- Maximum shelf height: 24 inches (reasonable furniture limit)

**Shelf Data Structure:**
```javascript
{
  shelfId: "shelf-1",
  heightInches: 12,
  books: ["book-1", "book-2", "book-3"]
}
```

**Oversized Book Warning:**
- If `book.physicalHeight > shelf.heightInches`, show warning
- Visual indicator: orange/red outline or icon on book
- Tooltip: "This book is 15″ tall but shelf is only 12″. Adjust shelf height or move to taller shelf."
- Book still displays but is clearly flagged

### 4. Temporary Holding Area

**Location:**
- Right side panel, below Settings section
- Fixed width: 300-400px
- Scrollable if many books present
- Always visible (not collapsible by default)

**Visual Design:**
- Header: "📚 Temporary Holding" with book count: "(3 books)"
- Distinct background color (light gray in light mode, dark gray in dark mode)
- Clear separation from settings section above

**Book Display:**
- Books shown as vertical list/grid
- Thumbnail size: 60-80px height, maintaining aspect ratio
- Show filename or title on hover
- Delete button (trash icon) for permanent removal

**Drag & Drop Integration:**
- Temporary holding is a SortableJS group member (group: 'books')
- Books can drag from shelves → temporary holding
- Books can drag from temporary holding → any shelf
- Books can reorder within temporary holding
- Same visual feedback as shelf dragging (highlights, animations)

**Data Structure:**
```javascript
// Temporary holding is a special "shelf"
{
  shelfId: "temporary-holding",
  heightInches: null,  // Not applicable
  books: ["book-5", "book-8", "book-12"]
}
```

**Persistence:**
- Stored in localStorage like regular shelves
- Books retain all metadata when moved to/from temporary holding
- Survives page refresh

### 5. Settings Panel UI

**Panel Design:**
- Collapsible accordion with header: "⚙️ Settings"
- Arrow indicator (▼/▶) shows expand/collapse state
- Starts collapsed to save space
- Smooth CSS transition when expanding/collapsing
- Positioned at top of right side panel

**Settings Layout:**
```
⚙️ Settings [▼]
─────────────────────────────
Display Settings:
  Screen DPI: [96] [Calibrate]

Shelf Settings:
  Default Shelf Height: [12] inches

[Reset to Defaults]
```

**Calibration Modal:**
- Full-screen semi-transparent overlay
- Modal centered on screen
- Contains:
  - Instructions: "Hold a physical ruler against your screen"
  - Horizontal ruler graphic (12 inches based on current DPI calculation)
  - Slider to adjust DPI (range: 72-200)
  - Current DPI value display
  - [Done] button to save and close
- Ruler resizes in real-time as slider moves
- [ESC] key or clicking outside closes without saving

**Data Persistence:**
localStorage keys:
- `bookshelf-dpi-setting`: number (default: 96)
- `bookshelf-default-shelf-height`: number (default: 12)
- `bookshelf-books-metadata`: object containing all book metadata
- `bookshelf-shelves-data`: array of shelf objects with heights and book IDs

### 6. Error Handling & Edge Cases

**Oversized Books:**
- Warning indicator (orange outline, icon badge)
- Tooltip explains the issue
- Book still functional, just visually flagged

**Missing/Invalid Images:**
- Placeholder with book icon if image fails to load
- Default to 1″ × 8″ if dimensions unreadable
- Console error for debugging
- Flag for manual entry

**Sample Books vs Image Books:**
- Sample colored books: default 1″ × 8″
- Image-based books: calculated from pixels
- Both can be manually edited
- Visual distinction maintained (color vs image)

**Responsive Behavior:**
- < 1024px: Side panel stacks below bookshelf
- < 768px: Temporary holding collapsible
- Books maintain aspect ratio at all screen sizes
- Horizontal scrolling enabled if books overflow at physical scale

**Data Migration:**
- On first load with new version, detect old data format
- Calculate dimensions for existing books
- Add default shelf heights to existing shelves
- Set `hasManualOverride: false` for migrated data
- Preserve existing book order and shelf assignments

**Performance Considerations:**
- Limit: 100 books per shelf (show warning if exceeded)
- Debounce DPI changes (500ms delay before recalculating all books)
- Lazy-load images if total books > 50
- Use CSS transforms for smooth animations (GPU accelerated)

**Dark Mode Compatibility:**
- All new UI respects existing `dark-mode` class
- Settings panel: `--bg-panel` and `--text-primary` variables
- Bookshelf back panel: darker shade in dark mode
- Temporary holding: `--bg-secondary` background
- Warning indicators: adjust color for contrast

## Data Schema

**localStorage Keys:**
```javascript
{
  "bookshelf-dpi-setting": 96,
  "bookshelf-default-shelf-height": 12,
  "bookshelf-theme-preference": "dark",  // existing

  "bookshelf-books-metadata": {
    "book-1": {
      fileName: "HarryPotter7.jpeg",
      imageUrl: "blob:...",
      pixelWidth: 525,
      pixelHeight: 2226,
      physicalWidth: 5.47,
      physicalHeight: 23.19,
      hasManualOverride: false
    },
    // ... more books
  },

  "bookshelf-shelves-data": [
    {
      shelfId: "shelf-1",
      heightInches: 12,
      books: ["book-1", "book-2"]
    },
    {
      shelfId: "shelf-2",
      heightInches: 10,
      books: ["book-3"]
    },
    {
      shelfId: "temporary-holding",
      heightInches: null,
      books: ["book-4"]
    }
  ]
}
```

## Implementation Notes

**Preserve Existing Functionality:**
- All current buttons (Add Book, Add Shelf, Clear All) continue working
- Theme toggle remains functional
- File upload for spine images works as before
- SortableJS drag-and-drop animations preserved
- All CSS transitions and hover effects maintained

**CSS Modifications:**
- Add flexbox layout to main container (bookshelf area + side panel)
- Add bookshelf frame container with background styling
- Adjust shelf spacing to show back panel
- Style side panel sections (settings, temporary holding)
- Ensure responsive breakpoints work smoothly

**JavaScript Additions:**
- DPI management functions (get, set, calibrate)
- Dimension calculation utilities
- Book metadata CRUD operations
- Shelf height management
- Settings panel expand/collapse
- Manual override modal
- Data migration function for existing data
- localStorage persistence for new data structures

**Testing Considerations:**
- Test with various screen DPIs (96, 110, 163)
- Test with books of varying dimensions (thin/thick, short/tall)
- Test oversized book warnings
- Test drag-and-drop across all areas
- Test responsive layouts on different screen sizes
- Test data persistence (refresh page, close/reopen browser)
- Test dark mode compatibility
- Test manual override functionality

## Success Criteria

- [ ] Books display at physical scale based on DPI setting
- [ ] DPI calibration tool works accurately
- [ ] Individual shelf heights can be customized
- [ ] Temporary holding area accepts books via drag-and-drop
- [ ] Books can be dragged back from temporary holding to shelves
- [ ] Manual dimension override works for individual books
- [ ] Settings persist across page refreshes
- [ ] Bookshelf has cohesive furniture appearance (no whitespace gaps)
- [ ] All existing features continue working
- [ ] Dark mode works properly with new UI elements
- [ ] Responsive layout works on mobile/tablet
- [ ] Oversized books show warning indicators

## Future Enhancements (Out of Scope)

- Measurement in centimeters (currently inches only)
- Multiple zoom levels (currently 1:1 physical scale only)
- Shelf width constraints (currently unlimited horizontal scrolling)
- "Copy shelf to clipboard" for sharing arrangements
- Import/export bookshelf configurations
- Multi-select for bulk operations
- Undo/redo functionality
- Print view for shelf layouts
