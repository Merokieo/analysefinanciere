# Analyse Financière — Calculateur Web

Application statique pour GitHub Pages, faite uniquement avec HTML, CSS et JavaScript.

## Ce que le site calcule

- Bilan fonctionnel : FRNG, BFRE, BFRHE, BFR, trésorerie nette, contrôle `FRNG - BFR = TN`
- Bilan financier : fonds de roulement financier, liquidité générale, liquidité réduite, liquidité immédiate, autonomie financière, endettement
- SIG : marge commerciale, production, chiffre d'affaires, valeur ajoutée, EBE, résultat d'exploitation, résultat financier, RCAI, résultat non courant, résultat net
- CAF : calcul simple par la méthode additive
- Ratios : marge nette, taux d'EBE, taux de VA, ROE, ROA, rotation de l'actif, BFR en jours de CA, CAF / dettes
- Seuil de rentabilité : MCV, taux MCV, seuil, marge de sécurité, indice de sécurité, point mort
- Investissement : VAN, TRI, indice de profitabilité, délai de récupération
- Emprunt : tableau d'amortissement par annuités constantes ou amortissements constants
- Évolution sur 3 exercices : variations et taux d'évolution
- Export / import JSON, sauvegarde locale, impression

## Utilisation dans GitHub Codespaces

1. Crée un nouveau repository GitHub.
2. Ouvre-le dans Codespaces.
3. Ajoute ces fichiers à la racine du projet :
   - `index.html`
   - `styles.css`
   - `app.js`
   - `README.md`
4. Lance un serveur local si tu veux tester :

```bash
python3 -m http.server 8000
```

Puis ouvre le port 8000 dans Codespaces.

## Déploiement avec GitHub Pages

1. Push les fichiers sur la branche `main`.
2. Va dans `Settings` → `Pages`.
3. Dans `Build and deployment`, choisis `Deploy from a branch`.
4. Sélectionne `main` et le dossier `/root`.
5. Sauvegarde. GitHub Pages publiera le site.

## Modifier les formules

Toutes les formules sont dans `app.js` :

- `bilanFonctionnel()`
- `bilanFinancier()`
- `sig()`
- `seuilRentabilite()`
- `investissement()`
- `emprunt()`

Tu peux adapter les formules selon la méthode exacte donnée par ton professeur.

## Note importante

Les règles d'analyse financière peuvent changer selon le pays, l'école, le plan comptable, ou la méthode du professeur. Ce site sert de calculateur et support de révision. Vérifie toujours les retraitements exigés dans ton cours.
