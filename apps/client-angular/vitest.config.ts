import { defineConfig } from "vitest/config";
import angular from "@analogjs/vite-plugin-angular";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "../../"),
  plugins: [
    angular({
      tsconfig: path.resolve(__dirname, "tsconfig.app.json"),
    }),
    tsconfigPaths({
      projects: [path.resolve(__dirname, "../../tsconfig.base.json")],
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [path.resolve(__dirname, "src/test-setup.ts")],
    include: [
      "apps/client-angular/src/**/*.spec.ts",
      "libs/client-angular/**/*.spec.ts",
    ],
    server: {
      deps: {
        inline: [/@angular\//, /rxfire/],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
    },
  },
});
