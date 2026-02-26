# Dark Mode Design - Virtual Bookshelf

**Date:** 2026-02-25
**Feature:** Toggleable Dark Mode with Dark Mode Default

## Overview

Add a toggleable dark mode to the virtual bookshelf application that starts in dark mode by default. The toggle will be a small icon button in the top-right corner, and the theme preference will persist across sessions.

## Design Approach

**Implementation Method:** CSS Variables (Option A)

We'll use CSS custom properties (variables) to define all theme colors. A `dark-mode` class on the body element will trigger the dark theme by changing the variable values. This approach is clean, maintainable, and follows modern web development practices.

## Color Scheme

### Light Mode (Current)
- Background: `#f5f5f5` (light gray)
- Header/Footer: `#34495e` (dark blue-gray)
- Bookshelf wood: `#6f3a1f` and `#844213ff` (brown tones) - **will be commented as OLD COLOR**
- Text: `#333` (dark gray)
- Controls/Panels: `#fff` (white)

### Dark Mode
- Background: `#1a1a1a` (very dark gray, almost black)
- Header/Footer: `#2c3e50` (slightly lighter for contrast)
- Bookshelf wood: `#5a2f18` and `#6b3410` (slightly desaturated browns)
- Text: `#e0e0e0` (light gray)
- Controls/Panels: `#2a2a2a` (dark gray)
- Accent blue: `#3498db` (works in both modes)

### Special Considerations
- **Book spines:** Keep colorful backgrounds in both modes (books should stay vibrant)
- **Shadows:** Lighter/more subtle in dark mode
- **Info banner:** Adjust gradient to work well on dark background
- **Original colors:** Comment out old bookshelf wood colors with `/* OLD COLOR */` markers for easy restoration

## Toggle Button UI

### Position & Layout
- Fixed position in top-right corner of viewport
- Size: 40px × 40px circular button
- High z-index to stay above all content
- Visible during scrolling

### Icon Design
- Sun icon (☀️) displayed in dark mode → clicking switches to light
- Moon icon (🌙) displayed in light mode → clicking switches to dark
- Smooth icon transition with fade/rotate animation

### Styling
- Semi-transparent background that adapts to theme
- Subtle shadow for depth
- Hover effect: slight scale up + glow
- Smooth transitions on all interactions

### Accessibility
- Proper aria-label describing the action
- Keyboard accessible (tab navigation + enter to activate)
- Clear visual focus state for keyboard users

## JavaScript Functionality

### Initialization
1. On page load, check localStorage for saved theme preference
2. If no preference exists, default to dark mode
3. Apply `dark-mode` class to body immediately (prevent flash of wrong theme)
4. Update toggle button icon to match current theme

### Toggle Behavior
1. Click handler on toggle button
2. Toggle `dark-mode` class on body element
3. Update icon (sun ↔ moon with animation)
4. Save new preference to localStorage
5. CSS transitions handle smooth color changes

### LocalStorage Structure
- **Key:** `bookshelf-theme-preference`
- **Value:** `"dark"` or `"light"`
- **Default:** `"dark"` if not set

### Integration
- Add theme toggle code alongside existing bookshelf JavaScript
- No conflicts with SortableJS or existing event listeners
- Keep existing `bookshelfOrder` localStorage separate

## CSS Implementation

### Variable Definition
1. Define `:root` selector with all color variables (light mode defaults)
2. Override in `body.dark-mode` selector (dark mode values)
3. All color references throughout stylesheet use `var(--variable-name)`

### Elements to Theme
- Body background
- Header and footer backgrounds/text
- Button colors and hover states
- Bookshelf container backgrounds
- Bookshelf row colors and shadows
- Controls panel background
- Info banner background and gradient
- Text colors throughout
- Border colors
- Shadow colors (adjusted opacity for dark backgrounds)

### Transitions
- Add `transition: background-color 0.3s ease, color 0.3s ease` to themed elements
- Smooth color changes when toggling
- Won't interfere with existing drag-and-drop animations

## File Changes

### `modern_bookshelf_sortable.html`
1. Add CSS variables in `<style>` section
2. Update all color references to use CSS variables
3. Add dark mode variable overrides
4. Add toggle button styles
5. Add toggle button HTML in body
6. Add JavaScript for theme initialization and toggle functionality

## Success Criteria

- [ ] App starts in dark mode by default
- [ ] Toggle button appears in top-right corner
- [ ] Clicking toggle smoothly transitions between themes
- [ ] Theme preference persists across page refreshes
- [ ] All UI elements properly themed in both modes
- [ ] Book spines remain colorful in both modes
- [ ] No flash of wrong theme on page load
- [ ] Toggle button is keyboard accessible
- [ ] Existing drag-and-drop functionality unaffected
