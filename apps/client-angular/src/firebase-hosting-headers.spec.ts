import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Firebase Hosting Headers Configuration', () => {
  const firebaseJsonPath = path.resolve(__dirname, '../../../firebase.json');
  const firebaseJson = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));

  it('should define a hosting configuration with headers', () => {
    expect(firebaseJson.hosting).toBeDefined();
    expect(Array.isArray(firebaseJson.hosting.headers)).toBe(true);
    expect(firebaseJson.hosting.headers.length).toBeGreaterThan(0);
  });

  it('should configure production HTTP security headers for all routes (**)', () => {
    const globalRule = firebaseJson.hosting.headers.find(
      (entry: { source: string }) => entry.source === '**',
    );
    expect(globalRule).toBeDefined();

    const headersMap = new Map<string, string>(
      globalRule.headers.map((h: { key: string; value: string }) => [
        h.key,
        h.value,
      ]),
    );

    expect(headersMap.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headersMap.get('X-Frame-Options')).toBeUndefined();
    expect(headersMap.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(headersMap.get('Permissions-Policy')).toContain('camera=()');
    expect(headersMap.get('Permissions-Policy')).toContain('microphone=()');
    expect(headersMap.get('Permissions-Policy')).toContain('geolocation=()');
    expect(headersMap.get('Strict-Transport-Security')).toBe(
      'max-age=31536000; includeSubDomains; preload',
    );
    expect(headersMap.get('Cache-Control')).toBe(
      'no-cache, no-store, must-revalidate',
    );

    const csp = headersMap.get('Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain('https://apis.google.com');
    expect(csp).toContain('https://appleid.cdn-apple.com');
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain('https://fonts.googleapis.com');
    expect(csp).toContain('https://cdnjs.cloudflare.com');
    expect(csp).toContain('https://fonts.gstatic.com');
    expect(csp).toContain("img-src 'self' data: blob: https:");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain('https://*.googleapis.com');
    expect(csp).toContain('https://*.firebaseio.com');
    expect(csp).toContain('https://appleid.apple.com');
    expect(csp).toContain("frame-src 'self'");
    expect(csp).toContain('https://appleid.apple.com');
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain('https://*.firebaseapp.com');
    expect(csp).toContain('https://*.web.app');
    expect(csp).toContain('https://tracker.cwapolitical.org');
    expect(csp).toContain('https://*.cwapolitical.org');
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('should configure immutable long-term caching for static hashed assets and assets directory', () => {
    const jsCssRule = firebaseJson.hosting.headers.find(
      (entry: { source: string }) => entry.source === '**/*.@(js|css)',
    );
    expect(jsCssRule).toBeDefined();
    expect(
      jsCssRule.headers.find(
        (h: { key: string; value: string }) => h.key === 'Cache-Control',
      )?.value,
    ).toBe('max-age=31536000, immutable');

    const assetsRule = firebaseJson.hosting.headers.find(
      (entry: { source: string }) => entry.source === '/assets/**',
    );
    expect(assetsRule).toBeDefined();
    expect(
      assetsRule.headers.find(
        (h: { key: string; value: string }) => h.key === 'Cache-Control',
      )?.value,
    ).toBe('max-age=31536000, immutable');
  });

  it('should configure no-cache rules for index.html, runtime config, and service worker manifests', () => {
    const configRule = firebaseJson.hosting.headers.find(
      (entry: { source: string }) => entry.source === '/assets/config.json',
    );
    expect(configRule).toBeDefined();
    expect(
      configRule.headers.find(
        (h: { key: string; value: string }) => h.key === 'Cache-Control',
      )?.value,
    ).toBe('no-cache, no-store, must-revalidate');

    const mutableManifestsRule = firebaseJson.hosting.headers.find(
      (entry: { source: string }) =>
        entry.source ===
        '/@(index.html|ngsw.json|manifest.webmanifest|robots.txt|sitemap.xml)',
    );
    expect(mutableManifestsRule).toBeDefined();
    expect(
      mutableManifestsRule.headers.find(
        (h: { key: string; value: string }) => h.key === 'Cache-Control',
      )?.value,
    ).toBe('no-cache, no-store, must-revalidate');

    const indexHtmlRule = firebaseJson.hosting.headers.find(
      (entry: { source: string }) => entry.source === 'index.html',
    );
    expect(indexHtmlRule).toBeDefined();
    expect(
      indexHtmlRule.headers.find(
        (h: { key: string; value: string }) => h.key === 'Cache-Control',
      )?.value,
    ).toBe('no-cache, no-store, must-revalidate');
  });
});
