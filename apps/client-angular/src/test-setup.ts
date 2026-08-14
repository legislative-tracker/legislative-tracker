import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';

const testBed = getTestBed() as any;
if (!testBed.platform && !testBed.ngModule) {
  try {
    testBed.initTestEnvironment(
      BrowserTestingModule,
      platformBrowserTesting(),
    );
  } catch {
    // TestBed environment already initialized
  }
}

