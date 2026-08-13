import { openStatesKey } from "../../common/config";
import { Person } from "@jpstroud/opencivicdata-types";
import { OSResponse } from "./types";

const BASE_URL = "https://v3.openstates.org";

/**
 * Generic function to fetch paginated data from OpenStates
 * @param {string} jurisdiction - The state/jurisdiction name (e.g., "New York", "California")
 * @param {string} targetEndpoint - The API endpoint suffix (e.g., "people", "committees")
 */
export const getOpenStatesData = async (
  jurisdiction: string,
  targetEndpoint: string,
): Promise<Person[]> => {
  const endpointUrl = `${BASE_URL}/${targetEndpoint}`;
  console.log(`Fetching ${targetEndpoint} for ${jurisdiction}...`);

  const results: Person[] = [];
  let currentPage = 1;
  let maxPage = 1;

  try {
    do {
      const url = new URL(endpointUrl);
      url.searchParams.set("jurisdiction", jurisdiction);
      url.searchParams.set("page", String(currentPage));
      url.searchParams.set("per_page", "50");
      url.searchParams.set("apikey", openStatesKey.value());

      if (targetEndpoint === "people") {
        url.searchParams.append("include", "offices");
        url.searchParams.append("include", "links");
        url.searchParams.append("include", "other_identifiers");
      }

      console.log(url.toString());

      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "LegislativeTracker/1.0",
        },
      });
      if (!response.ok) {
        throw new Error(
          `OpenStates API error: ${response.status} ${response.statusText}`,
        );
      }

      const body = (await response.json()) as OSResponse<Person>;
      if (body.results) {
        results.push(...body.results);
      }

      maxPage = body.pagination?.max_page || currentPage;
      currentPage++;
    } while (currentPage <= maxPage);

    return results;
  } catch (error: any) {
    console.error(`Failed to fetch data from ${endpointUrl}:`, error.message);
    throw error;
  }
};
