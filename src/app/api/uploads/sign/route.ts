import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createCloudinarySignature, getUploadFolder } from "@/lib/storage";

const uploadSchema = z.object({
  folderType: z.string().default("reports")
});

export async function POST(request: NextRequest) {
  const parsed = uploadSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = getUploadFolder(parsed.data.folderType);
  const signature = createCloudinarySignature({ folder, timestamp });

  if (!signature || !process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    return NextResponse.json({
      configured: false,
      message:
        "Cloudinary credentials are not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    });
  }

  return NextResponse.json({
    configured: true,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
    timestamp,
    signature
  });
}
