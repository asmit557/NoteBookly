import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // ── Auth gate ──────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const cloudinaryUrl = searchParams.get("url");
  const fileName = searchParams.get("name") ?? "document.pdf";

  if (!cloudinaryUrl) {
    return NextResponse.json({ message: "Missing url parameter" }, { status: 400 });
  }

  // ── Validate the URL belongs to our Cloudinary account ────────────────────
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const expectedPrefix = `https://res.cloudinary.com/${cloudName}/`;

  if (!cloudName || !cloudinaryUrl.startsWith(expectedPrefix)) {
    return NextResponse.json({ message: "Invalid URL" }, { status: 400 });
  }

  // ── Sanitise the filename once ─────────────────────────────────────────────
  const safeName = fileName
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/\.pdf$/i, "")
    .slice(0, 100)
    .concat(".pdf");

  // ── Fetch from Cloudinary and pipe back with correct headers ──────────────
  try {
    const upstream = await fetch(cloudinaryUrl, {
      // Bypass Next.js's data cache — always fetch fresh from Cloudinary
      cache: "no-store",
      headers: {
        // Some CDNs require a recognisable User-Agent
        "User-Agent": "Mozilla/5.0 (compatible; NoteBookly/1.0)",
        "Accept": "application/pdf, application/octet-stream, */*",
      },
    });

    if (!upstream.ok) {
      // Log the real status so it's visible in Vercel function logs
      console.error(
        `[pdf] Cloudinary returned ${upstream.status} ${upstream.statusText} for: ${cloudinaryUrl}`
      );
      // Redirect directly to Cloudinary as fallback — the browser will handle
      // whatever Content-Disposition Cloudinary sends rather than showing an error.
      return NextResponse.redirect(cloudinaryUrl, { status: 302 });
    }

    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        // Override whatever Cloudinary sends — guarantee PDF MIME type
        "Content-Type": "application/pdf",
        // "inline" → browser PDF viewer instead of download prompt
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[pdf] proxy fetch threw:", err);
    // Network-level failure — redirect to Cloudinary as last resort
    return NextResponse.redirect(cloudinaryUrl, { status: 302 });
  }
}
