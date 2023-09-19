import { Collections } from '../store'

// Update github id after user login
onRecordAfterAuthWithOAuth2Request((e) => {
  const dao = $app.dao()

  if (!e.record || !dao)
    throw new Error('onRecordAfterAuthWithOAuth2Request - Something went wrong')

  let dirty = false

  if (e.record.getString('profile') === '') {
    const collection = dao.findCollectionByNameOrId(Collections.UserProfile)
    // const collection = dao.findCollectionByNameOrId('user_profile')

    const profile = new Record(collection, {
      user: e.record.getId(),
    })
    profile.refreshId()
    dao.saveRecord(profile)

    dirty = true
    e.record.set('profile', profile.getId())
  }

  if (e.oAuth2User) {
    const maps = [
      ['github_id', e.oAuth2User.id],
      ['email', e.oAuth2User.email],
      ['username', e.oAuth2User.username],
      ['name', e.oAuth2User.name],
    ] as const

    for (const [key, value] of maps) {
      if (e.record.getString(key) !== value) {
        e.record.set(key, value)
        dirty = true
      }
    }
  }

  if (dirty)
    dao.saveRecord(e.record)
}, 'user')
