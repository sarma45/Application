import { defineConfig } from "prisma/config";
import { config } from "dotenv";

config();

export default defineConfig({
  earlyAccess: true,
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
