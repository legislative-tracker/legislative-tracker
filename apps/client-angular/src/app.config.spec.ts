import { TestBed } from '@angular/core/testing';
import { ApplicationInitStatus } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { getAppConfig } from './app.config';
import {
  LegislaturePluginRegistry,
  getAllPlugins,
} from '@legislative-tracker/plugins-core';
import {
  AppConfig,
  ConfigService,
  MockConfigService,
} from '@legislative-tracker/client-angular/core';

describe('getAppConfig', () => {
  beforeEach(() => {
    LegislaturePluginRegistry.clear();
  });

  it('should initialize plugins with all enabled by default when enabledPlugins is undefined', async () => {
    const config: AppConfig = {
      production: false,
      firebase: {
        projectId: 'test',
        appId: 'test',
        databaseURL: '',
        storageBucket: '',
        apiKey: '',
        authDomain: '',
        messagingSenderId: '',
        measurementId: '',
        projectNumber: '',
        version: '1',
      },
    };

    const appConfig = getAppConfig(config);
    expect(appConfig.providers).toBeDefined();

    TestBed.configureTestingModule({
      providers: [
        appConfig.providers,
        { provide: ConfigService, useClass: MockConfigService },
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;

    const plugins = getAllPlugins();
    expect(plugins.length).toBeGreaterThanOrEqual(2);
    expect(plugins.some((p) => p.metadata.id === 'leg-us-ny')).toBe(true);
    expect(plugins.some((p) => p.metadata.id === 'leg-us-nj')).toBe(true);
  });

  it('should only enable specified plugins when enabledPlugins is provided', async () => {
    const config: AppConfig = {
      production: false,
      enabledPlugins: ['us-ny'],
      firebase: {
        projectId: 'test',
        appId: 'test',
        databaseURL: '',
        storageBucket: '',
        apiKey: '',
        authDomain: '',
        messagingSenderId: '',
        measurementId: '',
        projectNumber: '',
        version: '1',
      },
    };

    const appConfig = getAppConfig(config);
    TestBed.configureTestingModule({
      providers: [
        appConfig.providers,
        { provide: ConfigService, useClass: MockConfigService },
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;

    const plugins = getAllPlugins();
    expect(plugins).toHaveLength(1);
    expect(plugins[0].metadata.id).toBe('leg-us-ny');
    expect(LegislaturePluginRegistry.has('leg-us-ny')).toBe(true);
    expect(LegislaturePluginRegistry.has('leg-us-nj')).toBe(false);
  });
});
