# Eduvas Affiliate Referral Campaign · DIU

Registration site for the Eduvas Affiliate Referral Program at Daffodil
International University. A static front-end on Netlify writes to a Google
Sheet through a Google Apps Script web app.

```
public/                 ← this folder is what Netlify serves
  index.html            markup
  assets/styles.css     all styling
  assets/app.js         form logic, validation, submit
  assets/config.js      ← the only file you normally edit
  assets/logo.png       Eduvas logo
apps-script/
  Code.gs               paste this into the Apps Script editor
  appsscript.json       deployment settings (reference)
netlify.toml            tells Netlify to publish public/
```

## Why the front-end is not served from Apps Script

A `script.google.com` URL fails for anyone signed into more than one Google
account: the browser rewrites the path to `/macros/u/1/s/...`, which does not
exist, and Google returns a Drive error reading *"Sorry, unable to open the
file at this time."* Most students have a personal Gmail **and** a
`@diu.edu.bd` account on the same phone, so this would have hit a large share
of the audience. Serving the page from Netlify removes Google account context
from the equation entirely. Apps Script is used only as a data endpoint.

## Setup

### 1. Apps Script

1. Open the Apps Script project → delete everything in `Code.gs` → paste the
   contents of `apps-script/Code.gs`.
2. Delete the old `Index.html` file. It is no longer used.
3. Run the `setup` function once to create the sheet header row.
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the `/exec` URL.

The Sheet ID is already set at the top of `Code.gs`.

### 2. Front-end

Paste the `/exec` URL into `public/assets/config.js`:

```js
window.EDUVAS_ENDPOINT = "https://script.google.com/macros/s/XXXX/exec";
```

Leave it empty and the site runs in preview mode — the form works end to end
but nothing is saved.

### 3. Netlify

Push to GitHub, then in Netlify: **Add new site → Import an existing project**
→ pick the repo. Netlify reads `netlify.toml`, so leave the build command
empty and the publish directory as `public`.

Rename the site to something printable (e.g. `eduvas-diu.netlify.app`), then
put that URL into the `SITE_URL` constant in `Code.gs` and redeploy the script.
`doGet` forwards anyone who scans an older poster QR to the live site.

## Local preview

```bash
cd public
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

Opening `index.html` directly with `file://` also works, but `fetch` to the
Apps Script endpoint will be blocked, so use the server above when testing a
real submission.

## How submissions reach the sheet

`app.js` sends JSON with `Content-Type: text/plain`. This matters: it keeps the
request a CORS "simple request", so the browser never fires a preflight
`OPTIONS` call, which Apps Script cannot answer. `doPost` parses
`e.postData.contents` and appends a row.

Two actions are supported:

| action      | when it fires                              | result                          |
|-------------|--------------------------------------------|---------------------------------|
| `check`     | student finishes the phone or email field  | flags an already-registered contact early |
| *(default)* | Submit on the final step                   | validates, dedupes, appends the row, returns the referral code |

Duplicates are rejected on **phone or email**, so email is required on both the
form and the server. If you want email optional, remove the email check in
`submitApplication` **and** drop `data-req` from the email field in
`index.html` — changing only one side causes submissions to pass validation in
the browser and then be rejected by the server.

## Referral codes

Format `EDU-FIRSTNAME-1234` (last four digits of the phone number). The same
algorithm runs in the browser for the live preview on the pass card and on the
server for the stored value, so they always agree.
