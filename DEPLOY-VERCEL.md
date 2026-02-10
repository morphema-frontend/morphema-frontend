# Deploy Vercel (morphema.app)

## Prerequisiti
- Repo frontend collegato a Vercel.
- Accesso al dominio `morphema.app`.

## Variabili ambiente (Production)
- `NEXT_PUBLIC_API_BASE_URL` = base API backend con `/api` finale (es: `https://<backend-domain>/api`).

## Passi
1. In Vercel, crea un nuovo Project e importa il repo.
2. Imposta la Root Directory a `frontend/morphema-frontend` (se il repo e' monorepo) oppure alla cartella progetto.
3. Framework: Next.js (auto-detect).
4. Build Command: `npm run build`.
5. Output Directory: `.next`.
6. Aggiungi la variabile `NEXT_PUBLIC_API_BASE_URL` in Environment Variables (Production).
7. Deploy.
8. Vai in Project Settings -> Domains e aggiungi `morphema.app` (e `www.morphema.app` se richiesto).
9. Applica i record DNS forniti da Vercel e imposta `morphema.app` come Primary.
10. Esegui un Redeploy se necessario dopo l'attivazione del dominio.
10. Esegui un Redeploy se necessario dopo l'attivazione del dominio.
