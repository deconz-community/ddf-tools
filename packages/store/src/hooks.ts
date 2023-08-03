/// <reference path="../pb_data/types.d.ts" />

onAfterBootstrap((e) => {
  console.log('App initialized!')
  console.log(e.app.isBootstrapped())
})
