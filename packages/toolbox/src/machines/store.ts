import { assign, fromPromise, raise, sendTo, setup } from "xstate";
import { produce } from "immer";
import type { AuthenticationClient, DirectusClient, RestClient } from "@directus/sdk";
import { authentication, createDirectus, readSettings, rest, serverHealth } from "@directus/sdk";
import {
  createStoreClient,
  type StoreClient,
  type StoreProfile,
} from "@deconz-community/store-client";
import type { Collections, Schema } from "~/interfaces/store";
import { toastError } from "~/lib/handleError";

export type Directus = DirectusClient<Schema> & RestClient<Schema> & AuthenticationClient<Schema>;

export type DirectusSettings = Pick<Collections.DirectusSettings, PublicSettingsKeys>;

export type PublicSettingsKeys = "public_key_stable" | "public_key_beta" | "public_key_deprecated";

export interface StoreContext {
  directusUrl: string;
  storeApiUrl: string;
  directus?: Directus;
  storeApi?: StoreClient;
  profile?: StoreProfile & {
    avatar?: string | null;
    is_contributor?: boolean;
    token?: string | null;
  };
  settings?: DirectusSettings;
}

export const storeMachine = setup({
  types: {
    context: {} as StoreContext,
    input: {} as Partial<Pick<StoreContext, "directusUrl" | "storeApiUrl">>,
    events: {} as
      | {
          type: "LOGIN_WITH_PASSWORD";
          email: string;
          password: string;
        }
      | {
          type: "LOGIN_WITH_TOKEN";
          username: string;
          token: string;
        }
      | {
          type: "UPDATE_PROFILE";
          profile: StoreContext["profile"];
        }
      | {
          type: "LOGOUT";
        }
      | {
          type: "UPDATE_DIRECTUS_URL";
          directusUrl: string;
        }
      | {
          type: "REFRESH_PROFILE";
        },
  },

  actors: {
    // #region fetchProfile
    fetchProfile: fromPromise(async ({ input }: { input: StoreClient }) => {
      return await input.getProfile();
    }),
    // #endregion

    // #region initDirectus
    initDirectus: fromPromise<
      {
        isAuthenticated: boolean;
        directus: Directus;
        storeApi: StoreClient;
        settings: DirectusSettings;
        profile?: StoreProfile;
      },
      {
        directusUrl: string;
        storeApiUrl: string;
      }
    >(async ({ input }) => {
      const makeClient = () => {
        return (
          createDirectus<Schema>(input.directusUrl)
            .with(
              rest({
                onRequest: (fetchOptions) => {
                  let timeout = 3000;
                  if (
                    typeof fetchOptions.headers === "object" &&
                    "X-Timeout" in fetchOptions.headers
                  ) {
                    const timeoutHeader = fetchOptions.headers["X-Timeout"];
                    if (typeof timeoutHeader === "string") {
                      const converted = Number.parseInt(timeoutHeader);
                      if (!Number.isNaN(converted)) timeout = converted;
                    }
                  }
                  const abortController = new AbortController();
                  const timeoutHandler = setTimeout(() => abortController.abort(), timeout);
                  fetchOptions.signal = abortController.signal;
                  fetchOptions.signal.addEventListener("abort", () => clearTimeout(timeoutHandler));
                  return fetchOptions;
                },
                onResponse: (_result, fetchOptions) => {
                  if (fetchOptions.signal?.aborted === false)
                    fetchOptions.signal.dispatchEvent(new Event("abort"));
                  return _result;
                },
              }),
            )
            // TODO: Don't use cookie
            .with(
              authentication("cookie", {
                credentials: "include", // TODO What do this does ?
              }),
            )
        );
      };

      const client = makeClient();

      const health = await client.request(serverHealth());

      if (health.status !== "ok") throw new Error("Could not connect to Directus");

      const settings = await client.request(readSettings());
      const storeApi = createStoreClient({ baseUrl: input.storeApiUrl });
      let profile: StoreProfile | undefined;
      try {
        profile = await storeApi.getProfile();
      } catch {
        profile = undefined;
      }

      return {
        directus: client,
        storeApi,
        settings,
        isAuthenticated: profile !== undefined,
        profile,
      };
    }),
    // #endregion

    // #region Login
    login: fromPromise<
      {
        success: boolean;
      },
      {
        storeApi: StoreClient;
        email: string;
        password: string;
      }
    >(async ({ input }) => {
      try {
        await input.storeApi.login({ email: input.email, password: input.password });
        toast.success("Logged in.");
      } catch (error) {
        await toastError(error);
        return { success: false };
      }
      return { success: true };
    }),

    logout: fromPromise<
      void,
      {
        storeApi: StoreClient;
      }
    >(async ({ input }) => {
      try {
        await input.storeApi.logout();
        toast.info("Logged out.");
      } catch (error) {
        await toastError(error);
      }
    }),

    // #endregion
  },

  actions: {
    updateProfile: assign(({ context, event }) =>
      produce(context, (draft) => {
        /*
      if (event.type !== 'UPDATE_PROFILE' && 'profile' in event === false)
        throw new Error(`Invalid event type = ${event.type}`)
      */

        const profile = "profile" in event ? event.profile : undefined;

        if (!profile) {
          draft.profile = undefined;
          return;
        }

        const avatar_url =
          profile.avatar_url ??
          (context.directus && profile.avatar
            ? `${context.directus.url}assets/${profile.avatar}`
            : null);

        draft.profile = {
          ...profile,
          avatar_url,
        };
      }),
    ),
  },
}).createMachine({
  id: "store",

  context: ({ input }) => ({
    directusUrl: input.directusUrl ?? "",
    storeApiUrl: input.storeApiUrl ?? import.meta.env.VITE_STORE_API_URL ?? "http://localhost:3000",
  }),

  states: {
    init: {
      after: {
        10: "connecting",
      },
    },

    connecting: {
      invoke: {
        input: ({ context }) => ({
          directusUrl: context.directusUrl,
          storeApiUrl: context.storeApiUrl,
        }),
        src: "initDirectus",
        onError: {
          target: "offline",
          actions: assign(({ context }) =>
            produce(context, (draft) => {
              draft.directus = undefined;
              draft.storeApi = undefined;
              draft.settings = undefined;
            }),
          ),
        },
        onDone: [
          {
            target: "online.auth.connected",
            guard: ({ event }) => event.output.isAuthenticated === true,
            actions: assign(({ context, event }) =>
              produce(context, (draft) => {
                draft.directus = event.output.directus as any;
                draft.storeApi = event.output.storeApi;
                draft.settings = event.output.settings;
                draft.profile = event.output.profile;
              }),
            ),
          },
          {
            target: "online.auth.anonymous",
            actions: assign(({ context, event }) =>
              produce(context, (draft) => {
                draft.directus = event.output.directus as any;
                draft.storeApi = event.output.storeApi;
                draft.settings = event.output.settings;
                draft.profile = undefined;
              }),
            ),
          },
        ],
      },
    },

    online: {
      type: "parallel",
      states: {
        auth: {
          initial: "anonymous",
          states: {
            anonymous: {
              on: {
                LOGIN_WITH_PASSWORD: {
                  target: "connecting",
                },
              },
            },
            connecting: {
              invoke: {
                src: "login",
                input: ({ context, event }) => {
                  if (event.type !== "LOGIN_WITH_PASSWORD") throw new Error("Invalid event type");

                  return {
                    storeApi: context.storeApi!,
                    email: event.email,
                    password: event.password,
                  };
                },
                onDone: [
                  {
                    guard: ({ event }) => event.output.success === true,
                    target: "connected",
                  },
                  {
                    target: "anonymous",
                  },
                ],
              },
            },
            disconnecting: {
              invoke: {
                src: "logout",
                input: ({ context }) => ({ storeApi: context.storeApi! }),
                onDone: {
                  target: "anonymous",
                  actions: "updateProfile",
                },
              },
            },
            connected: {
              on: {
                LOGOUT: {
                  target: "disconnecting",
                },
                UPDATE_PROFILE: {
                  actions: "updateProfile",
                },
                REFRESH_PROFILE: {
                  target: "connected",
                  reenter: true,
                },
              },

              invoke: {
                input: ({ context }) => context.storeApi!,
                src: "fetchProfile",
                onDone: {
                  actions: raise(({ event }) => ({
                    type: "UPDATE_PROFILE",
                    profile: event.output,
                  })),
                },
              },
            },
          },
        },
      },
    },

    offline: {},
  },

  initial: "init",

  on: {
    UPDATE_DIRECTUS_URL: {
      target: ".connecting",
      actions: [
        assign(({ context, event }) =>
          produce(context, (draft) => {
            draft.directusUrl = event.directusUrl;
          }),
        ),
        sendTo(({ system }) => system.get("app"), { type: "SAVE_SETTINGS" }),
      ],
    },
  },
});
