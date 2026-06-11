import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db'
import {
  addMemory,
  buildMemoryContext,
  clearMemories,
  deleteMemory,
  getRelevantMemories,
  listMemories,
  MEMORY_CONTENT_MAX_LENGTH,
} from './memory'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

beforeEach(async () => {
  await resetDb()
})

describe('addMemory', () => {
  it('crée une entrée avec les valeurs par défaut (source manual, importance 1)', async () => {
    const entry = await addMemory('Préfère les explications avec des exemples')

    expect(entry.id).toBeTruthy()
    expect(entry.content).toBe('Préfère les explications avec des exemples')
    expect(entry.tags).toEqual([])
    expect(entry.importance).toBe(1)
    expect(entry.source).toBe('manual')
    expect(typeof entry.createdAt).toBe('number')

    expect(await db.aiMemory.get(entry.id)).toEqual(entry)
  })

  it('tronque le contenu à 500 caractères', async () => {
    const entry = await addMemory('x'.repeat(800))
    expect(entry.content.length).toBe(MEMORY_CONTENT_MAX_LENGTH)
    expect(entry.content).toBe('x'.repeat(500))
  })

  it('respecte tags, importance et source fournis', async () => {
    const entry = await addMemory('Niveau BTS comptabilité', {
      tags: ['bts', 'compta'],
      importance: 3,
      source: 'auto',
    })
    expect(entry.tags).toEqual(['bts', 'compta'])
    expect(entry.importance).toBe(3)
    expect(entry.source).toBe('auto')
  })
})

describe('listMemories', () => {
  it('retourne les entrées triées par createdAt décroissant', async () => {
    const a = await addMemory('Ancienne')
    const b = await addMemory('Récente')
    // createdAt déterministes (Date.now() peut produire des égalités).
    await db.aiMemory.update(a.id, { createdAt: 1000 })
    await db.aiMemory.update(b.id, { createdAt: 2000 })

    const list = await listMemories()
    expect(list.map((m) => m.id)).toEqual([b.id, a.id])
  })
})

describe('deleteMemory / clearMemories', () => {
  it('supprime une entrée puis vide la table', async () => {
    const a = await addMemory('À supprimer')
    await addMemory('À garder')

    await deleteMemory(a.id)
    expect(await db.aiMemory.count()).toBe(1)

    await clearMemories()
    expect(await db.aiMemory.count()).toBe(0)
  })
})

describe('getRelevantMemories', () => {
  it('retourne les entrées avec match lexical, formatées [MEM:tags] contenu', async () => {
    await addMemory('Étudiant en BTS comptabilité, préfère les tableaux', {
      tags: ['profil', 'compta'],
    })
    await addMemory('Aime le football le week-end', { tags: ['loisirs'] })

    const memories = await getRelevantMemories('Aide-moi en comptabilité avec des tableaux')

    expect(memories).toHaveLength(1)
    expect(memories[0]).toBe('[MEM:profil,compta] Étudiant en BTS comptabilité, préfère les tableaux')
  })

  it('n’inclut pas une entrée sans aucun match lexical, même très importante', async () => {
    await addMemory('Adore la cuisine italienne', { importance: 10 })

    const memories = await getRelevantMemories('Explique-moi la photosynthèse')
    expect(memories).toEqual([])
  })

  it('trie par score décroissant (termes + tags + importance)', async () => {
    // Match faible : un seul terme (+2) + importance 1 = 3.
    await addMemory('Un seul mot : comptabilité', { tags: [] })
    // Match fort : terme (+2), tag "comptabilité" présent dans la requête (+1), importance 3.
    await addMemory('Bilan de comptabilité générale', {
      tags: ['comptabilité'],
      importance: 3,
    })

    const memories = await getRelevantMemories('Révision comptabilité bilan')
    expect(memories).toHaveLength(2)
    expect(memories[0]).toBe('[MEM:comptabilité] Bilan de comptabilité générale')
    expect(memories[1]).toBe('[MEM] Un seul mot : comptabilité')
  })

  it('compte +1 par tag présent dans la requête', async () => {
    // Aucun terme du contenu ne matche, mais le tag est dans la requête → retenu.
    await addMemory('Préférence de présentation : schémas', { tags: ['svt'] })

    const memories = await getRelevantMemories('quiz svt')
    expect(memories).toHaveLength(1)
    expect(memories[0]).toContain('[MEM:svt]')
  })

  it('plafonne le score des termes à +6 (limit respecté)', async () => {
    // Quatre termes matchent mais le score lexical plafonne à 6 ; importance départage.
    await addMemory('alpha beta gamma delta', { importance: 1 })
    await addMemory('alpha beta gamma delta epsilon', { importance: 2 })
    await addMemory('alpha seulement ici', { importance: 1 })

    const memories = await getRelevantMemories('alpha beta gamma delta', 2)
    expect(memories).toHaveLength(2)
    // Les deux premières sont à +6 de termes ; l'importance 2 passe devant.
    expect(memories[0]).toBe('[MEM] alpha beta gamma delta epsilon')
    expect(memories[1]).toBe('[MEM] alpha beta gamma delta')
  })
})

describe('buildMemoryContext', () => {
  it('construit le bloc [MÉMOIRE LOCALE] avec les entrées pertinentes', async () => {
    await addMemory('Étudiant en droit, niveau licence', { tags: ['profil'] })

    const context = await buildMemoryContext('Résume ce cours de droit')
    expect(context.startsWith('[MÉMOIRE LOCALE]\n')).toBe(true)
    expect(context).toContain('[MEM:profil] Étudiant en droit, niveau licence')
  })

  it('retourne une chaîne vide si aucun match', async () => {
    await addMemory('Adore la randonnée', { importance: 5 })

    const context = await buildMemoryContext('Explique les fractions')
    expect(context).toBe('')
  })

  it('retourne une chaîne vide si la mémoire est vide', async () => {
    expect(await buildMemoryContext('nimporte quoi')).toBe('')
  })
})
