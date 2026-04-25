# Shareable Deliverable Folder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create one clean, shareable folder that contains only the files needed to run the calculator locally, with one obvious file for classmates or a professor to open.

**Architecture:** Keep the current working project untouched as the development workspace. Add a small packaging step that copies the runtime app files into a dedicated deliverable folder, removes dev clutter from the deliverable, and adds one clear start file plus a short readme. This keeps development flexible while making the submission dead simple for non-technical users.

**Tech Stack:** Static HTML/CSS/JS, PowerShell packaging script, local filesystem copy operations, browser smoke-check with Playwright or normal browser open.

---

### Task 1: Define the deliverable folder structure

**Files:**
- Create: `C:/Users/Emmy Lou/Downloads/New folder (16)/docs/plans/2026-03-09-shareable-deliverable-folder.md`
- Create: `C:/Users/Emmy Lou/Downloads/New folder (16)/deliverable/`
- Inspect: `C:/Users/Emmy Lou/Downloads/New folder (16)/index.html`
- Inspect: `C:/Users/Emmy Lou/Downloads/New folder (16)/styles.css`
- Inspect: `C:/Users/Emmy Lou/Downloads/New folder (16)/app.js`
- Inspect: `C:/Users/Emmy Lou/Downloads/New folder (16)/math-engine.js`
- Inspect: `C:/Users/Emmy Lou/Downloads/New folder (16)/expression-engine.js`
- Inspect: `C:/Users/Emmy Lou/Downloads/New folder (16)/calc-engine.js`
- Inspect: `C:/Users/Emmy Lou/Downloads/New folder (16)/poly-engine.js`
- Inspect: `C:/Users/Emmy Lou/Downloads/New folder (16)/math-display.js`

**Step 1: Lock the runtime file list**
The deliverable must include only the files required to open the app directly in a browser:
- `index.html`
- `styles.css`
- `app.js`
- `math-engine.js`
- `expression-engine.js`
- `calc-engine.js`
- `poly-engine.js`
- `math-display.js`
- favicon file if one exists in the final app state

**Step 2: Define the clean folder structure**
Target deliverable structure:
- `deliverable/`
- `deliverable/index.html`
- `deliverable/styles.css`
- `deliverable/app.js`
- `deliverable/math-engine.js`
- `deliverable/expression-engine.js`
- `deliverable/calc-engine.js`
- `deliverable/poly-engine.js`
- `deliverable/math-display.js`
- `deliverable/README.txt`
- optionally `deliverable/OPEN-ME-FIRST.txt`

**Step 3: Decide the one obvious entrypoint**
Use `index.html` as the actual runtime entrypoint, but add a short text file that says:
- `Open index.html in any browser.`
This avoids breaking the app’s internal script references while still making the entry obvious.

**Step 4: Verify what must stay out**
The deliverable must exclude:
- `.agents/`
- `.claude/`
- `.playwright-cli/`
- `docs/`
- `output/`
- all `.log` files
- screenshots and audit images
- temp server files such as `__tmp_server__.js`
- plan files and dev-only config files

**Step 5: Commit**
```bash
git add docs/plans/2026-03-09-shareable-deliverable-folder.md
git commit -m "docs: add deliverable packaging plan"
```

### Task 2: Add a packaging script that builds the clean folder

**Files:**
- Create: `C:/Users/Emmy Lou/Downloads/New folder (16)/scripts/build-deliverable.ps1`
- Create: `C:/Users/Emmy Lou/Downloads/New folder (16)/deliverable/` (generated output)

**Step 1: Write the script with an explicit allowlist**
The script should:
- remove any existing `deliverable/` folder
- recreate `deliverable/`
- copy only the runtime files from Task 1
- write `README.txt`
- optionally write `OPEN-ME-FIRST.txt`

**Step 2: Keep the script simple and deterministic**
Use an allowlist array in PowerShell, for example:
```powershell
$files = @(
  'index.html',
  'styles.css',
  'app.js',
  'math-engine.js',
  'expression-engine.js',
  'calc-engine.js',
  'poly-engine.js',
  'math-display.js'
)
```
Then copy each file into `deliverable/`.

**Step 3: Write the readme content**
`README.txt` should say, in plain language:
- this is the standalone calculator
- open `index.html`
- works in a modern browser with no install
- if symbols look odd, try Chrome or Edge

`OPEN-ME-FIRST.txt` should be even shorter:
- `Open index.html to start the calculator.`

**Step 4: Run the script once**
Run:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-deliverable.ps1
```
Expected:
- `deliverable/` exists
- only the allowed files plus the text instructions are present

**Step 5: Commit**
```bash
git add scripts/build-deliverable.ps1 deliverable/README.txt deliverable/OPEN-ME-FIRST.txt
git commit -m "feat: add clean deliverable packaging script"
```

### Task 3: Make the entrypoint obvious for non-technical users

**Files:**
- Modify: `C:/Users/Emmy Lou/Downloads/New folder (16)/deliverable/README.txt`
- Modify: `C:/Users/Emmy Lou/Downloads/New folder (16)/deliverable/OPEN-ME-FIRST.txt`

**Step 1: Keep the instructions minimal**
The text should answer only three questions:
- what is this?
- what do I open?
- do I need to install anything?

**Step 2: Use unambiguous wording**
Recommended text:
```text
This folder contains the standalone Numerical Analysis Calculator.

To use it:
1. Open index.html
2. Use any modern browser (Chrome, Edge, Firefox)
3. No installation is required
```

For `OPEN-ME-FIRST.txt`:
```text
Open index.html in your browser.
No installation is required.
```

**Step 3: Keep filenames simple**
Do not rename `index.html` unless all script/style references are also updated. Simpler is safer here.

**Step 4: Commit**
```bash
git add deliverable/README.txt deliverable/OPEN-ME-FIRST.txt
git commit -m "docs: add simple launch instructions for deliverable"
```

### Task 4: Verify the deliverable opens cleanly

**Files:**
- Test: `C:/Users/Emmy Lou/Downloads/New folder (16)/deliverable/index.html`
- Test: `C:/Users/Emmy Lou/Downloads/New folder (16)/deliverable/*.js`
- Test: `C:/Users/Emmy Lou/Downloads/New folder (16)/deliverable/styles.css`

**Step 1: Syntax-check the copied JS files**
Run:
```powershell
node --check .\deliverable\app.js
node --check .\deliverable\math-engine.js
node --check .\deliverable\expression-engine.js
node --check .\deliverable\calc-engine.js
node --check .\deliverable\poly-engine.js
node --check .\deliverable\math-display.js
```
Expected:
- all succeed with no output

**Step 2: Open the deliverable in a browser**
Check that `deliverable/index.html` opens directly and the calculator loads.

**Step 3: Run one smoke test per core module**
- Module I:
  - `2.1892 * 3.7008`
  - confirm exact `8.10179136`
- Module II:
  - import from Module I or manually enter `p` and `p*`
  - confirm results render
- Module III:
  - load the `sqrt(3)` example
  - confirm polynomial results render

**Step 4: Confirm the folder is clean**
Run:
```powershell
Get-ChildItem .\deliverable | Select-Object Name
```
Expected:
- only runtime files and the 1-2 text instruction files
- no logs, screenshots, plans, or temp server files

**Step 5: Commit**
```bash
git add deliverable/
git commit -m "test: verify clean standalone deliverable folder"
```

### Task 5: Optional share-ready zip

**Files:**
- Create optionally: `C:/Users/Emmy Lou/Downloads/New folder (16)/Numerical-Analysis-Calculator.zip`

**Step 1: Zip only the deliverable folder**
Run:
```powershell
Compress-Archive -Path .\deliverable\* -DestinationPath .\Numerical-Analysis-Calculator.zip -Force
```
Expected:
- one zip file ready to send

**Step 2: Sanity-check the zip contents**
Open or list the zip contents and confirm it contains only the clean deliverable files.

**Step 3: Commit if desired**
Only commit the zip if you explicitly want the archive inside the project. Otherwise leave it as a distribution artifact outside version control.

## Important interface changes
- No calculator behavior changes
- No parsing changes
- No math-engine changes
- No UI redesign
- Only the packaging and shareability workflow changes

## Test cases and scenarios
- `deliverable/index.html` opens directly in a browser
- runtime files load with no missing dependencies
- one smoke test per module passes
- classmates/professor can identify `index.html` as the file to open without searching through the development workspace

## Assumptions
- We are keeping the main development folder as-is and creating a separate clean deliverable folder.
- `index.html` remains the actual file to open, because changing the runtime entry name adds avoidable risk.
- The best user experience is one clean folder plus a short instruction text file, not a destructive cleanup of the development workspace.
- A zip is optional and should be created from `deliverable/`, not from the full project root.
