-- =====================================================
-- Executive Dashboard MVP - Refresh Tokens Table
-- =====================================================
-- Stores JWT refresh tokens with SHA256 hashing
-- Tokens are rotated on every refresh for security
-- Expired tokens are cleaned up via cron job
-- =====================================================

-- Create refresh tokens table
CREATE TABLE IF NOT EXISTS cm_refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL COMMENT 'SHA256 hash of refresh token',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES cm_users(id) ON DELETE CASCADE,
  INDEX idx_token (token_hash),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
