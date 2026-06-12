/**
 * calc-engine — évaluateur d'expressions mathématiques SÛR (aucun eval /
 * new Function). Tokenizer + parseur à descente récursive.
 *
 * Grammaire (priorités croissantes) :
 *   expression := term (('+' | '-') term)*
 *   term       := unary (('*' | '/' | implicite) unary)*
 *   unary      := ('-' | '+') unary | power
 *   power      := postfix ('^' unary)?          — associatif à droite
 *   postfix    := primary ('%')*                — pourcentage (÷100)
 *   primary    := nombre | constante | fonction '(' expression ')'
 *              |  '(' expression ')'
 *
 * Multiplication implicite : `2π`, `2(3+4)`, `(2)(3)` — un identifiant ou
 * une parenthèse ouvrante après un facteur multiplie.
 *
 * Fonctions trigonométriques en DEGRÉS (sin(30) = 0,5).
 * Alias clavier acceptés : × · ÷ − , (virgule décimale) √ π.
 */

export class CalcError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CalcError'
  }
}

// ─── Tokenizer ────────────────────────────────────────────────────────────────

type TokenType = 'number' | 'op' | 'lparen' | 'rparen' | 'ident'

interface Token {
  type: TokenType
  value: string
}

const OP_ALIASES: Record<string, string> = {
  '×': '*',
  '·': '*',
  '÷': '/',
  '−': '-',
}

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9'
}

function isLetter(c: string): boolean {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < input.length) {
    const c = input[i]

    if (c === ' ' || c === '\t' || c === '\n') {
      i++
      continue
    }

    // Nombre : chiffres + séparateur décimal '.' ou ','
    if (isDigit(c) || ((c === '.' || c === ',') && isDigit(input[i + 1] ?? ''))) {
      let num = ''
      let hasDot = false
      while (i < input.length) {
        const d = input[i]
        if (isDigit(d)) {
          num += d
          i++
        } else if ((d === '.' || d === ',') && !hasDot) {
          num += '.'
          hasDot = true
          i++
        } else {
          break
        }
      }
      tokens.push({ type: 'number', value: num })
      continue
    }

    // Identifiants (fonctions, constantes) + symboles unicode dédiés
    if (isLetter(c)) {
      let ident = ''
      while (i < input.length && isLetter(input[i])) {
        ident += input[i]
        i++
      }
      tokens.push({ type: 'ident', value: ident.toLowerCase() })
      continue
    }
    if (c === 'π') {
      tokens.push({ type: 'ident', value: 'pi' })
      i++
      continue
    }
    if (c === '√') {
      tokens.push({ type: 'ident', value: 'sqrt' })
      i++
      continue
    }

    if (c === '(') {
      tokens.push({ type: 'lparen', value: '(' })
      i++
      continue
    }
    if (c === ')') {
      tokens.push({ type: 'rparen', value: ')' })
      i++
      continue
    }

    const op = OP_ALIASES[c] ?? c
    if (op === '+' || op === '-' || op === '*' || op === '/' || op === '^' || op === '%') {
      tokens.push({ type: 'op', value: op })
      i++
      continue
    }

    throw new CalcError(`Caractère inattendu : « ${c} »`)
  }
  return tokens
}

// ─── Fonctions et constantes ──────────────────────────────────────────────────

const DEG = Math.PI / 180

const FUNCTIONS: Record<string, (x: number) => number> = {
  sin: (x) => Math.sin(x * DEG),
  cos: (x) => Math.cos(x * DEG),
  tan: (x) => Math.tan(x * DEG),
  asin: (x) => {
    if (x < -1 || x > 1) throw new CalcError('asin : argument hors de [-1, 1]')
    return Math.asin(x) / DEG
  },
  acos: (x) => {
    if (x < -1 || x > 1) throw new CalcError('acos : argument hors de [-1, 1]')
    return Math.acos(x) / DEG
  },
  atan: (x) => Math.atan(x) / DEG,
  sqrt: (x) => {
    if (x < 0) throw new CalcError("Racine carrée d'un nombre négatif")
    return Math.sqrt(x)
  },
  log: (x) => {
    if (x <= 0) throw new CalcError("log : argument non positif")
    return Math.log10(x)
  },
  ln: (x) => {
    if (x <= 0) throw new CalcError("ln : argument non positif")
    return Math.log(x)
  },
  abs: (x) => Math.abs(x),
}

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
}

// ─── Parseur à descente récursive ─────────────────────────────────────────────

class Parser {
  private tokens: Token[]
  private pos: number

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.pos = 0
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private next(): Token | undefined {
    return this.tokens[this.pos++]
  }

  expectEnd(): void {
    const t = this.peek()
    if (t) {
      if (t.type === 'rparen') throw new CalcError('Parenthèse fermante en trop')
      throw new CalcError(`Élément inattendu : « ${t.value} »`)
    }
  }

  parseExpression(): number {
    let left = this.parseTerm()
    for (;;) {
      const t = this.peek()
      if (t?.type === 'op' && (t.value === '+' || t.value === '-')) {
        this.next()
        const right = this.parseTerm()
        left = t.value === '+' ? left + right : left - right
      } else {
        return left
      }
    }
  }

  private parseTerm(): number {
    let left = this.parseUnary()
    for (;;) {
      const t = this.peek()
      if (t?.type === 'op' && (t.value === '*' || t.value === '/')) {
        this.next()
        const right = this.parseUnary()
        if (t.value === '/') {
          if (right === 0) throw new CalcError('Division par zéro')
          left /= right
        } else {
          left *= right
        }
      } else if (t && (t.type === 'ident' || t.type === 'lparen')) {
        // Multiplication implicite : 2π, 2(3+4), (2)(3)
        left *= this.parseUnary()
      } else {
        return left
      }
    }
  }

  private parseUnary(): number {
    const t = this.peek()
    if (t?.type === 'op' && (t.value === '-' || t.value === '+')) {
      this.next()
      const v = this.parseUnary()
      return t.value === '-' ? -v : v
    }
    return this.parsePower()
  }

  private parsePower(): number {
    const base = this.parsePostfix()
    const t = this.peek()
    if (t?.type === 'op' && t.value === '^') {
      this.next()
      // Associatif à droite : 2^3^2 = 2^(3^2)
      const exponent = this.parseUnary()
      return base ** exponent
    }
    return base
  }

  private parsePostfix(): number {
    let value = this.parsePrimary()
    while (this.peek()?.type === 'op' && this.peek()?.value === '%') {
      this.next()
      value /= 100
    }
    return value
  }

  private parsePrimary(): number {
    const t = this.next()
    if (!t) throw new CalcError('Expression incomplète')

    if (t.type === 'number') {
      return parseFloat(t.value)
    }

    if (t.type === 'ident') {
      const constant = CONSTANTS[t.value]
      if (constant !== undefined) return constant
      const fn = FUNCTIONS[t.value]
      if (fn) {
        const open = this.next()
        if (!open || open.type !== 'lparen') {
          throw new CalcError(`Parenthèse attendue après « ${t.value} »`)
        }
        const arg = this.parseExpression()
        const close = this.next()
        if (!close || close.type !== 'rparen') {
          throw new CalcError('Parenthèse fermante manquante')
        }
        return fn(arg)
      }
      throw new CalcError(`Fonction inconnue : « ${t.value} »`)
    }

    if (t.type === 'lparen') {
      const value = this.parseExpression()
      const close = this.next()
      if (!close || close.type !== 'rparen') {
        throw new CalcError('Parenthèse fermante manquante')
      }
      return value
    }

    throw new CalcError(`Élément inattendu : « ${t.value} »`)
  }
}

/**
 * Évalue une expression mathématique et retourne le résultat.
 * @throws {CalcError} expression vide, syntaxe invalide, division par zéro,
 *                     domaine de fonction invalide, ou résultat non fini.
 */
export function evaluate(expression: string): number {
  const trimmed = expression.trim()
  if (!trimmed) throw new CalcError('Expression vide')
  const parser = new Parser(tokenize(trimmed))
  const value = parser.parseExpression()
  parser.expectEnd()
  if (Number.isNaN(value)) throw new CalcError('Résultat non défini')
  if (!Number.isFinite(value)) throw new CalcError('Résultat infini')
  return value
}
