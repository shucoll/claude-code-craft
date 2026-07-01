// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { scaffoldLanguage } from './language.ts'

function seedSnippets(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-'))
  fs.mkdirSync(path.join(dir, 'snippets'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'snippets/index.ts'),
    `import type { LanguagePack } from '../types'
import javascript from './javascript'
import python from './python'

export const LANGUAGE_PACKS: Record<string, LanguagePack> = {
  javascript,
  python,
}
`,
  )
  return dir
}

test('scaffoldLanguage creates an empty pack and registers it', () => {
  const dir = seedSnippets()
  scaffoldLanguage({ id: 'rust', label: 'Rust', icon: '🦀' }, dir)

  const pack = fs.readFileSync(path.join(dir, 'snippets/rust.ts'), 'utf8')
  expect(pack).toContain("id: 'rust'")
  expect(pack).toContain("label: 'Rust'")
  expect(pack).toContain('snippets: {}')
  expect(pack).toContain('prompts: {}')

  const index = fs.readFileSync(path.join(dir, 'snippets/index.ts'), 'utf8')
  expect(index).toContain("import rust from './rust'")
  expect(index).toMatch(/LANGUAGE_PACKS[\s\S]*rust/)
})

test('scaffoldLanguage refuses to overwrite an existing pack', () => {
  const dir = seedSnippets()
  fs.writeFileSync(path.join(dir, 'snippets/rust.ts'), '// existing')
  expect(() => scaffoldLanguage({ id: 'rust', label: 'Rust' }, dir)).toThrow(/already exists/)
})

test('scaffoldLanguage rejects a non-identifier id', () => {
  const dir = seedSnippets()
  expect(() => scaffoldLanguage({ id: 'c++', label: 'C++' }, dir)).toThrow(/identifier/)
})
