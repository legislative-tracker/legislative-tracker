import { Injectable, inject } from "@angular/core";
import { Functions, httpsCallable } from "@angular/fire/functions";

@Injectable({
  providedIn: "root",
})
export class UserManagementService {
  private functions = inject(Functions);

  async grantAdminPrivileges(email: string) {
    const addAdminRole = httpsCallable(this.functions, "admin-addAdminRole");
    try {
      const result = await addAdminRole({ email });
      console.log("Promotion successful:", result.data);
      return result;
    } catch (error) {
      console.error("Promotion failed:", error);
      throw error;
    }
  }

  async revokeAdminPrivileges(email: string) {
    const removeAdminRole = httpsCallable(this.functions, "admin-removeAdminRole");
    try {
      const result = await removeAdminRole({ email });
      console.log("Demotion successful:", result.data);
      return result;
    } catch (error) {
      console.error("Demotion failed:", error);
      throw error;
    }
  }
}
