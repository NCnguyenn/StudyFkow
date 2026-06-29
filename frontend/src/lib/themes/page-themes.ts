"use client";

/**
 * page-themes.ts
 *
 * Comprehensive Page Theme System.
 * Defines 20+ built-in page themes controlling page-level backgrounds, typography,
 * selection colors, links, headings, paragraphs, and block defaults.
 */

export interface ThemeStyle {
  color: string;
  fontWeight?: string;
  fontFamily?: string;
  lineHeight?: string;
  backgroundColor?: string;
  borderColor?: string;
  headerBg?: string;
  stripedRows?: boolean;
  underline?: boolean;
}

export interface PageTheme {
  id: string;
  name: string;
  category: 'minimal' | 'colorful' | 'dark' | 'professional' | 'creative';
  preview: string; // Background color or CSS gradient representation
  
  // Page-level styles
  pageBackground: string;        // CSS background value
  pageFontFamily: string;        // Font family name or var
  pageColor: string;             // Base text color
  pageAccentColor: string;       // Secondary highlights/accents
  borderColor?: string;          // Page borders

  // Block defaults
  headingStyle: { color: string; fontWeight: string; fontFamily?: string };
  paragraphStyle: { color: string; lineHeight: string };
  codeBlockStyle: { backgroundColor: string; borderColor: string };
  calloutStyle: { backgroundColor: string; borderColor: string };
  tableStyle: { headerBg: string; borderColor: string; stripedRows: boolean };
  linkStyle: { color: string; underline: boolean };
}

export const PAGE_THEMES: PageTheme[] = [
  // ─── MINIMAL CATEGORY ────────────────────────────────────────────────────────
  {
    id: "minimal",
    name: "Minimal Light",
    category: "minimal",
    preview: "#ffffff",
    pageBackground: "#ffffff",
    pageFontFamily: "var(--font-inter)",
    pageColor: "#1e293b",
    pageAccentColor: "#4f46e5",
    borderColor: "#f1f5f9",
    headingStyle: { color: "#0f172a", fontWeight: "700", fontFamily: "var(--font-inter)" },
    paragraphStyle: { color: "#334155", lineHeight: "1.7" },
    codeBlockStyle: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" },
    calloutStyle: { backgroundColor: "#f8fafc", borderColor: "#cbd5e1" },
    tableStyle: { headerBg: "#f8fafc", borderColor: "#cbd5e1", stripedRows: true },
    linkStyle: { color: "#4f46e5", underline: false },
  },
  {
    id: "notion-classic",
    name: "Notion Classic",
    category: "minimal",
    preview: "#fcfbfa",
    pageBackground: "#fcfbfa",
    pageFontFamily: "var(--font-inter)",
    pageColor: "#37352f",
    pageAccentColor: "#2eaadc",
    borderColor: "#edece9",
    headingStyle: { color: "#191711", fontWeight: "600", fontFamily: "var(--font-inter)" },
    paragraphStyle: { color: "#37352f", lineHeight: "1.65" },
    codeBlockStyle: { backgroundColor: "#f7f6f3", borderColor: "#edece9" },
    calloutStyle: { backgroundColor: "#f1f0ec", borderColor: "#edece9" },
    tableStyle: { headerBg: "#f7f6f3", borderColor: "#edece9", stripedRows: false },
    linkStyle: { color: "#2eaadc", underline: true },
  },
  {
    id: "japanese",
    name: "Japanese Zen",
    category: "minimal",
    preview: "#fbfaf8",
    pageBackground: "#fbfaf8",
    pageFontFamily: "var(--font-noto-serif)",
    pageColor: "#2d2d2d",
    pageAccentColor: "#8c2d19",
    borderColor: "#e6e1da",
    headingStyle: { color: "#1a1a1a", fontWeight: "600", fontFamily: "var(--font-noto-serif)" },
    paragraphStyle: { color: "#2d2d2d", lineHeight: "1.8" },
    codeBlockStyle: { backgroundColor: "#f3efe6", borderColor: "#e6e1da" },
    calloutStyle: { backgroundColor: "#f4ede1", borderColor: "#e6e1da" },
    tableStyle: { headerBg: "#f4ede1", borderColor: "#e6e1da", stripedRows: true },
    linkStyle: { color: "#8c2d19", underline: false },
  },
  {
    id: "minimal-dark",
    name: "Minimal Dark",
    category: "minimal",
    preview: "#121212",
    pageBackground: "#121212",
    pageFontFamily: "var(--font-inter)",
    pageColor: "#e2e8f0",
    pageAccentColor: "#818cf8",
    borderColor: "#1e293b",
    headingStyle: { color: "#f8fafc", fontWeight: "700", fontFamily: "var(--font-inter)" },
    paragraphStyle: { color: "#cbd5e1", lineHeight: "1.7" },
    codeBlockStyle: { backgroundColor: "#1e293b", borderColor: "#334155" },
    calloutStyle: { backgroundColor: "#1e293b", borderColor: "#334155" },
    tableStyle: { headerBg: "#1e293b", borderColor: "#334155", stripedRows: true },
    linkStyle: { color: "#818cf8", underline: false },
  },

  // ─── COLORFUL CATEGORY ───────────────────────────────────────────────────────
  {
    id: "ocean",
    name: "Ocean Mist",
    category: "colorful",
    preview: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
    pageBackground: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
    pageFontFamily: "var(--font-inter)",
    pageColor: "#0f172a",
    pageAccentColor: "#0284c7",
    borderColor: "#bae6fd",
    headingStyle: { color: "#0369a1", fontWeight: "700" },
    paragraphStyle: { color: "#0f172a", lineHeight: "1.7" },
    codeBlockStyle: { backgroundColor: "rgba(255, 255, 255, 0.6)", borderColor: "#93c5fd" },
    calloutStyle: { backgroundColor: "rgba(255, 255, 255, 0.4)", borderColor: "#93c5fd" },
    tableStyle: { headerBg: "rgba(255, 255, 255, 0.7)", borderColor: "#93c5fd", stripedRows: true },
    linkStyle: { color: "#0284c7", underline: true },
  },
  {
    id: "forest",
    name: "Misty Forest",
    category: "colorful",
    preview: "#f0fdf4",
    pageBackground: "#f0fdf4",
    pageFontFamily: "var(--font-inter)",
    pageColor: "#064e3b",
    pageAccentColor: "#059669",
    borderColor: "#d1fae5",
    headingStyle: { color: "#065f46", fontWeight: "700" },
    paragraphStyle: { color: "#064e3b", lineHeight: "1.75" },
    codeBlockStyle: { backgroundColor: "#e6fcf0", borderColor: "#a7f3d0" },
    calloutStyle: { backgroundColor: "#e6fcf0", borderColor: "#a7f3d0" },
    tableStyle: { headerBg: "#d1fae5", borderColor: "#a7f3d0", stripedRows: true },
    linkStyle: { color: "#059669", underline: true },
  },
  {
    id: "sunset",
    name: "Sunset Fade",
    category: "colorful",
    preview: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
    pageBackground: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
    pageFontFamily: "var(--font-plus-jakarta-sans)",
    pageColor: "#431407",
    pageAccentColor: "#ea580c",
    borderColor: "#fed7aa",
    headingStyle: { color: "#9a3412", fontWeight: "700" },
    paragraphStyle: { color: "#431407", lineHeight: "1.7" },
    codeBlockStyle: { backgroundColor: "rgba(255,255,255,0.6)", borderColor: "#fdba74" },
    calloutStyle: { backgroundColor: "rgba(255,255,255,0.4)", borderColor: "#fdba74" },
    tableStyle: { headerBg: "rgba(255,255,255,0.7)", borderColor: "#fdba74", stripedRows: true },
    linkStyle: { color: "#ea580c", underline: true },
  },
  {
    id: "pastel",
    name: "Sweet Pastel",
    category: "colorful",
    preview: "#fff5f5",
    pageBackground: "#fff5f5",
    pageFontFamily: "var(--font-plus-jakarta-sans)",
    pageColor: "#4c1d95",
    pageAccentColor: "#db2777",
    borderColor: "#fce7f3",
    headingStyle: { color: "#831843", fontWeight: "700" },
    paragraphStyle: { color: "#4c1d95", lineHeight: "1.7" },
    codeBlockStyle: { backgroundColor: "#fef2f2", borderColor: "#fbcfe8" },
    calloutStyle: { backgroundColor: "#fdf2f8", borderColor: "#fbcfe8" },
    tableStyle: { headerBg: "#fce7f3", borderColor: "#fbcfe8", stripedRows: true },
    linkStyle: { color: "#db2777", underline: true },
  },

  // ─── DARK CATEGORY ───────────────────────────────────────────────────────────
  {
    id: "dark-slate",
    name: "Dark Slate",
    category: "dark",
    preview: "#0f172a",
    pageBackground: "#0f172a",
    pageFontFamily: "var(--font-inter)",
    pageColor: "#e2e8f0",
    pageAccentColor: "#6366f1",
    borderColor: "#1e293b",
    headingStyle: { color: "#38bdf8", fontWeight: "700" },
    paragraphStyle: { color: "#94a3b8", lineHeight: "1.75" },
    codeBlockStyle: { backgroundColor: "#1e293b", borderColor: "#334155" },
    calloutStyle: { backgroundColor: "#1e293b", borderColor: "#334155" },
    tableStyle: { headerBg: "#1e293b", borderColor: "#334155", stripedRows: true },
    linkStyle: { color: "#38bdf8", underline: false },
  },
  {
    id: "dracula",
    name: "Dracula Goth",
    category: "dark",
    preview: "#282a36",
    pageBackground: "#282a36",
    pageFontFamily: "var(--font-fira-code)",
    pageColor: "#f8f8f2",
    pageAccentColor: "#ff79c6",
    borderColor: "#44475a",
    headingStyle: { color: "#bd93f9", fontWeight: "600", fontFamily: "var(--font-fira-code)" },
    paragraphStyle: { color: "#f8f8f2", lineHeight: "1.65" },
    codeBlockStyle: { backgroundColor: "#1d1f27", borderColor: "#44475a" },
    calloutStyle: { backgroundColor: "#44475a", borderColor: "#6272a4" },
    tableStyle: { headerBg: "#1d1f27", borderColor: "#44475a", stripedRows: true },
    linkStyle: { color: "#ff79c6", underline: false },
  },
  {
    id: "solarized-dark",
    name: "Solar Dark",
    category: "dark",
    preview: "#002b36",
    pageBackground: "#002b36",
    pageFontFamily: "var(--font-fira-code)",
    pageColor: "#839496",
    pageAccentColor: "#268bd2",
    borderColor: "#073642",
    headingStyle: { color: "#b58900", fontWeight: "600" },
    paragraphStyle: { color: "#93a1a1", lineHeight: "1.7" },
    codeBlockStyle: { backgroundColor: "#073642", borderColor: "#586e75" },
    calloutStyle: { backgroundColor: "#073642", borderColor: "#586e75" },
    tableStyle: { headerBg: "#073642", borderColor: "#586e75", stripedRows: true },
    linkStyle: { color: "#268bd2", underline: false },
  },
  {
    id: "nord",
    name: "Nord Ice",
    category: "dark",
    preview: "#2e3440",
    pageBackground: "#2e3440",
    pageFontFamily: "var(--font-inter)",
    pageColor: "#d8dee9",
    pageAccentColor: "#88c0d0",
    borderColor: "#3b4252",
    headingStyle: { color: "#8fbcbb", fontWeight: "600" },
    paragraphStyle: { color: "#e5e9f0", lineHeight: "1.65" },
    codeBlockStyle: { backgroundColor: "#3b4252", borderColor: "#434c5e" },
    calloutStyle: { backgroundColor: "#3b4252", borderColor: "#434c5e" },
    tableStyle: { headerBg: "#3b4252", borderColor: "#434c5e", stripedRows: true },
    linkStyle: { color: "#88c0d0", underline: false },
  },
  {
    id: "midnight",
    name: "Deep Midnight",
    category: "dark",
    preview: "#020617",
    pageBackground: "#020617",
    pageFontFamily: "var(--font-inter)",
    pageColor: "#e2e8f0",
    pageAccentColor: "#38bdf8",
    borderColor: "#0f172a",
    headingStyle: { color: "#ffffff", fontWeight: "700" },
    paragraphStyle: { color: "#94a3b8", lineHeight: "1.75" },
    codeBlockStyle: { backgroundColor: "#0f172a", borderColor: "#1e293b" },
    calloutStyle: { backgroundColor: "#0f172a", borderColor: "#1e293b" },
    tableStyle: { headerBg: "#0f172a", borderColor: "#1e293b", stripedRows: true },
    linkStyle: { color: "#38bdf8", underline: false },
  },

  // ─── PROFESSIONAL CATEGORY ───────────────────────────────────────────────────
  {
    id: "paper",
    name: "Paper / Book",
    category: "professional",
    preview: "#f5ece1",
    pageBackground: "#f5ece1",
    pageFontFamily: "var(--font-merriweather)",
    pageColor: "#2a1e17",
    pageAccentColor: "#c2410c",
    borderColor: "#e3d2be",
    headingStyle: { color: "#1c140f", fontWeight: "700", fontFamily: "var(--font-playfair-display)" },
    paragraphStyle: { color: "#2a1e17", lineHeight: "1.8" },
    codeBlockStyle: { backgroundColor: "#ebdcd0", borderColor: "#e3d2be" },
    calloutStyle: { backgroundColor: "#ece0d3", borderColor: "#e3d2be" },
    tableStyle: { headerBg: "#ebdcd0", borderColor: "#e3d2be", stripedRows: false },
    linkStyle: { color: "#c2410c", underline: true },
  },
  {
    id: "academic",
    name: "Academic Formal",
    category: "professional",
    preview: "#ffffff",
    pageBackground: "#ffffff",
    pageFontFamily: "var(--font-playfair-display)",
    pageColor: "#111111",
    pageAccentColor: "#111111",
    borderColor: "#d1d5db",
    headingStyle: { color: "#000000", fontWeight: "600", fontFamily: "var(--font-playfair-display)" },
    paragraphStyle: { color: "#222222", lineHeight: "1.9" },
    codeBlockStyle: { backgroundColor: "#f9fafb", borderColor: "#e5e7eb" },
    calloutStyle: { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" },
    tableStyle: { headerBg: "#f3f4f6", borderColor: "#d1d5db", stripedRows: false },
    linkStyle: { color: "#000000", underline: true },
  },
  {
    id: "solarized-light",
    name: "Solar Light",
    category: "professional",
    preview: "#fdf6e3",
    pageBackground: "#fdf6e3",
    pageFontFamily: "var(--font-inter)",
    pageColor: "#657b83",
    pageAccentColor: "#cb4b16",
    borderColor: "#eee8d5",
    headingStyle: { color: "#586e75", fontWeight: "600" },
    paragraphStyle: { color: "#657b83", lineHeight: "1.7" },
    codeBlockStyle: { backgroundColor: "#eee8d5", borderColor: "#cbd5e1" },
    calloutStyle: { backgroundColor: "#eee8d5", borderColor: "#cbd5e1" },
    tableStyle: { headerBg: "#eee8d5", borderColor: "#cbd5e1", stripedRows: true },
    linkStyle: { color: "#cb4b16", underline: true },
  },
  {
    id: "magazine",
    name: "Magazine Column",
    category: "professional",
    preview: "#faf9f6",
    pageBackground: "#faf9f6",
    pageFontFamily: "var(--font-playfair-display)",
    pageColor: "#222222",
    pageAccentColor: "#dc2626",
    borderColor: "#e5e7eb",
    headingStyle: { color: "#000000", fontWeight: "900", fontFamily: "var(--font-playfair-display)" },
    paragraphStyle: { color: "#222222", lineHeight: "1.85" },
    codeBlockStyle: { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" },
    calloutStyle: { backgroundColor: "#faf9f6", borderColor: "#dc2626" },
    tableStyle: { headerBg: "#e5e7eb", borderColor: "#d1d5db", stripedRows: false },
    linkStyle: { color: "#dc2626", underline: true },
  },

  // ─── CREATIVE CATEGORY ───────────────────────────────────────────────────────
  {
    id: "neon",
    name: "Neon Hacker",
    category: "creative",
    preview: "#000000",
    pageBackground: "#000000",
    pageFontFamily: "var(--font-fira-code)",
    pageColor: "#39ff14",
    pageAccentColor: "#ff007f",
    borderColor: "#39ff14",
    headingStyle: { color: "#ff007f", fontWeight: "700", fontFamily: "var(--font-fira-code)" },
    paragraphStyle: { color: "#39ff14", lineHeight: "1.6" },
    codeBlockStyle: { backgroundColor: "#0a0a0a", borderColor: "#39ff14" },
    calloutStyle: { backgroundColor: "#0a0a0a", borderColor: "#ff007f" },
    tableStyle: { headerBg: "#0a0a0a", borderColor: "#39ff14", stripedRows: true },
    linkStyle: { color: "#00ffff", underline: true },
  },
  {
    id: "creative",
    name: "Creative Splash",
    category: "creative",
    preview: "linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)",
    pageBackground: "linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)",
    pageFontFamily: "var(--font-caveat)",
    pageColor: "#4a044e",
    pageAccentColor: "#c084fc",
    borderColor: "#f5d0fe",
    headingStyle: { color: "#701a75", fontWeight: "700", fontFamily: "var(--font-caveat)" },
    paragraphStyle: { color: "#4a044e", lineHeight: "1.8" },
    codeBlockStyle: { backgroundColor: "#faf5ff", borderColor: "#e9d5ff" },
    calloutStyle: { backgroundColor: "#fdf4ff", borderColor: "#e9d5ff" },
    tableStyle: { headerBg: "#f3e8ff", borderColor: "#e9d5ff", stripedRows: true },
    linkStyle: { color: "#a855f7", underline: true },
  },
  {
    id: "notebook",
    name: "Lined Notebook",
    category: "creative",
    preview: "#fffdf9",
    pageBackground: "#fffdf9",
    pageFontFamily: "var(--font-caveat)",
    pageColor: "#1e3a8a",
    pageAccentColor: "#ef4444",
    borderColor: "#bfdbfe",
    headingStyle: { color: "#ef4444", fontWeight: "700", fontFamily: "var(--font-caveat)" },
    paragraphStyle: { color: "#1e3a8a", lineHeight: "1.6" },
    codeBlockStyle: { backgroundColor: "#f8fafc", borderColor: "#bfdbfe" },
    calloutStyle: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
    tableStyle: { headerBg: "#eff6ff", borderColor: "#bfdbfe", stripedRows: false },
    linkStyle: { color: "#3b82f6", underline: true },
  },
  {
    id: "code-editor",
    name: "Code Editor",
    category: "creative",
    preview: "#1e1e1e",
    pageBackground: "#1e1e1e",
    pageFontFamily: "var(--font-fira-code)",
    pageColor: "#d4d4d4",
    pageAccentColor: "#569cd6",
    borderColor: "#333333",
    headingStyle: { color: "#4ec9b0", fontWeight: "600", fontFamily: "var(--font-fira-code)" },
    paragraphStyle: { color: "#d4d4d4", lineHeight: "1.7" },
    codeBlockStyle: { backgroundColor: "#1e1e1e", borderColor: "#333333" },
    calloutStyle: { backgroundColor: "#252526", borderColor: "#3c3c3c" },
    tableStyle: { headerBg: "#252526", borderColor: "#333333", stripedRows: true },
    linkStyle: { color: "#569cd6", underline: false },
  },
];

/**
 * Generates raw CSS rules to override page and editor block defaults
 * based on the active PageTheme and optional custom user overrides.
 */
export function generateThemeCSS(
  ui: { page_theme?: string; custom_theme?: Partial<PageTheme>; page_background_image?: string | null } | undefined
): string {
  if (!ui) return "";
  
  const baseTheme = PAGE_THEMES.find((t) => t.id === ui.page_theme) || PAGE_THEMES[0];
  
  // Merge baseTheme and custom overrides
  const custom = ui.custom_theme || {};
  const theme = {
    ...baseTheme,
    ...custom,
    headingStyle: { ...baseTheme.headingStyle, ...(custom.headingStyle || {}) },
    paragraphStyle: { ...baseTheme.paragraphStyle, ...(custom.paragraphStyle || {}) },
    codeBlockStyle: { ...baseTheme.codeBlockStyle, ...(custom.codeBlockStyle || {}) },
    calloutStyle: { ...baseTheme.calloutStyle, ...(custom.calloutStyle || {}) },
    tableStyle: { ...baseTheme.tableStyle, ...(custom.tableStyle || {}) },
    linkStyle: { ...baseTheme.linkStyle, ...(custom.linkStyle || {}) },
  };

  const bgStyle = ui.page_background_image 
    ? `background-image: url(${ui.page_background_image}) !important; background-size: cover !important; background-position: center !important;`
    : `background: ${theme.pageBackground} !important;`;

  return `
    .tiptap-editor .ProseMirror .page {
      ${bgStyle}
      color: ${theme.pageColor} !important;
      font-family: ${theme.pageFontFamily} !important;
      ${theme.borderColor ? `border-color: ${theme.borderColor} !important;` : ""}
    }

    .tiptap-editor .ProseMirror .page h1,
    .tiptap-editor .ProseMirror .page h2,
    .tiptap-editor .ProseMirror .page h3,
    .tiptap-editor .ProseMirror .page h4 {
      color: ${theme.headingStyle.color} !important;
      font-weight: ${theme.headingStyle.fontWeight} !important;
      ${theme.headingStyle.fontFamily ? `font-family: ${theme.headingStyle.fontFamily} !important;` : ""}
    }

    .tiptap-editor .ProseMirror .page p,
    .tiptap-editor .ProseMirror .page li {
      color: ${theme.paragraphStyle.color} !important;
      line-height: ${theme.paragraphStyle.lineHeight} !important;
    }

    .tiptap-editor .ProseMirror .page code {
      background-color: ${theme.codeBlockStyle.backgroundColor} !important;
      border-color: ${theme.codeBlockStyle.borderColor} !important;
      color: ${theme.pageAccentColor} !important;
    }

    .tiptap-editor .ProseMirror .page pre {
      background-color: ${theme.codeBlockStyle.backgroundColor} !important;
      border-color: ${theme.codeBlockStyle.borderColor} !important;
    }

    .tiptap-editor .ProseMirror .page .callout-block {
      background-color: ${theme.calloutStyle.backgroundColor} !important;
      border-color: ${theme.calloutStyle.borderColor} !important;
    }

    .tiptap-editor .ProseMirror .page table,
    .tiptap-editor .ProseMirror .page table td,
    .tiptap-editor .ProseMirror .page table th {
      border-color: ${theme.tableStyle.borderColor} !important;
    }

    .tiptap-editor .ProseMirror .page table th {
      background-color: ${theme.tableStyle.headerBg} !important;
    }

    .tiptap-editor .ProseMirror .page table tr:nth-child(even) {
      background-color: ${theme.tableStyle.stripedRows ? 'rgba(0,0,0,0.02)' : 'transparent'} !important;
    }

    .tiptap-editor .ProseMirror .page a,
    .tiptap-editor .ProseMirror .page span[data-wiki-link] {
      color: ${theme.linkStyle.color} !important;
      text-decoration: ${theme.linkStyle.underline ? 'underline' : 'none'} !important;
    }
  `.replace(/\s+/g, " ");
}
