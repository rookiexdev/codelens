-- NOTE: hand-written migration (flagged per CLAUDE.md).
-- Adds Slack-style status fields and a free-form tech-stack array to users,
-- plus three new ActivityType variants. New columns are all nullable (or
-- have safe defaults), so this is a non-blocking deploy.

-- =============================================================================
-- 1. Extend ActivityType enum
-- =============================================================================

ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'tech_stack_updated';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'status_updated';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'status_cleared';

-- =============================================================================
-- 2. New columns on users
-- =============================================================================

ALTER TABLE "users"
    ADD COLUMN "tech_stack"          TEXT[]      NOT NULL DEFAULT '{}',
    ADD COLUMN "status_emoji"        TEXT,
    ADD COLUMN "status_text"         TEXT,
    ADD COLUMN "status_busy"         BOOLEAN     NOT NULL DEFAULT false,
    ADD COLUMN "status_expires_at"   TIMESTAMP(3),
    ADD COLUMN "status_updated_at"   TIMESTAMP(3);
