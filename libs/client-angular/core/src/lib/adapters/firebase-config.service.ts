import { Injectable, inject, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Firestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { timeout, catchError, map, take } from 'rxjs/operators';
import { firstValueFrom, of, Observable } from 'rxjs';

import {
  RuntimeConfig,
  ResourceLink,
  DEFAULT_CONFIG,
  ThemePalettesConfig,
} from '@legislative-tracker/shared/models';
import { ConfigService } from '../services/config.service';
import { ThemeService } from '../services/theme.service';
import { FIREBASE_FIRESTORE } from '../firebase-tokens.token';

const GITHUB_RESOURCE: ResourceLink = {
  title: 'GitHub Repository',
  description: 'Access the source code under GNU AGPL v3.0.',
  url: 'https://github.com/legislative-tracker/reimagined-parakeet/',
  icon: 'code',
  actionLabel: 'View Code',
};

export const RUNTIME_CONFIG_STORAGE_KEY = 'legislative_tracker_runtime_config';

/**
 * Firebase-backed implementation of ConfigService.
 * Subscribes to `configurations/global` in Firestore, caches runtime configuration
 * in localStorage, and applies dynamic Material theme palettes.
 */
@Injectable({ providedIn: 'root' })
export class FirebaseConfigService implements ConfigService {
  private readonly document = inject(DOCUMENT);
  private readonly themeService = inject(ThemeService, { optional: true });
  private readonly firestore = inject<Firestore>(FIREBASE_FIRESTORE, {
    optional: true,
  });

  readonly config = signal<RuntimeConfig>(this.getInitialConfig());

  constructor() {
    effect(() => {
      const branding = this.config().branding;

      if (branding.faviconUrl) {
        this.updateFavicon(branding.faviconUrl);
      }

      this.applyAngularMaterialTheme(branding.primaryColor, branding.palettes);
    });
  }

  private getInitialConfig(): RuntimeConfig {
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(RUNTIME_CONFIG_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          return {
            ...DEFAULT_CONFIG,
            ...parsed,
            organization: {
              ...DEFAULT_CONFIG.organization,
              ...parsed?.organization,
            },
            branding: {
              ...DEFAULT_CONFIG.branding,
              ...parsed?.branding,
              palettes: parsed?.branding?.palettes,
            },
          };
        }
      } catch (e) {
        console.warn(
          'Failed to read cached RuntimeConfig from localStorage',
          e,
        );
      }
    }
    return DEFAULT_CONFIG;
  }

  private stashConfig(cfg: RuntimeConfig): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(RUNTIME_CONFIG_STORAGE_KEY, JSON.stringify(cfg));
      } catch (e) {
        console.warn('Failed to stash RuntimeConfig in localStorage', e);
      }
    }
  }

  async save(newConfig: Partial<RuntimeConfig>): Promise<void> {
    if (!this.firestore) return;
    try {
      const configDoc = doc(this.firestore, 'configurations/global');
      await setDoc(configDoc, newConfig, { merge: true });

      this.config.update((current) => {
        const updated = { ...current, ...newConfig };
        this.stashConfig(updated);
        return updated;
      });
    } catch (e) {
      console.error('Failed to save configuration', e);
      throw e;
    }
  }

  async load(): Promise<void> {
    if (!this.firestore) return;
    try {
      const configDoc = doc(this.firestore, 'configurations/global');

      const data$ = new Observable<any>((subscriber) => {
        return onSnapshot(
          configDoc,
          (snapshot) => subscriber.next(snapshot.data()),
          (err) => subscriber.error(err),
        );
      }).pipe(
        map((data) => data as RuntimeConfig),
        timeout(3000),
        catchError((err) => {
          console.warn('Config fetch failed, using cached/defaults.', err);
          return of(null);
        }),
      );

      data$.subscribe((remoteConfig) => {
        if (remoteConfig) {
          this.config.update((current) => {
            const dynamicResources = remoteConfig.resources || [];
            const uniqueDynamic = dynamicResources.filter(
              (r) => r.url !== GITHUB_RESOURCE.url,
            );

            const updated: RuntimeConfig = {
              ...current,
              organization: {
                ...current.organization,
                ...remoteConfig.organization,
              },
              branding: { ...current.branding, ...remoteConfig.branding },
              resources: [GITHUB_RESOURCE, ...uniqueDynamic],
            };

            this.stashConfig(updated);
            return updated;
          });
        }
      });

      await firstValueFrom(data$.pipe(take(1)));
    } catch (e) {
      console.error('Error loading config', e);
      return Promise.resolve();
    }
  }

  private updateFavicon(url: string) {
    let link: HTMLLinkElement | null =
      this.document.querySelector("link[rel*='icon']");
    if (!link) {
      link = this.document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'icon';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }

  private async applyAngularMaterialTheme(
    hexColor: string,
    palettes?: ThemePalettesConfig,
  ) {
    if (this.themeService) {
      this.themeService.setPalettes(palettes, false);
      this.themeService.setPrimaryColor(hexColor);
      return;
    }

    try {
      const { argbFromHex, themeFromSourceColor, hexFromArgb } =
        await import('@material/material-color-utilities');

      const flattenSchemeToCssVars = (scheme: any): Record<string, string> => {
        const mapping: Record<string, string> = {};
        const toHex = (argb: number) => hexFromArgb(argb);

        for (const [key, value] of Object.entries(scheme.toJSON())) {
          if (typeof value !== 'number') continue;
          const kebabKey = key
            .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
            .toLowerCase();
          mapping[`--mat-sys-color-${kebabKey}`] = toHex(value);
          mapping[`--mat-sys-${kebabKey}`] = toHex(value);
        }
        return mapping;
      };

      const sourceColor = argbFromHex(hexColor);
      const theme = themeFromSourceColor(sourceColor);
      const scheme = theme.schemes.light;
      const properties = flattenSchemeToCssVars(scheme);

      const root = this.document.documentElement;
      for (const [key, value] of Object.entries(properties)) {
        root.style.setProperty(key, value);
      }
    } catch (e) {
      console.error('Failed to generate dynamic theme', e);
    }
  }
}
