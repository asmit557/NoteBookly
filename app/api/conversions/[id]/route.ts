import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deletePdf } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Find the conversion and verify ownership
    const conversion = await prisma.conversion.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });

    if (!conversion) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }
    if (conversion.user.email !== session.user.email) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    // Delete from Cloudinary (best-effort — don't fail if it errors)
    if (conversion.publicId) {
      await deletePdf(conversion.publicId).catch((err) => {
        console.error("[conversions] Cloudinary delete error:", err);
      });
    }

    // Delete from DB
    await prisma.conversion.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[conversions] DELETE error:", err);
    return NextResponse.json({ message: "Failed to delete conversion." }, { status: 500 });
  }
}
