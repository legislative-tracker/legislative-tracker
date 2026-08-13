import { Injectable } from '@angular/core';

@Injectable()
export abstract class UserManagementService {
  abstract grantAdminPrivileges(email: string): Promise<any>;
  abstract revokeAdminPrivileges(email: string): Promise<any>;
}
