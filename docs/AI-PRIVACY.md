# IA & confidentialité (préparation 0.25.2)

**Statut** : panneaux UI existants (`AIPanel`, OCR) — **aucune API cloud branchée**.

## Principes

1. **Opt-in explicite** avant tout envoi réseau
2. **Jamais** d’upload automatique de carnets/pages
3. **Consentement** révocable dans Paramètres
4. **Journal local** des requêtes (sans contenu sensible si possible)
5. **Mode offline** : IA désactivée

## Données envoyées (futur, si opt-in)

| Feature | Entrée | Sortie | Stockage |
|---------|--------|--------|----------|
| OCR | image sélection/crop | texte | index recherche local |
| Résumé | texte extrait pages | markdown | panneau IA |
| Q/R | question + contexte limité | réponse | session |
| Flashcards | sélection Study | cartes CSV | Study DB |
| Transcription | blob audio | texte | audio.transcript |

## Points d’intégration code

- `AIPanel.tsx` — orchestration UI
- `OCRPanel.tsx` / `tesseract.js` — OCR **local** aujourd’hui
- `speech-transcribe.ts` — stub cloud
- `handwriting-index.ts` — index local

## Masquage

- Regex emails/téléphones avant log cloud (futur)
- Troncature contexte > N tokens

## Non objectifs 0.25.x

- Pas de clé OpenAI/Anthropic en `.env` prod
- Pas de RAG sur bibliothèque complète
