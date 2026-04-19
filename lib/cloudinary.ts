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

  const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          public_id: publicId,
          overwrite: false,
          format: "pdf",
          type: "upload",
          access_mode: "public",
          // Explicit anonymous grant — overrides account-level "Secured media"
          // restrictions that would otherwise mark the asset "Blocked for delivery".
          access_control: [{ access_type: "anonymous" }],
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload returned no result"));
            return;
          }
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        }
      );
      stream.end(buffer);
    }
  );

  // Belt-and-suspenders: explicitly update the asset's access mode via the
  // Admin API after upload, in case account-level security overrode the
  // upload-time setting.
  try {
    await cloudinary.api.update(uploadResult.public_id, {
      resource_type: "image",
      type: "upload",
      access_mode: "public",
      access_control: [{ access_type: "anonymous" }],
    });
  } catch (err) {
    // Non-fatal — the upload itself succeeded; log and continue.
    console.warn("[cloudinary] post-upload access update failed:", err);
  }

  return { url: uploadResult.secure_url, publicId: uploadResult.public_id };
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
