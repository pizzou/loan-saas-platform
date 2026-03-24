-- LoanSaaS Initial Schema
-- Flyway migration V1

CREATE TABLE IF NOT EXISTS organizations (
    id       BIGSERIAL PRIMARY KEY,
    name     VARCHAR(255) NOT NULL,
    industry VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS roles (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    CONSTRAINT roles_name_key UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS app_users (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    password        VARCHAR(255) NOT NULL,
    role_id         BIGINT REFERENCES roles(id),
    organization_id BIGINT REFERENCES organizations(id),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    CONSTRAINT app_users_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS borrowers (
    id              BIGSERIAL PRIMARY KEY,
    first_name      VARCHAR(255) NOT NULL,
    last_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255),
    phone           VARCHAR(50),
    national_id     VARCHAR(100),
    address         TEXT,
    credit_score    INTEGER,
    kyc_status      VARCHAR(50) DEFAULT 'PENDING',
    organization_id BIGINT REFERENCES organizations(id),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loans (
    id                     BIGSERIAL PRIMARY KEY,
    amount                 DOUBLE PRECISION,
    interest_rate          DOUBLE PRECISION,
    duration_months        INTEGER,
    currency               VARCHAR(10),
    start_date             DATE,
    notes                  TEXT,
    rejection_reason       TEXT,
    risk_score             DOUBLE PRECISION,
    risk_category          VARCHAR(50),
    collateral_value       DOUBLE PRECISION,
    collateral_description TEXT,
    status                 VARCHAR(50),
    borrower_id            BIGINT REFERENCES borrowers(id),
    organization_id        BIGINT REFERENCES organizations(id),
    approved_by_user_id    BIGINT REFERENCES app_users(id),
    approved_at            DATE,
    created_at             TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id                  BIGSERIAL PRIMARY KEY,
    amount              DOUBLE PRECISION,
    penalty             DOUBLE PRECISION DEFAULT 0,
    due_date            DATE,
    paid_date           DATE,
    paid                BOOLEAN DEFAULT FALSE,
    payment_method      VARCHAR(100),
    transaction_id      VARCHAR(255),
    installment_number  INTEGER,
    loan_id             BIGINT REFERENCES loans(id),
    organization_id     BIGINT REFERENCES organizations(id),
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS borrower_files (
    id          BIGSERIAL PRIMARY KEY,
    file_name   VARCHAR(255),
    file_type   VARCHAR(255),
    file_size   BIGINT,
    data        BYTEA,
    borrower_id BIGINT REFERENCES borrowers(id),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loan_approvals (
    id          BIGSERIAL PRIMARY KEY,
    loan_id     BIGINT REFERENCES loans(id),
    user_id     BIGINT REFERENCES app_users(id),
    action      VARCHAR(50),
    reason      TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    action      VARCHAR(255),
    entity_name VARCHAR(255),
    entity_id   BIGINT,
    user_id     BIGINT REFERENCES app_users(id),
    timestamp   TIMESTAMP DEFAULT NOW(),
    details     TEXT,
    ip_address  VARCHAR(255),
    user_agent  VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         BIGSERIAL PRIMARY KEY,
    token      VARCHAR(255) NOT NULL,
    user_id    BIGINT REFERENCES app_users(id),
    expires_at TIMESTAMP NOT NULL,
    used       BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT password_reset_tokens_token_key UNIQUE (token)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_loans_org       ON loans(organization_id);
CREATE INDEX IF NOT EXISTS idx_loans_borrower  ON loans(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loans_status    ON loans(status);
CREATE INDEX IF NOT EXISTS idx_payments_loan   ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_due    ON payments(due_date) WHERE paid = FALSE;
CREATE INDEX IF NOT EXISTS idx_payments_org    ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_borrowers_org   ON borrowers(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email     ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_files_borrower  ON borrower_files(borrower_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity    ON audit_logs(entity_name, entity_id);

-- Roles are seeded in V2 migration