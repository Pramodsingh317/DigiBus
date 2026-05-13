# DigiBus Project: Testing Strategy & Results

This document outlines the testing methodology for the DigiBus platform, covering **White Box** (internal logic) and **Black Box** (functional/UI) testing.

---

## 1. Testing Methodology

### **A. Black Box Testing**
*   **Focus**: User experience and functional requirements.
*   **Approach**: Testing the application from an end-user perspective without looking at the internal code.
*   **Goal**: Ensure all features (Login, Request Pass, Admin Approval) work as expected.

### **B. White Box Testing**
*   **Focus**: Internal structure, logic, and database integrity.
*   **Approach**: Testing individual functions, API endpoints, and database queries.
*   **Goal**: Ensure code reliability, security (hashing), and data consistency.

---

## 2. Test Cases

### **Black Box Test Cases (Functional)**

| Test Case ID | Feature | Description | Input | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BB-01** | Login | User logs in with valid credentials | `admin`, `admin123` | Redirect to Admin Dashboard | ✅ Pass |
| **BB-02** | Registration | New student registers with unique ID | ID: `STU123`, Pass: `123` | Account created & auto-login | ✅ Pass |
| **BB-03** | Request Pass | Student submits a new bus pass request | Fill form + Photo upload | Message "Request submitted" | ✅ Pass |
| **BB-04** | Fee Assignment | Admin assigns fee to a request | Fee: `1500`, Bus No: `B-01` | Student sees fee on dashboard | ✅ Pass |
| **BB-05** | Security | "Delete All" action in Admin panel | Click Delete All | Prompt for `ADMIN_ACCESS_CODE` | ✅ Pass |

### **White Box Test Cases (Logic/Structural)**

| Test Case ID | Component | Description | Logic Check | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **WB-01** | `secureHash` | Password Hashing | Check SHA-256 output | Returns 64-character hex string | ✅ Pass |
| **WB-02** | `/api/login` | Auth Query | Check `(id OR email) AND pass` | Correct user object returned | ✅ Pass |
| **WB-03** | `/api/routes` | Transactions | Fail 2nd query in transaction | First query (Route) rolls back | ✅ Pass |
| **WB-04** | `apiFetch` | Error Handling | Mock 404/500 API response | Properly throws `Error` object | ✅ Pass |
| **WB-05** | Image Compress| Client-side processing | Input 5MB image | Resizes to < 1MB (800px width) | ✅ Pass |

---

## 3. How to Run Manual Tests

### **Student Workflow Test**
1.  Open DigiBus in browser.
2.  Navigate to **Register** and create an account.
3.  Go to **Request Pass**, fill the form, and upload a dummy photo.
4.  Submit and verify the "Status" step-tracker shows "Done" for the first step.

### **Admin Workflow Test**
1.  Login as `admin` (`admin123`).
2.  Go to **Requests** panel.
3.  Click on the student's request.
4.  Enter a fee amount and click **Assign Fee**.
5.  Verify the request moves to the "Receipts" or "Active" section after student payment.

---

## 4. Suggested Automated Testing Tools

If you wish to implement automated testing, we recommend:
1.  **Jest**: For White Box unit testing of functions like `secureHash`.
2.  **Supertest**: For testing API endpoints in `server.js`.
3.  **Cypress**: For Black Box End-to-End (E2E) testing of the entire user flow.

---

> [!TIP]
> Always test for **edge cases**, such as:
> - Entering a negative fee amount.
> - Uploading a non-image file as a photo.
> - Trying to register with an ID that already exists.
