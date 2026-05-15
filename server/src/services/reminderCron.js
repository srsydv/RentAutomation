import cron from "node-cron";
import { Tenant } from "../models/Tenant.js";
import { Property } from "../models/Property.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { sendRentReminderEmail } from "./email.js";

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function tomorrowDate(d = new Date()) {
  const t = new Date(d);
  t.setDate(t.getDate() + 1);
  return t;
}

function isDueTomorrow(dueDay, today = new Date()) {
  const t = tomorrowDate(today);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  const effectiveDue = Math.min(dueDay, last);
  return t.getDate() === effectiveDue;
}

function isDueToday(dueDay, today = new Date()) {
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const effectiveDue = Math.min(dueDay, last);
  return today.getDate() === effectiveDue;
}

async function runReminders() {
  const today = new Date();
  const key = monthKey(today);
  const tenants = await Tenant.find({ paymentStatus: "pending" }).populate("propertyId");
  for (const tenant of tenants) {
    const prop = tenant.propertyId;
    if (!prop) continue;
    const landlord = await User.findById(tenant.landlordId);
    if (!landlord) continue;
    const dueDay = prop.dueDay;
    const landlordEmail = landlord.email;

    if (isDueTomorrow(dueDay, today) && tenant.reminderEveSentForMonth !== key) {
      try {
        await sendRentReminderEmail({
          to: landlordEmail,
          tenantName: tenant.name,
          propertyName: prop.name,
          rentAmount: tenant.rentAmount,
          dueDay,
        });
        await Notification.create({
          userId: tenant.landlordId,
          title: "Rent due tomorrow",
          message: `${tenant.name} — ${prop.name} (₹${tenant.rentAmount}) is due on the ${dueDay}${suffix(dueDay)}.`,
          type: "due_tomorrow",
        });
        tenant.reminderEveSentForMonth = key;
        await tenant.save();
      } catch (e) {
        console.error("[cron] reminder eve failed", tenant._id, e.message);
      }
    }

    if (isDueToday(dueDay, today) && tenant.reminderDaySentForMonth !== key) {
      try {
        await sendRentReminderEmail({
          to: landlordEmail,
          tenantName: tenant.name,
          propertyName: prop.name,
          rentAmount: tenant.rentAmount,
          dueDay,
        });
        await Notification.create({
          userId: tenant.landlordId,
          title: "Rent due today",
          message: `${tenant.name} — ${prop.name} (₹${tenant.rentAmount}) is due today.`,
          type: "due_today",
        });
        tenant.reminderDaySentForMonth = key;
        await tenant.save();
      } catch (e) {
        console.error("[cron] reminder day failed", tenant._id, e.message);
      }
    }
  }
}

function suffix(d) {
  if (d === 1 || d === 21 || d === 31) return "st";
  if (d === 2 || d === 22) return "nd";
  if (d === 3 || d === 23) return "rd";
  return "th";
}

export function startReminderCron() {
  cron.schedule("0 8 * * *", () => {
    runReminders().catch((e) => console.error("[cron]", e));
  });
  console.log("[cron] Rent reminders scheduled daily at 08:00 server time");
}
