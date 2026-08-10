import { Injectable, inject } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private app = inject(FirebaseApp);

  async grantAdminPrivileges(email: string) {
    const { getFunctions, httpsCallable } = await import('@angular/fire/functions');

    const functions = getFunctions(this.app);
    const addAdminRole = httpsCallable(functions, 'admin-addAdminRole');
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
    const { getFunctions, httpsCallable } = await import('@angular/fire/functions');

    const functions = getFunctions(this.app);
    const removeAdminRole = httpsCallable(functions, 'admin-removeAdminRole');
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
