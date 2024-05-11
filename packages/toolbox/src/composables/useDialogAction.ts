import type { ZodTypeAny } from 'zod'
import { VTextField, VTextarea } from 'vuetify/components'
import type { MaybeRef } from 'vue'

type ConfirmParams = Parameters<ReturnType<typeof useConfirm>>[0]

type ContentComponentProps = Omit<
  ConfirmParams['contentComponentProps'],
  'model-value' | 'rules' | 'ref'
>

export interface UseDialogActionParams {
  title: string
  schema?: ZodTypeAny
  defaultValue?: MaybeRef<string>
  useTextArea?: boolean
  confirmationText?: string
  contentComponentProps?: ContentComponentProps
  dialogProps?: ConfirmParams['dialogProps']
  onSubmit: (value: string) => Promise<any>
}

export function useDialogAction(getParams: () => UseDialogActionParams | undefined) {
  const createConfirm = useConfirm()

  async function open() {
    const params = getParams()
    if (!params)
      return
    const input = ref(unref(params.defaultValue) ?? '')
    const inputFieldRef = ref<VTextField | VTextarea>()

    const rules = []
    const { schema } = params
    if (schema) {
      rules.push((v: string) => {
        const result = schema.safeParse(v)
        if (result.success)
          return true
        return result.error.issues.map(issue => issue.message).join('\n')
      })
    }

    const isConfirmed = createConfirm({
      title: params.title,
      contentComponent: params.useTextArea ? VTextarea : VTextField,
      contentComponentProps: {
        ...params.contentComponentProps,
        'model-value': input,
        rules,
        'ref': inputFieldRef,
      },
      confirmationText: params.confirmationText,
      dialogProps: {
        width: 600,
        ...params.dialogProps,
      },
    })

    inputFieldRef.value?.focus()

    if (!await isConfirmed)
      return

    const value = input.value ?? ''

    for (const rule of rules) {
      const result = rule(value)
      if (typeof result === 'string')
        return toast.error('Error', { description: result })
    }

    params.onSubmit(value)
  }

  return open
}
