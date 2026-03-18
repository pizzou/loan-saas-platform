-- V5: Fix loan_approvals table to match LoanApproval entity
-- The entity has: decision, comment, decision_date, approver_id
-- The table had:  action, reason, user_id, created_at

DO $$
BEGIN
    -- Add decision column (maps from old action)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'loan_approvals' AND column_name = 'decision'
    ) THEN
        ALTER TABLE loan_approvals ADD COLUMN decision VARCHAR(50);
        UPDATE loan_approvals SET decision = action WHERE action IS NOT NULL;
    END IF;

    -- Add comment column (maps from old reason)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'loan_approvals' AND column_name = 'comment'
    ) THEN
        ALTER TABLE loan_approvals ADD COLUMN comment TEXT;
        UPDATE loan_approvals SET comment = reason WHERE reason IS NOT NULL;
    END IF;

    -- Add decision_date column (maps from old created_at)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'loan_approvals' AND column_name = 'decision_date'
    ) THEN
        ALTER TABLE loan_approvals ADD COLUMN decision_date TIMESTAMP DEFAULT NOW();
        UPDATE loan_approvals SET decision_date = created_at WHERE created_at IS NOT NULL;
    END IF;

    -- Add approver_id column (maps from old user_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'loan_approvals' AND column_name = 'approver_id'
    ) THEN
        ALTER TABLE loan_approvals ADD COLUMN approver_id BIGINT REFERENCES app_users(id);
        UPDATE loan_approvals SET approver_id = user_id WHERE user_id IS NOT NULL;
    END IF;
END $$;