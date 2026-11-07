import { assign, fromPromise, raise, sendTo, setup } from "xstate";
import {
  createStoreAccountClient,
  createStoreClient,
  searchBundles,
  type StoreAccountClient,
  type StoreClient,
  type StoreProfile,
} from "@deconz-community/store-api-client";
import { toastError } from "~/lib/handleError";

/**
 * Store API used when nothing is configured. Only development builds fall back to a local
 * server; production builds must be given `VITE_STORE_API_URL` (or a URL in the settings),
 * otherwise the store stays offline instead of pointing users at `localhost`.
 */
export const defaultStoreApiUrl: string =
  import.meta.env.VITE_STORE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "");

export interface StoreContext {
  storeApiUrl: string;
  storeClient?: StoreClient;
  storeApi?: StoreAccountClient;
  profile?: StoreProfile;
}

export const storeMachine = setup({
  types: {
    context: {} as StoreContext,
    input: {} as Partial<Pick<StoreContext, "storeApiUrl">>,
    events: {} as
      | {
          type: "LOGIN_WITH_PASSWORD";
          email: string;
          password: string;
        }
      | {
          type: "UPDATE_PROFILE";
          profile: StoreContext["profile"];
        }
      | {
          type: "LOGOUT";
        }
      | { type: "UPDATE_STORE_URL"; storeApiUrl: string }
      | {
          type: "REFRESH_PROFILE";
        },
  },

  actors: {
    fetchProfile: fromPromise(async ({ input }: { input: StoreAccountClient }) => {
      return await input.getProfile();
    }),

    connectStore: fromPromise<
      {
        isAuthenticated: boolean;
        storeClient: StoreClient;
        storeApi: StoreAccountClient;
        profile?: StoreProfile;
      },
      {
        storeApiUrl: string;
      }
    >(async ({ input }) => {
      if (!input.storeApiUrl) throw new Error("No store API URL is configured.");
      const storeClient = createStoreClient({ url: input.storeApiUrl });
      await searchBundles(storeClient);
      const storeApi = createStoreAccountClient({ url: input.storeApiUrl });
      let profile: StoreProfile | undefined;
      try {
        profile = await storeApi.getProfile();
      } catch {
        profile = undefined;
      }

      return {
        storeClient,
        storeApi,
        isAuthenticated: profile !== undefined,
        profile,
      };
    }),

    login: fromPromise<
      {
        success: boolean;
      },
      {
        storeApi: StoreAccountClient;
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
        storeApi: StoreAccountClient;
      }
    >(async ({ input }) => {
      try {
        await input.storeApi.logout();
        toast.info("Logged out.");
      } catch (error) {
        await toastError(error);
      }
    }),
  },

  actions: {
    updateProfile: assign(({ event }) => ({
      profile: "profile" in event ? event.profile : undefined,
    })),
  },
}).createMachine({
  id: "store",

  context: ({ input }) => ({
    storeApiUrl: input.storeApiUrl ?? defaultStoreApiUrl,
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
          storeApiUrl: context.storeApiUrl,
        }),
        src: "connectStore",
        onError: {
          target: "offline",
          actions: assign({ storeClient: undefined, storeApi: undefined, profile: undefined }),
        },
        onDone: [
          {
            target: "online.auth.connected",
            guard: ({ event }) => event.output.isAuthenticated === true,
            actions: assign(({ event }) => ({
              storeClient: event.output.storeClient,
              storeApi: event.output.storeApi,
              profile: event.output.profile,
            })),
          },
          {
            target: "online.auth.anonymous",
            actions: assign(({ event }) => ({
              storeClient: event.output.storeClient,
              storeApi: event.output.storeApi,
              profile: undefined,
            })),
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
                // A failed refresh (network error, blocked cookies) must not crash the machine:
                // stay connected so the user can still log out or retry.
                onError: {
                  actions: ({ event }) => {
                    void toastError(event.error);
                  },
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
    UPDATE_STORE_URL: {
      target: ".connecting",
      actions: [
        assign(({ event }) => ({ storeApiUrl: event.storeApiUrl })),
        sendTo(({ system }) => system.get("app"), { type: "SAVE_SETTINGS" }),
      ],
    },
  },
});
