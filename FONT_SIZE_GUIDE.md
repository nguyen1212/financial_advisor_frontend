# Font Size Standardization Guide

## Unified Font Size System

### Available Sizes:
- **text-caption** (12px) - Small captions, footer text, version info
- **text-body-sm** (14px) - Form labels, small body text, secondary information
- **text-body** (16px) - Default body text, main content
- **text-body-lg** (18px) - Large body text, important content
- **text-heading-sm** (20px) - Small headings, subheadings, card titles
- **text-heading** (24px) - Section headings, modal titles
- **text-heading-lg** (30px) - Large headings, page subtitles
- **text-title** (36px) - Page titles, main headings

## Usage Guidelines:

### Page Structure:
- **Page Title**: `text-title` (36px)
- **Section Headings**: `text-heading` (24px)
- **Card/Modal Titles**: `text-heading-sm` (20px)
- **Body Text**: `text-body` (16px)
- **Form Labels**: `text-body-sm` (14px)
- **Captions/Footer**: `text-caption` (12px)

### Examples:

```tsx
// Page title
<h1 className="text-title font-bold text-gray-800">News Feed</h1>

// Section heading
<h2 className="text-heading font-semibold text-gray-800">Filters</h2>

// Card title
<h3 className="text-heading-sm font-semibold text-gray-800">Article Title</h3>

// Body text
<p className="text-body text-gray-600">Article content...</p>

// Form label
<label className="text-body-sm font-medium text-gray-700">Email Address</label>

// Caption/footer
<p className="text-caption text-gray-500">News Portal v1.0</p>
```

## Migration Notes:
- Replace `text-4xl` → `text-title`
- Replace `text-3xl` → `text-heading-lg`
- Replace `text-2xl` → `text-heading`
- Replace `text-xl` → `text-heading-sm`
- Replace `text-lg` → `text-body-lg`
- Replace `text-base` → `text-body`
- Replace `text-sm` → `text-body-sm`
- Replace `text-xs` → `text-caption`