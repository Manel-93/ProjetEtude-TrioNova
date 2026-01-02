import { emailTransporter, emailFrom } from '../config/email.js';

export class EmailService {
  async sendEmailConfirmation(email, token, baseUrl) {
    const confirmUrl = `${baseUrl}/auth/confirm-email?token=${token}`;
    
    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: 'Confirmation de votre compte TrioNova',
      html: `
        <h2>Bienvenue sur TrioNova !</h2>
        <p>Merci de vous être inscrit. Veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :</p>
        <p><a href="${confirmUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirmer mon email</a></p>
        <p>Ou copiez ce lien dans votre navigateur :</p>
        <p>${confirmUrl}</p>
        <p>Ce lien expire dans 24 heures.</p>
      `
    };

    try {
      await emailTransporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      throw new Error('Erreur lors de l\'envoi de l\'email de confirmation');
    }
  }

  async sendPasswordReset(email, token, baseUrl) {
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;
    
    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: 'Réinitialisation de votre mot de passe TrioNova',
      html: `
        <h2>Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
        <p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a></p>
        <p>Ou copiez ce lien dans votre navigateur :</p>
        <p>${resetUrl}</p>
        <p>Ce lien expire dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      `
    };

    try {
      await emailTransporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      throw new Error('Erreur lors de l\'envoi de l\'email de réinitialisation');
    }
  }
}

