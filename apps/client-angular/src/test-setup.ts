import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { beforeEach, afterEach } from 'vitest';

const testBed = getTestBed() as any;
if (!testBed.platform) {
  testBed.initTestEnvironment(
    BrowserTestingModule,
    platformBrowserTesting(),
    { teardown: { destroyAfterEach: true } }
  );
}

beforeEach(() => {
  getTestBed().resetTestingModule();
});

afterEach(() => {
  getTestBed().resetTestingModule();
});

