import { type UserModule } from '../types'

export const install: UserModule = ({ router }) => {
  /* TODO Fix this
  router.beforeEach((to, from) => {
    if (to.meta.requiresAuth) {
      const store = useStore()
      const userID = store.client?.authStore.model?.id

      if (!store.client?.authStore.isValid)
        return from

      if (to.meta.requiresPersonnalAuth && (to.params.user === undefined || to.params.user !== userID))
        return from
    }
  })
  */
}
