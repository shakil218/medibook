import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { getBaseUrl } from "./api";

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
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
