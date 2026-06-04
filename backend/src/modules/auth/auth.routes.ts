import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { DB, pool, qid } from "../../config/db";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

router.post("/login", asyncHandler(async (req, res) => {
  const { login_id, password } = req.body;

  if (!login_id || !password) {
    return res.status(400).json({ success: false, message: "login_id and password required" });
  }

  const [rows]: any = await pool.query(
    `SELECT user_id, employee_code, full_name, login_id, email, role_code, branch_short_name, password_hash, account_locked, active_status
     FROM ${qid(DB.APP)}.user_master
     WHERE login_id = ?`,
    [login_id]
  );

  if (!rows || rows.length === 0) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const user = rows[0];

  if (user.account_locked) {
    return res.status(403).json({ success: false, message: "Account is locked" });
  }

  if (!user.active_status) {
    return res.status(403).json({ success: false, message: "Account is inactive" });
  }

  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    await pool.query(
      `UPDATE ${qid(DB.APP)}.user_master
       SET failed_login_attempts = failed_login_attempts + 1
       WHERE user_id = ?`,
      [user.user_id]
    );

    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  await pool.query(
    `UPDATE ${qid(DB.APP)}.user_master
     SET failed_login_attempts = 0, last_login_at = NOW()
     WHERE user_id = ?`,
    [user.user_id]
  );

  const [scopeRows]: any = await pool.query(
    `SELECT scope_type, branch_short_name, process_name, employee_code
     FROM ${qid(DB.APP)}.user_scope_mapping
     WHERE user_id = ? AND active_status = 1`,
    [user.user_id]
  );

  const token = jwt.sign(
    { user_id: user.user_id, role_code: user.role_code },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({
    success: true,
    token,
    user: {
      user_id: user.user_id,
      employee_code: user.employee_code,
      full_name: user.full_name,
      login_id: user.login_id,
      email: user.email,
      role_code: user.role_code,
      branch_short_name: user.branch_short_name,
    },
    scopes: scopeRows || [],
  });
}));

router.post("/logout", asyncHandler(async (_req, res) => {
  res.json({ success: true, message: "Logged out" });
}));

export default router;
