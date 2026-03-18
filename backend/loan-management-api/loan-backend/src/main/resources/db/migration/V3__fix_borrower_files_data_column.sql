-- V3: Fix borrower_files.data column type from oid to bytea
-- Needed when the table was previously created by ddl-auto=update
-- which used oid instead of bytea for byte[] fields in PostgreSQL

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name  = 'borrower_files'
          AND column_name = 'data'
          AND data_type   = 'oid'
    ) THEN
        ALTER TABLE borrower_files DROP COLUMN data;
        ALTER TABLE borrower_files ADD COLUMN data BYTEA;
    END IF;
END $$;