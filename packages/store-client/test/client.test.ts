import { describe, expect, it } from "vite-plus/test";
import { createStoreClient, StoreApiError } from "../src/index.js";

describe("typed store client", () => {
  it("sends credentialed, CSRF-marked requests and returns account data", async () => {
    const requests: Request[] = [];
    const client = createStoreClient({
      baseUrl: "https://store.example/",
      origin: "https://toolbox.example",
      fetch: async (input, init) => {
        requests.push(new Request(input, init));
        return Response.json(
          { user: { id: "user-1", email: "user@example.com" }, verification_required: true },
          {
            status: 201,
          },
        );
      },
    });

    const response = await client.register({
      email: "user@example.com",
      password: "a secure password",
    });

    expect(response.verification_required).toBe(true);
    expect(requests[0]?.url).toBe("https://store.example/api/v1/auth/register");
    expect(requests[0]?.credentials).toBe("include");
    expect(requests[0]?.headers.get("x-store-request")).toBe("1");
    expect(requests[0]?.headers.get("origin")).toBe("https://toolbox.example");
    expect(await requests[0]?.json()).toEqual({
      email: "user@example.com",
      password: "a secure password",
    });
  });

  it("exposes typed server errors to callers", async () => {
    const client = createStoreClient({
      baseUrl: "https://store.example",
      fetch: async () =>
        Response.json(
          { error: { code: "email_not_verified", message: "Verify your email first." } },
          { status: 403 },
        ),
    });

    await expect(
      client.login({ email: "user@example.com", password: "a secure password" }),
    ).rejects.toMatchObject({
      name: "StoreApiError",
      status: 403,
      code: "email_not_verified",
    } satisfies Partial<StoreApiError>);
  });

  it("updates profile fields through the authenticated profile endpoint", async () => {
    let request: Request | undefined;
    const profile = {
      id: "user-1",
      email: "user@example.com",
      first_name: "User",
      last_name: null,
      avatar_url: "https://example.com/avatar.png",
      public_key: "public-key",
      private_key: "private-key",
      email_verified: true,
      date_created: "2026-10-22T00:00:00.000Z",
    };
    const client = createStoreClient({
      baseUrl: "https://store.example",
      fetch: async (input, init) => {
        request = new Request(input, init);
        return Response.json(profile);
      },
    });

    await expect(
      client.updateProfile({
        avatar_url: profile.avatar_url,
        public_key: profile.public_key,
        private_key: profile.private_key,
      }),
    ).resolves.toEqual(profile);

    expect(request?.method).toBe("PATCH");
    expect(request?.url).toBe("https://store.example/api/v1/profile");
    expect(request?.headers.get("x-store-request")).toBe("1");
    expect(await request?.json()).toEqual({
      avatar_url: profile.avatar_url,
      public_key: profile.public_key,
      private_key: profile.private_key,
    });
  });
});
