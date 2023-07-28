import type { MaybeRef } from 'vue'

export function useGithubAvatar(github_id: MaybeRef<number | undefined>, avatarSize = 40) {
  return computed(() => {
    const id = unref(github_id)
    if (!id)
      return ''

    const url = new URL(`https://avatars.githubusercontent.com/u/${id}`)
    url.searchParams.append('s', avatarSize.toString())
    url.searchParams.append('v', '4')
    return url.href
  })
}
