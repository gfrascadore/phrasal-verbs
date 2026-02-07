# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



📘 Manuale Sviluppo App React + Tailwind su GitHub Pages

PARTE 1: Creazione e Configurazione (Una Tantum)
Questi passaggi servono solo quando crei un nuovo progetto da zero.

1. Creazione Scheletro
Bash
npm create vite@latest nome-progetto -- --template react
cd nome-progetto
npm install
2. Installazione Dipendenze (Il "Fix" Cruciale)
Per evitare errori di compilazione e problemi con npx, installiamo specificamente la versione 3 di Tailwind.

Bash
# Grafica (Versione 3 stabile)
npm install -D tailwindcss@3.4.17 postcss autoprefixer

# Icone
npm install lucide-react

# Tool per pubblicare online
npm install gh-pages --save-dev
3. Creazione Manuale Configurazione (Piano B - Infallibile)
Invece di usare comandi automatici che possono fallire, crea manualmente questi due file nella cartella principale del progetto:

File postcss.config.js:

JavaScript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
File tailwind.config.js:

JavaScript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
4. Collegamento Codice
src/index.css: Cancella tutto e incolla:

CSS
@tailwind base;
@tailwind components;
@tailwind utilities;
src/App.jsx: Incolla qui tutto il codice dell'applicazione.

5. Configurazione GitHub Pages
vite.config.js: Aggiungi la base (deve corrispondere al nome del repo su GitHub):

JavaScript
base: '/nome-repository/',
package.json:

Aggiungi: "homepage": "https://TUO_UTENTE.github.io/nome-repository",

Aggiungi in scripts:

JSON
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
PARTE 2: Il Problema Risolto (Perché abbiamo fatto così?)
Durante il processo abbiamo incontrato l'errore:

"could not determine executable" oppure "PostCSS plugin has moved"

La Causa: npm installava di default l'ultimissima versione di Tailwind (v4.0+), che ha cambiato radicalmente struttura e non usa più i file di configurazione classici. La Soluzione: Abbiamo forzato l'installazione di Tailwind v3.4.17 e creato i file di configurazione a mano. Questo ha garantito stabilità e compatibilità.

# PARTE 3: Routine di Aggiornamento (Da fare sempre)
Ogni volta che vuoi modificare l'app (cambiare un colore, aggiungere un verbo, correggere un testo), segui SOLO questi 4 passaggi.

Modifica e Salva: Fai le modifiche ai file (es. src/App.jsx) e salva. (Opzionale: controlla con npm run dev che tutto funzioni).

Prepara le modifiche:

Bash
git add .
Registra le modifiche (Commit):

Bash
git commit -m "Descrizione della modifica fatta"
Pubblica tutto:

Bash
git push       # Salva il codice sorgente su GitHub
npm run deploy # Aggiorna il sito web pubblico
Finito. Dopo circa 2 minuti dal comando deploy, il tuo sito sarà aggiornato per tutti gli utenti.
