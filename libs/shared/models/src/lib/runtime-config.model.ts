/**
 * Color palette definitions for a single theme mode (light or dark).
 */
export interface ModePaletteConfig {
  /** Hex color code for the primary brand color. */
  primary?: string;
  /** Hex color code for the secondary accent color. */
  secondary?: string;
  /** Hex color code for tertiary highlights. */
  tertiary?: string;
  /** Hex color code for neutral background/surface colors. */
  neutral?: string;
  /** Hex color code for neutral variant outlines/surfaces. */
  neutralVariant?: string;
  /** Hex color code for semantic error state. */
  error?: string;
  /** Optional custom CSS variable overrides. */
  customOverrides?: Record<string, string>;
}

/**
 * Material Theme palette configuration for light and dark modes.
 */
export interface ThemePalettesConfig {
  /** Whether dynamic theme palette generation is enabled. */
  enabled: boolean;
  /** Palette overrides for light theme. */
  light?: ModePaletteConfig;
  /** Palette overrides for dark theme. */
  dark?: ModePaletteConfig;
}

/**
 * Client runtime configuration structure loaded from assets/config.json.
 */
export type RuntimeConfig = {
  /** Sponsoring organization metadata. */
  organization: {
    /** Organization display name. */
    name: string;
    /** Organization website URL. */
    url: string;
  };
  /** UI branding and visual appearance configurations. */
  branding: {
    /** Primary theme hex color code. */
    primaryColor: string;
    /** URL to organization/app logo image. */
    logoUrl: string;
    /** URL to favicon icon. */
    faviconUrl: string;
    /** Default dark mode state. */
    darkMode: boolean;
    /** Advanced theme palette configurations. */
    palettes?: ThemePalettesConfig;
  };
  /** Resource links displayed in navigation and sidebars. */
  resources: ResourceLink[];
  /** Optional list of enabled plugin IDs or jurisdiction codes (e.g. ['us-ny', 'leg-us-nj']). Defaults to all installed plugins when omitted. */
  enabledPlugins?: string[];
};

/**
 * External resource link definition.
 */
export type ResourceLink = {
  /** Display title of the resource. */
  title: string;
  /** Description of what the resource contains. */
  description: string;
  /** Target link URL. */
  url: string;
  /** Material icon name or FontAwesome icon class. */
  icon: string;
  /** Call-to-action button text. */
  actionLabel: string;
};

/**
 * Default fallback runtime configuration used when no external config is provided.
 */
export const DEFAULT_CONFIG: RuntimeConfig = {
  organization: {
    name: 'OrgName',
    url: 'http://neverssl.com',
  },
  branding: {
    logoUrl: 'assets/default_logo.png',
    primaryColor: '#673ab7',
    faviconUrl: 'favicon.ico',
    darkMode: false,
  },
  resources: [
    {
      title: 'GitHub Repository',
      description: 'Access the source code under GNU AGPL v3.0.',
      url: 'https://github.com/legislative-tracker/legislative-tracker/',
      icon: 'code',
      actionLabel: 'View Code',
    },
  ],
};
