import { getUser } from "../lib/supabase.js";

export async function requireAuth(req, res, next) {
  try {
    const user = await getUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized: Invalid or missing token" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: err.message || "Unauthorized" });
  }
}
