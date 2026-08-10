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
    logoUrl: 'assets/default-logo.png',
    primaryColor: '#673ab7',
    faviconUrl: 'favicon.ico',
    darkMode: false,
  },
  resources: [
    {
      title: 'GitHub Repository',
      description: 'Access the source code under GNU AGPL v3.0.',
      url: 'https://github.com/legislative-tracker/reimagined-parakeet/',
      icon: 'code',
      actionLabel: 'View Code',
    },
  ],
};
