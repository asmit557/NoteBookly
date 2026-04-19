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
  // Prevents this route from being used as an open proxy.
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const expectedPrefix = `https://res.cloudinary.com/${cloudName}/`;

  if (!cloudName || !cloudinaryUrl.startsWith(expectedPrefix)) {
    return NextResponse.json({ message: "Invalid URL" }, { status: 400 });
  }

  // ── Fetch from Cloudinary and pipe back with correct headers ──────────────
  try {
    const upstream = await fetch(cloudinaryUrl);

    if (!upstream.ok) {
      return NextResponse.json(
        { message: "Failed to fetch PDF from storage" },
        { status: 502 }
      );
    }

    const buffer = await upstream.arrayBuffer();

    // Sanitise the filename for use in the Content-Disposition header
    const safeName = fileName
      .replace(/[^\w\s.-]/g, "")
      .replace(/\s+/g, "_")
      .replace(/\.pdf$/i, "")
      .slice(0, 100)
      .concat(".pdf");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        // Force PDF MIME type — overrides whatever Cloudinary sends
        "Content-Type": "application/pdf",
        // "inline" tells the browser to render in its built-in PDF viewer
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Content-Length": String(buffer.byteLength),
        // Allow browser to cache for 1 hour
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[pdf] proxy error:", err);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
