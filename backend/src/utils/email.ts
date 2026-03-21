import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
// Import prisma directly from @prisma/client instead of from index
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email types
interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Base email template
function getBaseEmailTemplate(content: string, companyName: string = 'GuinéaManager'): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${companyName}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #16a34a 0%, #10b981 100%); padding: 30px 40px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${companyName}</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  ${content}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                    © ${new Date().getFullYear()} GuinéaManager. Tous droits réservés.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    Conakry, Guinée | <a href="mailto:support@guineamanager.com" style="color: #16a34a;">support@guineamanager.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Send email function
async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const info = await transporter.sendMail({
      from: `"GuinéaManager" <${process.env.SMTP_USER}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });

    // Log the email
    await prisma.emailLog.create({
      data: {
        destinataire: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        sujet: options.subject,
        contenu: options.text || options.html.substring(0, 1000),
        statut: 'ENVOYE',
      },
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Email sending error:', error);

    // Log the error
    await prisma.emailLog.create({
      data: {
        destinataire: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        sujet: options.subject,
        statut: 'ECHEC',
        erreur: error.message,
      },
    });

    return { success: false, error: error.message };
  }
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

// Welcome email
export async function sendWelcomeEmail(email: string, nom: string, prenom: string, companyName: string): Promise<any> {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Bienvenue sur GuinéaManager, ${prenom} !</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Votre compte pour <strong>${companyName}</strong> a été créé avec succès. Vous pouvez maintenant accéder à votre espace de gestion.
    </p>
    <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #166534; font-size: 14px;">
        <strong>Connexion :</strong> Utilisez votre email et mot de passe pour vous connecter à votre tableau de bord.
      </p>
    </div>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #10b981 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Accéder à mon espace
    </a>
  `;

  return sendEmail({
    to: email,
    subject: `Bienvenue sur GuinéaManager - ${companyName}`,
    html: getBaseEmailTemplate(content),
    text: `Bienvenue ${prenom} ! Votre compte pour ${companyName} a été créé avec succès. Connectez-vous sur ${process.env.FRONTEND_URL}/login`,
  });
}

// Email verification
export async function sendVerificationEmail(email: string, token: string, nom: string): Promise<any> {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Vérifiez votre adresse email</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Bonjour ${nom},<br><br>
      Merci de vous être inscrit sur GuinéaManager. Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email.
    </p>
    <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #10b981 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Vérifier mon email
    </a>
    <p style="color: #9ca3af; font-size: 14px; margin: 20px 0 0 0;">
      Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Vérifiez votre adresse email - GuinéaManager',
    html: getBaseEmailTemplate(content),
    text: `Vérifiez votre email en cliquant sur ce lien: ${verificationUrl}`,
  });
}

// Password reset email
export async function sendPasswordResetEmail(email: string, token: string, nom: string): Promise<any> {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Réinitialisation du mot de passe</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Bonjour ${nom},<br><br>
      Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.
    </p>
    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #10b981 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Réinitialiser mon mot de passe
    </a>
    <p style="color: #9ca3af; font-size: 14px; margin: 20px 0 0 0;">
      Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Réinitialisation du mot de passe - GuinéaManager',
    html: getBaseEmailTemplate(content),
    text: `Réinitialisez votre mot de passe: ${resetUrl}`,
  });
}

// Invoice email
export async function sendInvoiceEmail(
  email: string,
  clientNom: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string,
  pdfBuffer: Buffer,
  companyName: string
): Promise<any> {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Nouvelle facture</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Bonjour ${clientNom},<br><br>
      Veuillez trouver ci-joint votre facture <strong>${invoiceNumber}</strong> d'un montant de <strong>${amount}</strong>.
    </p>
    <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
      <tr>
        <td style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;"><strong>Facture N°</strong></td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${invoiceNumber}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;"><strong>Montant</strong></td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${amount}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f9fafb;"><strong>Date d'échéance</strong></td>
        <td style="padding: 12px;">${dueDate}</td>
      </tr>
    </table>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Merci pour votre confiance.<br>
      <strong>${companyName}</strong>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `Facture ${invoiceNumber} - ${companyName}`,
    html: getBaseEmailTemplate(content, companyName),
    text: `Facture ${invoiceNumber} - Montant: ${amount} - Échéance: ${dueDate}`,
    attachments: [{
      filename: `Facture_${invoiceNumber}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }],
  });
}

// Payslip email
export async function sendPayslipEmail(
  email: string,
  employeNom: string,
  month: string,
  netAmount: string,
  pdfBuffer: Buffer,
  companyName: string
): Promise<any> {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Bulletin de paie</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Bonjour ${employeNom},<br><br>
      Veuillez trouver ci-joint votre bulletin de paie pour <strong>${month}</strong>.
    </p>
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
      <p style="color: #166534; font-size: 14px; margin: 0 0 8px 0;">Net à payer</p>
      <p style="color: #16a34a; font-size: 32px; font-weight: bold; margin: 0;">${netAmount}</p>
    </div>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Pour toute question concernant votre paie, veuillez contacter le service RH.<br>
      <strong>${companyName}</strong>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `Bulletin de paie ${month} - ${companyName}`,
    html: getBaseEmailTemplate(content, companyName),
    text: `Bulletin de paie ${month} - Net à payer: ${netAmount}`,
    attachments: [{
      filename: `Bulletin_${month.replace(' ', '_')}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }],
  });
}

// Payment reminder email
export async function sendPaymentReminderEmail(
  email: string,
  clientNom: string,
  invoiceNumber: string,
  amount: string,
  daysOverdue: number,
  companyName: string
): Promise<any> {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Rappel de paiement</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Bonjour ${clientNom},<br><br>
      Nous vous rappelons que la facture <strong>${invoiceNumber}</strong> est en retard de <strong>${daysOverdue} jour(s)</strong>.
    </p>
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #991b1b; font-size: 16px;">
        <strong>Montant dû : ${amount}</strong>
      </p>
    </div>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Merci de régulariser votre situation dans les meilleurs délais.<br>
      <strong>${companyName}</strong>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `Rappel: Facture ${invoiceNumber} en retard - ${companyName}`,
    html: getBaseEmailTemplate(content, companyName),
    text: `Rappel: Facture ${invoiceNumber} en retard de ${daysOverdue} jour(s). Montant: ${amount}`,
  });
}

// 2FA code email
export async function send2FACodeEmail(email: string, code: string, nom: string): Promise<any> {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Code de vérification</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Bonjour ${nom},<br><br>
      Voici votre code de vérification pour vous connecter à GuinéaManager :
    </p>
    <div style="background: linear-gradient(135deg, #16a34a 0%, #10b981 100%); padding: 20px 40px; border-radius: 12px; text-align: center; margin: 30px 0;">
      <p style="color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0;">
        ${code}
      </p>
    </div>
    <p style="color: #9ca3af; font-size: 14px; margin: 20px 0 0 0;">
      Ce code expire dans 5 minutes. Ne le partagez avec personne.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Code de vérification - GuinéaManager',
    html: getBaseEmailTemplate(content),
    text: `Votre code de vérification: ${code} (expire dans 5 minutes)`,
  });
}

// Subscription confirmation email
export async function sendSubscriptionEmail(
  email: string,
  planName: string,
  amount: string,
  startDate: string,
  endDate: string,
  companyName: string
): Promise<any> {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Confirmation d'abonnement</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Félicitations ! Votre abonnement a été activé avec succès.
    </p>
    <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
      <tr>
        <td style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;"><strong>Plan</strong></td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${planName}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;"><strong>Montant</strong></td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${amount}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;"><strong>Date de début</strong></td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${startDate}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f9fafb;"><strong>Date de fin</strong></td>
        <td style="padding: 12px;">${endDate}</td>
      </tr>
    </table>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #10b981 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Accéder à mon tableau de bord
    </a>
  `;

  return sendEmail({
    to: email,
    subject: `Abonnement ${planName} activé - GuinéaManager`,
    html: getBaseEmailTemplate(content),
    text: `Abonnement ${planName} activé. Du ${startDate} au ${endDate}.`,
  });
}

// Support ticket response email
export async function sendTicketResponseEmail(
  email: string,
  ticketNumber: string,
  subject: string,
  response: string
): Promise<any> {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Réponse à votre ticket</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Votre ticket <strong>#${ticketNumber}</strong> a reçu une réponse.
    </p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="color: #374151; font-size: 14px; margin: 0 0 10px 0;"><strong>Sujet:</strong> ${subject}</p>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0;">${response}</p>
    </div>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/support/tickets/${ticketNumber}" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #10b981 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Voir le ticket
    </a>
  `;

  return sendEmail({
    to: email,
    subject: `Réponse ticket #${ticketNumber} - GuinéaManager`,
    html: getBaseEmailTemplate(content),
    text: `Réponse à votre ticket #${ticketNumber}: ${response}`,
  });
}

export default {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendInvoiceEmail,
  sendPayslipEmail,
  sendPaymentReminderEmail,
  send2FACodeEmail,
  sendSubscriptionEmail,
  sendTicketResponseEmail,
};
