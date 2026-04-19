import { redirect } from "next/navigation";
import { auth } from "@/auth";
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

  return (
    <CodeLabClient
      user={{
        id: session.user.id ?? "",
        email: session.user.email,
        name: session.user.name ?? null,
      }}
    />
  );
}
