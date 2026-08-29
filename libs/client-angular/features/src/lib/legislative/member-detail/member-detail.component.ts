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
import { MatCardModule } from '@angular/material/card';

import {
  AuthService,
  LegislatureService,
  SeoService,
} from '@legislative-tracker/client-angular/core';
import { getPlugin, getAllPlugins } from '@legislative-tracker/plugins-core';
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

/**
 * Comprehensive elected official profile page showing contact info, office addresses,
 * social media links, committee roles, and sponsored legislation.
 */
@Component({
  selector: 'app-member-detail',
  imports: [
    MatTabsModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    TableComponent,
    ImgFallbackDirective,
  ],
  templateUrl: './member-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './member-detail.component.scss',
})
export class MemberDetail {
  stateCd = input<string>('');
  id = input<string>(''); // The Member ID

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

        this.seoService.setMemberTags({
          name: m.name,
          details,
          image: m.image,
        });
      } else {
        this.seoService.resetTags();
      }
    });
  }

  memberParams = computed(
    () => {
      const state = this.stateCd();
      const id = this.id();
      return state && id ? { state, id } : undefined;
    },
    { equal: (a, b) => a?.state === b?.state && a?.id === b?.id },
  );

  memberResource = rxResource({
    params: () => this.memberParams(),
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

  chamber = computed(() => {
    const m = this.member();
    if (!m) return '';

    const code = this.stateCd().toLowerCase();
    const plugins = getAllPlugins();
    const plugin =
      getPlugin(code) ||
      plugins.find((p) => {
        const jCode = p.metadata.jurisdiction?.code?.toLowerCase();
        const pId = p.metadata.id?.toLowerCase();
        return (
          jCode === code ||
          pId === code ||
          jCode?.replace(/^us-/, '') === code.replace(/^us-/, '')
        );
      }) ||
      (plugins.length === 1 ? plugins[0] : undefined);

    const chambers = plugin?.metadata?.jurisdiction?.chambers;
    const orgClass = m.current_role?.org_classification?.toLowerCase() || '';

    if (orgClass === 'upper') {
      return chambers?.upper ?? 'Senate';
    }
    if (orgClass === 'lower') {
      return chambers?.lower ?? 'Assembly';
    }

    const title = (m.current_role?.title || '').toLowerCase();
    if (title.includes('senat')) return chambers?.upper ?? 'Senate';
    if (
      title.includes('assembly') ||
      title.includes('rep') ||
      title.includes('house')
    ) {
      return chambers?.lower ?? 'Assembly';
    }

    return (m as any).chamber || '';
  });

  headerTitle = computed(() => {
    const m = this.member();
    if (!m?.name) return '';
    const ch = this.chamber();
    const dist = this.district();
    const districtPart = dist ? `District ${dist}` : '';
    const chamberDistrict = [ch, districtPart].filter(Boolean).join(' ');
    return chamberDistrict ? `${m.name} | ${chamberDistrict}` : m.name;
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

  officialWebsiteUrl = computed<string | undefined>(() => {
    const m = this.member();
    if (!m) return undefined;

    const isGov = (url: string) => {
      try {
        const parsed = new URL(url);
        return parsed.hostname.toLowerCase().endsWith('.gov');
      } catch {
        return /\.gov(?:\/|$)/i.test(url);
      }
    };

    const isSocial = (url: string, note?: string) =>
      Object.values(SOCIAL_PLATFORMS).some(
        (sp) =>
          sp.domainRegex?.test(url) ||
          (note && note.toLowerCase().includes(sp.name.toLowerCase())),
      );

    const memberLinks = m.links ?? [];
    for (const item of memberLinks) {
      if (!item?.url) continue;
      const urlStr = item.url.trim();
      if (!isSocial(urlStr, item.note) && isGov(urlStr)) {
        return urlStr;
      }
    }

    if ((m as any).website && isGov((m as any).website)) {
      return (m as any).website;
    }

    return undefined;
  });

  openStatesUrl = computed<string | undefined>(() => {
    const m = this.member();
    if (!m) return undefined;

    if (m.openstates_url) {
      return m.openstates_url;
    }

    const memberLinks = m.links ?? [];
    for (const item of memberLinks) {
      if (!item?.url) continue;
      const urlStr = item.url.trim();
      if (
        urlStr.includes('openstates.org') ||
        (item.note && item.note.toLowerCase().includes('openstates'))
      ) {
        return urlStr;
      }
    }

    return undefined;
  });

  generalWebsiteUrl = computed<string | undefined>(() => {
    const m = this.member();
    if (!m) return undefined;

    const isGov = (url: string) => {
      try {
        const parsed = new URL(url);
        return parsed.hostname.toLowerCase().endsWith('.gov');
      } catch {
        return /\.gov(?:\/|$)/i.test(url);
      }
    };

    const isOpenStates = (url: string, note?: string) =>
      url.includes('openstates.org') ||
      (note && note.toLowerCase().includes('openstates'));

    const isSocial = (url: string, note?: string) =>
      Object.values(SOCIAL_PLATFORMS).some(
        (sp) =>
          sp.domainRegex?.test(url) ||
          (note && note.toLowerCase().includes(sp.name.toLowerCase())),
      );

    const memberLinks = m.links ?? [];
    for (const item of memberLinks) {
      if (!item?.url) continue;
      const urlStr = item.url.trim();
      if (
        !isSocial(urlStr, item.note) &&
        !isGov(urlStr) &&
        !isOpenStates(urlStr, item.note) &&
        (urlStr.startsWith('http://') || urlStr.startsWith('https://'))
      ) {
        return urlStr;
      }
    }

    if ((m as any).website && !isGov((m as any).website)) {
      return (m as any).website;
    }

    return undefined;
  });

  websiteUrl = computed<string | undefined>(
    () => this.officialWebsiteUrl() || this.generalWebsiteUrl(),
  );

  userRepLabel = computed<string | undefined>(() => {
    const m = this.member();
    if (!m) return undefined;

    const profile = this.authService?.userProfile();
    if (!profile) return undefined;

    const stateReps = profile.legislators?.state ?? [];
    const federalReps = profile.legislators?.federal ?? [];
    const allReps = [...stateReps, ...federalReps];

    const cleanId = (val?: string) =>
      val
        ? String(val)
            .replace(/^ocd-person[\/:=]/, '')
            .trim()
            .toLowerCase()
        : '';

    const normalizeDistrict = (d?: string | number): string => {
      if (d === undefined || d === null) return '';
      const str = String(d)
        .trim()
        .replace(/^district\s+/i, '');
      const part = str.split('-').pop()?.trim() ?? str;
      return part.replace(/^0+/, '');
    };

    const normalizeName = (name?: string): string => {
      if (!name) return '';
      return name
        .toLowerCase()
        .replace(
          /\b(senator|sen\.|assemblymember|assembly member|assemblyman|assemblywoman|representative|rep\.|hon\.|mr\.|ms\.|mrs\.|dr\.)\b/g,
          '',
        )
        .replace(/\b(jr\.|sr\.|ii|iii|iv)\b/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const namesMatch = (nameA: string, nameB: string): boolean => {
      const normA = normalizeName(nameA);
      const normB = normalizeName(nameB);
      if (!normA || !normB) return false;
      if (normA === normB) return true;

      const partsA = normA.split(' ').filter(Boolean);
      const partsB = normB.split(' ').filter(Boolean);
      const lastA = partsA[partsA.length - 1];
      const lastB = partsB[partsB.length - 1];

      if (lastA && lastB && lastA === lastB) {
        const firstA = partsA[0];
        const firstB = partsB[0];
        if (
          firstA &&
          firstB &&
          (firstA === firstB ||
            firstA.startsWith(firstB) ||
            firstB.startsWith(firstA))
        ) {
          return true;
        }
      }

      return normA.includes(normB) || normB.includes(normA);
    };

    const memberCleanId = cleanId(m.id);
    const memberName = m.name ?? '';
    const memberDist = normalizeDistrict(
      m.current_role?.district ?? (m as any).district,
    );
    const memberChamberStr = String(
      m.current_role?.title ??
        m.current_role?.org_classification ??
        (m as any).chamber ??
        '',
    ).toLowerCase();
    const memberChamber =
      memberChamberStr.includes('senat') || memberChamberStr === 'upper'
        ? 'upper'
        : memberChamberStr.includes('assembly') ||
            memberChamberStr.includes('house') ||
            memberChamberStr === 'lower'
          ? 'lower'
          : 'unknown';

    for (const rep of allReps) {
      const repCleanId = cleanId((rep as any).ocdId ?? (rep as any).id);
      const repName = rep.name ?? '';
      const repDist = normalizeDistrict(
        (rep as any).district ?? (rep as any).current_role?.district,
      );
      const isStateRep = stateReps.includes(rep);
      const isFederalRep = federalReps.includes(rep);

      const repChamberStr = String(
        (rep as any).chamber ??
          (rep as any).current_role?.title ??
          (rep as any).current_role?.org_classification ??
          '',
      ).toLowerCase();
      const repChamber =
        repChamberStr.includes('senat') || repChamberStr === 'upper'
          ? 'upper'
          : repChamberStr.includes('assembly') ||
              repChamberStr.includes('house') ||
              repChamberStr === 'lower'
            ? 'lower'
            : 'unknown';

      const idMatches = !!(
        memberCleanId &&
        repCleanId &&
        memberCleanId === repCleanId
      );
      const nameMatches = !!(
        memberName &&
        repName &&
        namesMatch(memberName, repName)
      );
      const districtAndChamberMatches = !!(
        memberDist &&
        repDist &&
        memberDist === repDist &&
        memberChamber !== 'unknown' &&
        repChamber !== 'unknown' &&
        memberChamber === repChamber
      );

      if (idMatches || nameMatches || districtAndChamberMatches) {
        if (repChamber === 'upper') {
          return isFederalRep ? 'Your U.S. Senator' : 'Your State Senator';
        }
        if (repChamber === 'lower') {
          if (repChamberStr.includes('assembly'))
            return 'Your State Assemblymember';
          return isFederalRep
            ? 'Your U.S. Representative'
            : 'Your State Representative';
        }
        return isFederalRep
          ? 'Your Federal Representative'
          : 'Your Representative';
      }
    }

    // Direct district matching against profile.districts
    const userDistricts = profile.districts;
    if (userDistricts && memberDist) {
      const userStateSenate = normalizeDistrict(userDistricts.state?.senate);
      const userStateAssembly = normalizeDistrict(
        userDistricts.state?.assembly,
      );
      const userFederal = normalizeDistrict(userDistricts.federal);

      if (
        userStateSenate &&
        memberDist === userStateSenate &&
        (memberChamber === 'upper' || memberChamber === 'unknown')
      ) {
        return 'Your State Senator';
      }
      if (
        userStateAssembly &&
        memberDist === userStateAssembly &&
        (memberChamber === 'lower' || memberChamber === 'unknown')
      ) {
        return 'Your State Assemblymember';
      }
      if (
        userFederal &&
        memberDist === userFederal &&
        (memberChamber === 'lower' || memberChamber === 'unknown')
      ) {
        return 'Your U.S. Representative';
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
