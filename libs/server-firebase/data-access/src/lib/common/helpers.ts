import {
  Legislator,
  Legislation,
  LegislatureUpdateFnMap,
} from "@legislative-tracker/shared/models";
import { Person } from "@jpstroud/opencivicdata-types";
import { Success, ChamberMapping } from "@legislative-tracker/shared/models";
import * as ny from "../apis/ny/functions";

/**
 * Determines if 'got' responded with a successful fetch
 * @param {unknown} res The response object
 * @return {boolean}
 */
export const isSuccess = <T>(res: unknown): res is Success<T> => {
  if ((res as Success<T>).results) return true;
  return false;
};

/**
 * Mapping object that returns the name of a given legislative chamber
 *
 * TODO: Need to refactor before implementing a state that has different
 * chamber names
 */
const chamberMapping: ChamberMapping = {
  country: {
    upper: "Senate",
    lower: "House",
  },
  state: {
    upper: "Senate",
    lower: "Assembly",
  },
};

/**
 * Returns the name of the chamber in question
 *
 * @param {string} jurisdiction Whether the org is state- or country-level
 * @param {string} chamber Whether the org is the "upper" or "lower" chamber
 * @return {string} The name of the chamber
 */
const chamberMapper = (jurisdiction: string, chamber: string): string => {
  return chamberMapping[jurisdiction][chamber];
};

/**
 * Maps an OpenStates "Person" object to a Partial of our custom "Legislator"
 *
 * @param {Person} person An Open Civic Data "Person" object
 * @return {Partial<Legislator>}
 *
 * TODO: Refactor returned object to an OCD "PersonStub"
 */
export const mapPersonToLegislator = (person: Person): Partial<Legislator> => {
  const chamber: string = chamberMapper(
    person.jurisdiction.classification,
    person.current_role.org_classification,
  );

  return {
    id: person.name.replaceAll(".", "").replaceAll(" ", "-"),
    honorific_prefix: person.current_role.title,
    name: person.name,
    party: person.party,
    chamber: chamber,
    district: person.current_role.district,
  };
};

/**
 * Mapping object that returns the specific "updater" function for a given jurisdiction
 */
const updateFnMap: LegislatureUpdateFnMap<
  Partial<Legislation>[] | Partial<Legislator>[]
> = {
  ny: {
    bills: ny.updateBills,
    members: ny.updateMembers,
  },
};

export const getBillUpdates = async (o: { id: string; bills: string[] }) => {
  const updateFn = updateFnMap[o.id].bills;

  return {
    id: o.id,
    bills: (await updateFn(o.bills)) as Legislation[],
  };
};

/**
 * Fetches updated Legislator data for a given jurisdiction
 *
 * @param {string} legislatureCd The two-digit identifier of the target jurisdiction (e.g. 'ny')
 * @return {Promise<Legislator>} A promise of an array of Legislators
 */
export const getMemberUpdates = async (
  legislatureCd: string,
): Promise<Legislator[]> => {
  const updateFn = updateFnMap[legislatureCd].members;

  return (await updateFn()) as Legislator[];
};

/**
 * Checks whether the provided string is a valid URI for an image file
 *
 * @param {string | undefined} urlStr The string to test
 * @return {boolean}
 */
export const isImageLink = (urlStr: string | undefined): boolean => {
  if (!urlStr || typeof urlStr !== "string") return false;

  try {
    const url = new URL(urlStr);
    if (!["http:", "https:"].includes(url.protocol)) return false;

    const imageExtensions = /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i;
    return imageExtensions.test(url.pathname);
  } catch (e) {
    return false;
  }
};

/**
 * Checks whether the provided string is a valid Email address
 *
 * @param {string | undefined} email The string to be tested
 * @return {boolean}
 */
export const isEmail = (email: string | undefined): boolean => {
  if (!email || typeof email !== "string") return false;
  const cleanEmail = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleanEmail);
};
