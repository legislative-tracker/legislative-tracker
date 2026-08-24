import {
  Component,
  input,
  inject,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  LegislatureService,
  SeoService,
} from '@legislative-tracker/client-angular/core';
import {
  TableComponent,
  ImgFallbackDirective,
} from '@legislative-tracker/client-angular/ui';
import {
  SPONSORSHIP_COLS,
  OpenStatesPerson,
} from '@legislative-tracker/shared/models';

export interface SocialMediaLink {
  platform: string;
  username: string;
  url: string;
  icon: string;
}

const SOCIAL_PLATFORMS: Record<
  string,
  { icon: string; getUrl: (username: string) => string }
> = {
  twitter: {
    icon: 'fa-brands fa-x-twitter',
    getUrl: (username: string) => `https://x.com/${username}`,
  },
  facebook: {
    icon: 'fa-brands fa-facebook',
    getUrl: (username: string) => `https://facebook.com/${username}`,
  },
  instagram: {
    icon: 'fa-brands fa-instagram',
    getUrl: (username: string) => `https://instagram.com/${username}`,
  },
  youtube: {
    icon: 'fa-brands fa-youtube',
    getUrl: (username: string) => `https://youtube.com/@${username}`,
  },
  linkedin: {
    icon: 'fa-brands fa-linkedin',
    getUrl: (username: string) => `https://linkedin.com/in/${username}`,
  },
  tiktok: {
    icon: 'fa-brands fa-tiktok',
    getUrl: (username: string) => `https://tiktok.com/@${username}`,
  },
};

@Component({
  selector: 'app-member-detail',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatTabsModule,
    TableComponent,
    MatProgressSpinnerModule,
    ImgFallbackDirective,
  ],
  templateUrl: './member-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./member-detail.scss'],
})
export class MemberDetail {
  stateCd = input.required<string>();
  id = input.required<string>(); // The Member ID

  private legislatureService = inject(LegislatureService);
  private seoService = inject(SeoService);
  sponsorshipCols = SPONSORSHIP_COLS;

  constructor() {
    effect(() => {
      const m = this.member();
      if (m?.name) {
        const role = this.titleOrPrefix();
        const dist = this.district();
        const party = m.party;
        const details = [role, party, dist ? `District ${dist}` : '']
          .filter(Boolean)
          .join(', ');
        const description = details
          ? `${m.name} (${details}) - Legislative Tracker member profile and sponsored legislation.`
          : `${m.name} - Legislative Tracker member profile and sponsored legislation.`;

        this.seoService.updateTags({
          title: `${m.name} | Legislative Tracker`,
          description,
          image: m.image,
          type: 'profile',
          twitterCard: m.image ? 'summary_large_image' : 'summary',
        });
      } else {
        this.seoService.resetTags();
      }
    });
  }

  memberResource = rxResource({
    params: () => ({ state: this.stateCd(), id: this.id() }),
    stream: ({ params }) =>
      this.legislatureService.getMemberById(params.state, params.id),
  });

  member = computed(
    () => this.memberResource.value() as OpenStatesPerson | undefined,
  );

  sponsorships = computed(() => this.member()?.sponsorships ?? []);

  district = computed(() => {
    const m = this.member();
    return m?.current_role?.district ?? (m as any)?.district ?? '';
  });

  titleOrPrefix = computed(() => {
    const m = this.member();
    return m?.current_role?.title ?? (m as any)?.honorific_prefix ?? '';
  });

  socialLinks = computed<SocialMediaLink[]>(() => {
    const identifiers = this.member()?.other_identifiers ?? [];
    const links: SocialMediaLink[] = [];

    for (const item of identifiers) {
      const scheme = item?.scheme?.toLowerCase();
      const username = item?.identifier;
      if (scheme && username && SOCIAL_PLATFORMS[scheme]) {
        const config = SOCIAL_PLATFORMS[scheme];
        links.push({
          platform: scheme,
          username,
          url: config.getUrl(username),
          icon: config.icon,
        });
      }
    }

    return links;
  });
}
