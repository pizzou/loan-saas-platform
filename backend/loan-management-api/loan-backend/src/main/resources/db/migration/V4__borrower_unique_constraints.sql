-- V4: Add unique constraints to prevent duplicate borrowers
-- Using DO blocks so this is safe to re-run

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_borrower_national_id_org'
    ) THEN
        ALTER TABLE borrowers
            ADD CONSTRAINT uq_borrower_national_id_org
            UNIQUE (national_id, organization_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_borrower_phone_org'
    ) THEN
        ALTER TABLE borrowers
            ADD CONSTRAINT uq_borrower_phone_org
            UNIQUE (phone, organization_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_borrower_email_org'
    ) THEN
        ALTER TABLE borrowers
            ADD CONSTRAINT uq_borrower_email_org
            UNIQUE (email, organization_id);
    END IF;
END $$;