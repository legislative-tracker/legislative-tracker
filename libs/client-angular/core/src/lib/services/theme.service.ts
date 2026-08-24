import {
  Injectable,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'legislative_tracker_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = signal<ThemeMode>(this.getInitialMode());
  readonly systemIsDark = signal<boolean>(this.getSystemDarkPreference());
  readonly currentPrimaryColor = signal<string>('#673ab7');

  readonly isDarkMode = computed<boolean>(() => {
    const currentMode = this.mode();
    if (currentMode === 'dark') return true;
    if (currentMode === 'light') return false;
    return this.systemIsDark();
  });

  constructor() {
    this.setupSystemThemeListener();
  }

  setThemeMode(mode: ThemeMode): void {
    this.mode.set(mode);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      }
    } catch (e) {
      console.warn('Failed to save theme to localStorage', e);
    }
    this.applyTheme(this.currentPrimaryColor(), this.isDarkMode());
  }

  setPrimaryColor(hexColor: string): void {
    if (hexColor) {
      this.currentPrimaryColor.set(hexColor);
      this.applyTheme(hexColor, this.isDarkMode());
    }
  }

  async applyTheme(
    hexColor: string = this.currentPrimaryColor(),
    isDark: boolean = this.isDarkMode(),
  ): Promise<void> {
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
      const scheme = isDark ? theme.schemes.dark : theme.schemes.light;
      const properties = flattenSchemeToCssVars(scheme);

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
