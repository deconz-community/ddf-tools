import { type UserModule } from '../types'
import { usePocketBase } from '~/composables/usePocketbase'

export const install: UserModule = ({ router }) => {
  router.beforeEach((to, from) => {
    if (to.meta.requiresAuth) {
      const pb = usePocketBase()
      const userID = pb.client.authStore.model?.id

      if (!pb.client.authStore.isValid)
        return from

      if (to.meta.requiresPersonnalAuth && (to.params.user === undefined || to.params.user !== userID))
        return from
    }
  })
}
