// scripts/build.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Set environment variables
process.env.NODE_ENV = "production";
process.env.SKIP_PREFLIGHT_CHECK = "true";
process.env.CI = "false";

console.log("Building for production...");

try {
  // Run the build
  execSync("react-scripts build", {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_OPTIONS: "--max-old-space-size=4096",
    },
  });
  console.log("Build completed successfully!");
} catch (error) {
  console.error("Build failed:", error);
  process.exit(1);
}
