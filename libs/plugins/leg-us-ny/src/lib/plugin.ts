import { LegislaturePlugin } from '@legislative-tracker/plugins-core';
import { updateMembers } from './members';
import { updateBills } from './bills';

export const nyLegislaturePlugin: LegislaturePlugin = {
  id: 'ny',
  name: 'New York State Legislature',
  updateMembers,
  updateBills,
};
