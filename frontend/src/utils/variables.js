const VARIABLE_PATTERN = /\{\{\s*([A-Za-z_][\w]*)\s*\}\}/g

// Unique {{variable}} names in order of first appearance.
export function detectVariables(text) {
  const found = []
  for (const match of (text || '').matchAll(VARIABLE_PATTERN)) {
    if (!found.includes(match[1])) found.push(match[1])
  }
  return found
}

// Replaces {{name}} with the sample value; leaves it untouched when no value is given.
export function fillVariables(text, values) {
  return (text || '').replace(VARIABLE_PATTERN, (whole, name) => (values[name]?.trim() ? values[name] : whole))
}
