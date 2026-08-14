import { nyLegislaturePlugin } from './plugin';
import { isSuccess, isItemsResponse } from './api-client';
import { generateSortName, mapAPIMemberToLegislator } from './members';
import {
  mapCosponsorsToSponsorships,
  getCosponsors,
  mapAPIBillToLegislation,
} from './bills';

describe('NY Legislature Plugin', () => {
  describe('Plugin Definition', () => {
    it('should have id ny', () => {
      expect(nyLegislaturePlugin.id).toEqual('ny');
    });
  });

  describe('API Client Helpers', () => {
    it('isSuccess identifies API success response', () => {
      expect(isSuccess({ success: true, result: {} })).toBe(true);
      expect(isSuccess({ success: false })).toBe(false);
      expect(isSuccess(null)).toBe(false);
    });

    it('isItemsResponse identifies items array wrapper', () => {
      expect(isItemsResponse({ items: [1, 2] })).toBe(true);
      expect(isItemsResponse({})).toBe(false);
    });
  });

  describe('Members Helper Functions', () => {
    it('generateSortName formats full name correctly with suffix and middle name', () => {
      const p = {
        firstName: 'John',
        middleName: 'R.',
        lastName: 'Doe',
        suffix: 'Jr.',
      } as any;
      expect(generateSortName(p)).toBe('Doe Jr., John R.');
    });

    it('mapAPIMemberToLegislator maps FullMember to LegislatorPartial', () => {
      const mockMember: any = {
        fullName: 'Jane Doe',
        districtCode: 26,
        chamber: 'SENATE',
        shortName: 'DOE',
        personId: 100,
        memberId: 200,
        sessionMemberId: 300,
        imgName: 'jane_doe.jpg',
        person: {
          firstName: 'Jane',
          middleName: '',
          lastName: 'Doe',
          prefix: 'Sen.',
          suffix: '',
          email: 'jane@nysenate.gov',
        },
      };

      const leg = mapAPIMemberToLegislator(mockMember);

      expect(leg.id).toBe('Jane-Doe');
      expect(leg.name).toBe('Jane Doe');
      expect(leg.chamber).toBe('SENATE');
      expect(leg.district).toBe('26');
      expect(leg.email).toBe('jane@nysenate.gov');
      expect(leg.image).toBe(
        'https://legislation.nysenate.gov/static/img/business_assets/members/mini/jane_doe.jpg',
      );
      expect(leg.current_role?.title).toBe('Senator');
      expect(leg.current_role?.org_classification).toBe('upper');
    });
  });

  describe('Bills Helper Functions', () => {
    const mockBill: any = {
      basePrintNoStr: 'S1234',
      printNo: 'S1234A',
      title: 'An Act regarding clean energy',
      publishedDateTime: '2025-01-15T00:00:00Z',
      activeVersion: 'A',
      session: 2025,
      summary: 'Summary text',
      status: { actionDate: '2025-02-01', statusDesc: 'In Committee' },
      billType: { chamber: 'SENATE' },
      amendmentVersions: { items: ['', 'A'] },
      amendments: {
        items: {
          '': {
            coSponsors: {
              items: [
                {
                  fullName: 'Alice Smith',
                  chamber: 'SENATE',
                  districtCode: 10,
                },
              ],
            },
          },
          A: {
            coSponsors: {
              items: [
                {
                  fullName: 'Bob Johnson',
                  chamber: 'SENATE',
                  districtCode: 15,
                },
              ],
            },
          },
        },
      },
    };

    it('mapCosponsorsToSponsorships maps coSponsors for active version', () => {
      const result = mapCosponsorsToSponsorships(mockBill);
      expect(result).toEqual([
        {
          id: 'Bob-Johnson',
          name: 'Bob Johnson',
          entity_type: 'person',
          primary: false,
          classification: 'cosponsor',
        },
      ]);
    });

    it('getCosponsors groups cosponsors by version string', () => {
      const result = getCosponsors(mockBill);
      expect(result['Original']).toEqual([
        {
          id: 'Alice-Smith',
          name: 'Alice Smith',
          chamber: 'SENATE',
          district: '10',
        },
      ]);
      expect(result['A']).toEqual([
        {
          id: 'Bob-Johnson',
          name: 'Bob Johnson',
          chamber: 'SENATE',
          district: '15',
        },
      ]);
    });

    it('mapAPIBillToLegislation converts NY Senate Bill API response to Legislation model', () => {
      const result = mapAPIBillToLegislation(mockBill);

      expect(result.id).toBe('S1234');
      expect(result.identifier).toBe('S1234A');
      expect(result.title).toBe('An Act regarding clean energy');
      expect(result.session).toBe('2025');
      expect(result.text).toBe('Summary text');
      expect(result.current_version).toBe('A');
    });
  });
});
