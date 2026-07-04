import { Node, SyntaxKind } from 'ts-morph'
import type { ArrayLiteralExpression, ObjectLiteralExpression, SourceFile } from 'ts-morph'
import { sq } from './tsutil.ts'

function getStringProp(obj: ObjectLiteralExpression, name: string): string | undefined {
  const prop = obj.getProperty(name)
  if (!prop || !Node.isPropertyAssignment(prop)) return undefined
  const init = prop.getInitializer()
  return init && Node.isStringLiteral(init) ? init.getLiteralText() : undefined
}

function getArrayProp(obj: ObjectLiteralExpression, name: string): ArrayLiteralExpression {
  return obj
    .getPropertyOrThrow(name)
    .asKindOrThrow(SyntaxKind.PropertyAssignment)
    .getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
}

function objectsOf(arr: ArrayLiteralExpression): ObjectLiteralExpression[] {
  return arr.getElements().filter(Node.isObjectLiteralExpression)
}

function findBy(arr: ArrayLiteralExpression, prop: string, value: string): ObjectLiteralExpression | undefined {
  return objectsOf(arr).find((el) => getStringProp(el, prop) === value)
}

function nextOrder(arr: ArrayLiteralExpression): number {
  let max = 0
  for (const el of objectsOf(arr)) {
    const prop = el.getProperty('order')
    if (prop && Node.isPropertyAssignment(prop)) {
      const init = prop.getInitializer()
      const n = init ? Number(init.getText()) : NaN
      if (Number.isFinite(n) && n > max) max = n
    }
  }
  return max + 1
}

function structureArray(sf: SourceFile): ArrayLiteralExpression {
  return sf.getVariableDeclarationOrThrow('structure').getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
}

export function ensureLevel(sf: SourceFile, level: { id: string; title: string }): ObjectLiteralExpression {
  const arr = structureArray(sf)
  const existing = findBy(arr, 'id', level.id)
  if (existing) return existing
  const order = nextOrder(arr)
  arr.addElement(`{ id: ${sq(level.id)}, title: ${sq(level.title)}, order: ${order}, modules: [] }`)
  return findBy(arr, 'id', level.id)!
}

export function ensureModule(
  levelObj: ObjectLiteralExpression,
  mod: { code: string; slug: string; title: string },
): ObjectLiteralExpression {
  const modules = getArrayProp(levelObj, 'modules')
  const existing = findBy(modules, 'code', mod.code)
  if (existing) return existing
  const order = nextOrder(modules)
  modules.addElement(`{ code: ${sq(mod.code)}, slug: ${sq(mod.slug)}, title: ${sq(mod.title)}, order: ${order} }`)
  return findBy(modules, 'code', mod.code)!
}
