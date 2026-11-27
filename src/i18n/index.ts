import messages from './pt-BR.json'
import ruleMessages from './rules-pt-BR.json'

type Primitive = string | number | boolean | null | undefined
type NestedRecord = { [key: string]: Primitive | NestedRecord }

const catalog = {
  ...messages,
  rules: ruleMessages,
}

/** Dot-separated paths to the texts of a catalog, so a missing text fails to compile. */
type MessagePath<Catalog> = {
  [Key in keyof Catalog & string]: Catalog[Key] extends string
    ? Key
    : `${Key}.${MessagePath<Catalog[Key]>}`
}[keyof Catalog & string]

export type TextKey = MessagePath<typeof catalog>

type PrefixOf<Key, Leaf extends string> = Key extends `${infer Prefix}.${Leaf}` ? Prefix : never

/** Paths that hold a text named `Leaf`, such as every rule that has a `remediation`. */
export type TextKeyPrefix<Leaf extends string> = PrefixOf<TextKey, Leaf>

function readMessage(key: TextKey): string {
  return key.split('.').reduce<NestedRecord | Primitive>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return current[segment as keyof typeof current]
    }

    throw new Error(`Chave de texto não encontrada: ${key}`)
  }, catalog as NestedRecord) as string
}

export function t(key: TextKey, params?: Record<string, Primitive>): string {
  const template = readMessage(key)
  if (!params) return template

  return template.replace(/\{\{(\w+)\}\}/g, (_, token: string) => {
    const value = params[token]
    return value === undefined || value === null ? '' : String(value)
  })
}

export { messages }
