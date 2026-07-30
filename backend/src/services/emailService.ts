import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Function to dynamically initialize transporter with runtime process.env values
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const isSmtpConfigured =
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_USER !== 'your-email@gmail.com' &&
      process.env.SMTP_PASS !== 'your-app-password';

    // Mock console logging if SMTP credentials aren't properly passed in .env
    if (!isSmtpConfigured) {
      console.log(`\n📧 [DEV EMAIL MOCK] To: ${options.to} | Subject: ${options.subject}`);
      console.log(`Content:\n${options.html}\n`);
      return true;
    }

    const transporter = getTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"MediShare Platform" <noreply@medishare.org>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`✉️ Email successfully sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};

// Template: Handover OTP Notification
export const sendOtpEmail = async (to: string, otpCode: string, taskType: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #0284c7;">MediShare Logistics Verification</h2>
      <p>Your dispatch handover code for <strong>${taskType}</strong> is:</p>
      <div style="background-color: #f0f9ff; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #0369a1; border-radius: 6px;">
        ${otpCode}
      </div>
      <p style="margin-top: 15px; font-size: 14px; color: #666;">
        Please share this code with the volunteer upon equipment pickup/delivery to confirm the handover.
      </p>
    </div>
  `;
  return sendEmail({ to, subject: `[MediShare] Your Handover OTP Code: ${otpCode}`, html });
};

// Template: Task Assigned Alert for Volunteer
export const sendTaskAssignmentEmail = async (to: string, taskId: string, pickupAddress: string, dropoffAddress: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #16a34a;">New Logistics Dispatch Assigned</h2>
      <p>Thank you for volunteering! You have been assigned to task <strong>#${taskId}</strong>.</p>
      <ul>
        <li><strong>Pickup Location:</strong> ${pickupAddress}</li>
        <li><strong>Dropoff Location:</strong> ${dropoffAddress}</li>
      </ul>
      <p>Please open your MediShare app to start live tracking during route delivery.</p>
    </div>
  `;
  return sendEmail({ to, subject: `[MediShare] New Dispatch Task Assigned (#${taskId})`, html });
};