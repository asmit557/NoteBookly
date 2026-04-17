import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard — nbpdf",
  description: "Manage your notebook conversions",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  // Upsert user so they exist in DB
  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {
      name: session.user.name ?? undefined,
      image: session.user.image ?? undefined,
    },
    create: {
      email: session.user.email,
      name: session.user.name ?? undefined,
      image: session.user.image ?? undefined,
    },
  });

  const conversions = await prisma.conversion.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Serialize dates for client component transfer
  const serialized = conversions.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <DashboardClient
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      }}
      initialConversions={serialized}
    />
  );
}
