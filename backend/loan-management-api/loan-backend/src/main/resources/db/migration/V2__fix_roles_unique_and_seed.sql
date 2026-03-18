-- V2: Fix roles table unique constraint and re-seed safely

-- Add UNIQUE constraint on roles.name if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'roles_name_key'
          AND conrelid = 'roles'::regclass
    ) THEN
        ALTER TABLE roles ADD CONSTRAINT roles_name_key UNIQUE (name);
    END IF;
END $$;

-- Seed roles safely now that UNIQUE constraint exists
INSERT INTO roles (name) VALUES ('ADMIN')        ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('MANAGER')      ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('LOAN_OFFICER') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('ACCOUNTANT')   ON CONFLICT (name) DO NOTHING;