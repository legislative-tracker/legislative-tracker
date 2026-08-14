import { LegislaturePlugin } from '@legislative-tracker/plugins-core';
import { updateMembers } from './members';
import { updateBills } from './bills';

export const nyLegislaturePlugin: LegislaturePlugin = {
  id: 'ny',
  jurisdiction: 'US-NY',
  name: 'New York State Legislature',
  updateMembers,
  updateBills,
};

