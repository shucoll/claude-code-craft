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

function str(obj: ObjectLiteralExpression, name: string): string {
  const p = obj.getPropertyOrThrow(name).asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializerOrThrow()
  return Node.isStringLiteral(p) ? p.getLiteralText() : ''
}
function num(obj: ObjectLiteralExpression, name: string): number {
  const prop = obj.getProperty(name)
  if (!prop || !Node.isPropertyAssignment(prop)) return 0
  const init = prop.getInitializer()
  return init ? Number(init.getText()) : 0
}
