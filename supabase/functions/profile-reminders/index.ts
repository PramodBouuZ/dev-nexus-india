import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendResendEmail({ to, subject, html }: EmailPayload) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not configured. Mocking email delivery to:", to);
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

function getEmailHtml(
  title: string,
  salutation: string,
  intro: string,
  listTitle: string,
  items: string[],
  ctaLabel: string,
  ctaUrl: string,
) {
  const listItemsHtml = items.map((item) => `<li class="list-item">${item}</li>`).join("\n");

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // SECURITY AUTHENTICATION VERIFICATION
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const cronSecret = "f6a2fe0a-3471-4eea-a581-75c4d2be396b";

    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` ||
      (serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`);

    if (!isAuthorized) {
      console.warn("Unauthenticated attempt to call profile-reminders edge function.");
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // DATABASE QUERY ALIGNMENT
    // Query public.profiles to get user id, full_name, email, created_at
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, created_at");

    if (profilesError) {
      throw profilesError;
    }

    console.log(`Processing reminders for ${profiles?.length || 0} profiles...`);
    const now = new Date();
    let sentCount = 0;
    let skippedCount = 0;

    for (const profile of profiles || []) {
      if (!profile.email) continue;

      // Query user_roles to resolve user's role
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (roleError || !userRole) {
        continue; // Skip if role not determined
      }

      const role = userRole.role as "developer" | "recruiter";
      const createdAt = new Date(profile.created_at);
      const diffMs = now.getTime() - createdAt.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let eligibleStage: number | null = null;
      if (diffDays >= 15) {
        eligibleStage = 15;
      } else if (diffDays >= 7) {
        eligibleStage = 7;
      } else if (diffDays >= 3) {
        eligibleStage = 3;
      } else if (diffDays >= 1) {
        eligibleStage = 1;
      }

      if (eligibleStage === null) {
        continue;
      }

      // Check if this reminder stage has already been handled (sent/skipped) in the unified tracking table
      const { data: existingRecord } = await supabase
        .from("profile_email_reminders")
        .select("id")
        .eq("user_id", profile.id)
        .eq("reminder_stage", eligibleStage)
        .maybeSingle();

      if (existingRecord) {
        // Already handled! Skip to maintain idempotency
        continue;
      }

      // Calculate profile completion percentage
      let completionPercentage = 0;

      if (role === "developer") {
        const { data: devProfile } = await supabase
          .from("developer_profiles")
          .select("bio, skills, experience_years, portfolio_url, hourly_rate_inr")
          .eq("id", profile.id)
          .maybeSingle();

        let totalFields = 7;
        let filledFields = 0;

        if (profile.full_name?.trim()) filledFields++;
        // We can check if avatar_url is present inside the developer's profile via main profiles table
        const { data: profileAvatar } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", profile.id)
          .maybeSingle();

        if (profileAvatar?.avatar_url?.trim()) filledFields++;
        if (devProfile?.bio?.trim()) filledFields++;
        if (Array.isArray(devProfile?.skills) && devProfile.skills.length > 0) filledFields++;
        if (devProfile?.experience_years !== null && devProfile?.experience_years !== undefined)
          filledFields++;
        if (devProfile?.portfolio_url?.trim()) filledFields++;
        if (devProfile?.hourly_rate_inr !== null && devProfile?.hourly_rate_inr !== undefined)
          filledFields++;

        completionPercentage = Math.round((filledFields / totalFields) * 100);
      } else if (role === "recruiter") {
        const { data: recProfile } = await supabase
          .from("recruiter_profiles")
          .select("company_name, logo_url, company_description, industry, company_website")
          .eq("id", profile.id)
          .maybeSingle();

        let totalFields = 5;
        let filledFields = 0;

        if (recProfile?.company_name?.trim()) filledFields++;
        if (recProfile?.logo_url?.trim()) filledFields++;
        if (recProfile?.company_description?.trim()) filledFields++;
        if (recProfile?.industry?.trim()) filledFields++;
        if (recProfile?.company_website?.trim()) filledFields++;

        completionPercentage = Math.round((filledFields / totalFields) * 100);
      } else {
        continue;
      }

      if (completionPercentage === 100) {
        // Record as skipped_completed to ensure idempotency
        const { error: insErr } = await supabase.from("profile_email_reminders").insert({
          user_id: profile.id,
          reminder_stage: eligibleStage,
          email_status: "skipped_completed",
          sent_at: now.toISOString(),
        });

        if (insErr) {
          console.error(`Error inserting history for completed user ${profile.id}:`, insErr);
        } else {
          skippedCount++;
        }
        continue;
      }

      // Profile is incomplete! Send the reminder email.
      let subject = "";
      let html = "";
      const name = profile.full_name || "User";

      if (role === "developer") {
        subject = "Complete Your Developer Profile";
        html = getEmailHtml(
          subject,
          `Hi ${name},`,
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
          "https://developerconnect.in/profile",
        );
      } else {
        subject = "Complete Your Company Profile";
        html = getEmailHtml(
          subject,
          `Hi ${name},`,
          "We noticed your recruiter profile is still incomplete on DeveloperConnect. A complete company profile builds trust with developers and helps you attract the best tech talent in India.<br/><br/>Please take a minute to complete your company profile.",
          "Complete your profile by adding:",
          ["Company Logo", "Company Description", "Industry", "Website", "Company Details"],
          "Complete Company Profile",
          "https://developerconnect.in/profile",
        );
      }

      const emailResult = await sendResendEmail({
        to: profile.email,
        subject,
        html,
      });

      const emailStatus = emailResult.success ? "sent" : "failed";

      const { error: insErr } = await supabase.from("profile_email_reminders").insert({
        user_id: profile.id,
        reminder_stage: eligibleStage,
        email_status: emailStatus,
        sent_at: now.toISOString(),
      });

      if (insErr) {
        console.error(`Error inserting history for user ${profile.id}:`, insErr);
      } else {
        if (emailResult.success) {
          sentCount++;
          console.log(`Successfully sent Day ${eligibleStage} reminder to ${profile.email}`);
        } else {
          console.error(
            `Failed to send Day ${eligibleStage} reminder to ${profile.email}:`,
            emailResult.error,
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Profile reminder check complete. Sent: ${sentCount}, Skipped (Completed): ${skippedCount}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("Error in profile-reminders edge function:", error);
    return new Response(JSON.stringify({ success: false, error: error.message || error }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
