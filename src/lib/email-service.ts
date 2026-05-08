import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Lifeheart Hub <noreply@lifeheart.com.au>";

export const EmailService = {
  async sendOnboardingLink(to: string, staffName: string, token: string): Promise<void> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const onboardingUrl = `${appUrl}/onboard/${token}`;

    await resend.emails.send({
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
  },
};
