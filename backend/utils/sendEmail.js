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
    subject: ` Your Ticket for ${eventName}`,
    html: `
      <div style="font-family: sans-serif; color: #333;">
        <h2>Registration Confirmed!</h2>
        <p>Hi <strong>${participantName}</strong>,</p>
        <p>Your registration for <strong>${eventName}</strong> is confirmed.</p>
        
        <ul>
          <li><strong>Date:</strong> ${eventDate}</li>
          <li><strong>Venue:</strong> ${eventVenue || "To be announced"}</li>
          <li><strong>Ticket Number:</strong> ${ticketNumber}</li>
        </ul>

        <p>Please find your QR code below. Show this at the entrance for check-in:</p>
        <div>
          <img src="cid:qrcode" alt="QR Code" width="200" height="200" style="border: 1px solid #ccc; padding: 10px;" />
        </div>

        <p><small>If you have any questions, please contact the event organizer.</small></p>
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