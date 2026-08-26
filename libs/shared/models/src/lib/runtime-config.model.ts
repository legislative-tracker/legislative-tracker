export interface ModePaletteConfig {
  primary?: string;
  secondary?: string;
  tertiary?: string;
  neutral?: string;
  neutralVariant?: string;
  error?: string;
  customOverrides?: Record<string, string>;
}

export interface ThemePalettesConfig {
  enabled: boolean;
  light?: ModePaletteConfig;
  dark?: ModePaletteConfig;
}

export type RuntimeConfig = {
  organization: {
    name: string;
    url: string;
  };
  branding: {
    primaryColor: string;
    logoUrl: string;
    faviconUrl: string;
    darkMode: boolean;
    palettes?: ThemePalettesConfig;
  };
  resources: ResourceLink[];
};

export type ResourceLink = {
  title: string;
  description: string;
  url: string;
  icon: string;
  actionLabel: string;
};

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
