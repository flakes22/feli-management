import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendTicketEmail = async ({
  to,
  eventName,
  ticketId,
  qrCode,
}) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Your Ticket for ${eventName}`,
    html: `
      <h2>Registration Successful!</h2>
      <p><strong>Event:</strong> ${eventName}</p>
      <p><strong>Ticket ID:</strong> ${ticketId}</p>
      <p>Please find your QR code below:</p>
      <img src="${qrCode}" />
      <p>Show this QR at entry.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
