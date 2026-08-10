import { onCall, HttpsError } from "firebase-functions/v2/https";
import { auth } from "@legislative-tracker/server-firebase/data-access";

/**
 * Promotes a user to Admin status.
 */
export const addAdminRole = onCall(async (request) => {
  if (request.auth?.token.admin !== true) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can promote other users."
    );
  }

  const targetEmail = request.data.email;
  if (!targetEmail) throw new HttpsError("invalid-argument", "Email required.");

  try {
    const user = await auth.getUserByEmail(targetEmail);
    await auth.setCustomUserClaims(user.uid, { admin: true });
    return {
      message: `Success! ${targetEmail} has been granted admin privileges.`,
    };
  } catch (error: any) {
    if (error.code === "auth/user-not-found")
      throw new HttpsError("not-found", "User not found.");
    throw new HttpsError("internal", "Error setting admin claim.");
  }
});

/**
 * Removes Admin status from a user.
 */
export const removeAdminRole = onCall(async (request) => {
  if (request.auth?.token.admin !== true) {
    throw new HttpsError("permission-denied", "Only admins can demote users.");
  }

  const targetEmail = request.data.email;
  if (!targetEmail) throw new HttpsError("invalid-argument", "Email required.");

  if (request.auth.token.email === targetEmail) {
    throw new HttpsError("failed-precondition", "You cannot demote yourself.");
  }

  try {
    const user = await auth.getUserByEmail(targetEmail);
    await auth.setCustomUserClaims(user.uid, { admin: null });
    return { message: `Success! ${targetEmail} is no longer an admin.` };
  } catch (error: any) {
    if (error.code === "auth/user-not-found")
      throw new HttpsError("not-found", "User not found.");
    throw new HttpsError("internal", "Error removing admin claim.");
  }
});
