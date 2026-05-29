/**
 * File d'attente miniatures — concurrence limitée, priorité, cache mémoire.
 */

type Job = {
  id: string
  priority: number
  run: () => Promise<string>
  resolve: (url: string) => void
  reject: (reason: unknown) => void
  waiters: Array<{ resolve: (url: string) => void; reject: (reason: unknown) => void }>
}

export class ThumbQueue {
  private readonly maxConcurrent: number
  private queue: Job[] = []
  private running = 0
  private runningIds = new Set<string>()
  private cache = new Map<string, string>()
  private stale = new Set<string>()
  private inflight = new Map<string, Promise<string>>()

  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent
  }

  peek(id: string): string | undefined {
    if (this.stale.has(id)) return undefined
    return this.cache.get(id)
  }

  invalidate(id: string): void {
    this.cache.delete(id)
    this.stale.add(id)
    const dropped = this.queue.filter((j) => j.id === id)
    this.queue = this.queue.filter((j) => j.id !== id)
    for (const j of dropped) this.rejectJob(j, new Error('thumb_cancelled'))
    this.inflight.delete(id)
  }

  invalidateMany(ids: string[]): void {
    for (const id of ids) this.invalidate(id)
  }

  clear(): void {
    this.queue = []
    this.cache.clear()
    this.stale.clear()
    this.inflight.clear()
    this.runningIds.clear()
  }

  private scheduled = false

  enqueue(id: string, priority: number, run: () => Promise<string>): Promise<string> {
    const hit = this.peek(id)
    if (hit) return Promise.resolve(hit)

    const existingInflight = this.inflight.get(id)
    if (existingInflight) {
      this.bumpQueuedPriority(id, priority)
      return existingInflight
    }

    this.stale.delete(id)

    const queued = this.queue.find((j) => j.id === id)
    if (queued) {
      if (priority > queued.priority) {
        queued.priority = priority
        this.reinsert(queued)
      }
      return new Promise((resolve, reject) => {
        queued.waiters.push({ resolve, reject })
      })
    }

    const promise = new Promise<string>((resolve, reject) => {
      this.insertByPriority({ id, priority, run, resolve, reject, waiters: [] })
      this.schedulePump()
    })
    this.inflight.set(id, promise)
    void promise.finally(() => {
      if (this.inflight.get(id) === promise) this.inflight.delete(id)
    })
    return promise
  }

  private bumpQueuedPriority(id: string, priority: number): void {
    const job = this.queue.find((j) => j.id === id)
    if (job && priority > job.priority) {
      job.priority = priority
      this.reinsert(job)
    }
  }

  private insertByPriority(job: Job): void {
    let i = 0
    while (i < this.queue.length && this.queue[i].priority >= job.priority) i++
    this.queue.splice(i, 0, job)
  }

  private reinsert(job: Job): void {
    const idx = this.queue.indexOf(job)
    if (idx >= 0) this.queue.splice(idx, 1)
    this.insertByPriority(job)
  }

  private schedulePump(): void {
    if (this.scheduled) return
    this.scheduled = true
    queueMicrotask(() => {
      this.scheduled = false
      this.pump()
    })
  }

  get pendingCount(): number {
    return this.queue.length + this.running
  }

  get cacheSize(): number {
    return this.cache.size
  }

  private rejectJob(job: Job, reason: unknown): void {
    job.reject(reason)
    for (const w of job.waiters) w.reject(reason)
  }

  private resolveJob(job: Job, url: string): void {
    job.resolve(url)
    for (const w of job.waiters) w.resolve(url)
  }

  private pump(): void {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const job = this.queue.shift()!
      this.running++
      this.runningIds.add(job.id)
      void job
        .run()
        .then((url) => {
          if (this.stale.has(job.id)) {
            this.rejectJob(job, new Error('thumb_stale'))
            return
          }
          this.cache.set(job.id, url)
          this.resolveJob(job, url)
        })
        .catch((err) => this.rejectJob(job, err))
        .finally(() => {
          this.running--
          this.runningIds.delete(job.id)
          this.stale.delete(job.id)
          this.pump()
        })
    }
  }
}

/** Miniatures sidebar éditeur. */
export const sidebarThumbQueue = new ThumbQueue(2)

/** Couvertures carnets bibliothèque. */
export const libraryThumbQueue = new ThumbQueue(1)

export const THUMB_PRIORITY = {
  active: 100,
  visible: 40,
  background: 5,
} as const
