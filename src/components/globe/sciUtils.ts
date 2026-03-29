import * as THREE from 'three'

export const REGIONS = [
  { id: 'eu-north', name: 'EU North',      sub: 'Sweden · eu-north-1',        lat: 59.3,  lon: 18.1,   sci: 22  },
  { id: 'eu-west',  name: 'EU West',       sub: 'Ireland · eu-west-1',        lat: 53.3,  lon: -6.3,   sci: 38  },
  { id: 'us-west',  name: 'US West',       sub: 'Oregon · us-west-2',         lat: 45.5,  lon: -122.7, sci: 55  },
  { id: 'sa-east',  name: 'SA East',       sub: 'São Paulo · sa-east-1',      lat: -23.5, lon: -46.6,  sci: 61  },
  { id: 'ap-au',    name: 'AP Australia',  sub: 'Sydney · ap-southeast-2',    lat: -33.9, lon: 151.2,  sci: 74  },
  { id: 'us-east',  name: 'US East',       sub: 'Virginia · us-east-1',       lat: 38.9,  lon: -77.0,  sci: 89  },
  { id: 'ap-ne',    name: 'AP Northeast',  sub: 'Tokyo · ap-northeast-1',     lat: 35.7,  lon: 139.7,  sci: 112 },
  { id: 'ap-se',    name: 'AP Southeast',  sub: 'Singapore · ap-southeast-1', lat: 1.35,  lon: 103.8,  sci: 148 },
] as const

export type Region = typeof REGIONS[number]

export function sciToColor(sci: number): string {
  if (sci < 50)  return '#5DB800'  // cyber green — low carbon
  if (sci < 80)  return '#D4860A'  // cyber amber — medium
  if (sci < 110) return '#C8470A'  // cyber orange — high
  return '#E03030'                  // cyber red — critical
}

export function latLonToVector3(lat: number, lon: number, radius = 1.05): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
      (radius * Math.cos(phi)),
      (radius * Math.sin(phi) * Math.sin(theta))
  )
}

export type TaskType = 'code' | 'reason' | 'summ'

export const MODELS: Record<TaskType, { name: string; sci: number; note: string; best: boolean }[]> = {
  code: [
    { name: 'Qwen-SCI-7B', sci: 38, note: 'Baseline · lowest SCI', best: true  },
    { name: 'Qwen-72B',    sci: 52, note: 'High quality',           best: false },
    { name: 'Claude 3.5',  sci: 78, note: 'Balanced',               best: false },
    { name: 'GPT-4o',      sci: 91, note: 'Quality-first',          best: false },
  ],
  reason: [
    { name: 'Qwen-72B',    sci: 52, note: 'Best quality/SCI',       best: true  },
    { name: 'Qwen-SCI-7B', sci: 38, note: 'Baseline',               best: false },
    { name: 'Claude 3.5',  sci: 78, note: 'Strong reasoning',       best: false },
    { name: 'GPT-4o',      sci: 91, note: 'Quality-first',          best: false },
  ],
  summ: [
    { name: 'Qwen-SCI-7B', sci: 38, note: 'Best efficiency',        best: true  },
    { name: 'Qwen-7B',     sci: 41, note: 'Fast',                   best: false },
    { name: 'Claude 3.5',  sci: 78, note: 'Good quality',           best: false },
    { name: 'GPT-4o',      sci: 91, note: 'Overkill',               best: false },
  ],
}

// ── Task classification ───────────────────────────────────────────────────────

// Structural intent patterns — checked before keyword scoring.
// A pattern match adds a strong bonus to cut through keyword ambiguity
// (e.g. "write a summary" vs "write a function").
const INTENT_PATTERNS: { pattern: RegExp; task: TaskType; bonus: number }[] = [
  // "write/create/build a function/class/script/method/test/program" → code
  { pattern: /\b(write|create|build|make)\s+a?\s*(function|class|script|method|test|program|module|component|snippet)/i, task: 'code', bonus: 5 },
  // "write/give me a summary/overview/recap/brief/tldr" → summ
  { pattern: /\b(write|give|create|make)\s+(me\s+)?a?\s*(summary|overview|recap|brief|tldr|digest)/i, task: 'summ', bonus: 5 },
  // "summarize/condense/shorten this/the/my…" → summ
  { pattern: /\b(summarize|summarise|condense|shorten|compress|paraphrase)\s+(this|the|my|a|an|these)/i, task: 'summ', bonus: 4 },
  // "explain why/how/what/the reason" → reason
  { pattern: /\bexplain\s+(why|how|what|the\s+reason)/i, task: 'reason', bonus: 3 },
  // question openers: "why does", "how does", "what is/are" → reason
  { pattern: /^(why|how|what)\s+(does|do|is|are|would|should|can|could)/i, task: 'reason', bonus: 3 },
  // "analyze/evaluate/compare X" → reason
  { pattern: /\b(analyze|analyse|evaluate|compare|assess)\s+(this|the|my|a|an|these|whether)/i, task: 'reason', bonus: 3 },
  // "find/search for/look up sources/references/studies/information on" → reason
  { pattern: /\b(find|search\s+for|look\s+up|locate|gather)\s+(sources?|references?|resources?|studies|papers?|evidence|information|data|articles?|research)\b/i, task: 'reason', bonus: 4 },
]

// Weighted keywords — high-signal (domain-specific) terms score much higher
// than low-signal (ambiguous) terms to prevent false positives.
const TASK_KEYWORDS: Record<TaskType, { term: string; weight: number }[]> = {
  code: [
    // high-signal: unambiguously about code
    { term: 'typescript', weight: 3 }, { term: 'python',     weight: 3 },
    { term: 'javascript', weight: 3 }, { term: 'debug',      weight: 3 },
    { term: 'refactor',   weight: 3 }, { term: 'unit test',  weight: 3 },
    { term: 'compile',    weight: 3 }, { term: 'algorithm',  weight: 2.5 },
    { term: 'function',   weight: 2.5 },{ term: 'class',     weight: 2.5 },
    { term: 'array',      weight: 2.5 },{ term: 'regex',     weight: 2.5 },
    { term: 'html',       weight: 3 }, { term: 'css',        weight: 3 },
    { term: 'bash',       weight: 2.5 },{ term: 'shell',     weight: 2.5 },
    { term: 'api',        weight: 2 }, { term: 'method',     weight: 2 },
    { term: 'implement',  weight: 2 }, { term: 'code',       weight: 2 },
    { term: 'syntax',     weight: 2 }, { term: 'library',    weight: 1.5 },
    { term: 'variable',   weight: 2 }, { term: 'loop',       weight: 2 },
    { term: 'database',   weight: 2 }, { term: 'sql',        weight: 2 },
    { term: 'bug',        weight: 2 }, { term: 'error',      weight: 2 },
    { term: 'endpoint',   weight: 2 }, { term: 'frontend',   weight: 1.5 },
    { term: 'backend',    weight: 1.5 },
    { term: 'parse',      weight: 2.5 },{ term: 'serialize',  weight: 3 },
    { term: 'lint',       weight: 3 }, { term: 'scaffold',   weight: 3 },
    { term: 'initialize', weight: 2 }, { term: 'iterate',    weight: 2 },
    { term: 'mock',       weight: 2 }, { term: 'query',      weight: 2 },
    { term: 'execute',    weight: 1.5 },{ term: 'install',   weight: 1.5 },
    { term: 'configure',  weight: 1.5 },{ term: 'render',    weight: 1.5 },
    { term: 'migrate',    weight: 1.5 },{ term: 'fetch',     weight: 1.5 },
    { term: 'automate',   weight: 1.5 },{ term: 'integrate', weight: 1.5 },
    // medium-signal
    { term: 'script',     weight: 1.5 },{ term: 'program',   weight: 1.5 },
    { term: 'develop',    weight: 1 }, { term: 'test',       weight: 0.8 },
    { term: 'deploy',     weight: 1 }, { term: 'editing',    weight: 1 },
    { term: 'optimize',   weight: 1 }, { term: 'run',        weight: 0.8 },
    // low-signal: ambiguous — penalised heavily
    { term: 'build',      weight: 0.5 },{ term: 'generate',  weight: 0.3 },
    { term: 'write',      weight: 0.3 },
  ],
  reason: [
    // high-signal
    { term: 'analyze',    weight: 3 }, { term: 'analyse',    weight: 3 },
    { term: 'reason',     weight: 3 }, { term: 'deduce',     weight: 3 },
    { term: 'infer',      weight: 3 }, { term: 'calculate',  weight: 2.5 },
    { term: 'evaluate',   weight: 2.5 },{ term: 'logic',     weight: 2 },
    { term: 'math',       weight: 2 }, { term: 'compare',    weight: 2 },
    { term: 'decision',   weight: 2 }, { term: 'hypothesis', weight: 2 },
    // medium-signal
    { term: 'explain',    weight: 1.5 },{ term: 'solve',     weight: 1.5 },
    { term: 'strategy',   weight: 1.5 },{ term: 'research',  weight: 1.5 },
    { term: 'assess',     weight: 1.5 },{ term: 'predict',   weight: 1.5 },
    { term: 'think',      weight: 1 }, { term: 'plan',       weight: 0.8 },
    { term: 'sources',    weight: 2 }, { term: 'references', weight: 2 },
    { term: 'resources',  weight: 2 },
    { term: 'evidence',   weight: 1.5 },{ term: 'literature', weight: 2 },
    { term: 'studies',    weight: 1.5 },{ term: 'papers',    weight: 1.5 },
    { term: 'prove',      weight: 2.5 },{ term: 'proof',     weight: 2.5 },
    { term: 'implications', weight: 2 },{ term: 'tradeoffs', weight: 2 },
    { term: 'pros and cons', weight: 2 },{ term: 'argue',    weight: 2 },
    { term: 'argument',   weight: 2 }, { term: 'interpret',  weight: 1.5 },
    { term: 'diagnose',   weight: 2 }, { term: 'determine',  weight: 1.5 },
    { term: 'cause',      weight: 1.5 },{ term: 'effect',    weight: 1.5 },
    { term: 'investigate', weight: 2.5 },{ term: 'contrast', weight: 2.5 },
    { term: 'differentiate', weight: 2.5 },{ term: 'distinguish', weight: 2.5 },
    { term: 'hypothesize', weight: 2.5 },{ term: 'disprove', weight: 2.5 },
    { term: 'examine',    weight: 2 }, { term: 'conclude',   weight: 2 },
    { term: 'theorize',   weight: 2 }, { term: 'quantify',   weight: 2 },
    { term: 'justify',    weight: 2 }, { term: 'rationalize', weight: 2 },
    { term: 'strategize', weight: 2 }, { term: 'critique',   weight: 2 },
    { term: 'debate',     weight: 2 },
    { term: 'identify',   weight: 1.5 },{ term: 'verify',    weight: 1.5 },
    { term: 'validate',   weight: 1.5 },{ term: 'estimate',  weight: 1.5 },
    { term: 'weigh',      weight: 1.5 },{ term: 'recommend', weight: 1.5 },
    { term: 'troubleshoot', weight: 1.5 },
    // low-signal
    { term: 'problem',    weight: 0.5 },{ term: 'question',  weight: 0.3 },
    { term: 'why',        weight: 0.3 },{ term: 'how',       weight: 0.3 },
    { term: 'consider',   weight: 0.5 },
  ],
  summ: [
    // high-signal
    { term: 'tldr',       weight: 4 }, { term: 'tl;dr',      weight: 4 },
    { term: 'summarize',  weight: 3 }, { term: 'summarise',  weight: 3 },
    { term: 'condense',   weight: 3 }, { term: 'paraphrase', weight: 3 },
    { term: 'recap',      weight: 3 }, { term: 'key points', weight: 2.5 },
    { term: 'summary',    weight: 2.5 },{ term: 'shorten',   weight: 2 },
    { term: 'compress',   weight: 2 }, { term: 'digest',     weight: 2 },
    // medium-signal
    { term: 'gist',       weight: 3 }, { term: 'synopsis',   weight: 2.5 },
    { term: 'takeaways',  weight: 2.5 },{ term: 'key takeaways', weight: 2.5 },
    { term: 'main points', weight: 2.5 },{ term: 'abstract',  weight: 2 },
    { term: 'bullet points', weight: 2 },{ term: 'rephrase',  weight: 2 },
    { term: 'brief',      weight: 1.5 },{ term: 'overview',  weight: 1.5 },
    { term: 'outline',    weight: 1.5 },{ term: 'highlight',  weight: 1.5 },
    { term: 'shorter',    weight: 1.5 },{ term: 'extract',   weight: 1 },
    { term: 'editing',    weight: 1 },
    { term: 'distill',    weight: 2.5 },{ term: 'restate',    weight: 2 },
    { term: 'abbreviate', weight: 2 }, { term: 'synthesize',  weight: 2 },
    { term: 'consolidate', weight: 1.5 },{ term: 'rewrite',   weight: 1 },
    { term: 'clarify',    weight: 1 },
    // low-signal
    { term: 'simplify',   weight: 0.8 },
  ],
}

// Simple suffix normalization — maps common inflections to a shared stem
// so "summarizing", "summarized", "summarization" all match "summarize".
function stemWord(word: string): string {
  return word
    .replace(/izations?$/,  '')   // summarization(s) → summariz
    .replace(/i[sz]ing$/,   '')   // summarizing/summarising → summariz
    .replace(/i[sz]ed$/,    '')   // summarized/summarised → summariz
    .replace(/i[sz]e[sd]?$/, '')  // summarizes → summariz
    .replace(/tions?$/,     '')   // abbreviation(s) → abbrevia
    .replace(/ments?$/,     '')   // assessment(s) → assess
    .replace(/ing$/,        '')   // analyzing → analyz
    .replace(/ed$/,         '')   // analyzed → analyz
    .replace(/s$/,          '')   // keywords → keyword
}

function stemText(text: string): string {
  return text.split(/\s+/).map(stemWord).join(' ')
}

export function classifyTask(input: string): {
  task: TaskType
  confidence: 'high' | 'medium' | 'low'
  matched: string[]
} {
  const text       = input.toLowerCase()
  const stemmed    = stemText(text)
  const scores: Record<TaskType, number>     = { code: 0, reason: 0, summ: 0 }
  const matchedByTask: Record<TaskType, string[]> = { code: [], reason: [], summ: [] }

  // Step 1: structural intent patterns (applied to original text for readability)
  for (const { pattern, task, bonus } of INTENT_PATTERNS) {
    if (pattern.test(input)) {
      scores[task] += bonus
      matchedByTask[task].push(`~${pattern.source.replace(/\\/g, '').slice(0, 28)}`)
    }
  }

  // Step 2: weighted keyword scan (applied to both original and stemmed text)
  for (const [taskId, keywords] of Object.entries(TASK_KEYWORDS) as [TaskType, { term: string; weight: number }[]][]) {
    for (const { term, weight } of keywords) {
      const stemmedTerm = stemText(term)
      const matchIn = (t: string, kw: string) =>
        kw.includes(' ') ? t.includes(kw) : new RegExp(`\\b${kw}\\b`).test(t)

      if (matchIn(text, term) || matchIn(stemmed, stemmedTerm)) {
        scores[taskId as TaskType] += weight
        matchedByTask[taskId as TaskType].push(term)
      }
    }
  }

  const best = (Object.keys(scores) as TaskType[]).reduce((a, b) =>
    scores[a] >= scores[b] ? a : b
  )
  const topScore = scores[best]

  const confidence: 'high' | 'medium' | 'low' =
    topScore >= 4 ? 'high' :
    topScore >= 2 ? 'medium' :
    'low'

  // Low confidence → fallback to 'reason'
  const task: TaskType = confidence === 'low' ? 'reason' : best

  return { task, confidence, matched: matchedByTask[task] }
}
