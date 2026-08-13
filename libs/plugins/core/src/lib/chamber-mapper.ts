import { ChamberMapping } from "@legislative-tracker/shared/models";

/**
 * Mapping object that returns the name of a given legislative chamber
 */
export const chamberMapping: ChamberMapping = {
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
 */
export const chamberMapper = (
  jurisdiction: string,
  chamber: string,
): string => {
  return chamberMapping[jurisdiction]?.[chamber] || chamber;
};
