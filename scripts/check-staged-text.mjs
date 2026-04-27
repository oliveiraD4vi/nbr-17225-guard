import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const suspiciousPatterns = [
  {
    label: 'U+00C3',
    pattern: new RegExp(String.fromCharCode(0x00c3), 'g'),
    description: 'indício comum de texto UTF-8 lido com codificação incorreta',
  },
  {
    label: 'U+00C2',
    pattern: new RegExp(String.fromCharCode(0x00c2), 'g'),
    description: 'indício comum de texto UTF-8 lido com codificação incorreta',
  },
  {
    label: 'U+FFFD',
    pattern: new RegExp(String.fromCharCode(0xfffd), 'g'),
    description: 'caractere de substituição, normalmente associado a texto corrompido',
  },
]
const allowedExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.yml',
  '.yaml',
])

function resolveGitCommand() {
  if (process.platform !== 'win32') return 'git'

  const candidatePaths = [
    path.join(process.env.ProgramFiles ?? '', 'Git', 'cmd', 'git.exe'),
    path.join(process.env.ProgramFiles ?? '', 'Git', 'bin', 'git.exe'),
    path.join(process.env['ProgramFiles(x86)'] ?? '', 'Git', 'cmd', 'git.exe'),
    path.join(process.env['ProgramFiles(x86)'] ?? '', 'Git', 'bin', 'git.exe'),
  ].filter(Boolean)

  return candidatePaths.find((candidatePath) => existsSync(candidatePath)) ?? 'git'
}

function getStagedFiles() {
  const output = execFileSync(
    resolveGitCommand(),
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
    { cwd, encoding: 'utf8' },
  )

  return output
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function isScannableFile(filePath) {
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) return false
  return allowedExtensions.has(path.extname(filePath))
}

function scanFile(filePath) {
  const text = readFileSync(filePath, 'utf8')
  const hits = suspiciousPatterns
    .filter(({ pattern }) => pattern.test(text))
    .map(({ label, description }) => ({ label, description }))

  suspiciousPatterns.forEach(({ pattern }) => {
    pattern.lastIndex = 0
  })

  return hits
}

const files = getStagedFiles()
const findings = []

files.forEach((relativePath) => {
  const absolutePath = path.resolve(cwd, relativePath)
  if (!isScannableFile(absolutePath)) return

  const hits = scanFile(absolutePath)
  if (hits.length > 0) {
    findings.push({ relativePath, hits })
  }
})

if (findings.length > 0) {
  console.error('Texto possivelmente corrompido encontrado nos arquivos staged:')
  findings.forEach(({ relativePath, hits }) => {
    const details = hits.map(({ label, description }) => `${label} (${description})`).join(', ')
    console.error(`- ${relativePath}: ${details}`)
  })
  process.exit(1)
}

console.log('Verificação de texto staged concluída sem sinais de codificação corrompida.')
