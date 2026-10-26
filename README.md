# Reanimate-CRVJA Backend

CRVJA translates AMOS BASIC into JavaScript for the browser. This backend provides APIs
to transpile source code, detokenize binary AMOS programs, and read or generate sprite banks.

## 1. Getting started

### 1.1. Requirements and setup

Use Node.js 20 or later. Java is needed only when regenerating parsers.

```sh
npm install
npm run dev
```

The server starts at `http://localhost:4000`. Use `npm start` to run without automatic restarts.

### 1.2. Configuration

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | Server port |
| `FRONTEND_BASE_URL` | `http://localhost:3000` | Allowed frontend origin for CORS |

### 1.3. Development commands

Run these commands from the backend root:

| Command | Purpose |
| --- | --- |
| `npm test -- --runInBand` | Run the backend test suite |
| `npm run antlr` | Generate and format the beta AMOS and extension lexers, parsers, and listeners without visitors; requires Java |
| `npm run format` | Format all JavaScript files with Prettier |

Regenerate parsers after changing a grammar, then include the generated files with that
change. Handler-only changes do not require regeneration.

## 2. Project structure and versions

| Path | Responsibility |
| --- | --- |
| `src/server.js`, `src/app.js` | Start the server and configure Express |
| `src/routes/`, `src/controllers/`, `src/services/` | API routes, request handling, and services |
| `src/transpilers/<version>/` | Versioned transpilers, grammars, and tests |
| `src/utils/` | Shared Amiga colour and binary AMOS helpers |
| `src/resources/` | Packaged extension token tables used by the binary decoder |
| `tests/` | API and shared-helper tests |
| `docs/` | Developer guides listed in [section 4](#4-developer-guides) |
| `antlr-4.13.2-complete.jar` | ANTLR generator invoked by `npm run antlr` |
| `amos-code-analysis/` | Separate command-usage analysis project; see its [README](amos-code-analysis/README.md) |

The API accepts a transpiler `version`. A missing, invalid, or unknown version falls back
to the version in `package.json`, currently `2.0.0-beta`.

New transpiler work belongs in `2.0.0-beta`; keep `1.1.0` and `1.2.0` unchanged for older
programs. The [architecture guide](docs/TRANSPILER.md) explains how parsing and translation work.

## 3. API

Use the local server or your deployment URL. `GET /` returns
`{ "status": "ok", "message": "CRVJA 🍺" }`.

### 3.1. Transpile source code

`POST /api/transpile` accepts JSON:

```json
{
  "code": "Print \"Hello World\"",
  "version": "2.0.0-beta"
}
```

`version` is optional. The beta grammar accepts uppercase, lowercase, and mixed-case
keywords and variable names while preserving quoted strings and label spelling.

```json
{
  "message": "(AMOS -> JavaScript) Successfully transpiled.",
  "data": {
    "lexicalErrors": { "errors": [] },
    "syntaxErrors": { "errors": [] },
    "translatedCode": "..."
  }
}
```

Lexical or syntax errors appear as `{ "line", "column", "msg" }` entries, with empty
`translatedCode`. Check these diagnostics even when the HTTP response is `200`.
A missing or non-string `code` returns `400`. The generated code is intended for the
frontend's browser runner, not execution by the backend.

### 3.2. List transpiler versions

`GET /api/versions` returns:

```json
{
  "message": "Available versions fetched.",
  "versions": ["2.0.0-beta", "1.2.0", "1.1.0"]
}
```

### 3.3. Decode a binary AMOS program

`POST /api/decode-amos` accepts a multipart upload in the `file` field, up to 5 MB.
It validates the AMOS container, loads the packaged AMCAF token table, and returns
`{ "sourceCode": "..." }`. Missing or invalid input returns `400`; oversized uploads return `413`.

### 3.4. Read or generate a sprite bank

| Endpoint | Input | Result |
| --- | --- | --- |
| `POST /api/parse-bank-file` | Multipart `.abk` upload in `file` | `{ "message", "sprites", "palette" }` |
| `POST /api/generate-bank-file` | JSON containing `sprites`, `palette`, and optional `filename` | A downloadable `.abk` file |

## 4. Developer guides

Read the architecture guide first, then choose the guide for your contribution:

| Guide | Read it to… |
| --- | --- |
| [TRANSPILER.md](docs/TRANSPILER.md) | Understand the pipeline, classes, shared state, and a complete translation example |
| [COMMANDS.md](docs/COMMANDS.md) | Add or change core AMOS commands, grammar rules, handlers, and tests |
| [EXTENSIONS.md](docs/EXTENSIONS.md) | Build a statement mini-transpiler using the shared infrastructure and understand current limits |
