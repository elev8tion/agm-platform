# 🎨 Theme Customization Guide

Complete guide to customizing the visual design and branding of your CRM.

---

## Quick Reference

| What to Change | File | Line |
|----------------|------|------|
| Brand colors | `config/theme.json` | colors section |
| Logo | `public/assets/logo.svg` | - |
| Company name | `config/theme.json` | brand.name |
| Fonts | `config/theme.json` | typography |
| Button styles | `config/theme.json` | components.button |
| Spacing | `config/theme.json` | spacing |
| Border radius | `config/theme.json` | borderRadius |

---

## 🎨 Color System

### Primary Colors

**Primary** - Main brand color (buttons, links, highlights)
```json
{
  "colors": {
    "primary": {
      "DEFAULT": "#2563eb",  // This is the main shade
      "50": "#eff6ff",       // Lightest
      "900": "#1e3a8a"       // Darkest
    }
  }
}
```

**Where it's used:**
- Primary buttons
- Active navigation items
- Links
- Progress bars
- Selected states
- Focus rings

**How to choose:**
- Should represent your brand
- Good contrast against white
- Not too light or too dark
- Test readability

### Secondary Colors

**Secondary** - Supporting color (headers, sidebars, secondary elements)
```json
{
  "colors": {
    "secondary": {
      "DEFAULT": "#64748b"
    }
  }
}
```

**Where it's used:**
- Secondary buttons
- Table headers
- Sidebar backgrounds
- Card borders
- Muted text

### Semantic Colors

**Success** - Positive actions and states
```json
"success": { "DEFAULT": "#10b981" }
```
Used for: Completed tasks, success messages, positive metrics

**Warning** - Caution and pending states
```json
"warning": { "DEFAULT": "#f59e0b" }
```
Used for: Pending items, warnings, important notices

**Error** - Errors and negative states
```json
"error": { "DEFAULT": "#ef4444" }
```
Used for: Error messages, failed states, delete actions

**Info** - Informational content
```json
"info": { "DEFAULT": "#0ea5e9" }
```
Used for: Info messages, tips, help text

---

## 🖼️ Logo & Branding

### Logo Requirements

**Main Logo** (`logo.svg`):
- **Format:** SVG (preferred) or PNG with transparency
- **Size:** 200px width max, maintains aspect ratio
- **Usage:** Header, navigation, login screen

**Logo Variations:**

1. **Light Logo** (`logo-light.svg`) - For dark backgrounds
2. **Dark Logo** (`logo-dark.svg`) - For light backgrounds
3. **Icon Only** (`logo-icon.svg`) - Square icon for mobile/collapsed sidebar

**Favicon** (`favicon.ico`):
- **Size:** 32x32 or 64x64 pixels
- **Format:** ICO or PNG
- **Tool:** Use [Favicon.io](https://favicon.io) to generate

**Apple Touch Icon** (`apple-touch-icon.png`):
- **Size:** 180x180 pixels
- **Format:** PNG
- **Usage:** iOS home screen

### Logo Placement

```json
{
  "brand": {
    "logo": "/assets/logo.svg",
    "logoLight": "/assets/logo-light.svg",
    "logoDark": "/assets/logo-dark.svg"
  }
}
```

### Testing Your Logo

Check logo visibility:
- ✅ White backgrounds
- ✅ Dark backgrounds
- ✅ Colored backgrounds (primary, secondary)
- ✅ Small sizes (mobile)
- ✅ Large sizes (login page)

---

## ✍️ Typography

### Font Selection

**Sans-serif** (for UI):
```json
{
  "typography": {
    "fontFamily": {
      "sans": "Inter, system-ui, sans-serif"
    }
  }
}
```

**Popular choices:**
- **Inter** - Modern, clean (default)
- **Roboto** - Friendly, readable
- **Open Sans** - Neutral, professional
- **Poppins** - Rounded, friendly
- **Lato** - Warm, readable

**Serif** (for content):
```json
"serif": "Georgia, Cambria, serif"
```

**Monospace** (for code/numbers):
```json
"mono": "JetBrains Mono, Consolas, monospace"
```

### Adding Google Fonts

1. **Choose fonts** at [Google Fonts](https://fonts.google.com)

2. **Add to `index.html`:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

3. **Update theme config:**
```json
{
  "typography": {
    "fontFamily": {
      "sans": "Inter, system-ui, sans-serif"
    }
  }
}
```

### Font Sizes

```json
{
  "fontSize": {
    "xs": "0.75rem",    // 12px - Small labels
    "sm": "0.875rem",   // 14px - Body text (small)
    "base": "1rem",     // 16px - Body text (default)
    "lg": "1.125rem",   // 18px - Large body
    "xl": "1.25rem",    // 20px - Small headings
    "2xl": "1.5rem",    // 24px - H3
    "3xl": "1.875rem",  // 30px - H2
    "4xl": "2.25rem",   // 36px - H1
    "5xl": "3rem"       // 48px - Hero text
  }
}
```

### Font Weights

```json
{
  "fontWeight": {
    "light": "300",     // Light text
    "normal": "400",    // Regular text
    "medium": "500",    // Emphasis
    "semibold": "600",  // Buttons, labels
    "bold": "700",      // Headings
    "extrabold": "800"  // Hero headings
  }
}
```

---

## 📐 Spacing & Layout

### Spacing Scale

```json
{
  "spacing": {
    "xs": "0.25rem",   // 4px
    "sm": "0.5rem",    // 8px
    "md": "1rem",      // 16px (base)
    "lg": "1.5rem",    // 24px
    "xl": "2rem",      // 32px
    "2xl": "3rem",     // 48px
    "3xl": "4rem"      // 64px
  }
}
```

**Usage:**
- `xs` - Tight spacing (badges, tags)
- `sm` - Small gaps (form fields)
- `md` - Default spacing (cards, sections)
- `lg` - Generous spacing (page sections)
- `xl` - Large gaps (page layout)

### Border Radius

```json
{
  "borderRadius": {
    "none": "0",          // Sharp corners
    "sm": "0.25rem",      // 4px - Subtle
    "md": "0.375rem",     // 6px - Default
    "lg": "0.5rem",       // 8px - Cards
    "xl": "0.75rem",      // 12px - Modals
    "2xl": "1rem",        // 16px - Hero sections
    "full": "9999px"      // Pill shape
  }
}
```

**Style Guide:**
- **Sharp** (none) - Modern, technical
- **Subtle** (sm/md) - Professional, clean
- **Rounded** (lg/xl) - Friendly, modern
- **Pills** (full) - Badges, tags

### Shadows

```json
{
  "shadows": {
    "sm": "0 1px 2px rgba(0,0,0,0.05)",      // Subtle
    "md": "0 4px 6px rgba(0,0,0,0.1)",       // Cards
    "lg": "0 10px 15px rgba(0,0,0,0.1)",     // Dropdowns
    "xl": "0 20px 25px rgba(0,0,0,0.1)",     // Modals
    "2xl": "0 25px 50px rgba(0,0,0,0.25)"    // Overlays
  }
}
```

---

## 🎭 Dark Mode

### Enabling Dark Mode

```json
{
  "darkMode": {
    "enabled": true,
    "colors": {
      "background": {
        "primary": "#0f172a",
        "secondary": "#1e293b"
      },
      "text": {
        "primary": "#f8fafc",
        "secondary": "#cbd5e1"
      }
    }
  }
}
```

### Dark Mode Best Practices

1. **Don't invert everything** - Adjust, don't just flip colors
2. **Reduce contrast** - Pure black is harsh, use dark grays
3. **Test readability** - Ensure text is legible
4. **Keep brand colors** - Primary/accent colors should stay similar
5. **Adjust shadows** - Use lighter shadows in dark mode

### Testing Dark Mode

- Test all components in both modes
- Check color contrast ratios (use [Contrast Checker](https://webaim.org/resources/contrastchecker/))
- Verify images and logos work in both modes
- Test transitions between modes

---

## 🧩 Component Styles

### Buttons

```json
{
  "components": {
    "button": {
      "borderRadius": "md",
      "fontWeight": "medium",
      "sizes": {
        "sm": { "padding": "0.5rem 1rem", "fontSize": "sm" },
        "md": { "padding": "0.625rem 1.25rem", "fontSize": "base" },
        "lg": { "padding": "0.75rem 1.5rem", "fontSize": "lg" }
      }
    }
  }
}
```

**Button Variants:**
- **Primary** - Main actions (uses primary color)
- **Secondary** - Secondary actions (uses secondary color)
- **Outline** - Less emphasis (border only)
- **Ghost** - Minimal (text only)
- **Danger** - Destructive actions (uses error color)

### Input Fields

```json
{
  "components": {
    "input": {
      "borderRadius": "md",
      "borderWidth": "1px",
      "fontSize": "base",
      "padding": "0.625rem 0.875rem"
    }
  }
}
```

### Cards

```json
{
  "components": {
    "card": {
      "borderRadius": "lg",
      "padding": "1.5rem",
      "shadow": "md"
    }
  }
}
```

### Modals

```json
{
  "components": {
    "modal": {
      "borderRadius": "xl",
      "padding": "2rem",
      "shadow": "2xl"
    }
  }
}
```

---

## 🎯 Industry-Specific Themes

### Real Estate
```json
{
  "colors": {
    "primary": { "DEFAULT": "#2563eb" },  // Professional blue
    "secondary": { "DEFAULT": "#64748b" }
  }
}
```

### Insurance
```json
{
  "colors": {
    "primary": { "DEFAULT": "#0891b2" },  // Trust-building teal
    "secondary": { "DEFAULT": "#475569" }
  }
}
```

### Recruiting
```json
{
  "colors": {
    "primary": { "DEFAULT": "#8b5cf6" },  // Energetic purple
    "secondary": { "DEFAULT": "#6366f1" }
  }
}
```

### B2B Sales
```json
{
  "colors": {
    "primary": { "DEFAULT": "#059669" },  // Growth green
    "secondary": { "DEFAULT": "#4b5563" }
  }
}
```

### Finance/Legal
```json
{
  "colors": {
    "primary": { "DEFAULT": "#1e40af" },  // Professional navy
    "secondary": { "DEFAULT": "#334155" }
  }
}
```

---

## 🔧 Advanced Customization

### CSS Variables

After running `npm run generate:theme`, CSS variables are created:

```css
:root {
  --color-primary: #2563eb;
  --color-secondary: #64748b;
  --font-sans: Inter, system-ui, sans-serif;
  --border-radius-md: 0.375rem;
  --spacing-md: 1rem;
}
```

**Usage in components:**
```css
.button {
  background-color: var(--color-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
}
```

### Tailwind Configuration

Theme config is automatically converted to Tailwind format:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        // ... from theme.json
      }
    }
  }
}
```

**Usage in components:**
```jsx
<button className="bg-primary text-white rounded-md">
  Click Me
</button>
```

---

## 📱 Responsive Design

### Breakpoints

```json
{
  "breakpoints": {
    "sm": "640px",   // Mobile landscape
    "md": "768px",   // Tablet
    "lg": "1024px",  // Desktop
    "xl": "1280px",  // Large desktop
    "2xl": "1536px"  // Extra large
  }
}
```

### Testing Responsive Design

Check these sizes:
- ✅ **Mobile** (375px) - iPhone SE
- ✅ **Tablet** (768px) - iPad
- ✅ **Laptop** (1366px) - Standard laptop
- ✅ **Desktop** (1920px) - Full HD

---

## ✅ Theme Checklist

Before launching, verify:

### Colors
- [ ] Primary color matches brand
- [ ] Sufficient contrast for accessibility (4.5:1 minimum)
- [ ] All semantic colors defined
- [ ] Dark mode colors tested

### Typography
- [ ] Fonts loaded correctly
- [ ] Font sizes readable on all devices
- [ ] Headings hierarchy clear
- [ ] Line height comfortable

### Branding
- [ ] Logo visible on all backgrounds
- [ ] Favicon displays correctly
- [ ] Company name updated everywhere
- [ ] Social media preview image (OG image)

### Components
- [ ] Buttons all styled consistently
- [ ] Forms easy to use
- [ ] Cards have proper spacing
- [ ] Modals centered and accessible

### Responsive
- [ ] Mobile navigation works
- [ ] Tables scroll on mobile
- [ ] Forms usable on small screens
- [ ] No horizontal scrolling

---

## 🎓 Design Resources

### Color Tools
- [Coolors](https://coolors.co) - Palette generator
- [Adobe Color](https://color.adobe.com) - Color wheel
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - Accessibility

### Typography
- [Google Fonts](https://fonts.google.com) - Free fonts
- [Font Pair](https://fontpair.co) - Font combinations
- [Type Scale](https://type-scale.com) - Font size calculator

### Logo Design
- [Canva](https://canva.com) - Easy design tool
- [Figma](https://figma.com) - Professional design
- [Looka](https://looka.com) - AI logo generator
- [Favicon.io](https://favicon.io) - Favicon generator

### Inspiration
- [Dribbble](https://dribbble.com) - Design inspiration
- [Awwwards](https://awwwards.com) - Award-winning designs
- [UI Garage](https://uigarage.net) - UI patterns

---

## 🆘 Common Issues

### Logo not displaying
- Check file path in `config/theme.json`
- Verify file exists in `public/assets/`
- Clear browser cache
- Check console for errors

### Colors not updating
- Run `npm run generate:theme`
- Restart dev server
- Clear build cache: `rm -rf dist`

### Fonts not loading
- Check Google Fonts link in `index.html`
- Verify font name matches exactly
- Check browser console for errors
- Try preconnecting to fonts.googleapis.com

### Dark mode not working
- Ensure `darkMode.enabled: true`
- Check dark mode colors defined
- Verify theme switcher implemented
- Test system preference detection

---

Need help? Check the [main README](../README.md) or reach out for support!
