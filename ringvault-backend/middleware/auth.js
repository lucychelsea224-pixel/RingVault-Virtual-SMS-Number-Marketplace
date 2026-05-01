// middleware/auth.js
// Express middleware that validates a Supabase Bearer token and
// attaches the decoded user to req.user.

import { getUserFromToken } from "../lib/supabase.js";

/**
 * requireAuth middleware
 * Usage:  router.post('/buy-number', requireAuth, handler)
 */
export async function requireAuth(req, res, next) {
  try {
    const user = await getUserFromToken(req.headers.authorization);
    req.user = user; // { id, email, ... }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: err.message || "Unauthorized",
    });
  }
}
