import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/send-emails")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { processReminderEmails } = await import("@/utils/email-service");
          await processReminderEmails();
          return new Response(
            JSON.stringify({ success: true, message: "Reminder emails checked and processed successfully." }),
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({ success: false, error: err.message || err }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
      POST: async ({ request }) => {
        try {
          let userId: string | null = null;
          try {
            const body = await request.json();
            userId = body?.userId || null;
          } catch {
            // ignore JSON parse errors for empty/non-JSON bodies
          }

          const { processReminderEmails, processUserEmails } = await import("@/utils/email-service");

          if (userId) {
            await processUserEmails(userId);
          } else {
            await processReminderEmails();
          }

          return new Response(
            JSON.stringify({ success: true, message: "Emails checked and processed successfully." }),
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({ success: false, error: err.message || err }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
