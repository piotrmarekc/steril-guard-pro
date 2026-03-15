-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STYLIST',
    "certification" TEXT,
    "expiryDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sterilization_processes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycle_number" INTEGER NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "operator_id" TEXT NOT NULL,
    "biological_test_id" TEXT,
    "physical_parameters" TEXT NOT NULL,
    "notes" TEXT,
    "sealed_at" DATETIME,
    "seal_hash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sterilization_processes_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sterilization_processes_biological_test_id_fkey" FOREIGN KEY ("biological_test_id") REFERENCES "biological_tests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tool_packages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "process_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "riskCategory" TEXT NOT NULL DEFAULT 'LOW',
    "serial_number" TEXT NOT NULL,
    "expiry_date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tool_packages_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "sterilization_processes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chemical_indicators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "process_id" TEXT NOT NULL,
    "operator_id" TEXT,
    "type" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "photo_url" TEXT,
    "position" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chemical_indicators_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "sterilization_processes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chemical_indicators_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "biological_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "test_date" DATETIME NOT NULL,
    "testType" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "laboratory" TEXT,
    "report_url" TEXT,
    "next_test_date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "due_date" DATETIME NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sterilization_processes_cycle_number_key" ON "sterilization_processes"("cycle_number");

-- CreateIndex
CREATE UNIQUE INDEX "tool_packages_serial_number_key" ON "tool_packages"("serial_number");
