import {
  JurisdictionStub,
  OrganizationStub,
} from '@jpstroud/opencivicdata-types';

export const NY_JURISDICTION: JurisdictionStub = {
  id: 'ocd-jurisdiction/country:us/state:ny/government',
  name: 'New York',
  classification: 'state',
};

export const NY_SENATE_ORG: OrganizationStub = {
  id: 'ocd-organization/country:us/state:ny/senate',
  name: 'New York State Senate',
  classification: 'upper',
};

export const NY_ASSEMBLY_ORG: OrganizationStub = {
  id: 'ocd-organization/country:us/state:ny/assembly',
  name: 'New York State Assembly',
  classification: 'lower',
};
