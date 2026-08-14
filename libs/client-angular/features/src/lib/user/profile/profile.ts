import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DatePipe } from '@angular/common';

import {
  AuthService,
  FIREBASE_FUNCTIONS,
} from '@legislative-tracker/client-angular/core';
import {
  AddressForm,
  TableComponent,
} from '@legislative-tracker/client-angular/ui';
import {
  LEGISLATOR_COLS,
  SearchAddress,
} from '@legislative-tracker/shared/models';

@Component({
  selector: 'app-profile',
  imports: [
    DatePipe,
    MatListModule,
    MatIconModule,
    AddressForm,
    MatTabsModule,
    TableComponent,
  ],
  templateUrl: './profile.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './profile.scss',
})
export class Profile {
  private auth = inject(AuthService);
  private functions = inject(FIREBASE_FUNCTIONS, { optional: true });

  user = this.auth.userProfile;
  legislatorCols = LEGISLATOR_COLS;

  searchAddress = async (e: SearchAddress) => {
    let addressStr = e.address;
    if (e.address2) addressStr += `, ${e.address2}`;
    addressStr += `, ${e.city}, ${e.state} ${e.postalCode}`;

    try {
      if (!this.functions) throw new Error('Firebase Functions not available');
      const { httpsCallable } = await import('firebase/functions');

      const fetchUserReps = httpsCallable(
        this.functions,
        'users-fetchUserReps',
      );
      const result = await fetchUserReps({ address: addressStr });
      alert('Success!');
    } catch (error) {
      alert(error);
    }
  };
}
