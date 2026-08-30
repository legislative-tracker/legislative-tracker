import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadAppConfig,
  clearAppConfigCache,
  APP_CONFIG_STORAGE_KEY,
  APP_CONFIG_VERSION_KEY,
} from './app-config-loader';
import { AppConfig } from './app-config.token';
import { APP_VERSION } from '../version';

describe('loadAppConfig', () => {
  const sampleDefaultConfig: AppConfig = {
    production: false,
    useEmulators: true,
    firebase: {
      projectId: 'default-project',
      appId: 'default-app-id',
      databaseURL: 'http://127.0.0.1:9000',
      storageBucket: 'default.appspot.com',
      apiKey: 'default-key',
      authDomain: 'default.firebaseapp.com',
      messagingSenderId: '123',
      measurementId: 'G-123',
      projectNumber: '123',
      version: '1',
    },
  };

  const sampleRemoteConfig: AppConfig = {
    production: true,
    useEmulators: false,
    firebase: {
      projectId: 'remote-project',
      appId: 'remote-app-id',
      databaseURL: 'https://remote.firebaseio.com',
      storageBucket: 'remote.appspot.com',
      apiKey: 'remote-key',
      authDomain: 'remote.firebaseapp.com',
      messagingSenderId: '456',
      measurementId: 'G-456',
      projectNumber: '456',
      version: '2',
    },
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should fetch remote config when online and stash it in localStorage', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => sampleRemoteConfig,
    } as any);

    const config = await loadAppConfig(sampleDefaultConfig);

    expect(fetchSpy).toHaveBeenCalledWith('/assets/config.json', {
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(config).toEqual(sampleRemoteConfig);
    expect(localStorage.getItem(APP_CONFIG_STORAGE_KEY)).toBe(
      JSON.stringify(sampleRemoteConfig),
    );
    expect(localStorage.getItem(APP_CONFIG_VERSION_KEY)).toBe(APP_VERSION);
  });

  it('should fallback to cached config when network fetch fails', async () => {
    const cachedConfig: AppConfig = {
      ...sampleRemoteConfig,
      firebase: { ...sampleRemoteConfig.firebase, projectId: 'cached-project' },
    };

    localStorage.setItem(APP_CONFIG_STORAGE_KEY, JSON.stringify(cachedConfig));
    localStorage.setItem(APP_CONFIG_VERSION_KEY, APP_VERSION);

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const config = await loadAppConfig(sampleDefaultConfig);

    expect(config).toEqual(cachedConfig);
    expect(config.firebase.projectId).toBe('cached-project');
  });

  it('should fallback to defaultConfig when network fetch fails and no valid cache exists', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as any);

    const config = await loadAppConfig(sampleDefaultConfig);

    expect(config).toEqual(sampleDefaultConfig);
  });

  it('should invalidate cache and not use it if cached version does not match APP_VERSION', async () => {
    const staleConfig: AppConfig = {
      ...sampleRemoteConfig,
      firebase: { ...sampleRemoteConfig.firebase, projectId: 'stale-project' },
    };

    localStorage.setItem(APP_CONFIG_STORAGE_KEY, JSON.stringify(staleConfig));
    localStorage.setItem(APP_CONFIG_VERSION_KEY, '0.0.1-old');

    // Simulate network failure so it attempts fallback
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));

    const config = await loadAppConfig(sampleDefaultConfig);

    // Should invalidate old cache and fall back to defaultConfig
    expect(config).toEqual(sampleDefaultConfig);
    expect(localStorage.getItem(APP_CONFIG_STORAGE_KEY)).toBeNull();
  });

  it('should handle corrupted localStorage JSON gracefully', async () => {
    localStorage.setItem(APP_CONFIG_STORAGE_KEY, '{invalid json');
    localStorage.setItem(APP_CONFIG_VERSION_KEY, APP_VERSION);

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));

    const config = await loadAppConfig(sampleDefaultConfig);
    expect(config).toEqual(sampleDefaultConfig);
  });

  it('should throw error when neither network, cache, nor defaultConfig is available', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));

    await expect(loadAppConfig()).rejects.toThrow(
      'Unable to load application configuration',
    );
  });

  it('should clear cached config on clearAppConfigCache', () => {
    localStorage.setItem(
      APP_CONFIG_STORAGE_KEY,
      JSON.stringify(sampleRemoteConfig),
    );
    localStorage.setItem(APP_CONFIG_VERSION_KEY, APP_VERSION);

    clearAppConfigCache();

    expect(localStorage.getItem(APP_CONFIG_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(APP_CONFIG_VERSION_KEY)).toBeNull();
  });
});
