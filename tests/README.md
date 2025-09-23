# Tests de Performance et Smoke Tests

Ce dossier contient les tests de performance et les tests smoke pour l'application AccessGate PoC.

## Fichiers

- `performance.test.ts` - Tests de performance pour les temps de réponse et l'utilisation mémoire
- `smoke.test.ts` - Tests smoke pour vérifier le bon fonctionnement de l'application

## Tests de Performance

Les tests de performance vérifient :
- Temps de réponse des endpoints API (< 100-200ms)
- Gestion des requêtes concurrentes
- Utilisation mémoire (pas de fuites)

## Tests Smoke

Les tests smoke vérifient :
- Démarrage de l'application sans erreurs
- Fonctionnement des endpoints principaux
- Gestion des erreurs
- Headers de sécurité et CORS

## Exécution

```bash
# Depuis le dossier backend
npm test -- --testPathPatterns="performance|smoke"
```
