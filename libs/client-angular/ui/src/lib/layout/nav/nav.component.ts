import {
  Component,
  inject,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import { filter, map, shareReplay, startWith } from 'rxjs/operators';

// App imports
import {
  AuthService,
  ConfigService,
  OfflineStorageService,
  ThemeService,
} from '@legislative-tracker/client-angular/core';
import { Footer } from '../footer/footer.component';

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
    MatTooltipModule,
    AsyncPipe,
    Footer,
  ],
})
export class NavComponent {
  auth = inject(AuthService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  private titleService = inject(Title);

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

  currentFavoriteTarget = computed<{
    type: 'legislation' | 'bill';
    id: string;
    key: string;
  } | null>(() => {
    const url = this.currentUrl();
    if (!url) return null;

    // 1) Match /:stateCd/legislation/:id
    const legMatch = url.match(/^\/[^/]+\/legislation\/([^/?#]+)/);
    if (legMatch && legMatch[1]) {
      const rawId = decodeURIComponent(legMatch[1]);
      const clean = rawId
        .replace(/^leg:/, '')
        .replace(/^legislation:/, '')
        .replace(/^ocd-bill[\/:=]/, '')
        .trim();
      return {
        type: 'legislation',
        id: clean,
        key: `leg:${clean}`,
      };
    }

    // 2) Match /:stateCd/ocd-bill/:id
    const billMatch = url.match(/^\/[^/]+\/ocd-bill\/([^/?#]+)/);
    if (billMatch && billMatch[1]) {
      const rawId = decodeURIComponent(billMatch[1]);
      const clean = rawId
        .replace(/^bill:/, '')
        .replace(/^ocd-bill[\/:=]/, '')
        .trim();
      return {
        type: 'bill',
        id: clean,
        key: `bill:${clean}`,
      };
    }

    return null;
  });

  targetName = computed(() => {
    const target = this.currentFavoriteTarget();
    if (!target) return '';
    const fullTitle = this.titleService.getTitle() || '';
    const name = fullTitle.replace(/\s*\|\s*Legislative Tracker$/, '').trim();
    return name || (target.type === 'legislation' ? 'legislation' : 'bill');
  });

  isFavorited = computed(() => {
    const target = this.currentFavoriteTarget();
    if (!target) return false;
    const profile = this.auth.userProfile?.();
    const favs = profile?.favorites;
    if (!favs || !Array.isArray(favs)) return false;

    const targetKey = target.key.toLowerCase();
    const cleanId = target.id.toLowerCase();

    return favs.some((fav) => {
      const f = String(fav).toLowerCase();
      if (target.type === 'legislation') {
        return (
          f === targetKey || f === `legislation:${cleanId}` || f === cleanId
        );
      } else {
        return f === targetKey || f === `ocd-bill/${cleanId}` || f === cleanId;
      }
    });
  });

  async toggleFavorite(): Promise<void> {
    const target = this.currentFavoriteTarget();
    if (!target || !this.auth.isLoggedIn()) return;
    await this.auth.toggleFavorite(target.key);
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
