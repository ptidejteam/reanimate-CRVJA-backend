# Reanimate-CRVJA Backend

The backend service for Reanimate-CRVJA, providing APIs to transpile AMOS BASIC, detokenize binary AMOS programs, and process AMOS sprite banks.

## How the Transpiler Works

The core transpiler relies on **ANTLR4**. It processes AMOS BASIC code by generating a lexer and parser, which tokenize the code and build an Abstract Syntax Tree (AST). The AST is then walked and translated into JavaScript code designed to run in a web browser using HTML5 APIs.

## Version Handling

The transpiler logic is modularized by versions (located in `src/transpilers/`). When requesting a transpilation, you can specify the target `version` (e.g., `1.1.0`, `1.2.0`, `2.0.0-beta`). This ensures backward compatibility for older games while allowing testing of new features in newer versions.

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the server:**
   - **Development (with hot-reload):**
     ```bash
     npm run dev
     ```
   - **Production:**
     ```bash
     npm start
     ```

   The server will run on `http://localhost:4000` by default.

3. **Run tests:**
   ```bash
   npm test
   ```

## Using the API

You can call the API locally (`http://localhost:4000`) or using your deployed production URL.

### 1. Transpile Code

- **URL:** `/api/transpile`
- **Method:** `POST`
- **Body Example:**
  ```json
  {
    "code": "PRINT \"Hello World\"",
    "version": "2.0.0-beta"
  }
  ```

### 2. Get Available Versions

- **URL:** `/api/versions`
- **Method:** `GET`
- **Response:** Returns a list of supported transpiler versions.

### 3. Decode a binary AMOS program

- **URL:** `/api/decode-amos`
- **Method:** `POST`
- **Content type:** `multipart/form-data`
- **File field:** `file`
- **Response:** `{ "sourceCode": "..." }`
- **Upload limit:** 5 MB

The decoder validates the AMOS container, loads the packaged AMCAF token table, and returns detokenized AMOS source code.

### 4. Parse or generate an AMOS bank

- **Parse:** `POST /api/parse-bank-file` with a `.abk` file in the multipart field `file`
- **Generate:** `POST /api/generate-bank-file` with `sprites`, `palette`, and an optional `filename` in a JSON body
