-- DigiBus Database Schema
-- Generated based on project_diagrams.md

CREATE DATABASE IF NOT EXISTS digibus_db;
USE digibus_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    role ENUM('admin', 'staff', 'student') NOT NULL,
    studentId VARCHAR(50) UNIQUE,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    pass VARCHAR(255) NOT NULL, -- Hashed password
    dob DATE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Routes Table
CREATE TABLE IF NOT EXISTS routes (
    name VARCHAR(100) PRIMARY KEY
);

-- 3. Stops Table
CREATE TABLE IF NOT EXISTS stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    routeName VARCHAR(100) NOT NULL,
    stopName VARCHAR(100) NOT NULL,
    FOREIGN KEY (routeName) REFERENCES routes(name) ON DELETE CASCADE
);

-- 4. Requests Table
CREATE TABLE IF NOT EXISTS requests (
    id VARCHAR(50) PRIMARY KEY,
    studentId VARCHAR(50) NOT NULL,
    studentName VARCHAR(100),
    studentPhone VARCHAR(20),
    studentPhoto LONGTEXT, -- Stores Base64 string
    route VARCHAR(100),
    stop VARCHAR(100),
    status ENUM('pending', 'fee_assigned', 'payment_submitted', 'approved', 'rejection') DEFAULT 'pending',
    fee DECIMAL(10, 2),
    busNo VARCHAR(50),
    receiptImage LONGTEXT, -- Stores Base64 string
    receiptNote TEXT,
    busCardExpiry VARCHAR(20), -- Stored as string or DATE
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES users(studentId) ON DELETE CASCADE
);

-- 5. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    note TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Settings Table (Single Row Configuration)
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    collegeName VARCHAR(255),
    validFrom DATE,
    validTo DATE,
    collegeStamp LONGTEXT, -- Stores Base64 string
    collegeLogo LONGTEXT,  -- Stores Base64 string
    bankAccount VARCHAR(100),
    CONSTRAINT one_row_only CHECK (id = 1)
);

-- Insert Initial Settings
INSERT IGNORE INTO settings (id, collegeName, validFrom, validTo) 
VALUES (1, 'Graphic Era', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY));

-- Insert Demo Accounts
INSERT IGNORE INTO users (id, role, studentId, name, pass) 
VALUES ('student', 'student', 'student', 'Demo Student', 'student123');

INSERT IGNORE INTO users (id, role, name, pass) 
VALUES ('admin', 'admin', 'System Admin', 'admin123');

INSERT IGNORE INTO users (id, role, name, pass) 
VALUES ('staff', 'staff', 'Bus Staff', 'staff123');
