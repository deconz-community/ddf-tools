export function useApp() {
  const app = useAppMachine('app')
  return reactive({
    send: app.send,
    state: computed(() => app.state),
    settings: computed(() => app.state?.context.settings),
    gatewayIds: computed(() => app.state ? Array.from(app.state.context.gateways.keys()) : []),
  })
}
