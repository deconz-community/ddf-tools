import { describe, expect, it } from "vite-plus/test";
import { loadConfig } from "../src/config.js";

describe("store service configuration", () => {
  it("loads the configured browser origins and SMTP delivery settings", () => {
    expect(
      loadConfig({
        DATABASE_PATH: "./store.db",
        ALLOWED_ORIGINS: "https://toolbox.example, https://preview.example",
        SMTP_URL: "smtp://mail.example",
        SMTP_FROM: "store@example.com",
        TOOLBOX_URL: "https://toolbox.example/",
        NODE_ENV: "production",
      }),
    ).toMatchObject({
      allowedOrigins: ["https://toolbox.example", "https://preview.example"],
      smtpUrl: "smtp://mail.example",
      smtpFrom: "store@example.com",
      toolboxUrl: "https://toolbox.example",
      secureCookies: true,
    });
  });

  it("requires SMTP URL and sender to be configured together", () => {
    expect(() =>
      loadConfig({
        DATABASE_PATH: "./store.db",
        SMTP_URL: "smtp://mail.example",
      }),
    ).toThrow("SMTP_URL and SMTP_FROM must be configured together");
  });

  it("treats empty optional Docker environment variables as unset", () => {
    expect(
      loadConfig({
        DATABASE_PATH: "./store.db",
        SMTP_URL: "",
        SMTP_FROM: "",
        SECURE_COOKIES: "",
      }),
    ).toMatchObject({ smtpUrl: undefined, smtpFrom: undefined, secureCookies: false });
  });
});
