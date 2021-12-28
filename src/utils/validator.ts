import { TranslateResult } from 'vue-i18n'

export type ValidationError = TranslateResult
type validator = () => ValidationError | null | undefined

export function validate(validators: Array<validator>): Array<ValidationError> {
  let result: Array<ValidationError> = []
  validators.forEach(validator => {
    const error = validator()
    if (error !== null && error !== undefined) {
      result.push(error)
    }
  })
  return result
}
