import {
  Injectable,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

import {
  ThemePalettesConfig,
  ModePaletteConfig,
} from '@legislative-tracker/shared/models';

/**
 * Supported UI theme modes.
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Storage key used for persisting theme selection in browser localStorage.
 */
export const THEME_STORAGE_KEY = 'legislative_tracker_theme';

/**
 * Service responsible for managing UI theme modes (light, dark, system),
 * primary brand colors, and dynamic Material Theme CSS variable generation.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  /** Active user-selected theme mode signal. */
  readonly mode = signal<ThemeMode>(this.getInitialMode());
  /** Signal reflecting operating system dark mode preference. */
  readonly systemIsDark = signal<boolean>(this.getSystemDarkPreference());
  /** Active primary brand hex color. */
  readonly currentPrimaryColor = signal<string>('#673ab7');
  /** Advanced theme palettes configuration. */
  readonly palettes = signal<ThemePalettesConfig | undefined>(undefined);

  /** Computed boolean indicating whether the UI is currently rendered in dark mode. */
  readonly isDarkMode = computed<boolean>(() => {
    const currentMode = this.mode();
    if (currentMode === 'dark') return true;
    if (currentMode === 'light') return false;
    return this.systemIsDark();
  });

  constructor() {
    this.setupSystemThemeListener();
  }

  /**
   * Sets the active theme mode and persists choice to local storage.
   *
   * @param mode - Target theme mode ('light', 'dark', or 'system').
   */
  setThemeMode(mode: ThemeMode): void {
    this.mode.set(mode);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      }
    } catch (e) {
      console.warn('Failed to save theme to localStorage', e);
    }
    const isDark =
      mode === 'dark' ? true : mode === 'light' ? false : this.systemIsDark();
    this.applyTheme(this.currentPrimaryColor(), isDark);
  }

  /**
   * Updates the primary brand color and regenerates theme tokens.
   *
   * @param hexColor - 6-digit hex color code (e.g. '#673ab7').
   */
  setPrimaryColor(hexColor: string): void {
    if (hexColor) {
      this.currentPrimaryColor.set(hexColor);
      this.applyTheme(hexColor, this.isDarkMode());
    }
  }

  /**
   * Updates custom light and dark palette configurations.
   *
   * @param palettes - Custom ThemePalettesConfig object.
   * @param apply - Whether to apply theme changes immediately.
   */
  setPalettes(palettes?: ThemePalettesConfig, apply = true): void {
    this.palettes.set(palettes);
    if (apply) {
      this.applyTheme(this.currentPrimaryColor(), this.isDarkMode());
    }
  }

  private themeApplyVersion = 0;

  /**
   * Generates and injects Material 3 CSS custom properties onto the document root.
   *
   * @param hexColor - Base brand hex color.
   * @param isDark - Whether to generate dark mode tokens.
   */
  async applyTheme(
    hexColor: string = this.currentPrimaryColor(),
    isDark: boolean = this.isDarkMode(),
  ): Promise<void> {
    const version = ++this.themeApplyVersion;
    try {
      const {
        argbFromHex,
        themeFromSourceColor,
        hexFromArgb,
        CorePalette,
        TonalPalette,
        Scheme,
      } = await import('@material/material-color-utilities');

      if (version !== this.themeApplyVersion) {
        return;
      }

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

      const palettesConfig = this.palettes();
      let properties: Record<string, string> = {};

      const modeConfig = isDark ? palettesConfig?.dark : palettesConfig?.light;

      if (palettesConfig?.enabled && modeConfig) {
        const primaryHex = modeConfig.primary || hexColor;
        const primaryArgb = argbFromHex(primaryHex);
        const core = CorePalette.of(primaryArgb);

        if (modeConfig.secondary) {
          core.a2 = TonalPalette.fromInt(argbFromHex(modeConfig.secondary));
        }
        if (modeConfig.tertiary) {
          core.a3 = TonalPalette.fromInt(argbFromHex(modeConfig.tertiary));
        }
        if (modeConfig.neutral) {
          core.n1 = TonalPalette.fromInt(argbFromHex(modeConfig.neutral));
        }
        if (modeConfig.neutralVariant) {
          core.n2 = TonalPalette.fromInt(
            argbFromHex(modeConfig.neutralVariant),
          );
        }
        if (modeConfig.error) {
          core.error = TonalPalette.fromInt(argbFromHex(modeConfig.error));
        }

        const scheme = isDark
          ? Scheme.darkFromCorePalette(core)
          : Scheme.lightFromCorePalette(core);
        properties = flattenSchemeToCssVars(scheme);

        const getContrastingColor = (hex: string): string => {
          const clean = hex.replace('#', '');
          if (clean.length !== 6) return isDark ? '#ffffff' : '#000000';
          const r = parseInt(clean.substring(0, 2), 16) || 0;
          const g = parseInt(clean.substring(2, 4), 16) || 0;
          const b = parseInt(clean.substring(4, 6), 16) || 0;
          const yiq = (r * 299 + g * 587 + b * 114) / 1000;
          return yiq >= 128 ? '#000000' : '#ffffff';
        };

        // Directly apply the exact user-defined hex colors
        if (modeConfig.primary) {
          properties['--mat-sys-primary'] = modeConfig.primary;
          properties['--mat-sys-color-primary'] = modeConfig.primary;
          const onColor = getContrastingColor(modeConfig.primary);
          properties['--mat-sys-on-primary'] = onColor;
          properties['--mat-sys-color-on-primary'] = onColor;
        }
        if (modeConfig.secondary) {
          properties['--mat-sys-secondary'] = modeConfig.secondary;
          properties['--mat-sys-color-secondary'] = modeConfig.secondary;
          const onColor = getContrastingColor(modeConfig.secondary);
          properties['--mat-sys-on-secondary'] = onColor;
          properties['--mat-sys-color-on-secondary'] = onColor;
        }
        if (modeConfig.tertiary) {
          properties['--mat-sys-tertiary'] = modeConfig.tertiary;
          properties['--mat-sys-color-tertiary'] = modeConfig.tertiary;
          const onColor = getContrastingColor(modeConfig.tertiary);
          properties['--mat-sys-on-tertiary'] = onColor;
          properties['--mat-sys-color-on-tertiary'] = onColor;
        }
        if (modeConfig.neutral) {
          properties['--mat-sys-surface'] = modeConfig.neutral;
          properties['--mat-sys-color-surface'] = modeConfig.neutral;
          properties['--mat-sys-background'] = modeConfig.neutral;
          properties['--mat-sys-color-background'] = modeConfig.neutral;
          properties['--mat-sys-surface-container'] = modeConfig.neutral;
          properties['--mat-sys-surface-container-low'] = modeConfig.neutral;
          const onColor = getContrastingColor(modeConfig.neutral);
          properties['--mat-sys-on-surface'] = onColor;
          properties['--mat-sys-color-on-surface'] = onColor;
        }
        if (modeConfig.neutralVariant) {
          properties['--mat-sys-surface-variant'] = modeConfig.neutralVariant;
          properties['--mat-sys-color-surface-variant'] =
            modeConfig.neutralVariant;
          properties['--mat-sys-outline'] = modeConfig.neutralVariant;
          properties['--mat-sys-color-outline'] = modeConfig.neutralVariant;
          properties['--mat-sys-outline-variant'] = modeConfig.neutralVariant;
        }
        if (modeConfig.error) {
          properties['--mat-sys-error'] = modeConfig.error;
          properties['--mat-sys-color-error'] = modeConfig.error;
          const onColor = getContrastingColor(modeConfig.error);
          properties['--mat-sys-on-error'] = onColor;
          properties['--mat-sys-color-on-error'] = onColor;
        }

        if (modeConfig.customOverrides) {
          for (const [key, val] of Object.entries(modeConfig.customOverrides)) {
            if (val) {
              const cleanKey = key.replace(
                /^(--mat-sys-color-|--mat-sys-)/,
                '',
              );
              properties[`--mat-sys-color-${cleanKey}`] = val;
              properties[`--mat-sys-${cleanKey}`] = val;
            }
          }
        }
      } else {
        const sourceColor = argbFromHex(hexColor);
        const theme = themeFromSourceColor(sourceColor);
        const scheme = isDark ? theme.schemes.dark : theme.schemes.light;
        properties = flattenSchemeToCssVars(scheme);
      }

      const root = this.document.documentElement;
      for (const [key, value] of Object.entries(properties)) {
        root.style.setProperty(key, value);
      }

      root.classList.toggle('dark-theme', isDark);
      root.style.colorScheme = isDark ? 'dark' : 'light';
    } catch (e) {
      console.error('Failed to generate dynamic theme', e);
    }
  }

  private getInitialMode(): ThemeMode {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          return stored;
        }
      }
    } catch (e) {
      console.warn('Failed to access localStorage for theme', e);
    }
    return 'system';
  }

  private getSystemDarkPreference(): boolean {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
    ) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  private setupSystemThemeListener(): void {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
    ) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (event: MediaQueryListEvent) => {
        this.systemIsDark.set(event.matches);
        if (this.mode() === 'system') {
          this.applyTheme(this.currentPrimaryColor(), event.matches);
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
        this.destroyRef.onDestroy(() => {
          mediaQuery.removeEventListener('change', listener);
        });
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(listener);
        this.destroyRef.onDestroy(() => {
          mediaQuery.removeListener(listener);
        });
      }
    }
  }
}
