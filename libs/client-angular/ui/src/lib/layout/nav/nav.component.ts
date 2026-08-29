import {
  Component,
  inject,
  computed,
  effect,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe, UpperCasePipe, TitleCasePipe } from '@angular/common';
import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  NavigationEnd,
} from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom, Observable } from 'rxjs';
import { filter, map, shareReplay, startWith } from 'rxjs/operators';

import { getAllPlugins } from '@legislative-tracker/plugins-core';

// App imports
import {
  AuthService,
  ConfigService,
  LegislatureService,
  OfflineStorageService,
  ThemeService,
} from '@legislative-tracker/client-angular/core';
import { Footer } from '../footer/footer.component';

export const SELECTED_JURISDICTION_STORAGE_KEY = 'selected_jurisdiction';

export interface NavJurisdiction {
  id: string;
  code: string;
  name: string;
  session?: string;
}

/**
 * Primary application navigation shell containing header toolbar,
 * responsive sidenav drawer, jurisdiction switcher, offline bookmark triggers,
 * and dark mode toggles.
 */
@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    AsyncPipe,
    UpperCasePipe,
    TitleCasePipe,
    Footer,
  ],
})
export class NavComponent {
  auth = inject(AuthService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  private titleService = inject(Title);
  private legislatureService = inject(LegislatureService, { optional: true });

  protected offlineStorage = inject(OfflineStorageService);
  protected isOnline = this.offlineStorage.isOnline;

  // Load branding config
  protected configService = inject(ConfigService);
  protected config = this.configService.config;

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(
        (e) =>
          (e as NavigationEnd).urlAfterRedirects || (e as NavigationEnd).url,
      ),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  availableJurisdictions = computed<NavJurisdiction[]>(() => {
    return getAllPlugins().map((p) => ({
      id: p.metadata.id,
      code: p.metadata.jurisdiction.code,
      name: p.metadata.jurisdiction.name,
      session: p.metadata.jurisdiction.currentSession,
    }));
  });

  activeJurisdiction = computed<NavJurisdiction | null>(() => {
    const url = this.currentUrl();
    const list = this.availableJurisdictions();
    if (!list.length) return null;

    if (url) {
      const match = url.match(/^\/([a-zA-Z0-9_-]+)(?:\/|$|\?)/);
      if (match && match[1]) {
        const raw = match[1].toLowerCase();
        const found = list.find(
          (j) =>
            j.code.toLowerCase() === raw ||
            j.code.toLowerCase().replace(/^us-/, '') ===
              raw.replace(/^us-/, '') ||
            j.id.toLowerCase() === raw,
        );
        if (found) return found;
      }
    }

    return null;
  });

  selectedJurisdiction = signal<NavJurisdiction | null>(null);

  switchJurisdiction(code: string): void {
    const list = this.availableJurisdictions();
    const found = list.find(
      (j) =>
        j.code.toLowerCase() === code.toLowerCase() ||
        j.code.toLowerCase().replace(/^us-/, '') ===
          code.toLowerCase().replace(/^us-/, '') ||
        j.id.toLowerCase() === code.toLowerCase(),
    );
    if (found) {
      this.selectedJurisdiction.set(found);
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(SELECTED_JURISDICTION_STORAGE_KEY, found.code);
        } catch (e) {
          console.warn(
            'Failed to save selected jurisdiction to localStorage',
            e,
          );
        }
      }
    }
    this.router.navigate(['/', code]);
  }

  isSavedOffline = signal(false);

  currentBookmarkTarget = computed<{
    type: 'legislation' | 'bill';
    id: string;
    key: string;
    stateCd: string;
  } | null>(() => {
    const url = this.currentUrl();
    if (!url) return null;

    // 1) Match /:stateCd/legislation/:id
    const legMatch = url.match(/^\/([^/]+)\/legislation\/([^/?#]+)/);
    if (legMatch && legMatch[2]) {
      const stateCd = decodeURIComponent(legMatch[1]);
      const rawId = decodeURIComponent(legMatch[2]);
      const clean = rawId
        .replace(/^leg:/, '')
        .replace(/^legislation:/, '')
        .replace(/^ocd-bill[\/:=]/, '')
        .trim();
      return {
        type: 'legislation',
        id: clean,
        key: `leg:${clean}`,
        stateCd,
      };
    }

    // 2) Match /:stateCd/ocd-bill/:id
    const billMatch = url.match(/^\/([^/]+)\/ocd-bill\/([^/?#]+)/);
    if (billMatch && billMatch[2]) {
      const stateCd = decodeURIComponent(billMatch[1]);
      const rawId = decodeURIComponent(billMatch[2]);
      const clean = rawId
        .replace(/^bill:/, '')
        .replace(/^ocd-bill[\/:=]/, '')
        .trim();
      return {
        type: 'bill',
        id: clean,
        key: `bill:${clean}`,
        stateCd,
      };
    }

    return null;
  });

  targetName = computed(() => {
    const target = this.currentBookmarkTarget();
    if (!target) return '';
    const fullTitle = this.titleService.getTitle() || '';
    const name = fullTitle
      .replace(/\s*\|\s*Legislative Tracker$/i, '')
      .replace(/^Legislative Tracker$/i, '')
      .trim();

    if (
      name &&
      name.toLowerCase() !== 'legislation' &&
      name.toLowerCase() !== 'bill'
    ) {
      return name;
    }

    return target.id
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  });

  constructor() {
    if (typeof localStorage !== 'undefined') {
      try {
        const savedCode = localStorage.getItem(
          SELECTED_JURISDICTION_STORAGE_KEY,
        );
        if (savedCode) {
          const list = this.availableJurisdictions();
          const found = list.find(
            (j) =>
              j.code.toLowerCase() === savedCode.toLowerCase() ||
              j.code.toLowerCase().replace(/^us-/, '') ===
                savedCode.toLowerCase().replace(/^us-/, '') ||
              j.id.toLowerCase() === savedCode.toLowerCase(),
          );
          if (found) {
            this.selectedJurisdiction.set(found);
          }
        }
      } catch (e) {
        console.warn(
          'Failed to read selected jurisdiction from localStorage',
          e,
        );
      }
    }

    effect(() => {
      const active = this.activeJurisdiction();
      if (active) {
        this.selectedJurisdiction.set(active);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(
              SELECTED_JURISDICTION_STORAGE_KEY,
              active.code,
            );
          } catch (e) {
            console.warn(
              'Failed to save selected jurisdiction to localStorage',
              e,
            );
          }
        }
      }
    });

    effect(async () => {
      const target = this.currentBookmarkTarget();
      if (!target) {
        this.isSavedOffline.set(false);
        return;
      }
      const saved = await this.offlineStorage.isBillSaved(target.id);
      this.isSavedOffline.set(saved);
    });
  }

  async toggleOfflineSave(): Promise<void> {
    const target = this.currentBookmarkTarget();
    if (!target) return;
    const isCurrentlySaved = this.isSavedOffline();
    if (isCurrentlySaved) {
      await this.offlineStorage.removeSavedBill(target.id);
      this.isSavedOffline.set(false);
    } else {
      let title = this.targetName();
      let identifier: string | undefined;
      let summary: string | undefined;
      let billData: any;

      if (
        this.legislatureService &&
        target.stateCd &&
        (!title ||
          title.toLowerCase() === 'legislation' ||
          title.toLowerCase() === 'bill' ||
          title.toLowerCase() === 'legislative tracker')
      ) {
        try {
          if (target.type === 'legislation') {
            const legs = await firstValueFrom(
              this.legislatureService.getLegislationByState(target.stateCd),
            );
            const found = legs?.find((l) => l.id === target.id);
            if (found) {
              title = found.name;
              summary = found.description;
              billData = found;
            }
          } else {
            const bill = await firstValueFrom(
              this.legislatureService.getBillById(target.stateCd, target.id),
            );
            if (bill) {
              const b = bill as any;
              title = b.title || b.name || target.id;
              identifier = b.identifier;
              summary = b.abstract || b.title || b.description;
              billData = bill;
            }
          }
        } catch {
          // fallback to targetName
        }
      }

      if (
        !title ||
        title.toLowerCase() === 'legislation' ||
        title.toLowerCase() === 'bill' ||
        title.toLowerCase() === 'legislative tracker'
      ) {
        title = target.id
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }

      await this.offlineStorage.saveBill({
        id: target.id,
        title,
        identifier,
        summary,
        stateCd: target.stateCd || 'us-ny',
        savedAt: new Date().toISOString(),
        type: target.type,
        billData,
      });
      this.isSavedOffline.set(true);
    }
  }

  onNavItemClick(drawer: MatSidenav) {
    if (this.breakpointObserver.isMatched(Breakpoints.Handset)) {
      drawer.close();
    }
  }

  async handleLogout(drawer?: MatSidenav) {
    if (drawer && this.breakpointObserver.isMatched(Breakpoints.Handset)) {
      drawer.close();
    }
    await this.auth.logout();
    this.router.navigate(['/login']);
  }

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay(),
    );
}
