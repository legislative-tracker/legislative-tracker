import { bootstrapApplication } from "@angular/platform-browser";
import { App } from "./app";
import { getAppConfig } from "./app.config";
import { AppConfig } from "@legislative-tracker/client-angular/core";
import configJson from "../public/assets/config.json";

// 1. Fetch Config
fetch("/assets/config.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .catch((err) => {
    console.warn(
      "Config file '/assets/config.json' not found. Falling back to imported configuration.",
      err,
    );
    return configJson as AppConfig;
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
