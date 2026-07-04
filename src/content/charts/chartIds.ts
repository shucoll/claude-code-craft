// Node-safe list of registered chart ids. Kept import-free so the authoring
// generator (nodenext) can validate lesson `interactive.spec` without pulling
// the app chart module graph (demo.ts, *.mdx popups) into its compilation.
// A drift guard in index.test.ts asserts this matches the real registry.
export const chartIds: readonly string[] = ['demo']
