export const APIRoute = {
  path: "/api/send-reminders",
  async action({ request }: { request: Request }) {
    let reqData;
    try {
      reqData = await request.json();
    } catch {
      reqData = { email: "", milestones: [] };
    }

    const { email, milestones } = reqData;

    if (!email || !milestones || milestones.length === 0) {
      return new Response(JSON.stringify({ sentCount: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    const resendKey = process.env.RESEND_API_KEY;

    if (resendKey) {
      // Lazy-load Resend so the package is not pulled into the main SSR/edge
      // bundle on every request (top-level import was blanking the app).
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);

      for (const milestone of milestones) {
        try {
          await resend.emails.send({
            from: "OneLife <onboarding@resend.dev>",
            to: email,
            subject: `OneLife check-in: "${milestone.title}"`,
            html: `
               <p>Hi,</p>
               <p>Today is the target date for this milestone:</p>
               <p>🎯 Milestone: <strong>${milestone.title}</strong><br/>
               📌 Goal: <strong>${milestone.goalTitle}</strong><br/>
               📅 Target date: <strong>${milestone.targetDate}</strong></p>
               <p>Have you completed it?</p>
               <p>→ Open OneLife and mark it done<br/>
               (or reply to this email if you prefer)</p>
               <p>— OneLife</p>
             `,
          });
          sentCount++;
        } catch (e) {
          console.error("Error sending email:", e);
        }
      }
    } else {
      console.log(
        `Simulated sending emails to ${email} for ${milestones.length} milestones.`,
      );
      sentCount = milestones.length;
    }

    return new Response(JSON.stringify({ sentCount }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
