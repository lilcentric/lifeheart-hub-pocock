import { Resend } from "resend";

const FROM = "Lifeheart Hub <noreply@noreply.lifeheart.com.au>";

export const EmailService = {
  async sendOnboardingLink(to: string, staffName: string, token: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");
    const resend = new Resend(apiKey);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const onboardingUrl = `${appUrl}/onboard/${token}`;

    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Your Lifeheart onboarding link",
      html: `
        <p>Hi ${staffName},</p>
        <p>Please use the link below to complete your onboarding:</p>
        <p><a href="${onboardingUrl}">${onboardingUrl}</a></p>
        <hr />
        <p><strong>Reference documents:</strong></p>
        <ul>
          <li><a href="#">Staff Handbook</a></li>
          <li><a href="#">SIL Voyager Staff Manual</a></li>
        </ul>
        <p>A Xero setup email will arrive within the hour.</p>
        <p>Lifeheart Support Team</p>
      `,
    });
    if (error) throw new Error(error.message);
  },
};
