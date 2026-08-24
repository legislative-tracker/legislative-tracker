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
  AuthService,
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
  username?: string;
  url: string;
  icon: string;
}

export interface MemberPhone {
  label: string;
  number: string;
  telUrl: string;
  officeName?: string;
}

const SOCIAL_PLATFORMS: Record<
  string,
  {
    name: string;
    icon: string;
    getUrl: (username: string) => string;
    domainRegex?: RegExp;
  }
> = {
  twitter: {
    name: 'X (Twitter)',
    icon: 'fa-brands fa-x-twitter',
    getUrl: (username: string) => `https://x.com/${username.replace(/^@/, '')}`,
    domainRegex: /(?:twitter\.com|x\.com)\/([^/?#]+)/i,
  },
  facebook: {
    name: 'Facebook',
    icon: 'fa-brands fa-facebook',
    getUrl: (username: string) => `https://facebook.com/${username}`,
    domainRegex: /(?:facebook\.com|fb\.com|fb\.me)\/([^/?#]+)/i,
  },
  instagram: {
    name: 'Instagram',
    icon: 'fa-brands fa-instagram',
    getUrl: (username: string) =>
      `https://instagram.com/${username.replace(/^@/, '')}`,
    domainRegex: /(?:instagram\.com|instagr\.am)\/([^/?#]+)/i,
  },
  youtube: {
    name: 'YouTube',
    icon: 'fa-brands fa-youtube',
    getUrl: (username: string) =>
      `https://youtube.com/@${username.replace(/^@/, '')}`,
    domainRegex:
      /(?:youtube\.com\/(?:@|c\/|channel\/|user\/)?|youtu\.be\/)([^/?#]+)/i,
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'fa-brands fa-linkedin',
    getUrl: (username: string) => `https://linkedin.com/in/${username}`,
    domainRegex: /linkedin\.com\/(?:in|company)\/([^/?#]+)/i,
  },
  tiktok: {
    name: 'TikTok',
    icon: 'fa-brands fa-tiktok',
    getUrl: (username: string) =>
      `https://tiktok.com/@${username.replace(/^@/, '')}`,
    domainRegex: /tiktok\.com\/@?([^/?#]+)/i,
  },
  threads: {
    name: 'Threads',
    icon: 'fa-brands fa-threads',
    getUrl: (username: string) =>
      `https://threads.net/@${username.replace(/^@/, '')}`,
    domainRegex: /threads\.net\/@?([^/?#]+)/i,
  },
  bluesky: {
    name: 'Bluesky',
    icon: 'fa-brands fa-bluesky',
    getUrl: (username: string) => `https://bsky.app/profile/${username}`,
    domainRegex: /bsky\.app\/profile\/([^/?#]+)/i,
  },
  mastodon: {
    name: 'Mastodon',
    icon: 'fa-brands fa-mastodon',
    getUrl: (username: string) =>
      username.startsWith('http')
        ? username
        : `https://mastodon.social/@${username.replace(/^@/, '')}`,
    domainRegex: /(?:mastodon\.[a-z]+|mstdn\.[a-z]+)\/@?([^/?#]+)/i,
  },
  github: {
    name: 'GitHub',
    icon: 'fa-brands fa-github',
    getUrl: (username: string) => `https://github.com/${username}`,
    domainRegex: /github\.com\/([^/?#]+)/i,
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
  private authService = inject(AuthService, { optional: true });
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

  primaryEmail = computed<string | undefined>(() => {
    const m = this.member();
    return m?.email || (m as any)?.emailAddress || undefined;
  });

  phones = computed<MemberPhone[]>(() => {
    const m = this.member();
    if (!m) return [];

    const phoneList: MemberPhone[] = [];
    const seenNumbers = new Set<string>();

    const addPhone = (
      rawNum: string,
      officeName?: string,
      classification?: string,
    ) => {
      const cleanDigits = rawNum.replace(/[^\d+]/g, '');
      if (!cleanDigits || seenNumbers.has(cleanDigits)) return;
      seenNumbers.add(cleanDigits);

      let label = officeName ? `${officeName}: ${rawNum}` : `Call ${rawNum}`;
      if (classification && !officeName) {
        const titleCaseClass =
          classification.charAt(0).toUpperCase() + classification.slice(1);
        label = `${titleCaseClass} Office: ${rawNum}`;
      }

      phoneList.push({
        label,
        number: rawNum,
        telUrl: `tel:${cleanDigits}`,
        officeName: officeName || classification,
      });
    };

    if (Array.isArray(m.offices)) {
      for (const office of m.offices) {
        if (office.voice) {
          addPhone(office.voice, office.name, office.classification);
        }
      }
    }

    if ((m as any).phone) {
      addPhone((m as any).phone);
    }
    if ((m as any).phoneNumber) {
      addPhone((m as any).phoneNumber);
    }

    return phoneList;
  });

  websiteUrl = computed<string | undefined>(() => {
    const m = this.member();
    if (!m) return undefined;

    const memberLinks = m.links ?? [];
    for (const item of memberLinks) {
      if (!item?.url) continue;
      const urlStr = item.url.trim();
      const isSocial = Object.values(SOCIAL_PLATFORMS).some(
        (sp) =>
          sp.domainRegex?.test(urlStr) ||
          (item.note &&
            item.note.toLowerCase().includes(sp.name.toLowerCase())),
      );
      if (
        !isSocial &&
        (urlStr.startsWith('http://') || urlStr.startsWith('https://'))
      ) {
        return urlStr;
      }
    }

    if (m.openstates_url) {
      return m.openstates_url;
    }

    return (m as any).website;
  });

  userRepLabel = computed<string | undefined>(() => {
    const m = this.member();
    if (!m) return undefined;

    const profile = this.authService?.userProfile();
    if (!profile?.legislators) return undefined;

    const stateReps = profile.legislators.state ?? [];
    const federalReps = profile.legislators.federal ?? [];
    const allReps = [...stateReps, ...federalReps];
    if (allReps.length === 0) return undefined;

    const clean = (val?: string) =>
      val
        ? String(val)
            .replace(/^ocd-person[\/:=]/, '')
            .trim()
            .toLowerCase()
        : '';

    const memberCleanId = clean(m.id);
    const memberName = (m.name ?? '').trim().toLowerCase();

    for (const rep of allReps) {
      const repCleanId = clean((rep as any).ocdId ?? (rep as any).id);
      const repName = (rep.name ?? '').trim().toLowerCase();
      const isStateRep = stateReps.includes(rep);
      const isFederalRep = federalReps.includes(rep);

      const idMatches = !!(
        memberCleanId &&
        repCleanId &&
        memberCleanId === repCleanId
      );
      const nameMatches = !!(memberName && repName && memberName === repName);

      if (idMatches || nameMatches) {
        const chamber = String(
          (rep as any).chamber ??
            (rep as any).current_role?.title ??
            (rep as any).current_role?.org_classification ??
            '',
        ).toLowerCase();

        if (chamber.includes('senat') || chamber === 'upper') {
          return isFederalRep ? 'Your U.S. Senator' : 'Your State Senator';
        }
        if (chamber.includes('assembly')) {
          return 'Your State Assemblymember';
        }
        if (
          chamber.includes('house') ||
          chamber.includes('rep') ||
          chamber === 'lower'
        ) {
          return isFederalRep
            ? 'Your U.S. Representative'
            : 'Your State Representative';
        }
        return isFederalRep
          ? 'Your Federal Representative'
          : 'Your Representative';
      }
    }

    return undefined;
  });

  socialLinks = computed<SocialMediaLink[]>(() => {
    const m = this.member();
    if (!m) return [];

    const identifiers = m.other_identifiers ?? [];
    const memberLinks = m.links ?? [];
    const links: SocialMediaLink[] = [];
    const seenUrls = new Set<string>();

    const normalizeUrl = (u: string) =>
      u
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/$/, '')
        .toLowerCase();

    // 1. Process other_identifiers (e.g. { scheme: 'twitter', identifier: 'janedoe' })
    for (const item of identifiers) {
      const scheme = item?.scheme?.toLowerCase();
      const username = item?.identifier;
      if (scheme && username && SOCIAL_PLATFORMS[scheme]) {
        const config = SOCIAL_PLATFORMS[scheme];
        const url = config.getUrl(username);
        const norm = normalizeUrl(url);
        if (!seenUrls.has(norm)) {
          seenUrls.add(norm);
          links.push({
            platform: scheme,
            username,
            url,
            icon: config.icon,
          });
        }
      }
    }

    // 2. Process links array (e.g. { url: 'https://twitter.com/janedoe', note: 'twitter' })
    for (const item of memberLinks) {
      if (!item?.url) continue;
      const urlStr = item.url.trim();
      const noteStr = (item.note ?? '').toLowerCase();

      for (const [key, config] of Object.entries(SOCIAL_PLATFORMS)) {
        let username = '';
        if (config.domainRegex) {
          const match = urlStr.match(config.domainRegex);
          if (match && match[1]) {
            username = match[1];
          }
        }
        if (
          !username &&
          (noteStr.includes(key) || noteStr.includes(config.name.toLowerCase()))
        ) {
          username = urlStr.split('/').filter(Boolean).pop() || '';
        }

        if (
          username ||
          (config.domainRegex && config.domainRegex.test(urlStr)) ||
          noteStr === key
        ) {
          const norm = normalizeUrl(urlStr);
          if (!seenUrls.has(norm)) {
            seenUrls.add(norm);
            links.push({
              platform: key,
              username: username || undefined,
              url: urlStr,
              icon: config.icon,
            });
          }
          break;
        }
      }
    }

    return links;
  });
}
