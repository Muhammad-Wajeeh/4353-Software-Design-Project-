CREATE TABLE "User Profiles"(
    "ID" BIGINT NOT NULL,
    "FirstName" VARCHAR(255) NOT NULL,
    "LastName" VARCHAR(255) NOT NULL,
    "Username" VARCHAR(255) NOT NULL,
    "EmailAddress" VARCHAR(255) NOT NULL,
    "Password" VARCHAR(255) NOT NULL,
    "FullName" VARCHAR(255) NOT NULL,
    "Address1" VARCHAR(255) NOT NULL,
    "Address2" VARCHAR(255) NOT NULL,
    "City" VARCHAR(255) NOT NULL,
    "State" VARCHAR(255) NOT NULL,
    "Zip" BIGINT NOT NULL,
    "Skills" VARCHAR(255) NOT NULL,
    "Preferences" VARCHAR(255) NOT NULL,
    "MaxDistanceFromEvents" VARCHAR(255) NOT NULL,
    "IsAvailableSun" BOOLEAN NOT NULL,
    "IsAvailableMon" BIGINT NOT NULL,
    "IsAvailableTue" BIGINT NOT NULL,
    "IsAvailableWed" BIGINT NOT NULL,
    "IsAvailableThu" BIGINT NOT NULL,
    "IsAvailableFri" BIGINT NOT NULL,
    "IsAvailableSat" BIGINT NOT NULL
);
ALTER TABLE
    "User Profiles" ADD PRIMARY KEY("ID");
ALTER TABLE
    "User Profiles" ADD CONSTRAINT "user profiles_username_unique" UNIQUE("Username");
ALTER TABLE
    "User Profiles" ADD CONSTRAINT "user profiles_emailaddress_unique" UNIQUE("EmailAddress");
CREATE TABLE "Attendance"(
    "MemberID" BIGINT NOT NULL,
    "EventID" BIGINT NOT NULL,
    "HasAttended" BOOLEAN NOT NULL,
    "WillAttend" BIGINT NOT NULL,
    "HoursVolunteered" BIGINT NOT NULL
);
ALTER TABLE
    "Attendance" ADD PRIMARY KEY("MemberID");
ALTER TABLE
    "Attendance" ADD PRIMARY KEY("EventID");
COMMENT
ON COLUMN
    "Attendance"."MemberID" IS 'This + EventID will serve as a composite key';
COMMENT
ON COLUMN
    "Attendance"."EventID" IS 'This + MemberID will serve as a composite key';
CREATE TABLE "Events"(
    "ID" BIGINT NOT NULL,
    "Name" VARCHAR(255) NOT NULL,
    "Description" VARCHAR(255) NOT NULL,
    "Location" VARCHAR(255) NOT NULL,
    "ZipCode" VARCHAR(255) NOT NULL,
    "RequiredSkills" VARCHAR(255) NOT NULL,
    "Urgency" INTEGER NOT NULL,
    "Date" DATE NOT NULL,
    "Organization" VARCHAR(255) NOT NULL,
    "Hours" BIGINT NOT NULL
);
ALTER TABLE
    "Events" ADD PRIMARY KEY("ID");
CREATE TABLE "Notifications"(
    "ID" BIGINT NOT NULL,
    "Title" BIGINT NOT NULL,
    "Description" BIGINT NOT NULL,
    "IsReminder" BIGINT NOT NULL,
    "IsAssignment" BIGINT NOT NULL,
    "WasRead" BIGINT NOT NULL,
    "DateReceived" BIGINT NOT NULL
);
ALTER TABLE
    "Notifications" ADD PRIMARY KEY("ID");
ALTER TABLE
    "Attendance" ADD CONSTRAINT "attendance_memberid_foreign" FOREIGN KEY("MemberID") REFERENCES "User Profiles"("ID");
ALTER TABLE
    "Attendance" ADD CONSTRAINT "attendance_eventid_foreign" FOREIGN KEY("EventID") REFERENCES "Events"("ID");