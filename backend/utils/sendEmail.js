import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (not your login password)
  },
});

/**
 * Sends a registration confirmation email with the QR code attached.
 *
 * @param {Object} options
 * @param {string} options.toEmail        - Recipient email
 * @param {string} options.participantName
 * @param {string} options.eventName
 * @param {string} options.eventDate      - formatted date string
 * @param {string} options.eventVenue
 * @param {string} options.ticketNumber
 * @param {string} options.qrCodeDataUrl  - base64 data URL from QRCode.toDataURL()
 */
export const sendTicketEmail = async ({
  toEmail,
  participantName,
  eventName,
  eventDate,
  eventVenue,
  ticketNumber,
  qrCodeDataUrl,
}) => {
  // Strip the "data:image/png;base64," prefix to get raw base64
  const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");

  const mailOptions = {
    from: `"Feli Management" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🎟️ Your Ticket for ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #673ab7, #9c27b0); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎟️ Registration Confirmed!</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0;">You're all set for the event</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #333;">Hi <strong>${participantName}</strong>,</p>
          <p style="color: #555;">Your registration has been confirmed. Here are your details:</p>

          <!-- Event Details Card -->
          <div style="background: #f9f5ff; border-left: 4px solid #673ab7; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #888; font-size: 13px; width: 120px;"> Event</td>
                <td style="padding: 8px 0; color: #1a1a2e; font-weight: 700; font-size: 15px;">${eventName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #888; font-size: 13px;">📆 Date</td>
                <td style="padding: 8px 0; color: #333;">${eventDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #888; font-size: 13px;">📍 Venue</td>
                <td style="padding: 8px 0; color: #333;">${eventVenue || "To be announced"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #888; font-size: 13px;">🎫 Ticket No.</td>
                <td style="padding: 8px 0; color: #673ab7; font-weight: 700; font-family: monospace; font-size: 14px;">${ticketNumber}</td>
              </tr>
            </table>
          </div>

          <!-- QR Code -->
          <div style="text-align: center; margin: 28px 0;">
            <p style="color: #555; margin-bottom: 12px; font-size: 14px;">
              Show this QR code at the entrance for check-in:
            </p>
            <!-- cid:qrcode references the inline attachment below -->
            <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 8px;" />
          </div>

          <p style="color: #888; font-size: 13px; text-align: center;">
            If you have any questions, please contact the event organizer.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f5f5f5; padding: 16px; text-align: center;">
          <p style="margin: 0; color: #aaa; font-size: 12px;">
            © ${new Date().getFullYear()} Feli Management · This is an automated email, please do not reply.
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: "ticket-qr.png",
        content: base64Data,
        encoding: "base64",
        cid: "qrcode", // same as src="cid:qrcode" in the HTML above
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};