# Morphema Demo

## Cosa e'
- Demo frontend di Incarico autonomo (art. 2222 c.c.) tra Committente e Professionista occasionale.
- Il flusso mostra una singola Candidatura e la gestione del compenso a risultato.
- La UI mostra solo data evento e compenso a risultato.

## Cosa NON e'
- Non e' una piattaforma per Incarico autonomo ripetuto.
- Non gestisce pianificazioni ricorrenti.
- Non gestisce pagamenti continuativi.

## Account demo
- Committente: `venue@test.com` / `password123`
- Professionista occasionale: `worker@test.com` / `password123`

## Demo flow (click-by-click)
1. Vai su `/login`.
2. Clicca `Committente (venue@test.com)`.
3. Vai su `Nuovo incarico`, imposta `Data evento` e `Compenso a risultato`, poi clicca `Crea incarico`.
4. Torna su `Incarico autonomo` e clicca `Preautorizza compenso`, poi `Pubblica incarico`.
5. Logout.
6. Clicca `Professionista occasionale (worker@test.com)`.
7. Apri l'incarico pubblicato e clicca `Invia candidatura`.
8. Logout.
9. Rientra come `Committente` e clicca `Accetta candidatura`.
