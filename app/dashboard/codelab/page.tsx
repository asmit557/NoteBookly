import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CodeLabClient from "./CodeLabClient";

export const metadata = {
  title: "Code Lab — NoteBookly",
  description: "Write and run Python code in an isolated sandbox",
};

export default async function CodeLabPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  // Upsert so the user row always exists; get the Prisma DB id (not the OAuth sub)
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

  return (
    <CodeLabClient
      user={{
        id: user.id,
        email: user.email,
        name: user.name ?? null,
      }}
    />
  );
}
