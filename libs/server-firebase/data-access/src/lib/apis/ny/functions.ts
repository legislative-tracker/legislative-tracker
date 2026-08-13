import * as api from "@jpstroud/nys-openlegislation-types";
import { defineSecret } from "firebase-functions/params";

import {
  Legislator,
  Legislation,
  Cosponsor,
} from "@legislative-tracker/shared/models";
import {
  JurisdictionStub,
  OrganizationStub,
} from "@jpstroud/opencivicdata-types";

export const nySenateKey = defineSecret("NY_SENATE_KEY");

const NY_JURISDICTION: JurisdictionStub = {
  id: "ocd-jurisdiction/country:us/state:ny/government",
  name: "New York",
  classification: "state",
};

const NY_SENATE_ORG: OrganizationStub = {
  id: "ocd-organization/country:us/state:ny/senate",
  name: "New York State Senate",
  classification: "upper",
};

const NY_ASSEMBLY_ORG: OrganizationStub = {
  id: "ocd-organization/country:us/state:ny/assembly",
  name: "New York State Assembly",
  classification: "lower",
};

const isSuccess = <T>(v: unknown): v is api.APIResponseSuccess<T> => {
  if ((v as api.APIResponseSuccess<T>)?.success === true) return true;
  return false;
};
const isItemsResponse = <T>(v: unknown): v is api.Items<T> => {
  if ((v as api.Items<T>)?.items) return true;
  return false;
};

const fetchNYSenateAPI = async <T>(path: string): Promise<T> => {
  const url = new URL(`https://legislation.nysenate.gov/api/3/${path}`);
  url.searchParams.set("key", nySenateKey.value());
  url.searchParams.set("full", "true");
  url.searchParams.set("limit", "1000");

  console.log(url.toString());
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `NY Senate API request failed: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as T;
};

export const updateMembers = async (): Promise<Partial<Legislator>[]> => {
  let year: number = new Date().getFullYear();
  if (year % 2 === 0) year--;

  try {
    const res = await fetchNYSenateAPI<any>("members/" + year);
    if (isSuccess<api.FullMember[]>(res)) {
      if (isItemsResponse<api.FullMember>(res.result)) {
        const legislators: Partial<Legislator>[] = res.result.items.map(
          (m: api.FullMember) => mapAPIMemberToLegislator(m),
        );
        return legislators;
      } else {
        const error: Error = new Error(JSON.stringify(res));
        throw error;
      }
    } else {
      const error: Error = new Error(JSON.stringify(res));
      throw error;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateBills = async (billList: string[]) => {
  return await Promise.all(
    billList.map(async (bill: string) => {
      const billParts: string[] = bill.split("-");
      try {
        const res = await fetchNYSenateAPI<any>(
          `bills/${billParts.pop()}/${billParts.pop()}`,
        );
        if (isSuccess<api.Bill>(res)) {
          if (!isItemsResponse<api.Bill>(res.result)) {
            return mapAPIBillToLegislation(res.result);
          } else {
            throw new Error(
              "Expected single bill, but received items response.",
            );
          }
        } else {
          throw new Error("Fetch failed");
        }
      } catch (error) {
        console.error(`Error fetching bill ${bill}:`, error);
        throw error;
      }
    }),
  );
};

const generateSortName = (p: api.FullMember["person"]): string => {
  let sortName = p.lastName;
  if (p.suffix != "") sortName += ` ${p.suffix}`;
  sortName += `, ${p.firstName}`;
  if (p.middleName != "") sortName += ` ${p.middleName}`;
  return sortName;
};

const mapAPIMemberToLegislator = (m: api.FullMember): Partial<Legislator> => {
  const now = new Date().toISOString();

  const legislator: Partial<Legislator> = {
    id: m.fullName.replaceAll(".", "").replaceAll(" ", "-"),
    name: m.fullName,
    jurisdiction: NY_JURISDICTION,
    given_name: m.person.firstName,
    family_name: m.person.lastName,
    image:
      m.imgName && !m.imgName.includes("no_image")
        ? `https://legislation.nysenate.gov/static/img/business_assets/members/mini/${m.imgName}`
        : undefined,
    email: m.person.email,
    updated_at: now,

    current_role: {
      title: m.chamber === "SENATE" ? "Senator" : "Assembly Member",
      org_classification: m.chamber === "SENATE" ? "upper" : "lower",
      district: `${m.districtCode}`,
      division_id: "",
    },

    honorific_prefix: m.person.prefix,
    honorific_suffix: m.person.suffix,
    sort_name: generateSortName(m.person),
    chamber: m.chamber,
    district: `${m.districtCode}`,
    additional_name: m.person.middleName,

    other_identifiers: [
      { identifier: m.shortName, scheme: "session short name" },
      { identifier: `${m.person.personId}`, scheme: "person id" },
      { identifier: `${m.memberId}`, scheme: "member id" },
      { identifier: `${m.sessionMemberId}`, scheme: "session member id" },
    ],
  };
  return legislator;
};

const mapAPIBillToLegislation = (b: api.Bill): Legislation => {
  const now = new Date().toISOString();

  const fromOrg =
    b.billType.chamber === "SENATE" ? NY_SENATE_ORG : NY_ASSEMBLY_ORG;

  const legislation: Legislation = {
    id: b.basePrintNoStr,
    session: `${b.session}`,
    identifier: b.printNo,
    title: b.title,
    jurisdiction: NY_JURISDICTION,
    from_organization: fromOrg,
    classification: ["bill"],
    subject: [],
    extras: {},
    created_at: b.publishedDateTime,
    updated_at: now,
    openstates_url: "",
    first_action_date: b.publishedDateTime,
    latest_action_date: b.status.actionDate,
    latest_action_description: b.status.statusDesc,
    latest_passage_date: "",

    actions: [],
    versions: [],
    documents: [],

    sponsorships: mapCosponsorsToSponsorships(b),

    current_version: b.activeVersion,
    text: b.summary,
    cosponsors: getCosponsors(b),
  };

  return legislation;
};

const mapCosponsorsToSponsorships = (b: api.Bill) => {
  const activeVer = b.activeVersion;
  if (!b.amendments.items[activeVer]) return [];

  return b.amendments.items[activeVer].coSponsors.items.map(
    (c: api.Member) => ({
      id: c.fullName.replaceAll(".", "").replaceAll(" ", "-"),
      name: c.fullName,
      entity_type: "person" as const,
      primary: false,
      classification: "cosponsor",
    }),
  );
};

const getCosponsors = (b: api.Bill): { [key: string]: Cosponsor[] } => {
  const cosponsorsByVersion: { [key: string]: Cosponsor[] } = {};
  const amendmentVersions: string[] = b.amendmentVersions.items;

  amendmentVersions.forEach((v: string) => {
    const cosponsors: Cosponsor[] = [];

    if (b.amendments.items[v] && b.amendments.items[v].coSponsors) {
      b.amendments.items[v].coSponsors.items.forEach((c: api.Member) =>
        cosponsors.push({
          id: c.fullName.replaceAll(".", "").replaceAll(" ", "-"),
          name: c.fullName,
          chamber: c.chamber,
          district: `${c.districtCode}`,
        }),
      );
    }
    cosponsorsByVersion[v === "" ? "Original" : v] = cosponsors;
  });

  return cosponsorsByVersion;
};
