const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000', // Assuming the app runs on port 3000
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    supportFile: false,
  },
  video: false,
  screenshotOnRunFailure: true,
});
