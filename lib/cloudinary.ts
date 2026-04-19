import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

export async function uploadPdf(
  buffer: Buffer,
  fileName: string,
  userIdentifier: string
): Promise<CloudinaryUploadResult> {
  const safeName = fileName
    .replace(/\.pdf$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60);

  const safeUser = userIdentifier.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
  const publicId = `nbpdf/${safeUser}/${Date.now()}_${safeName}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        // "image" resource type is Cloudinary's native PDF support.
        // It serves the file with Content-Type: application/pdf and
        // Content-Disposition: inline (browser renders, not downloads).
        // "raw" was previously used but causes CDN to block server-to-server
        // fetches and defaults to Content-Disposition: attachment.
        resource_type: "image",
        public_id: publicId,
        overwrite: false,
        format: "pdf", // ensures URL ends in .pdf so Cloudinary delivers the original file
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function deletePdf(publicId: string): Promise<void> {
  // Try "image" first (new uploads), fall back to "raw" for existing records
  // that were stored before this fix.
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  }
}
