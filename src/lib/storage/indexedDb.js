/** IndexedDB bas niveau — Forma */

const DB_NAME = 'forma-storage'
const DB_VERSION = 2

let dbPromise = null

function openDb() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB indisponible'))
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = (ev) => {
        const db = ev.target.result
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'key' })
        if (!db.objectStoreNames.contains('pages')) db.createObjectStore('pages', { keyPath: 'notebookId' })
        if (!db.objectStoreNames.contains('offline_queue')) db.createObjectStore('offline_queue', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('versions')) db.createObjectStore('versions', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('journal')) db.createObjectStore('journal', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs', { keyPath: 'id' })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error || new Error('IndexedDB open failed'))
    })
  }
  return dbPromise
}

function tx(storeName, mode = 'readonly') {
  return openDb().then((db) => {
    const transaction = db.transaction(storeName, mode)
    return transaction.objectStore(storeName)
  })
}

export function idbAvailable() {
  return typeof indexedDB !== 'undefined'
}

export async function idbPut(storeName, record) {
  const store = await tx(storeName, 'readwrite')
  return new Promise((resolve, reject) => {
    const req = store.put(record)
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

export async function idbGet(storeName, key) {
  const store = await tx(storeName, 'readonly')
  return new Promise((resolve, reject) => {
    const req = store.get(key)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function idbDelete(storeName, key) {
  const store = await tx(storeName, 'readwrite')
  return new Promise((resolve, reject) => {
    const req = store.delete(key)
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

export async function idbGetAll(storeName) {
  const store = await tx(storeName, 'readonly')
  return new Promise((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

export async function idbClear(storeName) {
  const store = await tx(storeName, 'readwrite')
  return new Promise((resolve, reject) => {
    const req = store.clear()
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

export const IDB_STORES = {
  kv: 'kv',
  pages: 'pages',
  offline_queue: 'offline_queue',
  versions: 'versions',
  journal: 'journal',
  blobs: 'blobs',
}
