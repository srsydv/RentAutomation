/** Build wa.me link — opens WhatsApp app or WhatsApp Web with pre-filled message. */
export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits || !message.trim()) return null;

  let number = digits;
  // 10-digit Indian mobile → prepend country code 91
  if (digits.length === 10) number = `91${digits}`;
  // Leading 0 on local format e.g. 07007869915
  if (digits.length === 11 && digits.startsWith("0")) number = `91${digits.slice(1)}`;

  return `https://wa.me/${number}?text=${encodeURIComponent(message.trim())}`;
}

export function buildSmsUrl(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits || !message.trim()) return null;
  const number = digits.length === 10 ? `+91${digits}` : `+${digits}`;
  return `sms:${number}?body=${encodeURIComponent(message.trim())}`;
}

export function buildEmailUrl(email: string, subject: string, body: string): string | null {
  if (!email.trim() || !body.trim()) return null;
  return `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.trim())}`;
}
