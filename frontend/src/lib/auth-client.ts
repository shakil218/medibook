import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export const authClient = createAuthClient({
  baseURL: rawBaseUrl.replace(/\/$/, ""),
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: true,
          defaultValue: "patient",
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
    }),
  ],
});
