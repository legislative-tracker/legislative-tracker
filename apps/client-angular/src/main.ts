import { bootstrapApplication } from "@angular/platform-browser";
import { App } from "./app";
import { getAppConfig } from "./app.config";
import { AppConfig } from "@legislative-tracker/client-angular/core";

const DEFAULT_EMULATOR_CONFIG: AppConfig = {
  production: false,
  useEmulators: true,
  emulatorHosts: {
    firestore: { host: "127.0.0.1", port: 8080 },
    functions: { host: "127.0.0.1", port: 5001 },
    auth: { host: "127.0.0.1", port: 9099 },
  },
  firebase: {
    projectId: "demo-legislative-tracker",
    appId: "demo-app-id",
    databaseURL: "http://127.0.0.1:9000?ns=demo-legislative-tracker",
    storageBucket: "demo-legislative-tracker.appspot.com",
    apiKey: "demo-api-key",
    authDomain: "demo-legislative-tracker.firebaseapp.com",
    messagingSenderId: "1234567890",
    measurementId: "G-DEMO",
    projectNumber: "1234567890",
    version: "2",
  },
};

// 1. Fetch Config
fetch("/config.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .catch((err) => {
    console.warn(
      "Config file '/config.json' not found. Falling back to Firebase Emulator configuration for local development.",
      err,
    );
    return DEFAULT_EMULATOR_CONFIG;
  })
  .then((config: AppConfig) => {
    // 2. Bootstrap with fetched config
    bootstrapApplication(App, getAppConfig(config)).catch((err) =>
      console.error(err),
    );
  })
  .catch((err) => {
    console.error("CRITICAL: Failed to bootstrap application.", err);
    document.body.innerHTML =
      "<h1>Error loading application. Please check console.</h1>";
  });
