// Line-based diff (longest common subsequence). Returns [{ type: 'same' | 'add' | 'del', text }].
export function diffLines(before = '', after = '') {
  const a = before.split('\n')
  const b = after.split('\n')
  const table = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }

  const result = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { result.push({ type: 'same', text: a[i] }); i += 1; j += 1 }
    else if (table[i + 1][j] >= table[i][j + 1]) { result.push({ type: 'del', text: a[i] }); i += 1 }
    else { result.push({ type: 'add', text: b[j] }); j += 1 }
  }
  while (i < a.length) { result.push({ type: 'del', text: a[i] }); i += 1 }
  while (j < b.length) { result.push({ type: 'add', text: b[j] }); j += 1 }
  return result
}
