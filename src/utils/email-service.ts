import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export async function sendResendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not configured. Mocking email delivery to:", to);
    console.log("---------------- MOCK EMAIL START ----------------");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body Snippet:", html.substring(0, 300) + "...");
    console.log("---------------- MOCK EMAIL END ------------------");
    return { success: true, mock: true };
  }

  const fromEmail = "DeveloperConnect <notifications@developerconnect.in>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend API error:", res.status, errText);
      return { success: false, error: errText };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    console.error("Failed to send email via Resend:", err);
    return { success: false, error: err.message || err };
  }
}

export function getEmailHtml(
  title: string,
  salutation: string,
  intro: string,
  listTitle: string,
  items: string[],
  ctaLabel: string,
  ctaUrl: string
) {
  const listItemsHtml = items
    .map((item) => `<li class="list-item">${item}</li>`)
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      color: #1e293b;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background-color: #0f172a;
      background-image: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 32px;
      text-align: center;
    }
    .logo {
      color: #ffffff;
      font-size: 24px;
      font-weight: bold;
      text-decoration: none;
      letter-spacing: -0.025em;
    }
    .logo-accent {
      color: #14b8a6;
    }
    .content {
      padding: 40px 32px;
    }
    .salutation {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #0f172a;
    }
    .text {
      font-size: 16px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .list-title {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 12px;
      font-size: 15px;
    }
    .list {
      padding-left: 20px;
      margin-bottom: 30px;
    }
    .list-item {
      font-size: 15px;
      color: #475569;
      margin-bottom: 8px;
      line-height: 1.5;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0;
    }
    .cta-button {
      background-color: #0d9488;
      background-image: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      color: #ffffff !important;
      font-weight: 600;
      padding: 14px 30px;
      border-radius: 8px;
      text-decoration: none;
      display: inline-block;
      font-size: 16px;
      box-shadow: 0 4px 10px rgba(13, 148, 136, 0.25);
    }
    .footer {
      background-color: #f1f5f9;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer a {
      color: #0d9488;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="https://developerconnect.in" class="logo">
        Developer<span class="logo-accent">Connect</span>
      </a>
    </div>
    <div class="content">
      <div class="salutation">${salutation}</div>
      <p class="text">${intro}</p>
      <div class="list-title">${listTitle}</div>
      <ul class="list">
        ${listItemsHtml}
      </ul>
      <p class="text">A complete profile helps recruiters discover you faster.</p>
      <div class="cta-container">
        <a href="${ctaUrl}" class="cta-button">${ctaLabel}</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} DeveloperConnect. All rights reserved.</p>
      <p>Powered by Bant | <a href="mailto:support@developerconnect.in">support@developerconnect.in</a></p>
    </div>
  </div>
</body>
</html>`;
}

export async function isProfileComplete(userId: string, role: "developer" | "recruiter") {
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (role === "developer") {
      const { data: dev } = await supabaseAdmin
        .from("developer_profiles")
        .select("bio, skills, experience_years, portfolio_url, hourly_rate_inr")
        .eq("id", userId)
        .maybeSingle();

      return !!(
        profile?.full_name &&
        profile?.avatar_url &&
        dev?.bio &&
        dev?.skills &&
        dev.skills.length > 0 &&
        dev.experience_years !== null &&
        dev.experience_years !== undefined &&
        dev.portfolio_url &&
        dev.hourly_rate_inr !== null &&
        dev.hourly_rate_inr !== undefined
      );
    } else {
      const { data: rec } = await supabaseAdmin
        .from("recruiter_profiles")
        .select("company_name, logo_url, company_description, industry, company_website")
        .eq("id", userId)
        .maybeSingle();

      return !!(
        rec?.company_name &&
        rec?.logo_url &&
        rec?.company_description &&
        rec?.industry &&
        rec?.company_website
      );
    }
  } catch (error: any) {
    console.warn("Unable to check profile completeness (likely due to missing Supabase credentials):", error.message || error);
    return false;
  }
}

export async function processUserEmails(userId: string) {
  try {
    // 1. Fetch user role
    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!userRole) {
      console.warn("No role found for user:", userId);
      return;
    }

    const role = userRole.role as "developer" | "recruiter";

    // 2. Fetch notifications of type 'welcome' for this user
    const { data: welcomeNotifs } = await supabaseAdmin
      .from("notifications")
      .select("id, email_sent")
      .eq("user_id", userId)
      .eq("type", "welcome");

    const alreadySent = welcomeNotifs && welcomeNotifs.length > 0 && welcomeNotifs.some(n => n.email_sent);

    if (alreadySent) {
      console.log("Welcome email already sent for user:", userId);
      return;
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();

    const userName = profile?.full_name || "User";
    const toEmail = profile?.email;

    if (toEmail) {
      let subject = "Welcome to DeveloperConnect 🚀";
      let html = "";

      if (role === "developer") {
        html = getEmailHtml(
          subject,
          `Hi ${userName},`,
          "Welcome to DeveloperConnect!<br/><br/>Your account has been created successfully.<br/><br/>Complete your developer profile to improve your visibility and start receiving project opportunities from recruiters.",
          "Complete your profile by adding:",
          [
            "Profile Photo",
            "Skills",
            "Experience",
            "Portfolio",
            "Bio",
            "Availability",
            "Pricing",
            "Technologies",
          ],
          "Complete My Profile",
          "https://developerconnect.in/profile"
        );
      } else {
        html = getEmailHtml(
          subject,
          `Hi ${userName},`,
          "Welcome to DeveloperConnect!<br/><br/>Your recruiter account has been created successfully.<br/><br/>Complete your company profile to attract the right developers and start posting projects.",
          "Complete your profile by adding:",
          [
            "Company Logo",
            "Company Description",
            "Industry",
            "Website",
            "Company Details",
          ],
          "Complete Company Profile",
          "https://developerconnect.in/profile"
        );
      }

      const sent = await sendResendEmail({ to: toEmail, subject, html });
      if (sent.success) {
        if (welcomeNotifs && welcomeNotifs.length > 0) {
          // Update existing welcome notification(s)
          for (const notif of welcomeNotifs) {
            await supabaseAdmin
              .from("notifications")
              .update({ email_sent: true })
              .eq("id", notif.id);
          }
        } else {
          // Create a new welcome notification as sent
          await supabaseAdmin.from("notifications").insert({
            user_id: userId,
            type: "welcome",
            title: "Welcome to Developer Connect!",
            body: "Complete your profile to start matching.",
            email_sent: true,
          });
        }
        console.log("Welcome email sent successfully to:", toEmail);
      }
    }
  } catch (error) {
    console.error("Error in processUserEmails for user:", userId, error);
  }
}

export async function processReminderEmails() {
  try {
    // Fetch all profiles and their signup timestamps
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, created_at");

    if (!profiles || profiles.length === 0) return;

    const now = new Date();

    for (const p of profiles) {
      if (!p.email) continue;

      // Resolve user role
      const { data: userRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", p.id)
        .maybeSingle();

      if (!userRole) continue;
      const role = userRole.role as "developer" | "recruiter";

      // Calculate time passed since registration
      const createdAt = new Date(p.created_at);
      const diffMs = now.getTime() - createdAt.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      // We have 3 thresholds: 24h (1 day), 3 days, 7 days
      const thresholds = [
        { key: "24h", days: 1, title: "Profile Reminder 24h" },
        { key: "3d", days: 3, title: "Profile Reminder 3d" },
        { key: "7d", days: 7, title: "Profile Reminder 7d" },
      ];

      for (const t of thresholds) {
        if (diffDays >= t.days) {
          // Check if this reminder has already been sent/recorded
          const { data: existingRem } = await supabaseAdmin
            .from("notifications")
            .select("id")
            .eq("user_id", p.id)
            .eq("type", "account_update")
            .eq("title", t.title)
            .maybeSingle();

          if (!existingRem) {
            // Check if profile is complete. If so, stop all further reminders.
            const complete = await isProfileComplete(p.id, role);
            if (complete) {
              // Mark all future reminder thresholds as sent/blocked so we don't check again
              await supabaseAdmin.from("notifications").insert({
                user_id: p.id,
                type: "account_update",
                title: t.title,
                body: "Profile completed. No reminder sent.",
                email_sent: true,
              });
              continue;
            }

            // Profile is incomplete! Send the reminder email.
            let subject = "Action Required: Complete your DeveloperConnect profile! 🚀";
            let html = "";

            if (role === "developer") {
              html = getEmailHtml(
                subject,
                `Hi ${p.full_name || "Developer"},`,
                "We noticed your DeveloperConnect profile is still incomplete. A complete profile helps recruiters discover you 3× faster and matches you to the best project opportunities in India.<br/><br/>Please take a minute to complete your developer profile.",
                "Complete your profile by adding:",
                [
                  "Profile Photo",
                  "Skills",
                  "Experience",
                  "Portfolio",
                  "Bio",
                  "Availability",
                  "Pricing",
                  "Technologies",
                ],
                "Complete My Profile",
                "https://developerconnect.in/profile"
              );
            } else {
              subject = "Action Required: Complete your recruiter profile on DeveloperConnect! 🚀";
              html = getEmailHtml(
                subject,
                `Hi ${p.full_name || "Recruiter"},`,
                "We noticed your recruiter profile is still incomplete on DeveloperConnect. A complete company profile builds trust with developers and helps you attract the best tech talent in India.<br/><br/>Please take a minute to complete your company profile.",
                "Complete your profile by adding:",
                [
                  "Company Logo",
                  "Company Description",
                  "Industry",
                  "Website",
                  "Company Details",
                ],
                "Complete Company Profile",
                "https://developerconnect.in/profile"
              );
            }

            const sent = await sendResendEmail({ to: p.email, subject, html });
            if (sent.success) {
              // Record reminder sent
              await supabaseAdmin.from("notifications").insert({
                user_id: p.id,
                type: "account_update",
                title: t.title,
                body: `Profile reminder (${t.key}) sent.`,
                email_sent: true,
              });
              console.log(`Reminder email (${t.key}) sent successfully to:`, p.email);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in processReminderEmails:", error);
  }
}

export const triggerEmailsServerFn = createServerFn({ method: "POST" })
  .input(z.object({ userId: z.string().optional() }))
  .handler(async ({ input }) => {
    if (input.userId) {
      await processUserEmails(input.userId);
    } else {
      await processReminderEmails();
    }
    return { success: true };
  });
