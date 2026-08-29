import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter, NavigationEnd } from '@angular/router';
import {
  BreakpointObserver,
  Breakpoints,
  BreakpointState,
} from '@angular/cdk/layout';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { signal } from '@angular/core';

// Target Component
import {
  NavComponent,
  SELECTED_JURISDICTION_STORAGE_KEY,
} from './nav.component';
import { Footer } from '../footer/footer.component'; // Import the real footer class so we can reference it

// Service Dependencies
import {
  AuthService,
  ConfigService,
  OfflineStorageService,
  ThemeService,
} from '@legislative-tracker/client-angular/core';
import { LegislaturePluginRegistry } from '@legislative-tracker/plugins-core';

// Create a Dummy Footer
@Component({
  selector: 'app-footer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
class MockFooter {}

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;
  let router: Router;

  const mockUserProfileSignal = signal<any>({
    displayName: 'Test User',
  });
  const mockAuthService = {
    logout: vi.fn().mockResolvedValue(undefined),
    isLoggedIn: vi.fn().mockReturnValue(true),
    isAdmin: vi.fn().mockReturnValue(true),
    isAnnon: vi.fn().mockReturnValue(false),
    currentUser: signal({ displayName: 'Test User' }),
    userProfile: mockUserProfileSignal,
  };

  const mockConfigService = {
    config: signal({
      branding: {
        logoUrl: '/assets/logo.png',
        primaryColor: '#003366',
        faviconUrl: '/assets/favicon.ico',
      },
    }),
  };

  const mockThemeService = {
    mode: signal('system'),
    isDarkMode: signal(false),
    setThemeMode: vi.fn(),
  };

  // Mock Breakpoint Observer with a Subject for live updates
  const screenState$ = new BehaviorSubject<BreakpointState>({
    matches: false,
    breakpoints: {},
  });
  const mockBreakpointObserver = {
    observe: vi.fn().mockReturnValue(screenState$.asObservable()),
    isMatched: vi.fn().mockReturnValue(false),
  };

  beforeEach(async () => {
    localStorage.clear();
    screenState$.next({ matches: false, breakpoints: {} });

    if (!LegislaturePluginRegistry.has('leg-us-ny')) {
      await LegislaturePluginRegistry.register({
        metadata: {
          id: 'leg-us-ny',
          name: 'New York State Legislature Plugin',
          version: '1.0.0',
          jurisdiction: {
            id: 'ocd-jurisdiction/country:us/state:ny/government',
            code: 'us-ny',
            name: 'New York',
            isBicameral: true,
            chambers: {
              upper: 'Senate',
              lower: 'Assembly',
            },
            currentSession: '2025-2026',
          },
          capabilities: { hasApi: true },
        },
        calculateCurrentSession: () => '2025-2026',
      });
    }

    if (!LegislaturePluginRegistry.has('leg-us-nj')) {
      await LegislaturePluginRegistry.register({
        metadata: {
          id: 'leg-us-nj',
          name: 'New Jersey State Legislature Plugin',
          version: '1.0.0',
          jurisdiction: {
            id: 'ocd-jurisdiction/country:us/state:nj/government',
            code: 'us-nj',
            name: 'New Jersey',
            isBicameral: true,
            chambers: {
              upper: 'Senate',
              lower: 'General Assembly',
            },
            currentSession: '2024-2025',
          },
          capabilities: { hasApi: true },
        },
        calculateCurrentSession: () => '2024-2025',
      });
    }

    await TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
      ],
    })
      // Swap the real Footer for the Dummy
      // This prevents Footer's internal dependencies from crashing your test.
      .overrideComponent(NavComponent, {
        remove: { imports: [Footer] },
        add: { imports: [MockFooter] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Responsive Behavior', () => {
    it('should identify Handset mode correctly', () => {
      // Simulate Mobile (Handset)
      screenState$.next({ matches: true, breakpoints: {} });

      // Capture the value
      let result: boolean | undefined;
      component.isHandset$.subscribe((val) => (result = val));

      // Assert
      expect(result).toBe(true);
    });

    it('should identify Desktop mode correctly', () => {
      // Simulate Desktop
      screenState$.next({ matches: false, breakpoints: {} });

      let result: boolean | undefined;
      component.isHandset$.subscribe((val) => (result = val));
      expect(result).toBe(false);
    });
  });

  describe('Navigation Drawer', () => {
    it('should close drawer on nav item click in handset mode', () => {
      const mockDrawer = { close: vi.fn() } as any;

      const breakpointObserver = TestBed.inject(BreakpointObserver);
      vi.spyOn(breakpointObserver, 'isMatched').mockReturnValue(true);

      component.onNavItemClick(mockDrawer);
      expect(mockDrawer.close).toHaveBeenCalled();
    });

    it('should NOT close drawer on nav item click in desktop mode', () => {
      const mockDrawer = { close: vi.fn() } as any;

      const breakpointObserver = TestBed.inject(BreakpointObserver);
      vi.spyOn(breakpointObserver, 'isMatched').mockReturnValue(false);

      component.onNavItemClick(mockDrawer);
      expect(mockDrawer.close).not.toHaveBeenCalled();
    });

    it('should close drawer on logout in handset mode', async () => {
      const mockDrawer = { close: vi.fn() } as any;

      const breakpointObserver = TestBed.inject(BreakpointObserver);
      vi.spyOn(breakpointObserver, 'isMatched').mockReturnValue(true);

      await component.handleLogout(mockDrawer);
      expect(mockDrawer.close).toHaveBeenCalled();
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('Branding Configuration', () => {
    it('should expose config signal from ConfigService', () => {
      const protectedComponent = component as any;
      expect(protectedComponent.config).toBeDefined();
      expect(protectedComponent.config().branding.logoUrl).toBe(
        '/assets/logo.png',
      );
    });
  });

  describe('Theme Toggle', () => {
    it('should expose themeService', () => {
      expect(component.themeService).toBeDefined();
      expect(component.themeService.mode()).toBe('system');
    });
  });

  describe('Toolbar Bookmark Button', () => {
    it('should detect legislation route and target leg: prefix', () => {
      (router.events as any).next(
        new NavigationEnd(
          1,
          '/us-ny/legislation/clean-energy',
          '/us-ny/legislation/clean-energy',
        ),
      );
      fixture.detectChanges();

      const target = component.currentBookmarkTarget();
      expect(target).toEqual({
        type: 'legislation',
        id: 'clean-energy',
        key: 'leg:clean-energy',
        stateCd: 'us-ny',
      });
    });

    it('should detect ocd-bill route and target bill: prefix', () => {
      (router.events as any).next(
        new NavigationEnd(
          2,
          '/us-ny/ocd-bill/mock-bill-1',
          '/us-ny/ocd-bill/mock-bill-1',
        ),
      );
      fixture.detectChanges();

      const target = component.currentBookmarkTarget();
      expect(target).toEqual({
        type: 'bill',
        id: 'mock-bill-1',
        key: 'bill:mock-bill-1',
        stateCd: 'us-ny',
      });
    });

    it('should return null target on non-bookmarkable routes', () => {
      (router.events as any).next(new NavigationEnd(3, '/about', '/about'));
      fixture.detectChanges();

      expect(component.currentBookmarkTarget()).toBeNull();
    });

    it('should toggle offline save', async () => {
      const offlineStorage = TestBed.inject(OfflineStorageService);
      const saveSpy = vi.spyOn(offlineStorage, 'saveBill').mockResolvedValue();
      const removeSpy = vi
        .spyOn(offlineStorage, 'removeSavedBill')
        .mockResolvedValue();

      (router.events as any).next(
        new NavigationEnd(
          5,
          '/us-ny/ocd-bill/mock-bill-1',
          '/us-ny/ocd-bill/mock-bill-1',
        ),
      );
      fixture.detectChanges();

      component.isSavedOffline.set(false);
      await component.toggleOfflineSave();
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'mock-bill-1',
          stateCd: 'us-ny',
          type: 'bill',
        }),
      );
      expect(component.isSavedOffline()).toBe(true);

      component.isSavedOffline.set(true);
      await component.toggleOfflineSave();
      expect(removeSpy).toHaveBeenCalledWith('mock-bill-1');
      expect(component.isSavedOffline()).toBe(false);
    });
  });

  describe('State Jurisdiction Selector', () => {
    it('should list available jurisdictions from registered plugins', () => {
      const list = component.availableJurisdictions();
      expect(Array.isArray(list)).toBe(true);
      if (list.length > 0) {
        expect(list[0]).toHaveProperty('code');
        expect(list[0]).toHaveProperty('name');
      }
    });

    it('should determine active jurisdiction from route URL', () => {
      (router.events as any).next(new NavigationEnd(10, '/us-ny', '/us-ny'));
      fixture.detectChanges();

      const active = component.activeJurisdiction();
      expect(active?.code.toLowerCase()).toBe('us-ny');
    });

    it('should return null active jurisdiction when at root /', () => {
      (router.events as any).next(new NavigationEnd(11, '/', '/'));
      fixture.detectChanges();

      const active = component.activeJurisdiction();
      expect(active).toBeNull();
    });

    it('should navigate to selected jurisdiction and update selection when switchJurisdiction is called', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.switchJurisdiction('us-nj');
      expect(navigateSpy).toHaveBeenCalledWith(['/', 'us-nj']);
      expect(component.selectedJurisdiction()?.code).toBe('us-nj');
      expect(localStorage.getItem(SELECTED_JURISDICTION_STORAGE_KEY)).toBe(
        'us-nj',
      );
    });

    it('should render jurisdiction button below Home when a jurisdiction is active', () => {
      (router.events as any).next(new NavigationEnd(20, '/us-ny', '/us-ny'));
      fixture.detectChanges();

      const jurisdictionItem = fixture.nativeElement.querySelector(
        '.jurisdiction-nav-item',
      );
      expect(jurisdictionItem).toBeTruthy();
      expect(jurisdictionItem.textContent).toContain('US-NY');
      expect(jurisdictionItem.getAttribute('href')).toBe('/us-ny');
    });

    it('should not render jurisdiction button when no jurisdiction has been selected', () => {
      (router.events as any).next(new NavigationEnd(21, '/', '/'));
      fixture.detectChanges();

      const jurisdictionItem = fixture.nativeElement.querySelector(
        '.jurisdiction-nav-item',
      );
      expect(jurisdictionItem).toBeNull();
    });

    it('should render jurisdiction button when on sub-route of jurisdiction', () => {
      (router.events as any).next(
        new NavigationEnd(
          22,
          '/us-ny/legislation/clean-energy',
          '/us-ny/legislation/clean-energy',
        ),
      );
      fixture.detectChanges();

      const jurisdictionItem = fixture.nativeElement.querySelector(
        '.jurisdiction-nav-item',
      );
      expect(jurisdictionItem).toBeTruthy();
      expect(jurisdictionItem.textContent).toContain('US-NY');
      expect(jurisdictionItem.getAttribute('href')).toBe('/us-ny');
    });

    it('should persist jurisdiction button when user navigates to a page outside of a jurisdiction', () => {
      // 1. Visit NY
      (router.events as any).next(new NavigationEnd(23, '/us-ny', '/us-ny'));
      fixture.detectChanges();

      expect(component.selectedJurisdiction()?.code).toBe('us-ny');
      expect(localStorage.getItem(SELECTED_JURISDICTION_STORAGE_KEY)).toBe(
        'us-ny',
      );

      // 2. Navigate away to /about
      (router.events as any).next(new NavigationEnd(24, '/about', '/about'));
      fixture.detectChanges();

      const jurisdictionItemOnAbout = fixture.nativeElement.querySelector(
        '.jurisdiction-nav-item',
      );
      expect(jurisdictionItemOnAbout).toBeTruthy();
      expect(jurisdictionItemOnAbout.textContent).toContain('US-NY');
      expect(jurisdictionItemOnAbout.getAttribute('href')).toBe('/us-ny');

      // 3. Navigate away to / (Home)
      (router.events as any).next(new NavigationEnd(25, '/', '/'));
      fixture.detectChanges();

      const jurisdictionItemOnHome = fixture.nativeElement.querySelector(
        '.jurisdiction-nav-item',
      );
      expect(jurisdictionItemOnHome).toBeTruthy();
      expect(jurisdictionItemOnHome.textContent).toContain('US-NY');
      expect(jurisdictionItemOnHome.getAttribute('href')).toBe('/us-ny');
    });

    it('should restore selected jurisdiction from localStorage on initial creation', () => {
      localStorage.setItem(SELECTED_JURISDICTION_STORAGE_KEY, 'us-nj');

      const newFixture = TestBed.createComponent(NavComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.selectedJurisdiction()?.code).toBe('us-nj');
      expect(newComponent.selectedJurisdiction()?.name).toBe('New Jersey');

      const jurisdictionItem = newFixture.nativeElement.querySelector(
        '.jurisdiction-nav-item',
      );
      expect(jurisdictionItem).toBeTruthy();
      expect(jurisdictionItem.textContent).toContain('US-NJ');
      expect(jurisdictionItem.getAttribute('href')).toBe('/us-nj');
    });
  });

  describe('Toolbar Overflow Menu', () => {
    it('should render overflow menu trigger button with accessible label', () => {
      const overflowBtn = fixture.nativeElement.querySelector(
        '.toolbar-overflow-btn',
      );
      expect(overflowBtn).toBeTruthy();
      expect(overflowBtn.getAttribute('aria-label')).toBe('More options');
    });

    it('should render desktop-actions container in the toolbar', () => {
      const desktopActions =
        fixture.nativeElement.querySelector('.desktop-actions');
      expect(desktopActions).toBeTruthy();
    });

    it('should include jurisdiction selector in overflow menu when jurisdictions exist', () => {
      const overflowBtn = fixture.nativeElement.querySelector(
        '.toolbar-overflow-btn',
      );
      overflowBtn.click();
      fixture.detectChanges();

      const jurisdictionItem = document.querySelector(
        '.overflow-jurisdiction-btn',
      );
      expect(jurisdictionItem).toBeTruthy();
      expect(jurisdictionItem?.textContent).toContain('Jurisdiction');
    });
  });

  describe('Accessibility & Skip Navigation', () => {
    it('should render a skip-to-content link targeting the main content landmark', () => {
      const skipLink: HTMLAnchorElement =
        fixture.nativeElement.querySelector('.skip-link');
      expect(skipLink).toBeTruthy();
      expect(skipLink.getAttribute('href')).toBe('#main-content');
      expect(skipLink.textContent?.trim()).toBe('Skip to main content');
    });

    it('should designate the main element with id="main-content" and tabindex="-1"', () => {
      const mainElement: HTMLElement =
        fixture.nativeElement.querySelector('main.main-content');
      expect(mainElement).toBeTruthy();
      expect(mainElement.getAttribute('id')).toBe('main-content');
      expect(mainElement.getAttribute('tabindex')).toBe('-1');
    });

    it('should announce jurisdiction change via aria-live polite region', () => {
      const liveRegion: HTMLElement = fixture.nativeElement.querySelector(
        'div[aria-live="polite"]',
      );
      expect(liveRegion).toBeTruthy();
      expect(liveRegion.getAttribute('aria-atomic')).toBe('true');

      component.switchJurisdiction('us-ny');
      fixture.detectChanges();
      expect(liveRegion.textContent?.trim()).toBe(
        'Switched jurisdiction to New York',
      );
    });
  });
});
