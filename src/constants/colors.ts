/**
 * SkrimChat Master Color System
 * These are mapped into standard Tailwind CSS variables in index.css.
 */
export const COLORS = {
  primary: {
    neonPurple: "#B026FF",
    neonBlue: "#00F0FF",
  },
  background: {
    dark: "#0A0A0A",
    surface: "#141414",
    glass: "#1F1F1F",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "#A0A0A0",
    dim: "#666666",
  },
  accent: {
    success: "#00E676",
    danger: "#FF3D00",
    warning: "#FFEA00",
  }
} as const;
