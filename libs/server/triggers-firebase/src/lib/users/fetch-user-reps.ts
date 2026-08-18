import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { Person } from '@jpstroud/opencivicdata-types';
import { getJurisdictionCode } from '@legislative-tracker/server-util-core';
import { UserRepresentative } from '@legislative-tracker/shared/models';
import {
  db,
  dataAccessOpenStatesKey,
  dataAccessGoogleMapsKey,
} from '../config';
import { getGeocode } from '@legislative-tracker/server-data-access-google-maps';

const cleanPersonId = (rawId?: string): string => {
  if (!rawId) return '';
  return String(rawId).replace(/^ocd-person[\/:=]/, '');
};

const deriveChamber = (person: any, currentRole: any): string => {
  if (person.chamber) return person.chamber;
  const org = currentRole?.org_classification;
  if (org === 'upper') return 'Senate';
  if (org === 'lower') return 'Assembly';
  if (org === 'legislature') return 'House';
  return currentRole?.role || '';
};

const mapToUserRepresentative = (person: any): UserRepresentative => {
  const rawId = person.id || person.ocdId || person.name || '';
  const currentRole =
    person.current_role || person.roles?.find((r: any) => !r.end_date);
  const party =
    typeof person.party === 'string'
      ? person.party
      : person.party?.[0]?.name || '';
  const district = person.district || currentRole?.district || '';

  return {
    name: person.name || '',
    chamber: deriveChamber(person, currentRole),
    party,
    district,
    ocdId: cleanPersonId(rawId),
  };
};

const isSuccess = <T>(res: unknown): res is { results: T[] } => {
  return Array.isArray((res as { results: T[] })?.results);
};

const updateUserProfile = async (userId: string, data: object) => {
  const userRef = db.collection('users').doc(userId);
  await userRef.set(data, { merge: true });
};

export const fetchUserReps = onCall(
  { secrets: [dataAccessOpenStatesKey, dataAccessGoogleMapsKey] },
  async (request) => {
    const address = request.data.address;
    if (!address) throw new HttpsError('invalid-argument', 'Address required.');

    const userId = request.auth?.uid;
    if (!userId) throw new HttpsError('invalid-argument', 'User ID required.');

    try {
      const geocoding = await getGeocode(
        address,
        dataAccessGoogleMapsKey.value(),
      );
      if (!geocoding) throw new HttpsError('not-found', 'Geocoding failed');

      const url = new URL('https://v3.openstates.org/people.geo');
      url.searchParams.set('apikey', dataAccessOpenStatesKey.value());
      url.searchParams.set('lat', String(geocoding.lat));
      url.searchParams.set('lng', String(geocoding.lng));
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(
          `OpenStates API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const res = await response.json();

      if (isSuccess<Person>(res)) {
        const federalPeople = res.results.filter(
          (p) => p.jurisdiction?.classification === 'country',
        );
        const statePeople = res.results.filter(
          (p) => p.jurisdiction?.classification === 'state',
        );

        const getRole = (p?: Person) =>
          p?.current_role || (p as any)?.roles?.find((r: any) => !r.end_date);

        const federalHousePerson = federalPeople.find((p) => {
          const r = getRole(p);
          return (
            r?.org_classification === 'lower' || r?.role === 'Representative'
          );
        });
        const stateSenatePerson = statePeople.find((p) => {
          const r = getRole(p);
          return r?.org_classification === 'upper';
        });
        const stateAssemblyPerson = statePeople.find((p) => {
          const r = getRole(p);
          return r?.org_classification === 'lower';
        });

        const districts = {
          federal: getRole(federalHousePerson)?.district || '',
          state: {
            assembly: getRole(stateAssemblyPerson)?.district || '',
            senate: getRole(stateSenatePerson)?.district || '',
          },
        };

        const extractRawStateCode = (): string => {
          const statePerson = statePeople[0];
          if (statePerson) {
            const jId = statePerson.jurisdiction?.id;
            if (typeof jId === 'string') {
              const match = jId.match(/state:([a-z]{2})\b/i);
              if (match) return match[1];
            }
            if ((statePerson.jurisdiction as any)?.code) {
              return (statePerson.jurisdiction as any).code;
            }
            if (statePerson.jurisdiction?.name) {
              return statePerson.jurisdiction.name;
            }
          }
          for (const p of res.results) {
            const divId = (p as any).division_id || (p as any).jurisdiction?.id;
            if (typeof divId === 'string') {
              const match = divId.match(/state:([a-z]{2})\b/i);
              if (match) return match[1];
            }
          }
          if (districts.federal && typeof districts.federal === 'string') {
            const parts = districts.federal.split('-');
            if (parts.length > 1 && parts[0].length === 2) {
              return parts[0];
            }
          }
          return '';
        };

        const rawStateCode = extractRawStateCode();
        const stateKey = rawStateCode ? getJurisdictionCode(rawStateCode) : '';

        const federalReps = federalPeople.map(mapToUserRepresentative);

        let assemblyRep: UserRepresentative | undefined;
        let senateRep: UserRepresentative | undefined;

        if (stateKey) {
          const path = `legislatures/${stateKey}/ocd-person`;

          if (districts.state.assembly) {
            const assemblySnap = await db
              .collection(path)
              .where('current_role.org_classification', '==', 'lower')
              .where(
                'current_role.district',
                '==',
                String(districts.state.assembly),
              )
              .get();

            if (!assemblySnap.empty) {
              assemblyRep = mapToUserRepresentative({
                id: assemblySnap.docs[0].id,
                ...assemblySnap.docs[0].data(),
              });
            }
          }

          if (districts.state.senate) {
            const senateSnap = await db
              .collection(path)
              .where('current_role.org_classification', '==', 'upper')
              .where(
                'current_role.district',
                '==',
                String(districts.state.senate),
              )
              .get();

            if (!senateSnap.empty) {
              senateRep = mapToUserRepresentative({
                id: senateSnap.docs[0].id,
                ...senateSnap.docs[0].data(),
              });
            }
          }
        }

        // Fall back to OpenStates API person object if Firestore match wasn't found
        if (!assemblyRep && stateAssemblyPerson) {
          assemblyRep = mapToUserRepresentative(stateAssemblyPerson);
        }
        if (!senateRep && stateSenatePerson) {
          senateRep = mapToUserRepresentative(stateSenatePerson);
        }

        const stateReps: UserRepresentative[] = [assemblyRep, senateRep].filter(
          (r): r is UserRepresentative => Boolean(r),
        );

        await updateUserProfile(userId, {
          districts,
          legislators: { federal: federalReps, state: stateReps },
        });

        return { districts };
      } else {
        throw new HttpsError('unavailable', 'Failed to parse data.');
      }
    } catch (error: any) {
      console.error('Fetch Reps Error: ', error);
      throw new HttpsError('unknown', 'Failed to fetch reps.', error.message);
    }
  },
);
