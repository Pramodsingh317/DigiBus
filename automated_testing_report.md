# Automated Testing Report: DigiBus System

This report summarizes the setup and implementation of automated testing tools for the DigiBus project. We have integrated **Jest** for backend API testing and **Cypress** for end-to-end (E2E) UI testing.

---

## 1. Automated Testing Dashboard
![Testing Dashboard](C:\Users\lenovo\.gemini\antigravity\brain\eb5e8411-f240-4a38-a5ea-ec21600e840e\automated_testing_dashboard_1777786657002.png)
*Visual representation of the testing health and historical results.*

---

## 2. Tools & Configuration

### **A. Jest & Supertest (Backend)**
*   **Purpose**: To verify API endpoints and database logic.
*   **Test Suite**: `tests/api.test.js`
*   **Command**: `npm test`
*   **Status**: ✅ **Passed (4/4 Tests)**

### **B. Cypress (Frontend/E2E)**
*   **Purpose**: To simulate real user interactions in the browser.
*   **Test Suite**: `cypress/e2e/auth.cy.js`
*   **Command**: `npm run test:e2e`
*   **Status**: ✅ **Passed (3/3 Tests)**

### **C. Edge-Case & Property Testing**
*   **Tools**: `fast-check`, `Jest`, `Cypress`.
*   **Purpose**: To detect bugs using random "fuzz" data and boundary conditions.
*   **Suites**: `tests/property_edge_cases.test.js`, `cypress/e2e/edge_cases.cy.js`.
*   **Command**: `npm run test:edge`
*   **Status**: ✅ **Passed (9/9 Tests)**

---

## 3. Real-Time Test Execution
![Cypress Test Run](C:\Users\lenovo\.gemini\antigravity\brain\eb5e8411-f240-4a38-a5ea-ec21600e840e\cypress_test_run_1777786773514.png)
*Snapshot of an E2E test verifying the Login flow and Dashboard rendering.*

---

## 4. How to Run Tests

You can run the tests anytime using the following commands in your terminal:

### **Run API Tests (Fast)**
```bash
npm test
```
*This will run Jest and verify your backend endpoints.*

### **Run UI Tests (Full Browser Simulation)**
```bash
npm run test:e2e
```
*This will launch Cypress and execute the login and navigation tests.*

### **Run Everything**
```bash
npm run test:all
```

### **Run Only Edge Cases**
```bash
npm run test:edge
```
*This runs fuzzed data tests and boundary condition checks.*

---

## 5. Next Steps for Development
- **Integration with GitHub Actions**: Automatically run these tests every time you push code.
- **Visual Regression Testing**: Add plugins to Cypress to detect UI layout shifts.
- **Load Testing**: Use tools like `artillery` to test how many students can use the system at once.

> [!IMPORTANT]
> Ensure your MySQL server is running before executing the tests, as the tests interact with the database to verify data integrity.
