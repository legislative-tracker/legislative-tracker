import { onRequest } from "firebase-functions/v2/https";

export const helloWorld = onRequest(async (request, response) => {
  response.send("Update Complete!");
});
