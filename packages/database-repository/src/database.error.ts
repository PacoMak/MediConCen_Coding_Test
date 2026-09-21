import {
  ExceptionCategory,
  prepareErrorFactories,
} from '@mediconcen_coding_test/exceptions'

export const DatabaseError = prepareErrorFactories<{
  uniqueConstraintViolated: [{ target: unknown }]
}>(
  'database',
  {
    uniqueConstraintViolated: 'unique-constraint-violated',
  },
  {
    uniqueConstraintViolated: ExceptionCategory.concurrency,
  },
)
