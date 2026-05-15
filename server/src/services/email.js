import nodemailer from "nodemailer";

let transporterPromise;

async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return null;
  }
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user, pass },
  });
}

export async function sendRentReminderEmail({ to, tenantName, propertyName, rentAmount, dueDay }) {
  const transporter = await getTransporter();
  const from = process.env.EMAIL_FROM || "RentLandlord <noreply@example.com>";
  const subject = `Rent reminder: ${propertyName}`;
  const text = `Hello,\n\nThis is a friendly reminder that rent for ${propertyName} (${tenantName}) of ₹${rentAmount} is due on the ${dueDay}${suffix(
    dueDay
  )} of this month.\n\n— RentLandlord`;
  if (!transporter) {
    console.warn("[email] SMTP not configured; would send:", { to, subject });
    return { skipped: true };
  }
  await transporter.sendMail({ from, to, subject, text });
  return { sent: true };
}

function suffix(d) {
  if (d === 1 || d === 21 || d === 31) return "st";
  if (d === 2 || d === 22) return "nd";
  if (d === 3 || d === 23) return "rd";
  return "th";
}
