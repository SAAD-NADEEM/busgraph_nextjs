# Google Stitch Design System

This document outlines the design tokens and architectural patterns for the **Google Stitch** theme used in the BusGraph project. This theme is built on top of Tailwind CSS and Shadcn UI, utilizing OKLCH color spaces for modern, accessible, and vibrant UI.

## 🎨 Color Palette (OKLCH)

The theme uses the OKLCH color space to ensure consistent perceived lightness and chroma across all colors.

### Core Colors
| Token | Light Mode (Value) | Dark Mode (Value) | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `oklch(1 0 0)` | `oklch(0.148 0.004 228.8)` | Primary page background |
| **Foreground** | `oklch(0.148 0.004 228.8)` | `oklch(0.987 0.002 197.1)` | Primary text color |
| **Primary** | `oklch(0.555 0.163 48.998)` | `oklch(0.473 0.137 46.201)` | Buttons, active states, key branding |
| **Secondary** | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` | Less prominent UI elements |
| **Muted** | `oklch(0.963 0.002 197.1)` | `oklch(0.275 0.011 216.9)` | Decorative elements, disabled states |
| **Accent** | `oklch(0.963 0.002 197.1)` | `oklch(0.275 0.011 216.9)` | Hover states and subtle highlights |
| **Destructive**| `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Error states and dangerous actions |

### Borders & Inputs
- **Border**: `oklch(0.925 0.005 214.3)` (Light) / `oklch(1 0 0 / 10%)` (Dark)
- **Input**: `oklch(0.925 0.005 214.3)` (Light) / `oklch(1 0 0 / 15%)` (Dark)
- **Ring**: `oklch(0.723 0.014 214.4)` (Light) / `oklch(0.56 0.021 213.5)` (Dark)

---

## 🔡 Typography

We use a multi-font strategy to balance readability and modern aesthetics.

- **Sans (Body)**: `Inter`, `Geist Sans`
  - Used for standard text, UI labels, and general content.
  - Defined as `--font-sans`.
- **Heading**: `Noto Sans`
  - Used for page titles, section headers, and emphasized text.
  - Defined as `--font-heading`.
- **Mono**: `Geist Mono`
  - Used for technical data, coordinates, and code snippets.
  - Defined as `--font-geist-mono`.

---

## 📐 Layout & Spacing

### Corner Radius
The theme uses a base radius of `0.625rem` (`10px`), with scaled variations:
- **Small (sm)**: 6px
- **Medium (md)**: 8px
- **Large (lg)**: 10px (Default)
- **Extra Large (xl)**: 14px
- **2XL - 4XL**: Used for highly rounded "pill" components like buttons.

### Components
- **Buttons**: Use `rounded-4xl` for a soft, modern "Google-esque" feel.
- **Inputs**: Consistent `border-1` with subtle shadows on focus.
- **Cards**: Minimalist white background with a very soft `0 4px 20px` shadow to create depth without harsh lines.

---

## 🗺️ Map Integration (Stitch Style)

The map interface is integrated as a first-class citizen:
- **Route Line**: Blue (`#1a73e8`) with a white casing for high contrast against any map style.
- **Floating Controls**: High-elevation cards (`zIndex: 10`) positioned centrally to mimic mobile-first navigation patterns.
- **Search Suggestions**: Integrated with the same `oklch` color tokens to ensure a seamless transition from input to list.
