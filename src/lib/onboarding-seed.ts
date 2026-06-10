import { db, createEmptyPage } from '../db'
import { createId } from './id'
import { COVER_COLORS } from '../types'
import type { Notebook, Page, Stroke } from '../types'

/** Marqueur utilisé pour retrouver/identifier le carnet d'exemple créé à l'onboarding. */
export const ONBOARDING_NOTEBOOK_NAME = 'Bienvenue dans Forma'

function buildIntroPage(notebookId: string): Page {
  const id = createId()
  return createEmptyPage({
    id,
    notebookId,
    order: 0,
    template: 'lined',
    rotation: 0,
    favorite: false,
    texts: [
      {
        id: createId(),
        x: 60,
        y: 60,
        width: 600,
        height: 260,
        content:
          'Bienvenue dans Forma !\n\n' +
          'Ceci est un carnet d’exemple pour vous aider à démarrer.\n\n' +
          '• Écrivez et dessinez avec les outils de la barre latérale (raccourcis : P stylo, ' +
          'H surligneur, E gomme, L lasso, T texte).\n' +
          '• Naviguez entre les pages avec Alt + flèches gauche/droite.\n' +
          '• Vos données restent en local sur votre appareil.\n\n' +
          'Vous pouvez supprimer ce carnet à tout moment depuis la bibliothèque.',
        fontSize: 18,
        color: '#1f2937',
        align: 'left',
        pageId: id,
      },
    ],
  })
}

function buildAnnotationPage(notebookId: string): Page {
  const id = createId()
  const stroke: Stroke = {
    id: createId(),
    tool: 'pen',
    color: '#2563eb',
    width: 3,
    opacity: 1,
    pageId: id,
    points: [
      { x: 100, y: 200, pressure: 0.5, timestamp: 0 },
      { x: 220, y: 140, pressure: 0.6, timestamp: 16 },
      { x: 340, y: 220, pressure: 0.5, timestamp: 32 },
      { x: 460, y: 150, pressure: 0.6, timestamp: 48 },
    ],
  }
  return createEmptyPage({
    id,
    notebookId,
    order: 1,
    template: 'blank',
    rotation: 0,
    favorite: false,
    strokes: [stroke],
    texts: [
      {
        id: createId(),
        x: 60,
        y: 40,
        width: 600,
        height: 100,
        content:
          'Exemple d’annotation : ce trait a été tracé avec l’outil stylo (P). ' +
          'Essayez le surligneur (H) ou les formes (Maj+S) pour annoter vos documents.',
        fontSize: 16,
        color: '#1f2937',
        align: 'left',
        pageId: id,
      },
    ],
  })
}

function buildAssistantPage(notebookId: string): Page {
  const id = createId()
  return createEmptyPage({
    id,
    notebookId,
    order: 2,
    template: 'lined',
    rotation: 0,
    favorite: false,
    texts: [
      {
        id: createId(),
        x: 60,
        y: 60,
        width: 600,
        height: 220,
        content:
          'Assistant IA contextuel\n\n' +
          'Un assistant peut vous aider directement dans l’éditeur : résumer une page, ' +
          'répondre à des questions sur vos notes ou générer des fiches de révision.\n\n' +
          'Ouvrez la palette de commandes avec Ctrl+K (ou /) pour le retrouver rapidement, ' +
          'ou cherchez l’icône dédiée dans la barre d’outils de l’éditeur.',
        fontSize: 18,
        color: '#1f2937',
        align: 'left',
        pageId: id,
      },
    ],
  })
}

/**
 * Crée un carnet d'exemple "Bienvenue dans Forma" avec quelques pages illustrant
 * les fonctionnalités principales (texte, annotation, assistant IA).
 *
 * @returns l'id du notebook créé.
 */
export async function seedExampleNotebook(): Promise<string> {
  const notebookId = createId()
  const now = Date.now()

  const notebook: Notebook = {
    id: notebookId,
    folderId: null,
    name: ONBOARDING_NOTEBOOK_NAME,
    coverColor: COVER_COLORS[4],
    paperTemplate: 'lined',
    orientation: 'portrait',
    type: 'notebook',
    createdAt: now,
    updatedAt: now,
    favorite: false,
  }

  const pages: Page[] = [
    buildIntroPage(notebookId),
    buildAnnotationPage(notebookId),
    buildAssistantPage(notebookId),
  ]

  await db.notebooks.add(notebook)
  for (const page of pages) {
    await db.pages.add(page)
  }

  return notebookId
}

/**
 * Crée le carnet d'exemple uniquement si la bibliothèque est vide.
 * Retourne l'id du notebook créé, ou `null` si rien n'a été créé.
 */
export async function seedExampleNotebookIfEmpty(): Promise<string | null> {
  const count = await db.notebooks.count()
  if (count > 0) return null
  return seedExampleNotebook()
}
