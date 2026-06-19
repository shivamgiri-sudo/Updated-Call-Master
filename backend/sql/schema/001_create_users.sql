-- =====================================================
-- Executive Dashboard MVP - Users Table Migration
-- =====================================================
-- Creates cm_users table with RBAC and data scoping support
-- Role hierarchy: CEO > PROCESS_HEAD > BRANCH_MANAGER > TL > QA_HEAD > ANALYST > AGENT
-- Data scope: NULL process_codes/branch_codes = see all data (typically CEO)
-- =====================================================

-- Drop table if exists (for clean re-runs during development)
DROP TABLE IF EXISTS cm_users;

-- Create users table with RBAC
CREATE TABLE IF NOT EXISTS cm_users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Authentication
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    employee_code VARCHAR(50) UNIQUE,

    -- Profile
    full_name VARCHAR(255) NOT NULL,
    role ENUM('CEO', 'PROCESS_HEAD', 'BRANCH_MANAGER', 'TL', 'QA_HEAD', 'ANALYST', 'AGENT') NOT NULL,

    -- Multi-tenant scope
    client_id INT NOT NULL DEFAULT 1,

    -- Data scope (NULL = see all data)
    process_codes JSON DEFAULT NULL COMMENT 'Array of process codes user can access. NULL = all processes',
    branch_codes JSON DEFAULT NULL COMMENT 'Array of branch codes user can access. NULL = all branches',

    -- Status tracking
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at DATETIME DEFAULT NULL,

    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes for performance
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_employee_code (employee_code),
    INDEX idx_client_id (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Seed Data: CEO User
-- =====================================================
-- Default credentials:
-- Email: ceo@example.com
-- Password: ChangeMe123! (placeholder - will be updated with proper bcrypt hash)
-- Password hash below is a placeholder format - replace with real bcrypt hash later
-- =====================================================

INSERT INTO cm_users (
    email,
    password_hash,
    employee_code,
    full_name,
    role,
    client_id,
    process_codes,
    branch_codes,
    is_active,
    last_login_at
) VALUES (
    'ceo@example.com',
    '$2b$10$PlaceholderHashWillBeReplacedWithRealBcryptHash123456789',
    'EMP001',
    'System Administrator',
    'CEO',
    1,
    NULL,  -- CEO sees all processes
    NULL,  -- CEO sees all branches
    TRUE,
    NULL
);

-- =====================================================
-- Verification Queries (commented out - run manually)
-- =====================================================
-- DESCRIBE cm_users;
-- SELECT id, email, employee_code, full_name, role, is_active FROM cm_users;
-- SELECT COUNT(*) as total_users FROM cm_users;
-- SHOW INDEX FROM cm_users;
