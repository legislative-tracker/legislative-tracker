import { Component, inject } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app'; // Lightweight import
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DatePipe } from '@angular/common';

// App imports
import { AuthService } from '@legislative-tracker/client-angular/core';
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
  styleUrl: './profile.scss',
})
export class Profile {
  private auth = inject(AuthService);
  private app = inject(FirebaseApp);

  user = this.auth.userProfile;
  legislatorCols = LEGISLATOR_COLS;

  searchAddress = async (e: SearchAddress) => {
    let addressStr = e.address;
    if (e.address2) addressStr += `, ${e.address2}`;
    addressStr += `, ${e.city}, ${e.state} ${e.postalCode}`;

    try {
      const { getFunctions, httpsCallable } =
        await import('@angular/fire/functions');

      const functions = getFunctions(this.app);
      const fetchUserReps = httpsCallable(functions, 'users-fetchUserReps');
      const result = await fetchUserReps({ address: addressStr });
      alert('Success!');
    } catch (error) {
      alert(error);
    }
  };
}
