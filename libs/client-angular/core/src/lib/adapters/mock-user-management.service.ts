import { Injectable } from '@angular/core';
import { UserManagementService } from '../services/user-management.service';

@Injectable({ providedIn: 'root' })
export class MockUserManagementService implements UserManagementService {
  async grantAdminPrivileges(email: string) {
    console.log('[Mock] Granting admin privileges to:', email);
    return { data: { message: `Successfully granted admin role to ${email}` } };
  }

  async revokeAdminPrivileges(email: string) {
    console.log('[Mock] Revoking admin privileges from:', email);
    return {
      data: { message: `Successfully revoked admin role from ${email}` },
    };
  }
}
