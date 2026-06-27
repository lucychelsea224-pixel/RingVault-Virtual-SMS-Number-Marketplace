// middleware/auth.js
// Express middleware that validates a Supabase Bearer token and
// attaches the decoded user to req.user.

import { getUser } from "../lib/supabase.js"; // Match the exact function name from lib/supabase.js

/**
 * requireAuth middleware
 * Usage:  router.post('/buy-number', requireAuth, handler)
 */
export async function requireAuth(req, res, next) {
  try {
    // Pass the entire req object to getUser, which handles extracting the token
    const user = await getUser(req);
    
    // If token is missing, invalid, or expired, stop the request here
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid or missing token",
      });
    }

    req.user = user; // { id, email, ... }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: err.message || "Unauthorized",
    });
  }
}