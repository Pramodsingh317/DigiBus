# DigiBus Project Diagrams

This document contains the Data Flow Diagram (DFD) and Entity-Relationship (ER) Diagram for the DigiBus project.

## 1. Data Flow Diagram (DFD - Level 1)

The DFD illustrates how information flows through the DigiBus system between external entities (Students, Admins, Staff) and the internal processes/data stores.

```mermaid
graph TD
    %% External Entities
    Student[Student]
    Admin[Admin]
    Staff[Staff]

    %% Processes
    P1((1.0 Authentication))
    P2((2.0 Request Management))
    P3((3.0 Payment Processing))
    P4((4.0 Pass Issuance & Verification))
    P5((5.0 System Configuration))
    P6((6.0 Feedback Management))

    %% Data Stores
    D1[(Users Store)]
    D2[(Requests Store)]
    D3[(Routes Store)]
    D4[(Feedback Store)]
    D5[(Settings Store)]

    %% Student Flows
    Student -->|Credentials| P1
    P1 <-->|User Data| D1
    Student -->|Submit Request| P2
    P2 -->|Save Request| D2
    Student -->|Upload Receipt| P3
    P3 -->|Update Request Status| D2
    Student -->|View Pass| P4
    P4 <-->|Verify Details| D2

    %% Admin Flows
    Admin -->|Credentials| P1
    Admin -->|Assign Fee & Bus No| P2
    P2 <-->|Request Details| D2
    Admin -->|Approve/Reject Receipt| P3
    Admin -->|Update Settings| P5
    P5 -->|Save Config| D5
    Admin -->|Manage Routes| P5
    P5 -->|Save Routes| D3
    Admin -->|Review Feedback| P6
    P6 <-->|Feedback Data| D4

    %% Staff Flows
    Staff -->|Credentials| P1
    Staff -->|Verify Pass Details| P4
    P4 <-->|Pass Validity| D2

    %% Student Feedback
    Student -->|Submit Feedback| P6
```

---

## 2. Entity-Relationship (ER) Diagram

The ER diagram defines the database structure, showing the entities, their attributes, and how they relate to one another.

```mermaid
erDiagram
    USER ||--o{ REQUEST : submits
    USER {
        string id PK
        string role "admin/staff/student"
        string studentId
        string name
        string email
        string pass "hashed"
        date dob
        timestamp createdAt
    }

    REQUEST {
        string id PK
        string studentId FK "links to User.studentId"
        string studentName
        string studentPhone
        string studentPhoto "Base64/URL"
        string route
        string stop
        string status "pending/fee_assigned/payment_submitted/approved/rejection"
        float fee
        string busNo
        string receiptImage
        string receiptNote
        string busCardExpiry
        timestamp createdAt
        timestamp updatedAt
    }

    ROUTE ||--o{ STOP : contains
    ROUTE {
        string name PK
    }
    STOP {
        int id PK
        string routeName FK
        string stopName
    }

    FEEDBACK {
        string id PK
        string name
        string email
        string note
        timestamp createdAt
    }

    SETTINGS {
        string collegeName
        date validFrom
        date validTo
        string collegeStamp "Base64/URL"
        string collegeLogo "Base64/URL"
        string bankAccount
    }
```

### Key Relationships:
- **User to Request**: A Student (User) can submit one or more bus pass requests (though typically one active at a time).
- **Route to Stop**: A Route is composed of multiple physical bus stops.
- **Settings**: A global singleton entity that stores system-wide configuration (College name, logo, validity period).
