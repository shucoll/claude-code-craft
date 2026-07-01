import fs from 'node:fs'
import { Project, QuoteKind, SyntaxKind } from 'ts-morph'
import { DEFAULT_CONTENT_DIR, packFile, packsIndexFile } from './paths.ts'
import type { ScaffoldReport } from './scaffold.ts'

export interface LanguageSpec {
  id: string
  label: string
  icon?: string
}

const IDENTIFIER = /^[a-zA-Z_$][\w$]*$/

export function scaffoldLanguage(spec: LanguageSpec, contentDir: string = DEFAULT_CONTENT_DIR): ScaffoldReport {
  if (!IDENTIFIER.test(spec.id)) throw new Error(`language id "${spec.id}" is not a valid identifier`)
  const file = packFile(contentDir, spec.id)
  if (fs.existsSync(file)) throw new Error(`pack already exists: ${spec.id}`)

  const iconLine = spec.icon ? `, icon: '${spec.icon}'` : ''
  const body = `import type { LanguagePack } from '../types'

const ${spec.id}: LanguagePack = {
  meta: { id: '${spec.id}', label: '${spec.label}'${iconLine} },
  snippets: {},
  prompts: {},
}

export default ${spec.id}
`
  fs.writeFileSync(file, body)

  const project = new Project({ skipAddingFilesFromTsConfig: true, manipulationSettings: { quoteKind: QuoteKind.Single } })
  const index = project.addSourceFileAtPath(packsIndexFile(contentDir))
  index.addImportDeclaration({ defaultImport: spec.id, moduleSpecifier: `./${spec.id}` })
  index
    .getVariableDeclarationOrThrow('LANGUAGE_PACKS')
    .getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
    .addShorthandPropertyAssignment({ name: spec.id })
  index.saveSync()

  return { created: [file], changed: [packsIndexFile(contentDir)] }
}
