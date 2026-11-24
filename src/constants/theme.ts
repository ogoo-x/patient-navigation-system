/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "../global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    // Brand
    primary: "#187FF6", // Main blue (buttons, active states, links)
    primaryDark: "#0F5FCB", // Pressed / darker blue
    accent: "#EFC718", // Yellow accent (highlights, badges, CTAs)

    // Backgrounds
    background: "#FFFFFF", // Main screen background
    surface: "#F5F7FB", // Cards, search bars, secondary surfaces
    surfaceElevated: "#FFFFFF",

    // Text
    text: "#111827", // Primary text (ink)
    textMuted: "#6B7280", // Secondary / helper text
    textInverse: "#FFFFFF", // Text on primary buttons

    // UI elements
    border: "#E5E9F0",
    borderStrong: "#D1D5DB",
    danger: "#EF4444",
    success: "#22C55E",

    // Map specific
    mapBackground: "#F0F4F8",
    route: "#187FF6",
    pin: "#EFC718",
  },

  dark: {
    // Brand (slightly softened for dark backgrounds)
    primary: "#3B9BFF", // Brighter blue so it stays visible
    primaryDark: "#187FF6",
    accent: "#F5D76E", // Softer gold/yellow

    // Backgrounds
    background: "#0B1220", // Deep navy-black
    surface: "#121A2B", // Cards and elevated surfaces
    surfaceElevated: "#1A2438",

    // Text
    text: "#E8EDF7", // Soft white
    textMuted: "#9AA7BD", // Muted gray-blue
    textInverse: "#0B1220",

    // UI elements
    border: "#22304A",
    borderStrong: "#2E3F5C",
    danger: "#F87171",
    success: "#4ADE80",

    // Map specific
    mapBackground: "#0F172A",
    route: "#3B9BFF",
    pin: "#F5D76E",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
