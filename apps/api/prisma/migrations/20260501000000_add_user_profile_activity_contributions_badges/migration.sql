-- NOTE: hand-written migration (flagged per CLAUDE.md).
-- Reason Prisma cannot generate this on its own: adding NOT NULL + UNIQUE
-- columns (username) to a table with existing rows requires a backfill step,
-- which prisma migrate diff does not handle.
--
-- Soft-delete uniqueness strategy:
--   email and username keep plain UNIQUE constraints. On soft-delete the
--   SoftDeleteService rewrites these columns to `<value>#deleted-<id>` so
--   the original value is freed for a new registration. This keeps Prisma's
--   findUnique semantics straightforward (no partial-index footguns) at the
--   cost of cosmetic pollution on soft-deleted rows.

-- =============================================================================
-- 1. Enums
-- =============================================================================

CREATE TYPE "SocialProvider" AS ENUM (
    -- git hosting
    'github',
    'gitlab',
    'bitbucket',
    -- competitive / coding platforms
    'leetcode',
    'codeforces',
    'hackerrank',
    'codechef',
    'kaggle',
    'codepen',
    -- writing / Q&A
    'stackoverflow',
    'devto',
    'medium',
    'hashnode',
    'substack',
    -- social networks
    'x',
    'linkedin',
    'threads',
    'mastodon',
    'bluesky',
    'instagram',
    'facebook',
    'reddit',
    'youtube',
    'twitch',
    'telegram',
    'discord',
    -- design portfolios
    'dribbble',
    'behance',
    -- generic
    'website',
    'other'
);

CREATE TYPE "ActivityType" AS ENUM (
    'user_registered',
    'user_logged_in',
    'profile_updated',
    'username_changed',
    'social_links_updated',
    'oauth_connected',
    'oauth_disconnected',
    'review_created',
    'review_shared',
    'badge_awarded',
    'account_deleted',
    'account_restored'
);

CREATE TYPE "BadgeTier" AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- =============================================================================
-- 2. Extend "users" with profile fields + soft-delete tombstone column
-- =============================================================================

ALTER TABLE "users"
    ADD COLUMN "username"     TEXT,
    ADD COLUMN "full_name"    TEXT,
    ADD COLUMN "description"  TEXT,
    ADD COLUMN "company"      TEXT,
    ADD COLUMN "location"     TEXT,
    ADD COLUMN "avatar_seed"  TEXT,
    ADD COLUMN "avatar_url"   TEXT,
    ADD COLUMN "deleted_at"   TIMESTAMP(3);

-- Backfill username for existing rows. Strategy:
--   * lower-case the email local-part
--   * replace any character outside [a-z0-9_-] with '-'
--   * suffix with first 8 chars of the row's uuid to guarantee uniqueness
--     (avoids a multi-row collision loop in SQL).
UPDATE "users"
SET "username" = (
    regexp_replace(lower(split_part("email", '@', 1)), '[^a-z0-9_-]', '-', 'g')
    || '-' ||
    substr(replace("id"::text, '-', ''), 1, 8)
)
WHERE "username" IS NULL;

ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- Drop the existing plain unique index on email; replaced below by a
-- partial unique index so that soft-deleted rows do not block re-registration.
DROP INDEX IF EXISTS "users_email_key";

-- Partial unique indexes: uniqueness applies only to live rows.
CREATE UNIQUE INDEX "users_email_active_key"
    ON "users" ("email")
    WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "users_username_active_key"
    ON "users" ("username")
    WHERE "deleted_at" IS NULL;

CREATE INDEX "users_deleted_at_idx" ON "users" ("deleted_at");

-- =============================================================================
-- 3. user_social_links
-- =============================================================================

CREATE TABLE "user_social_links" (
    "id"       UUID NOT NULL,
    "user_id"  UUID NOT NULL,
    "provider" "SocialProvider" NOT NULL,
    "url"      TEXT NOT NULL,
    "label"    TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "user_social_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_social_links_user_id_idx" ON "user_social_links" ("user_id");
CREATE UNIQUE INDEX "user_social_links_user_id_position_key"
    ON "user_social_links" ("user_id", "position");

ALTER TABLE "user_social_links"
    ADD CONSTRAINT "user_social_links_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Enforce: position must be 0..3 (max 4 links per user).
ALTER TABLE "user_social_links"
    ADD CONSTRAINT "user_social_links_position_range_chk"
    CHECK ("position" >= 0 AND "position" <= 3);

-- =============================================================================
-- 4. activity_log
-- =============================================================================

CREATE TABLE "activity_log" (
    "id"          UUID NOT NULL,
    "user_id"     UUID NOT NULL,
    "type"        "ActivityType" NOT NULL,
    "metadata"    JSONB NOT NULL DEFAULT '{}',
    "ip_address"  TEXT,
    "user_agent"  TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activity_log_user_id_occurred_at_idx"
    ON "activity_log" ("user_id", "occurred_at" DESC);
CREATE INDEX "activity_log_user_id_type_occurred_at_idx"
    ON "activity_log" ("user_id", "type", "occurred_at" DESC);

ALTER TABLE "activity_log"
    ADD CONSTRAINT "activity_log_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- 5. user_contributions  (daily rollup; review_created counts only)
-- =============================================================================

CREATE TABLE "user_contributions" (
    "user_id" UUID NOT NULL,
    "day"     DATE NOT NULL,
    "count"   INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_contributions_pkey" PRIMARY KEY ("user_id", "day")
);

CREATE INDEX "user_contributions_user_id_day_idx"
    ON "user_contributions" ("user_id", "day" DESC);

ALTER TABLE "user_contributions"
    ADD CONSTRAINT "user_contributions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- 6. badges + user_badges
-- =============================================================================

CREATE TABLE "badges" (
    "id"          UUID NOT NULL,
    "slug"        TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_key"    TEXT NOT NULL,
    "tier"        "BadgeTier",
    "criteria"    JSONB NOT NULL DEFAULT '{}',
    "is_active"   BOOLEAN NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "badges_slug_key" ON "badges" ("slug");

CREATE TABLE "user_badges" (
    "id"         UUID NOT NULL,
    "user_id"    UUID NOT NULL,
    "badge_id"   UUID NOT NULL,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata"   JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key"
    ON "user_badges" ("user_id", "badge_id");
CREATE INDEX "user_badges_user_id_idx" ON "user_badges" ("user_id");
CREATE INDEX "user_badges_badge_id_idx" ON "user_badges" ("badge_id");

ALTER TABLE "user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_badges"
    ADD CONSTRAINT "user_badges_badge_id_fkey"
    FOREIGN KEY ("badge_id") REFERENCES "badges"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
