#!/usr/bin/env node

const crypto = require('node:crypto')
const fs = require('node:fs')
const concurrently = require('concurrently')
const spawnCommand = require('spawn-command')
const { createDirectus, rest, authentication, updateMe } = require('@directus/sdk')

/**
 *
 * @param {string} command
 */
async function spawnCli(command) {
  return new Promise((resolve, reject) => {
    const child = spawnCommand(command)
    let completeData = ''

    child.stdout.on('data', (data) => {
      completeData += data.toString()
    })

    child.on('exit', (exitCode) => {
      if (exitCode === 0)
        resolve(completeData)
      else
        reject(completeData)
    })
  })
}

function extractUuid(str) {
  const uuidRegex = /\b([a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12})\b/i
  const match = str.match(uuidRegex)
  if (match)
    return match[1]
  else
    return null
}

(async () => {
  const userMail = `${crypto.randomUUID()}@cli.foo`
  const userPassword = crypto.randomUUID()
  const token = crypto.randomUUID()
  const url = 'http://localhost:8055'

  console.log('Create Temp Cli Role')
  const adminRoleUUID = extractUuid(await spawnCli('npx directus roles create --role "Temp CLI Role" --admin'))

  console.log('Create Temp Cli User')
  const userUUID = extractUuid(await spawnCli(`npx directus users create --email ${userMail} --password ${userPassword} --role ${adminRoleUUID}`))

  const client = createDirectus('http://localhost:8055').with(rest()).with(authentication('json'))

  console.log('Auth Cli User')
  await client.login(userMail, userPassword)

  console.log('Update Cli User token')
  await client.request(updateMe({ token }))

  console.log('Export Schema')
  const result = await spawnCli(`npx indirectus sdk generate --url ${url} --token ${token} --fetch`)

  fs.copyFile('./.directus/generated/client.ts', 'packages/main/src/client.d.ts')
  console.log(result)

  console.log('Done')

  await client.logout()
})()
