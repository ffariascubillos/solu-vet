export function normalizeRut(rut: string) {
  return rut.replace(/\./g, "").replace(/\s/g, "").toUpperCase()
}

export function isValidRut(rut: string) {
  const normalizedRut = normalizeRut(rut)
  const match = /^(\d{7,8})-([\dK])$/.exec(normalizedRut)

  if (!match) {
    return false
  }

  const [, body, checkDigit] = match
  let multiplier = 2
  let sum = 0

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = 11 - (sum % 11)
  const expectedDigit =
    remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder)

  return checkDigit === expectedDigit
}
