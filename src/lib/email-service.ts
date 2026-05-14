import { Resend } from "resend";

// The local-part is arbitrary; what Resend checks is the domain. Default
// matches the only domain currently verified in the Resend account
// (noreply.lifeheart.com.au). Override via RESEND_FROM once the apex
// lifeheart.com.au is also verified.
const DEFAULT_FROM = "Lifeheart Hub <onboarding@noreply.lifeheart.com.au>";

function createResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

export const EmailService = {
  async sendOnboardingLink(to: string, staffName: string, token: string): Promise<void> {
    const resend = createResend();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const onboardingUrl = `${appUrl}/onboard/${token}`;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? DEFAULT_FROM,
      to,
      subject: "Your Lifeheart onboarding link",
      html: `
        <p>Hi ${staffName},</p>
        <p>Please use the link below to complete your onboarding:</p>
        <p><a href="${onboardingUrl}">${onboardingUrl}</a></p>
        <p>A Xero setup email will arrive within the hour.</p>
        <p>Lifeheart Support Team</p>
      `,
    });
    if (error) throw new Error(error.message);
  },

  async sendReferenceDocuments(
    to: string,
    staffName: string,
    handbookUrl: string,
    silManualUrl: string
  ): Promise<void> {
    const resend = createResend();

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? DEFAULT_FROM,
      to,
      subject: "Your Lifeheart reference documents",
      html: `
        <p>Hi ${staffName},</p>
        <p>Please find your Lifeheart reference documents below. These links are valid for 30 days.</p>
        <ul>
          <li><a href="${handbookUrl}">Staff Handbook</a></li>
          <li><a href="${silManualUrl}">SIL Voyager Staff Manual</a></li>
        </ul>
        <p>Lifeheart Support Team</p>
      `,
    });
    if (error) throw new Error(error.message);
  },

  async sendSubmissionNotification(
    to: string,
    staffName: string,
    recordId: string
  ): Promise<void> {
    const resend = createResend();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const recordUrl = `${appUrl}/onboarding/${recordId}`;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? DEFAULT_FROM,
      to,
      subject: `${staffName} has submitted their onboarding documents`,
      html: `
        <p>${staffName} has marked their onboarding portal as complete.</p>
        <p><a href="${recordUrl}">Review their record</a></p>
        <p>Lifeheart Hub</p>
      `,
    });
    if (error) throw new Error(error.message);
  },
};
