import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/sendEmail";
import { createWelcomeEmail } from "@/lib/email/templates/WelcomeEmail";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/",
  },
  events: {
    /**
     * Fires after every successful sign-in (OAuth callback completes).
     * We use this to send the welcome email exactly once per user.
     *
     * Race-condition safety: we atomically claim the send slot via
     * updateMany({ emailWelcomeSent: false } → true). Only the first
     * call that matches will return count > 0 and trigger the email.
     */
    signIn: async ({ user }) => {
      if (!user?.email) return;

      try {
        const firstName = user.name?.split(" ")[0] ?? "there";
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ?? "https://notebookly.vercel.app";

        // Ensure user row exists in DB.
        // On first sign-in the row may not exist yet (dashboard page hasn't
        // run). Create it now with emailWelcomeSent = false so the updateMany
        // below can claim the send slot.
        await prisma.user.upsert({
          where: { email: user.email },
          create: {
            email: user.email,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
            emailWelcomeSent: false,
          },
          // Don't overwrite emailWelcomeSent on subsequent sign-ins
          update: {},
        });

        // Atomically claim the "first email" send slot.
        // Only one concurrent call can succeed; subsequent calls return count=0.
        const claimed = await prisma.user.updateMany({
          where: { email: user.email, emailWelcomeSent: false },
          data: { emailWelcomeSent: true },
        });

        if (claimed.count > 0) {
          await sendEmail({
            to: user.email,
            subject: `Welcome to NoteBookly, ${firstName}!`,
            react: createWelcomeEmail({ name: firstName, appUrl }),
          });
          console.log(`[auth] welcome email sent to ${user.email}`);
        }
      } catch (err) {
        // Never block sign-in due to an email failure
        console.error("[auth] welcome email error (non-fatal):", err);
      }
    },
  },
});
