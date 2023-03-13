import { z as zod } from 'zod'

export function ddfSchema() {
  const zodSchema = zod.object({
    id: zod.number().int().positive(),
    email: zod.string().email(),
  })

  return zodSchema
}

export function validate(data: unknown) {
  const schema = ddfSchema()
  return schema.parse(data)
}
