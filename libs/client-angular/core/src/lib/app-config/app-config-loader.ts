import { AppConfig } from './app-config.token';
import { APP_VERSION } from '../version';

export const APP_CONFIG_STORAGE_KEY = 'legislative_tracker_app_config';
export const APP_CONFIG_VERSION_KEY = 'legislative_tracker_app_version';

/**
 * Loads the application configuration with offline caching and version validation.
 *
 * 1. Checks if a previously cached configuration exists in local client storage.
 * 2. Validates if the application version matches the cached version. In case of version mismatch, invalidates cache.
 * 3. Attempts to fetch the latest configuration from network (configUrl).
 * 4. If network fetch succeeds, saves the fresh config to local client storage and returns it.
 * 5. If network fetch fails (offline or network error), returns the stashed config or falls back to defaultConfig.
 */
export async function loadAppConfig(
  defaultConfig?: AppConfig,
  configUrl = 'assets/config.json',
): Promise<AppConfig> {
  let cachedConfig: AppConfig | null = null;

  if (typeof localStorage !== 'undefined') {
    try {
      const storedVersion = localStorage.getItem(APP_CONFIG_VERSION_KEY);
      const storedConfigRaw = localStorage.getItem(APP_CONFIG_STORAGE_KEY);

      if (storedConfigRaw) {
        if (storedVersion && storedVersion === APP_VERSION) {
          cachedConfig = JSON.parse(storedConfigRaw) as AppConfig;
        } else {
          // Version mismatch: invalidate stale cache
          localStorage.removeItem(APP_CONFIG_STORAGE_KEY);
          localStorage.removeItem(APP_CONFIG_VERSION_KEY);
        }
      }
    } catch (e) {
      console.warn('Failed to read cached AppConfig from localStorage', e);
    }
  }

  // Attempt network fetch
  if (typeof fetch !== 'undefined') {
    try {
      const response = await fetch(configUrl, {
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const fetchedConfig = (await response.json()) as AppConfig;

        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(
              APP_CONFIG_STORAGE_KEY,
              JSON.stringify(fetchedConfig),
            );
            localStorage.setItem(APP_CONFIG_VERSION_KEY, APP_VERSION);
          } catch (e) {
            console.warn('Failed to stash AppConfig in localStorage', e);
          }
        }

        return fetchedConfig;
      }
    } catch (e) {
      console.warn('Failed to fetch runtime AppConfig from network', e);
    }
  }

  // Fallback to cached config or defaultConfig
  if (cachedConfig) {
    return cachedConfig;
  }

  if (defaultConfig) {
    return defaultConfig;
  }

  throw new Error(
    'Unable to load application configuration: no network or cached config available.',
  );
}

/**
 * Clears the cached application configuration from client storage.
 */
export function clearAppConfigCache(): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(APP_CONFIG_STORAGE_KEY);
      localStorage.removeItem(APP_CONFIG_VERSION_KEY);
    } catch (e) {
      console.warn('Failed to clear AppConfig cache', e);
    }
  }
}
