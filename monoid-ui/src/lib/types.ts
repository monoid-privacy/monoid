// eslint-disable-next-line import/no-extraneous-dependencies
import { JSONSchema7 } from 'json-schema';

export interface MonoidJSONSchema extends JSONSchema7 {
  order?: number,
  secret?: boolean
}
