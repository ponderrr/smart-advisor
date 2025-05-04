import { put } from "@vercel/blob";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const filename = req.query.filename;
    if (!filename) {
      return res.status(400).json({ error: "Filename is required" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const fileUserId = filename.split("_")[0];
    if (fileUserId !== user.id) {
      return res.status(403).json({ error: "Forbidden: User ID mismatch" });
    }

    const file = req.body;

    const blob = await put(filename, file, {
      access: "public",
    });

    return res.status(200).json({
      url: blob.url,
      success: true,
    });
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    return res.status(500).json({
      error: "Failed to upload file",
      details: error.message,
    });
  }
}
