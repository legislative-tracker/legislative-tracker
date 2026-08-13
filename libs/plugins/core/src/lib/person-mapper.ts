import { Person } from '@jpstroud/opencivicdata-types';
import { Legislator } from '@legislative-tracker/shared/models';
import { chamberMapper } from './chamber-mapper';

/**
 * Maps an OpenStates "Person" object to a Partial of our custom "Legislator"
 */
export const mapPersonToLegislator = (person: Person): Partial<Legislator> => {
  const chamber: string = chamberMapper(
    person.jurisdiction.classification,
    person.current_role.org_classification,
  );

  return {
    id: person.name.replaceAll('.', '').replaceAll(' ', '-'),
    honorific_prefix: person.current_role.title,
    name: person.name,
    party: person.party,
    chamber: chamber,
    district: person.current_role.district,
  };
};
