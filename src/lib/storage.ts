import crypto from "node:crypto";

export function createCloudinarySignature(params: Record<string, string | number>) {
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) return null;

  const payload = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${secret}`).digest("hex");
}

export function getUploadFolder(role = "reports") {
  return `ai-meditrack/${role}/${new Date().toISOString().slice(0, 10)}`;
}
