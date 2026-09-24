import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildAuthUrlConfig } from "@/lib/auth-url";

const production = process.env.NODE_ENV === "production";
const authUrl = process.env.BETTER_AUTH_URL;
const deployPreviewUrl = process.env.DEPLOY_PRIME_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;
const authUrls = buildAuthUrlConfig({
  configuredUrl: authUrl,
  deployUrl: deployPreviewUrl,
  canonicalUrl: process.env.URL,
});

if (production && (!authUrl || !authSecret || authSecret.length < 32)) {
  throw new Error("En producción se requieren BETTER_AUTH_URL y BETTER_AUTH_SECRET de al menos 32 caracteres.");
}

export const auth = betterAuth({
  appName: "SaaS Contable Chile",
  baseURL: authUrls.baseURL,
  secret: authSecret,
  trustedOrigins: authUrls.trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    modelName: "user",
  },
  session: {
    modelName: "authSession",
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 12,
  },
  account: {
    modelName: "authAccount",
  },
  verification: {
    modelName: "authVerification",
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Restablece tu contraseña",
        text: `Para restablecer tu contraseña, abre este enlace: ${url}`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verifica tu correo electrónico",
        text: `Confirma tu dirección de correo para activar tu cuenta: ${url}`,
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "authRateLimit",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60 * 60, max: 5 },
      "/request-password-reset": { window: 60 * 60, max: 3 },
    },
  },
});
