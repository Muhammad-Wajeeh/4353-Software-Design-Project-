-- Create database
CREATE DATABASE VolunteerHub;
\c VolunteerHub;

-- Table: UserProfiles
CREATE TABLE UserProfiles (
    ID BIGSERIAL PRIMARY KEY,
    FirstName VARCHAR(100),
    LastName VARCHAR(100),
    Username VARCHAR(100) UNIQUE NOT NULL,
    EmailAddress VARCHAR(255) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL
);

-- Table: Events
CREATE TABLE Events (
    ID BIGSERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Description TEXT,
    Location VARCHAR(255),
    ZipCode VARCHAR(20),
    RequiredSkills VARCHAR(255),
    Urgency INT,
    Date DATE
);

-- Table: Attendance (junction table)
CREATE TABLE Attendance (
    MemberID BIGINT NOT NULL,
    EventID BIGINT NOT NULL,
    HasAttended BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (MemberID, EventID),
    FOREIGN KEY (MemberID) REFERENCES UserProfiles(ID) ON DELETE CASCADE,
    FOREIGN KEY (EventID) REFERENCES Events(ID) ON DELETE CASCADE
);