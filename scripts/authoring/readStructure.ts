import { Node, SyntaxKind } from 'ts-morph'
import type { ObjectLiteralExpression, Project } from 'ts-morph'
import { structureFile } from './paths.ts'
import type { LevelDef, ModuleDef } from '../../src/content/structure.ts'

export function readStructure(project: Project, contentDir: string): LevelDef[] {
  const sf = project.addSourceFileAtPath(structureFile(contentDir))
  const arr = sf.getVariableDeclarationOrThrow('structure').getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
  const levels: LevelDef[] = []
  for (const el of arr.getElements()) {
    if (!Node.isObjectLiteralExpression(el)) continue
    const id = str(el, 'id')
    const title = str(el, 'title')
    const order = num(el, 'order')
    const modsArr = el.getPropertyOrThrow('modules').asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
    const modules: ModuleDef[] = []
    for (const m of modsArr.getElements()) {
      if (!Node.isObjectLiteralExpression(m)) continue
      modules.push({ code: str(m, 'code'), slug: str(m, 'slug'), title: str(m, 'title'), order: num(m, 'order') })
    }
    levels.push({ id, title, order, modules })
  }
  return levels
}

// Malformed structure.ts should fail loudly, not silently coerce to ''/0 and
// emit a wrongly-ordered curriculum. structure.ts is also tsc-checked, so these
// throws only fire on genuinely bad hand edits.
function str(obj: ObjectLiteralExpression, name: string): string {
  const p = obj.getPropertyOrThrow(name).asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializerOrThrow()
  if (!Node.isStringLiteral(p)) throw new Error(`structure.ts: "${name}" must be a string literal, got: ${p.getText()}`)
  return p.getLiteralText()
}
function num(obj: ObjectLiteralExpression, name: string): number {
  const prop = obj.getProperty(name)
  if (!prop || !Node.isPropertyAssignment(prop)) throw new Error(`structure.ts: missing required "${name}"`)
  const init = prop.getInitializer()
  const value = init ? Number(init.getText()) : NaN
  if (!Number.isFinite(value)) throw new Error(`structure.ts: "${name}" must be a number, got: ${init?.getText()}`)
  return value
}
