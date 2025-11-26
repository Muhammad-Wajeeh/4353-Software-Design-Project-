-- ============================
-- VOLUNTEERHUB DATABASE SCHEMA
-- ============================

-- Drop tables in correct dependency order
DROP TABLE IF EXISTS Notifications CASCADE;
DROP TABLE IF EXISTS Attendance CASCADE;
DROP TABLE IF EXISTS Events CASCADE;
DROP TABLE IF EXISTS UserProfiles CASCADE;

-- ============================
-- USER PROFILES TABLE
-- ============================
CREATE TABLE UserProfiles (
    ID              BIGSERIAL PRIMARY KEY,
    FirstName       VARCHAR(100),
    LastName        VARCHAR(100),
    Username        VARCHAR(100) UNIQUE NOT NULL,
    EmailAddress    VARCHAR(150) UNIQUE NOT NULL,
    Password        VARCHAR(255) NOT NULL,
    FullName        VARCHAR(200),
    Address1        VARCHAR(200),
    Address2        VARCHAR(200),
    City            VARCHAR(100),
    State           VARCHAR(100),
    Zip             BIGINT,
    Skills          VARCHAR(255),
    Preferences     VARCHAR(255),
    MaxDistanceFromEvents VARCHAR(50),

    -- Weekly availability
    IsAvailableSun  BOOLEAN DEFAULT FALSE,
    IsAvailableMon  BOOLEAN DEFAULT FALSE,
    IsAvailableTue  BOOLEAN DEFAULT FALSE,
    IsAvailableWed  BOOLEAN DEFAULT FALSE,
    IsAvailableThu  BOOLEAN DEFAULT FALSE,
    IsAvailableFri  BOOLEAN DEFAULT FALSE,
    IsAvailableSat  BOOLEAN DEFAULT FALSE
);

-- ============================
-- EVENTS TABLE
-- ============================
CREATE TABLE Events (
    ID              BIGSERIAL PRIMARY KEY,
    Name            VARCHAR(150) NOT NULL,
    Description     VARCHAR(500),
    Location        VARCHAR(200),
    ZipCode         VARCHAR(20),
    RequiredSkills  VARCHAR(255),
    Urgency         INT CHECK (Urgency BETWEEN 0 AND 2),  -- e.g., 0=Low, 1=Medium, 2=High
    Date            DATE NOT NULL,
    Event_Time      TIME,
    Organization    VARCHAR(150),
    Hours           BIGINT,
    CreatorID       BIGINT REFERENCES UserProfiles(ID) ON DELETE SET NULL
);

-- ============================
-- ATTENDANCE TABLE
-- ============================
CREATE TABLE Attendance (
    MemberID        BIGINT NOT NULL,
    EventID         BIGINT NOT NULL,
    HasAttended     BOOLEAN DEFAULT FALSE,
    WillAttend      BOOLEAN DEFAULT FALSE,
    HoursVolunteered BIGINT,

    PRIMARY KEY (MemberID, EventID),

    FOREIGN KEY (MemberID)
        REFERENCES UserProfiles(ID)
        ON DELETE CASCADE,

    FOREIGN KEY (EventID)
        REFERENCES Events(ID)
        ON DELETE CASCADE
);

-- ============================
-- NOTIFICATIONS TABLE
-- ============================
CREATE TABLE Notifications (
    ID              BIGSERIAL PRIMARY KEY,
    Title           VARCHAR(200) NOT NULL,
    Description     VARCHAR(500),
    IsReminder      BOOLEAN DEFAULT FALSE,
    IsAssignment    BOOLEAN DEFAULT FALSE,
    WasRead         BOOLEAN DEFAULT FALSE,
    DateReceived    TIMESTAMP DEFAULT NOW(),
    user_id         BIGINT REFERENCES UserProfiles(ID) ON DELETE CASCADE
);

-- ============================
-- OPTIONAL INDEXES
-- ============================
CREATE INDEX idx_events_date ON Events(Date);
CREATE INDEX idx_attendance_member ON Attendance(MemberID);
CREATE INDEX idx_attendance_event ON Attendance(EventID);

-- ============================
-- SAMPLE DATA (OPTIONAL)
-- ============================
-- INSERT INTO UserProfiles (Username, EmailAddress, Password, FirstName, LastName)
-- VALUES ('TheFoodNoob', 'noob@example.com', 'hashed_pw', 'Jeff', 'Bob');

-- INSERT INTO Events (Name, Location, ZipCode, Urgency, Date, Organization, CreatorID)
-- VALUES ('ABSA Event', 'Houston', '77004', 1, '2025-11-01', 'SASE', 1);
