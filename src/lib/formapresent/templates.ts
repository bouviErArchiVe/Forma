import type { FormaPresentTemplateId } from '../../types'
import { createDeck, createElement, createSlide } from './model'

function titleSlide(title: string, subtitle: string, bg = '#1a1e28', fg = '#ffffff') {
  return createSlide({
    name: 'Titre',
    bgColor: bg,
    transition: 'fade',
    notes: 'Introduisez le projet et votre nom.',
    elements: [
      createElement('text', {
        x: 120,
        y: 380,
        w: 1680,
        h: 120,
        content: title,
        fontSize: 72,
        color: fg,
        align: 'center',
        bold: true,
      }),
      createElement('text', {
        x: 120,
        y: 520,
        w: 1680,
        h: 80,
        content: subtitle,
        fontSize: 36,
        color: `${fg}cc`,
        align: 'center',
      }),
    ],
  })
}

function contentSlide(title: string, body: string, notes = '') {
  return createSlide({
    name: title.slice(0, 24),
    bgColor: '#ffffff',
    notes,
    elements: [
      createElement('text', {
        x: 80,
        y: 60,
        w: 1760,
        h: 80,
        content: title,
        fontSize: 52,
        color: '#1a1a1a',
        bold: true,
      }),
      createElement('text', {
        x: 80,
        y: 180,
        w: 900,
        h: 800,
        content: body,
        fontSize: 28,
        color: '#333',
        align: 'left',
      }),
    ],
  })
}

function imageSlide(name: string, notes = '') {
  return createSlide({
    name,
    bgColor: '#f5f5f5',
    notes,
    elements: [
      createElement('text', {
        x: 80,
        y: 40,
        w: 800,
        h: 60,
        content: name,
        fontSize: 40,
        color: '#1a1a1a',
        bold: true,
      }),
      createElement('image', { x: 80, y: 140, w: 1760, h: 880, dataUrl: null }),
    ],
  })
}

export function buildTemplate(
  templateId: FormaPresentTemplateId,
  title = 'Présentation',
) {
  switch (templateId) {
    case 'architecture':
      return createDeck(title, {
        template: 'architecture',
        slides: [
          titleSlide(title, 'Projet architectural — S1 2026', '#2c3e50'),
          contentSlide(
            'Contexte & site',
            '• Localisation\n• Contraintes urbaines\n• Enjeux du programme\n• Analyse du terrain',
            'Décrire le contexte du projet.',
          ),
          contentSlide(
            'Concept',
            '• Idée directrice\n• Inspiration\n• Parti pris spatial',
            'Expliquer le concept en 2-3 minutes.',
          ),
          imageSlide('Plans & coupes', 'Commenter les plans et les coupes principales.'),
          imageSlide('Perspectives & rendus', 'Montrer les vues 3D et ambiances.'),
          contentSlide(
            'Matériaux & détails',
            '• Palette matériaux\n• Détails constructifs\n• Durabilité',
            'Focus sur les choix matériaux.',
          ),
          titleSlide('Merci', 'Questions ?', '#2c3e50'),
        ],
      })
    case 'portfolio':
      return createDeck(title, {
        template: 'portfolio',
        slides: [
          titleSlide(title, 'Portfolio — Architecture & Design', '#111827', '#f9fafb'),
          imageSlide('Projet 01'),
          imageSlide('Projet 02'),
          imageSlide('Projet 03'),
          contentSlide('Compétences', '• Conception\n• Modélisation 3D\n• Dessin technique'),
          titleSlide('Contact', 'portfolio@email.com', '#111827', '#f9fafb'),
        ],
      })
    case 'jury':
      return createDeck(title, {
        template: 'jury',
        slides: [
          titleSlide(title, 'Soutenance jury', '#4a1942', '#fce4ec'),
          contentSlide('Problématique', '• Question de recherche\n• Hypothèses\n• Méthodologie'),
          contentSlide('État de l\'art', '• Références\n• Précédents\n• Positionnement'),
          imageSlide('Proposition'),
          titleSlide('Merci', 'Questions & discussion', '#4a1942', '#fce4ec'),
        ],
      })
    case 'scolaire':
      return createDeck(title, {
        template: 'scolaire',
        slides: [
          titleSlide(title, 'Présentation scolaire', '#1e3a5f', '#e3f2fd'),
          contentSlide('Introduction', '• Sujet\n• Objectifs\n• Plan'),
          contentSlide('Développement', '• Point clé 1\n• Point clé 2'),
          contentSlide('Conclusion', '• Synthèse\n• Remerciements'),
        ],
      })
    case 'concept':
      return createDeck(title, {
        template: 'concept',
        slides: [
          createSlide({
            name: 'Planche concept',
            bgColor: '#fafafa',
            notes: 'Planche concept — vue d\'ensemble.',
            elements: [
              createElement('text', {
                x: 60,
                y: 40,
                w: 600,
                h: 60,
                content: title,
                fontSize: 44,
                bold: true,
                color: '#111',
              }),
              createElement('image', { x: 60, y: 120, w: 900, h: 900, dataUrl: null }),
              createElement('image', { x: 980, y: 120, w: 420, h: 420, dataUrl: null }),
              createElement('text', {
                x: 1420,
                y: 120,
                w: 440,
                h: 860,
                content: 'Concept\n\n• Idée\n• Matériaux\n• Lumière',
                fontSize: 24,
                color: '#333',
              }),
            ],
          }),
        ],
      })
    case 'blank':
    default:
      return createDeck(title, { template: 'blank' })
  }
}
