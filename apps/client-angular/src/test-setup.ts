import 'zone.js';
import 'zone.js/testing';
import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { beforeEach, afterEach, vi } from 'vitest';

vi.mock('@material/material-color-utilities', () => ({
  argbFromHex: vi.fn((hex: string) => 0),
  themeFromSourceColor: vi.fn((source: number) => ({
    schemes: {
      light: { toJSON: () => ({ primary: 0xff0000 }) },
      dark: { toJSON: () => ({ primary: 0x00ff00 }) },
    },
  })),
  hexFromArgb: vi.fn((argb: number) => '#000000'),
}));

const testBed = getTestBed() as any;
if (!testBed.platform) {
  testBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting(), {
    teardown: { destroyAfterEach: true },
  });
}

beforeEach(() => {
  getTestBed().resetTestingModule();
});

afterEach(() => {
  getTestBed().resetTestingModule();
});
