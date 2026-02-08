# 🎨 SHAMS SMS Enterprise Design System - Visual Reference

## Color Palette Reference

### Primary Colors (Enterprise Slate)

```
Light Mode
├── Background: Slate-50 (#F8FAFC)
├── Foreground: Slate-950 (#020617)
├── Primary: Blue-600 (#2563EB)
├── Sidebar: Slate-950 (#020617) with glassmorphism
└── Border: Slate-200 (#E2E8F0)

Dark Mode
├── Background: Slate-950 (#020617)
├── Foreground: Slate-50 (#F8FAFC)
├── Primary: Blue-400 (#60A5FA)
├── Card: Slate-900 (#0F172A)
└── Border: Slate-700 (#334155)
```

### Status Badge Colors

```
✅ PAID / SUCCESS
├── Background: Emerald-100 / Emerald-900/30 (dark)
└── Text: Emerald-900 / Emerald-200 (dark)

⏳ PENDING / WARNING
├── Background: Amber-100 / Amber-900/30 (dark)
└── Text: Amber-900 / Amber-200 (dark)

❌ UNPAID / ERROR
├── Background: Red-100 / Red-900/30 (dark)
└── Text: Red-900 / Red-200 (dark)

ℹ️ PROCESSING / INFO
├── Background: Blue-100 / Blue-900/30 (dark)
└── Text: Blue-900 / Blue-200 (dark)
```

## Typography Scale

```
Level 1 (Page Title)
├── Font Size: 32px (2rem)
├── Font Weight: Bold (700)
├── Letter Spacing: -0.02em (tracking-tight)
└── Use: Main page headings

Level 2 (Section Title)
├── Font Size: 24px (1.5rem)
├── Font Weight: Bold (700)
├── Letter Spacing: -0.02em (tracking-tight)
└── Use: Card titles, section headers

Level 3 (Subsection)
├── Font Size: 20px (1.25rem)
├── Font Weight: Semibold (600)
└── Use: Tab titles, metric labels

Level 4 (Caption)
├── Font Size: 14px (0.875rem)
├── Font Weight: Medium (500)
└── Use: Form labels, small headers

Level 5 (Body)
├── Font Size: 14px (0.875rem)
├── Font Weight: Normal (400)
└── Use: Default body text

Level 6 (Data Table)
├── Font Size: 13px (0.8125rem)
├── Font Weight: Normal (400)
├── Line Height: 1.5
└── Use: High-density table data (class: data-table-text)

Level 7 (Small Caption)
├── Font Size: 12px (0.75rem)
├── Font Weight: Normal (400)
└── Use: Timestamps, metadata
```

## Spacing System (8px Grid)

```
Base Unit: 8px

Spacing Scale      | Usage
─────────────────────────────────────────
p-1 (4px)         | Dense spacing, tight layouts
p-2 (8px)         | Default small element padding
p-3 (12px)        | Standard small padding
p-4 (16px)        | Default padding for cards
p-6 (24px)        | Spacious card padding
p-8 (32px)        | Landing page sections
p-12 (48px)       | Large gap between sections
p-16 (64px)       | Page-level spacing

gap-2 (8px)       | Grid/flex item spacing
gap-3 (12px)      | Default flex spacing
gap-4 (16px)      | Card content spacing
gap-6 (24px)      | Section spacing
```

## Component Variants

### Cards
```
Standard Card (card-surface)
├── Background: White (light) / Slate-900 (dark)
├── Border: Slate-200 (light) / Slate-700 (dark)
├── Border Width: 1px
├── Border Radius: 0.5rem
├── Box Shadow: Shadow-sm
└── Padding: p-6

Metric Card (metric-card)
├── All card properties above
├── Min Height: 128px (h-32)
├── Flex Layout: flex-col justify-between
├── Icon Position: Top-right
└── Trend Indicator: Bottom-left
```

### Buttons
```
Primary Button (bg-primary)
├── Background: Blue-600 (light) / Blue-500 (dark)
├── Text Color: White
├── Hover: Darker shade
├── Padding: px-4 py-2
├── Border Radius: 0.375rem
└── Font Weight: Medium (500)

Outline Button (border border-border)
├── Background: Transparent
├── Border: Slate-200 (light) / Slate-700 (dark)
├── Text: Slate-900 (light) / Slate-50 (dark)
└── Hover: Slight background change

Ghost Button
├── Background: Transparent
├── Border: None
├── Text: Primary color
└── Hover: Subtle background
```

### Sidebar Components
```
Collapsible Sidebar (sidebar-glass)
├── Width (expanded): 256px (w-64)
├── Width (collapsed): 80px (w-20)
├── Background: Slate-950 with 95% opacity
├── Backdrop Filter: Blur (glassmorphism)
├── Border Right: 1px solid Slate-700
├── Transition: 300ms smooth
├── Z-Index: 20 (fixed)
└── Height: 100vh (full viewport)

Nav Link (active)
├── Background: Primary color (Blue-600)
├── Text: White
├── Icon: White
├── Border Radius: 0.5rem
├── Padding: px-4 py-3
└── Transition: 200ms smooth

Nav Link (inactive)
├── Background: Transparent
├── Text: Sidebar foreground color
├── Hover: Slight highlight (bg-sidebar-accent/10)
└── Cursor: Pointer
```

## Responsive Breakpoints

```
Mobile First Approach
├── Base (0px+): Single column, full width
├── sm (640px+): Small tablets
├── md (768px+): Medium tablets & small desktops
├── lg (1024px+): Large desktops
└── xl (1280px+): Extra large screens

Dashboard Layout
├── Mobile: 1 column
├── Tablet: 2 columns (md: grid-cols-2)
├── Desktop: 4 columns (lg: grid-cols-4)

Sidebar + Content
├── mobile: Sidebar hidden, content full width
├── md: Sidebar icon-only (w-20), content grows
├── lg: Sidebar full width (w-64), content fills remaining
```

## Interactive States

### Hover Effect
```
Cards
├── Background: Slight muted color change
├── Border: Stays same
├── Shadow: Minor elevation increase
└── Cursor: Default (pointer for clickable)

Links
├── Color: Primary color
├── Underline: Show on hover
└── Cursor: Pointer

Buttons
├── Background: Darker shade
├── Transform: Scale up slightly (optional)
└── Cursor: Pointer
```

### Focus State
```
All Interactive Elements
├── Outline: Primary color ring (3px)
├── Outline Offset: 2px
├── Border Radius: Inherited
└── Z-Index: Visible above siblings
```

### Loading State
```
Skeleton Screens
├── Background: Muted-foreground color
├── Animation: Pulse (opacity 0.5 - 1.0)
├── Duration: 2s infinite
├── Height: Matches replaced element
└── Border Radius: Inherited
```

## Shadow System

```
Shadow Sizes
├── sm: Small elevation (cards, dropdowns)
├── md: Medium elevation (modal dialogs)
├── lg: Large elevation (floating panels)
└── xl: Extra large elevation (important overlays)

Usage
├── Cards: shadow-sm
├── Modals: shadow-md
├── Sidebars: shadow-lg (or glassmorphism)
└── Overlays: shadow-xl
```

## Border Radius Scale

```
Base Radius: 0.625rem (10px)

xs: calc(base - 4px) = 6px    → Tight corners
sm: calc(base - 2px) = 8px    → Slightly rounded
md: base = 10px               → Standard
lg: calc(base + 4px) = 14px   → Spacious
xl: calc(base + 8px) = 18px   → Very rounded
2xl: calc(base + 12px) = 22px → Large radius
full: 9999px                  → Fully rounded (pills)
```

## Utility Classes Quick Reference

```css
/* Professional Styling */
.card-surface      /* White card with border & shadow */
.sidebar-glass     /* Slate-950 with glassmorphism */
.metric-card       /* p-6 card for dashboard metrics */
.data-table-text   /* 13px high-density table font */
.page-container    /* Max-width + responsive padding */
.grid-spacing      /* gap-2 (8px) for grid items */

/* Status Badges */
.badge-success     /* Emerald background + text */
.badge-error       /* Red background + text */
.badge-warning     /* Amber background + text */
.badge-info        /* Blue background + text */
```

## Animation Timing

```
Transitions
├── Fast: 150ms - Quick feedback (buttons, icons)
├── Standard: 300ms - Normal transitions (sidebar collapse)
├── Slow: 500ms+ - Important transitions (page changes)

Easing
├── ease-in-out: Default smooth motion
├── ease-in: Acceleration (entering transitions)
├── ease-out: Deceleration (exiting transitions)
└── linear: Constant speed (progress indicators)
```

## Dark Mode Override

All components automatically support dark mode via CSS variables.

To force dark mode on an element:
```html
<div class="dark">...</div>
```

The dark colors are automatically applied through the CSS variable system in `app/globals.css`.

---

## Component Usage Examples

### MetricCard
```tsx
<MetricCard
  title="Total Revenue"
  value="PKR 2,45,000"
  icon={DollarSign}
  iconColor="text-emerald-600"
  valueColor="text-emerald-600"
/>
```

### StatusBadge
```tsx
<StatusBadge status="PAID" />      <!-- Green -->
<StatusBadge status="UNPAID" />    <!-- Red -->
<StatusBadge status="PENDING" />   <!-- Amber -->
<StatusBadge status="PROCESSING" /><!-- Blue -->
```

### Card Container
```tsx
<div className="card-surface p-6">
  <h3 className="text-xl font-bold tracking-tight">Title</h3>
  {/* Content */}
</div>
```

### Data Table
```tsx
<table className="data-table-text">
  <thead>
    <tr className="border-b border-border">
      <th className="text-left py-3 px-4 font-semibold">Column</th>
    </tr>
  </thead>
  <tbody>
    {/* Rows */}
  </tbody>
</table>
```

---

## Accessibility Considerations

1. **Color Contrast**: All text meets WCAG AA standards (4.5:1 for body text)
2. **Touch Targets**: Minimum 48px x 48px for mobile buttons
3. **Keyboard Navigation**: Full keyboard support for all interactive elements
4. **Focus Indicators**: Clear visual focus rings at 3px width
5. **Icon Labels**: All icons have title attributes or accompanying text
6. **Semantic HTML**: Proper heading hierarchy, form labels, and ARIA attributes

---

*Last Updated: February 8, 2026*  
*Design System Version: 1.0 (Enterprise Series)*
