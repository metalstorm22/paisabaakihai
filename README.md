# Paisa Baaki Hai

Static reminder site that shows someone which shared subscriptions they owe you for, how many months they are behind, and how to pay you back. Designed to live on GitHub Pages—just push these files to your repo and enable Pages.

## Project structure
- `index.html` — UI shell; links to CSS and JS.
- `styles.css` — minimal/playful styling.
- `script.js` — CSV parsing and dues calculation logic.
- `data/subscriptions.csv` — your data source (edit this file).

## Data format
Keep one row per subscription per person. Dates should be `YYYY-MM-DD`.

```
name,phone,subscription,monthly_amount,last_paid,paid
Rohan,+919876543210,Netflix,249,2023-10-15,200
Rohan,+919876543210,Spotify,119,2023-09-02,0
Neha,+919876500123,YouTube Premium,139,2023-12-01,50
```

Tips:
- Use the same phone number format per person; matching is done by digits only (spaces and symbols are ignored).
- Avoid commas in values to keep the simple CSV parser happy.
- `paid` is optional; use it for partial payments already made toward the owed amount (it subtracts from the total due). Leave `0` if nothing paid.
- Update `last_paid` after each payment; the page calculates full months since that date.

## How it works
1. Visitor enters their phone number.
2. `script.js` fetches `data/subscriptions.csv`, finds rows matching that number, and computes months owed based on `last_paid`.
3. The page shows per-subscription dues and the total, plus your payment instructions (update the placeholder text in `index.html`).

## Deploying to GitHub Pages
1. Commit/push these files to your GitHub repo.
2. In repo Settings → Pages, select the branch (e.g., `main`) and root `/` as the source.
3. Wait for the build; share the Pages URL.

## Customizing
- Colors and typography: tweak CSS variables at the top of `styles.css`.
- Payment details: edit the "How to pay" box in `index.html`.
- Copy tone: update the hero text or labels in `index.html`.
