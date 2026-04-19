import { v2 as cloudinary } from "cloudinary";

// 🔧 Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

// 📄 Upload PDF
export async function uploadPdf(
  buffer: Buffer,
  fileName: string,
  userIdentifier: string
): Promise<CloudinaryUploadResult> {
  // ✅ sanitize file name
  const safeName = fileName
    .replace(/\.pdf$/i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60);

  const safeUser = userIdentifier
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 30);

  const publicId = `nbpdf/${safeUser}/${Date.now()}_${safeName}`;

  const uploadResult = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // ✅ FIXED (PDF must be raw)
        public_id: publicId,
        overwrite: false,

        type: "upload",        // ✅ ensures public delivery
        access_mode: "public", // ✅ explicit public access

        // Optional (only needed if account has strict security)
        access_control: [{ access_type: "anonymous" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });

  // 🔁 Optional: reinforce access via Admin API (safe fallback)
  try {
    await cloudinary.api.update(uploadResult.public_id, {
      resource_type: "raw", // ✅ FIXED
      type: "upload",
      access_mode: "public",
      access_control: [{ access_type: "anonymous" }],
    });
  } catch (err) {
    console.warn("[cloudinary] access update failed:", err);
  }

  return {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  };
}

// 🗑️ Delete PDF
export async function deletePdf(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw", // ✅ correct type
    });
  } catch (err) {
    console.warn("[cloudinary] delete failed:", err);
  }
}