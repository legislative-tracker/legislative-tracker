import * as api from "@jpstroud/nys-openlegislation-types";
import { Legislator } from "@legislative-tracker/shared/models";
import { NY_JURISDICTION } from "./constants";
import { fetchNYSenateAPI, isSuccess, isItemsResponse } from "./api-client";

export const generateSortName = (p: api.FullMember["person"]): string => {
  let sortName = p.lastName;
  if (p.suffix !== "") sortName += ` ${p.suffix}`;
  sortName += `, ${p.firstName}`;
  if (p.middleName !== "") sortName += ` ${p.middleName}`;
  return sortName;
};

export const mapAPIMemberToLegislator = (
  m: api.FullMember,
): Partial<Legislator> => {
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

export const updateMembers = async (
  apiKey?: string,
): Promise<Partial<Legislator>[]> => {
  let year: number = new Date().getFullYear();
  if (year % 2 === 0) year--;

  try {
    const res = await fetchNYSenateAPI<any>(`members/${year}`, apiKey);
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
