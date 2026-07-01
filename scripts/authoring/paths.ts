import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const STUB = '@@TODO@@'
export const DEFAULT_LANGUAGE = 'javascript'

const here = path.dirname(fileURLToPath(import.meta.url))
export const DEFAULT_CONTENT_DIR = path.resolve(here, '../../src/content')

export const curriculumFile = (contentDir: string): string => path.join(contentDir, 'curriculum.ts')
export const lessonsDir = (contentDir: string): string => path.join(contentDir, 'lessons')
export const snippetsDir = (contentDir: string): string => path.join(contentDir, 'snippets')
export const packFile = (contentDir: string, id: string): string => path.join(contentDir, 'snippets', `${id}.ts`)
export const packsIndexFile = (contentDir: string): string => path.join(contentDir, 'snippets', 'index.ts')
