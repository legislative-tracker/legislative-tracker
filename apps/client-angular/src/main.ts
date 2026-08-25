import { bootstrapApplication } from '@angular/platform-browser';
import {
  loadAppConfig,
  AppConfig,
} from '@legislative-tracker/client-angular/core';
import { App } from './app.component';
import { getAppConfig } from './app.config';
import configJson from '../public/assets/config.json';

loadAppConfig(configJson as AppConfig)
  .then((runtimeConfig) => {
    return bootstrapApplication(App, getAppConfig(runtimeConfig));
  })
  .catch((err) =>
    console.error('CRITICAL: Failed to bootstrap application.', err),
  );
