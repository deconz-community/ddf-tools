onCollectionAfterCreateRequest(({ collection }) => {
  if (!collection)
    return

  console.log(`Collection ${collection.name} created - generating types...`)
  $os.exec('npm', 'run', 'typegen:pocketbase:delayed')?.run()
})

onCollectionAfterUpdateRequest(({ collection }) => {
  if (!collection)
    return

  console.log(`Collection ${collection.name} updated - generating types...`)
  $os.exec('npm', 'run', 'typegen:pocketbase:delayed')?.run()
})

onCollectionAfterDeleteRequest(({ collection }) => {
  if (!collection)
    return

  console.log(`Collection ${collection.name} deleted - generating types...`)
  $os.exec('npm', 'run', 'typegen:pocketbase:delayed')?.run()
})
