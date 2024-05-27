export function useApp() {
  const app = useAppMachine('app')
  return reactive({
    send: app.send,
    select: app.select,
    state: app.select(state => state),
    settings: app.select(state => state.context.settings),
    gatewayIds: app.select(state => Array.from(state.context.gateways.keys())),
  })
}
