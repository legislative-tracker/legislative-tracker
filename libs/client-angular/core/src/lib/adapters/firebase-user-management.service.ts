import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from 'firebase/functions';
import { UserManagementService } from '../services/user-management.service';
import { FIREBASE_FUNCTIONS } from '../firebase-tokens';

@Injectable({ providedIn: 'root' })
export class FirebaseUserManagementService implements UserManagementService {
  private functions = inject<Functions>(FIREBASE_FUNCTIONS, { optional: true });

  async grantAdminPrivileges(email: string) {
    if (!this.functions) throw new Error('Firebase Functions not provided');
    const addAdminRole = httpsCallable(this.functions, 'admin-addAdminRole');
    try {
      const result = await addAdminRole({ email });
      console.log('Promotion successful:', result.data);
      return result;
    } catch (error) {
      console.error('Promotion failed:', error);
      throw error;
    }
  }

  async revokeAdminPrivileges(email: string) {
    if (!this.functions) throw new Error('Firebase Functions not provided');
    const removeAdminRole = httpsCallable(
      this.functions,
      'admin-removeAdminRole',
    );
    try {
      const result = await removeAdminRole({ email });
      console.log('Demotion successful:', result.data);
      return result;
    } catch (error) {
      console.error('Demotion failed:', error);
      throw error;
    }
  }
}
