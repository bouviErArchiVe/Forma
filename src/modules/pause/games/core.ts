/**
 * Pause V2 — moteur commun des mini-jeux.
 *
 * Chaque jeu est une définition pure : init / update / draw. L'hôte
 * (GameCanvas) gère la boucle rAF, la pause, le restart, les entrées et
 * le score. Les fonctions update sont déterministes par rapport à
 * (état, dt, entrées) — testables sans canvas.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InputState {
  /** Touches maintenues (codes KeyboardEvent.code). */
  keys: Set<string>
  /** Touches pressées depuis la dernière frame. */
  justPressed: Set<string>
  /** Position X du pointeur dans le canvas (px logiques), null si dehors. */
  pointerX: number | null
  /** Clic/tap depuis la dernière frame. */
  tapped: boolean
}

export interface GameColors {
  fg: string
  muted: string
  accent: string
  danger: string
  bg: string
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface GameDef<S = any> {
  id: string
  name: string
  description: string
  /** Conseil de commande affiché sous le canvas. */
  controls: string
  init(w: number, h: number): S
  /** Avance la simulation ; muter `s` est permis. dt en secondes (borné). */
  update(s: S, dt: number, input: InputState, w: number, h: number): void
  draw(ctx: CanvasRenderingContext2D, s: S, w: number, h: number, colors: GameColors): void
  /** Score courant + état de fin. */
  score(s: S): number
  isGameOver(s: S): boolean
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Met à jour la table des meilleurs scores (retourne la même réf si inchangé). */
export function updateBestScore(
  best: Record<string, number>,
  gameId: string,
  score: number,
): Record<string, number> {
  if (score <= (best[gameId] ?? 0)) return best
  return { ...best, [gameId]: score }
}

// ─── Snake ────────────────────────────────────────────────────────────────────

export interface SnakeState {
  grid: number
  snake: { x: number; y: number }[]
  dir: { x: number; y: number }
  nextDir: { x: number; y: number }
  food: { x: number; y: number }
  acc: number
  interval: number
  score: number
  over: boolean
}

function placeFood(s: SnakeState): void {
  let x = 0
  let y = 0
  do {
    x = Math.floor(Math.random() * s.grid)
    y = Math.floor(Math.random() * s.grid)
  } while (s.snake.some((c) => c.x === x && c.y === y))
  s.food = { x, y }
}

/** Un pas de simulation Snake (exporté pour les tests). */
export function advanceSnake(s: SnakeState): void {
  s.dir = s.nextDir
  const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y }
  // murs = fin de partie
  if (head.x < 0 || head.y < 0 || head.x >= s.grid || head.y >= s.grid) {
    s.over = true
    return
  }
  if (s.snake.some((c) => c.x === head.x && c.y === head.y)) {
    s.over = true
    return
  }
  s.snake.unshift(head)
  if (head.x === s.food.x && head.y === s.food.y) {
    s.score += 10
    s.interval = Math.max(0.06, s.interval * 0.96) // accélération douce
    placeFood(s)
  } else {
    s.snake.pop()
  }
}

export const SNAKE: GameDef<SnakeState> = {
  id: 'snake',
  name: 'Snake',
  description: 'Mangez les pastilles, évitez murs et queue.',
  controls: 'Flèches ou WASD',
  init() {
    const s: SnakeState = {
      grid: 20,
      snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 14, y: 10 },
      acc: 0,
      interval: 0.14,
      score: 0,
      over: false,
    }
    return s
  },
  update(s, dt, input) {
    if (s.over) return
    const want =
      input.keys.has('ArrowUp') || input.keys.has('KeyW') ? { x: 0, y: -1 }
      : input.keys.has('ArrowDown') || input.keys.has('KeyS') ? { x: 0, y: 1 }
      : input.keys.has('ArrowLeft') || input.keys.has('KeyA') ? { x: -1, y: 0 }
      : input.keys.has('ArrowRight') || input.keys.has('KeyD') ? { x: 1, y: 0 }
      : null
    if (want && !(want.x === -s.dir.x && want.y === -s.dir.y)) s.nextDir = want
    s.acc += dt
    while (s.acc >= s.interval && !s.over) {
      s.acc -= s.interval
      advanceSnake(s)
    }
  },
  draw(ctx, s, w, h, colors) {
    const cell = Math.min(w, h) / s.grid
    const ox = (w - cell * s.grid) / 2
    ctx.strokeStyle = colors.muted
    ctx.globalAlpha = 0.25
    ctx.strokeRect(ox, 0, cell * s.grid, cell * s.grid)
    ctx.globalAlpha = 1
    ctx.fillStyle = colors.danger
    ctx.beginPath()
    ctx.arc(ox + (s.food.x + 0.5) * cell, (s.food.y + 0.5) * cell, cell * 0.35, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = colors.accent
    for (const c of s.snake) {
      ctx.fillRect(ox + c.x * cell + 1, c.y * cell + 1, cell - 2, cell - 2)
    }
  },
  score: (s) => s.score,
  isGameOver: (s) => s.over,
}

// ─── Pong (solo contre IA) ────────────────────────────────────────────────────

interface PongState {
  ballX: number; ballY: number; vx: number; vy: number
  playerY: number; aiY: number
  lives: number; score: number; over: boolean
}

export const PONG: GameDef<PongState> = {
  id: 'pong',
  name: 'Ping-Pong',
  description: 'Renvoyez la balle, l’IA défend l’autre camp.',
  controls: 'Souris ou flèches ↑↓',
  init(w, h) {
    return { ballX: w / 2, ballY: h / 2, vx: 220, vy: 140, playerY: h / 2, aiY: h / 2, lives: 3, score: 0, over: false }
  },
  update(s, dt, input, w, h) {
    if (s.over) return
    const PH = 70
    if (input.pointerX !== null) {
      // pointeur vertical : on mappe X→Y serait absurde ; on suit la souris en Y via pointerX réutilisé ?
    }
    if (input.keys.has('ArrowUp') || input.keys.has('KeyW')) s.playerY -= 320 * dt
    if (input.keys.has('ArrowDown') || input.keys.has('KeyS')) s.playerY += 320 * dt
    s.playerY = Math.max(PH / 2, Math.min(h - PH / 2, s.playerY))
    // IA simple : suit la balle avec retard
    s.aiY += Math.sign(s.ballY - s.aiY) * Math.min(200 * dt, Math.abs(s.ballY - s.aiY))
    s.ballX += s.vx * dt
    s.ballY += s.vy * dt
    if (s.ballY < 6 || s.ballY > h - 6) s.vy = -s.vy
    // raquette joueur (gauche)
    if (s.ballX < 18 && Math.abs(s.ballY - s.playerY) < PH / 2 && s.vx < 0) {
      s.vx = -s.vx * 1.04
      s.vy += (s.ballY - s.playerY) * 3
      s.score += 1
    }
    // raquette IA (droite)
    if (s.ballX > w - 18 && Math.abs(s.ballY - s.aiY) < PH / 2 && s.vx > 0) s.vx = -s.vx
    if (s.ballX < 0) {
      s.lives -= 1
      if (s.lives <= 0) { s.over = true; return }
      s.ballX = w / 2; s.ballY = h / 2; s.vx = 220; s.vy = 140
    }
    if (s.ballX > w) { s.ballX = w / 2; s.vx = -220 }
  },
  draw(ctx, s, w, h, colors) {
    ctx.setLineDash([4, 6])
    ctx.strokeStyle = colors.muted
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = colors.accent
    ctx.fillRect(10, s.playerY - 35, 6, 70)
    ctx.fillStyle = colors.muted
    ctx.fillRect(w - 16, s.aiY - 35, 6, 70)
    ctx.fillStyle = colors.fg
    ctx.beginPath(); ctx.arc(s.ballX, s.ballY, 6, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = colors.muted
    ctx.font = '11px sans-serif'
    ctx.fillText(`Vies : ${s.lives}`, 12, 14)
  },
  score: (s) => s.score,
  isGameOver: (s) => s.over,
}

// ─── Breakout ─────────────────────────────────────────────────────────────────

interface Brick { x: number; y: number; w: number; h: number; alive: boolean }
interface BreakoutState {
  bricks: Brick[]; ballX: number; ballY: number; vx: number; vy: number
  paddleX: number; lives: number; score: number; over: boolean; won: boolean
}

export const BREAKOUT: GameDef<BreakoutState> = {
  id: 'breakout',
  name: 'Breakout',
  description: 'Cassez toutes les briques sans perdre la balle.',
  controls: 'Souris ou flèches ←→',
  init(w, h) {
    const bricks: Brick[] = []
    const cols = 8
    const rows = 4
    const bw = (w - 20) / cols
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({ x: 10 + c * bw, y: 30 + r * 18, w: bw - 4, h: 14, alive: true })
      }
    }
    return { bricks, ballX: w / 2, ballY: h - 60, vx: 180, vy: -220, paddleX: w / 2, lives: 3, score: 0, over: false, won: false }
  },
  update(s, dt, input, w, h) {
    if (s.over) return
    const PW = 70
    if (input.pointerX !== null) s.paddleX = input.pointerX
    if (input.keys.has('ArrowLeft')) s.paddleX -= 360 * dt
    if (input.keys.has('ArrowRight')) s.paddleX += 360 * dt
    s.paddleX = Math.max(PW / 2, Math.min(w - PW / 2, s.paddleX))
    s.ballX += s.vx * dt
    s.ballY += s.vy * dt
    if (s.ballX < 6 || s.ballX > w - 6) s.vx = -s.vx
    if (s.ballY < 6) s.vy = -s.vy
    // raquette
    if (s.ballY > h - 18 && Math.abs(s.ballX - s.paddleX) < PW / 2 && s.vy > 0) {
      s.vy = -s.vy
      s.vx += (s.ballX - s.paddleX) * 4
    }
    // briques
    for (const b of s.bricks) {
      if (!b.alive) continue
      if (s.ballX > b.x && s.ballX < b.x + b.w && s.ballY > b.y && s.ballY < b.y + b.h) {
        b.alive = false
        s.vy = -s.vy
        s.score += 5
        break
      }
    }
    if (s.bricks.every((b) => !b.alive)) { s.won = true; s.over = true }
    if (s.ballY > h) {
      s.lives -= 1
      if (s.lives <= 0) { s.over = true; return }
      s.ballX = w / 2; s.ballY = h - 60; s.vx = 180; s.vy = -220
    }
  },
  draw(ctx, s, w, h, colors) {
    for (const b of s.bricks) {
      if (!b.alive) continue
      ctx.fillStyle = colors.accent
      ctx.fillRect(b.x, b.y, b.w, b.h)
    }
    ctx.fillStyle = colors.fg
    ctx.fillRect(s.paddleX - 35, h - 14, 70, 8)
    ctx.beginPath(); ctx.arc(s.ballX, s.ballY, 6, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = colors.muted
    ctx.font = '11px sans-serif'
    ctx.fillText(`Vies : ${s.lives}`, 12, 14)
    if (s.won) {
      ctx.fillStyle = colors.accent
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Gagné !', w / 2, h / 2)
      ctx.textAlign = 'left'
    }
  },
  score: (s) => s.score,
  isGameOver: (s) => s.over,
}

// ─── Ball Bounce ──────────────────────────────────────────────────────────────

interface BounceState {
  ballX: number; ballY: number; vx: number; vy: number
  paddleX: number; time: number; speed: number; score: number; over: boolean
}

export const BOUNCE: GameDef<BounceState> = {
  id: 'bounce',
  name: 'Ball Bounce',
  description: 'Gardez la balle en jeu le plus longtemps possible.',
  controls: 'Souris ou flèches ←→',
  init(w, h) {
    return { ballX: w / 2, ballY: h / 3, vx: 160, vy: 200, paddleX: w / 2, time: 0, speed: 1, score: 0, over: false }
  },
  update(s, dt, input, w, h) {
    if (s.over) return
    const PW = 80
    if (input.pointerX !== null) s.paddleX = input.pointerX
    if (input.keys.has('ArrowLeft')) s.paddleX -= 380 * dt
    if (input.keys.has('ArrowRight')) s.paddleX += 380 * dt
    s.paddleX = Math.max(PW / 2, Math.min(w - PW / 2, s.paddleX))
    s.time += dt
    s.speed = 1 + s.time / 30
    s.score = Math.floor(s.time * 10)
    s.ballX += s.vx * s.speed * dt
    s.ballY += s.vy * s.speed * dt
    if (s.ballX < 7 || s.ballX > w - 7) s.vx = -s.vx
    if (s.ballY < 7) s.vy = -s.vy
    if (s.ballY > h - 20 && Math.abs(s.ballX - s.paddleX) < PW / 2 && s.vy > 0) {
      s.vy = -s.vy
      s.vx += (s.ballX - s.paddleX) * 2.5
    }
    if (s.ballY > h) s.over = true
  },
  draw(ctx, s, _w, h, colors) {
    ctx.fillStyle = colors.fg
    ctx.fillRect(s.paddleX - 40, h - 14, 80, 8)
    ctx.fillStyle = colors.accent
    ctx.beginPath(); ctx.arc(s.ballX, s.ballY, 7, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = colors.muted
    ctx.font = '11px sans-serif'
    ctx.fillText(`Vitesse ×${s.speed.toFixed(1)}`, 12, 14)
  },
  score: (s) => s.score,
  isGameOver: (s) => s.over,
}

// ─── Mini Run ─────────────────────────────────────────────────────────────────

interface Obstacle { x: number; w: number; h: number }
interface RunnerState {
  y: number; vy: number; grounded: boolean
  obstacles: Obstacle[]; speed: number; dist: number
  spawnIn: number; score: number; over: boolean
}

export const RUNNER: GameDef<RunnerState> = {
  id: 'runner',
  name: 'Mini Run',
  description: 'Sautez par-dessus les obstacles, la vitesse augmente.',
  controls: 'Espace, ↑ ou clic pour sauter',
  init() {
    return { y: 0, vy: 0, grounded: true, obstacles: [], speed: 220, dist: 0, spawnIn: 1.2, score: 0, over: false }
  },
  update(s, dt, input, w, h) {
    if (s.over) return
    const groundY = h - 24
    const jump = input.justPressed.has('Space') || input.justPressed.has('ArrowUp') || input.tapped
    if (jump && s.grounded) {
      s.vy = -520
      s.grounded = false
    }
    s.vy += 1400 * dt
    s.y += s.vy * dt
    if (s.y >= 0) { s.y = 0; s.vy = 0; s.grounded = true }
    s.speed += 6 * dt
    s.dist += s.speed * dt
    s.score = Math.floor(s.dist / 10)
    s.spawnIn -= dt
    if (s.spawnIn <= 0) {
      s.obstacles.push({ x: w + 20, w: 14 + Math.random() * 14, h: 20 + Math.random() * 26 })
      s.spawnIn = 0.9 + Math.random() * 0.9 - Math.min(0.5, s.dist / 8000)
    }
    for (const o of s.obstacles) o.x -= s.speed * dt
    s.obstacles = s.obstacles.filter((o) => o.x + o.w > -10)
    // collision (le coureur est à x=40, taille 18×26, posé sur le sol + s.y)
    const px = 40
    const py = groundY + s.y - 26
    for (const o of s.obstacles) {
      const oy = groundY - o.h
      if (px + 18 > o.x && px < o.x + o.w && py + 26 > oy) {
        s.over = true
        break
      }
    }
  },
  draw(ctx, s, w, h, colors) {
    const groundY = h - 24
    ctx.strokeStyle = colors.muted
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke()
    ctx.fillStyle = colors.accent
    ctx.fillRect(40, groundY + s.y - 26, 18, 26)
    ctx.fillStyle = colors.danger
    for (const o of s.obstacles) ctx.fillRect(o.x, groundY - o.h, o.w, o.h)
  },
  score: (s) => s.score,
  isGameOver: (s) => s.over,
}

export const GAMES: GameDef[] = [RUNNER, SNAKE, PONG, BOUNCE, BREAKOUT]
