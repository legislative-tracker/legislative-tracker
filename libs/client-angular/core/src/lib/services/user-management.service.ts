import { Injectable } from '@angular/core';

/**
 * Abstract administrative service for managing user roles and authorization claims.
 */
@Injectable()
export abstract class UserManagementService {
  /**
   * Grants administrative privileges and custom claims to a target user.
   *
   * @param email - Target user email address.
   */
  abstract grantAdminPrivileges(email: string): Promise<any>;

  /**
   * Revokes administrative privileges and custom claims from a target user.
   *
   * @param email - Target user email address.
   */
  abstract revokeAdminPrivileges(email: string): Promise<any>;
}
