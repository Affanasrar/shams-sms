/**
 * Recursively converts Prisma Decimal objects to numbers in an object
 * This is needed because Decimal objects cannot be passed to Client Components
 */
export function serializeDecimals(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  // Check if this is a Decimal object (has toString and toJSON methods)
  if (obj.constructor?.name === 'Decimal' || (typeof obj === 'object' && obj.d && obj.e !== undefined)) {
    return Number(obj)
  }

  if (typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeDecimals(item))
  }

  const result: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = serializeDecimals(obj[key])
    }
  }
  return result
}
