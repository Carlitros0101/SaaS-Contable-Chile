import nodemailer from "nodemailer";

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail(message: EmailMessage) {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT);
  const user = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASSWORD;
  const from = process.env.EMAIL_FROM;
  const isAllowedLocalSmtp = allowsInsecureLocalSmtp({
    nodeEnv: process.env.NODE_ENV,
    allowInsecureLocal: process.env.EMAIL_ALLOW_INSECURE_LOCAL,
    host,
  });

  if (!host || !Number.isInteger(port) || port <= 0 || !from || Boolean(user) !== Boolean(password)) {
    throw new Error("Revisa la configuración SMTP: host, puerto, remitente y credenciales completas si se requieren.");
  }
  if ((!user || !password) && !isAllowedLocalSmtp) {
    throw new Error("SMTP requiere usuario y contraseña; solo el servidor de correo local puede funcionar sin credenciales.");
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465 && !isAllowedLocalSmtp,
    auth: user && password ? { user, pass: password } : undefined,
  });

  try {
    await transport.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  } finally {
    transport.close();
  }
}

export function allowsInsecureLocalSmtp(config: { nodeEnv?: string; allowInsecureLocal?: string; host?: string }): boolean {
  return config.nodeEnv !== "production" &&
    config.allowInsecureLocal === "true" &&
    ["localhost", "127.0.0.1", "::1"].includes(config.host ?? "");
}
