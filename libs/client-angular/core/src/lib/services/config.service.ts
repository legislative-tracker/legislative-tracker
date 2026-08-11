import { Injectable, inject, signal, effect, Injector } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { timeout, catchError, map, take } from "rxjs/operators";
import { firstValueFrom, of } from "rxjs";
import { FirebaseApp } from "@angular/fire/app";

// App imports
import {
  RuntimeConfig,
  ResourceLink,
  DEFAULT_CONFIG,
} from "@legislative-tracker/shared/models";

// Due to licensing, the GitHub repo must ALWAYS be included
const GITHUB_RESOURCE: ResourceLink = {
  title: "GitHub Repository",
  description: "Access the source code under GNU AGPL v3.0.",
  url: "https://github.com/legislative-tracker/reimagined-parakeet/",
  icon: "code",
  actionLabel: "View Code",
};

@Injectable({ providedIn: "root" })
export class ConfigService {
  private readonly document = inject(DOCUMENT);
  private readonly app = inject(FirebaseApp);

  readonly config = signal<RuntimeConfig>(DEFAULT_CONFIG);

  constructor() {
    effect(() => {
      const branding = this.config().branding;

      // Update Favicon
      if (branding.faviconUrl) {
        this.updateFavicon(branding.faviconUrl);
      }

      // Update Theme (Async, heavy dependencies)
      this.applyAngularMaterialTheme(branding.primaryColor);
    });
  }

  async save(newConfig: Partial<RuntimeConfig>): Promise<void> {
    try {
      const { getFirestore, doc, setDoc } =
        await import("@angular/fire/firestore");

      const firestore = getFirestore(this.app);
      const configDoc = doc(firestore, "configurations/global");

      await setDoc(configDoc, newConfig, { merge: true });

      this.config.update((current) => ({ ...current, ...newConfig }));
    } catch (e) {
      console.error("Failed to save configuration", e);
      throw e;
    }
  }

  async load(): Promise<void> {
    try {
      // Destructure 'Firestore' (the Class/Token) alongside the functions
      const { getFirestore, doc, docData } =
        await import("@angular/fire/firestore");

      const firestore = getFirestore(this.app);
      const configDoc = doc(firestore, "configurations/global");

      const data$ = docData(configDoc).pipe(
        map((data) => data as RuntimeConfig),
        timeout(3000),
        catchError((err) => {
          console.warn("Config fetch failed, using defaults.", err);
          return of(null);
        }),
      );

      data$.subscribe((remoteConfig) => {
        if (remoteConfig) {
          this.config.update((current) => {
            // Get dynamic resources from Firestore (or empty array if none)
            const dynamicResources = remoteConfig.resources || [];

            // Filter out duplicates to be safe
            // (Prevents admin from accidentally adding GitHub again)
            const uniqueDynamic = dynamicResources.filter(
              (r) => r.url !== GITHUB_RESOURCE.url,
            );

            return {
              ...current,
              organization: {
                ...current.organization,
                ...remoteConfig.organization,
              },
              branding: { ...current.branding, ...remoteConfig.branding },

              // MERGE: Hardcoded First + Dynamic Second
              resources: [GITHUB_RESOURCE, ...uniqueDynamic],
            };
          });
        }
      });

      await firstValueFrom(data$.pipe(take(1)));
    } catch (e) {
      console.error("Error loading config", e);
      // Ensure app doesn't crash if Firestore fails to load
      return Promise.resolve();
    }
  }

  private updateFavicon(url: string) {
    let link: HTMLLinkElement | null =
      this.document.querySelector("link[rel*='icon']");
    if (!link) {
      link = this.document.createElement("link");
      link.type = "image/x-icon";
      link.rel = "icon";
      this.document.head.appendChild(link);
    }
    link.href = url;
  }

  private async applyAngularMaterialTheme(hexColor: string) {
    try {
      // Dynamic import for Material Color Utilities
      const { argbFromHex, themeFromSourceColor, hexFromArgb } =
        await import("@material/material-color-utilities");

      // Scoped helper to flatten the scheme
      const flattenSchemeToCssVars = (scheme: any): Record<string, string> => {
        const mapping: Record<string, string> = {};
        const toHex = (argb: number) => hexFromArgb(argb);

        for (const [key, value] of Object.entries(scheme.toJSON())) {
          if (typeof value !== "number") continue;
          const kebabKey = key
            .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2")
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
      console.error("Failed to generate dynamic theme", e);
    }
  }
}
