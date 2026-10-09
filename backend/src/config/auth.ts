import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { client } from "./db.js";
import dotenv from "dotenv";

dotenv.config();

const db = client.db("medibook");

const isProduction = process.env.NODE_ENV === "production";

const frontendUrl = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.replace(/\/$/, "")
  : "http://localhost:3000";

const getBaseUrl = () => {
  if (!isProduction) {
    return "http://localhost:5000";
  }
  return process.env.BETTER_AUTH_URL ? process.env.BETTER_AUTH_URL.replace(/\/$/, "") : "http://localhost:5000";
};

export const auth = betterAuth({
  database: mongodbAdapter(db),
  baseURL: getBaseUrl(),
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    frontendUrl,
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: process.env.GOOGLE_REDIRECT_URI || undefined,
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: isProduction ? "none" : undefined,
      secure: isProduction ? true : undefined,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "patient",
        input: true,
      },
      phone: {
        type: "string",
        required: false,
      },
      city: {
        type: "string",
        required: false,
      },
    },
  },
});
