
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "error.platform.gateway.connecting:invocation[0]": { type: "error.platform.gateway.connecting:invocation[0]"; data: unknown };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "connectToGateway": "done.invoke.gateway.connecting:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: "isInvalidAPIKey" | "isUnreachable";
          services: "connectToGateway";
        };
        eventsCausingActions: {
          
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          "isInvalidAPIKey": "error.platform.gateway.connecting:invocation[0]";
"isUnreachable": "error.platform.gateway.connecting:invocation[0]";
        };
        eventsCausingServices: {
          "connectToGateway": "Connect" | "done.state.gateway.offline.editing";
        };
        matchesStates: "connecting" | "init" | "offline" | "offline.disabled" | "offline.editing" | "offline.editing.API key" | "offline.editing.Address" | "offline.editing.Done" | "offline.error" | "offline.error.invalid API key" | "offline.error.unknown" | "offline.error.unreachable" | "online" | { "offline"?: "disabled" | "editing" | "error" | { "editing"?: "API key" | "Address" | "Done";
"error"?: "invalid API key" | "unknown" | "unreachable"; }; };
        tags: never;
      }
  