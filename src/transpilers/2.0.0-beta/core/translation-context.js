import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  amiga12BitToCssRgb,
  amiga12BitToHex,
  amiga12BitToRgb,
  cssRgbToAmiga12Bit,
  validateAmigaColor,
} from '../../../utils/amiga-color.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeScript = fs.readFileSync(path.join(__dirname, 'amos-runtime.js'), 'utf8');

// AMOS colour indexes used until the program sets its own Palette
const DEFAULT_COLOR_MAPPING = {
  0: 'rgb(0,0,0)',
  1: 'rgb(255,255,255)',
  2: 'rgb(255,0,0)',
  3: 'rgb(0,255,0)',
  4: 'rgb(0,0,255)',
  5: 'rgb(255,255,0)',
  6: 'rgb(0,255,255)',
  7: 'rgb(255,0,255)',
  8: 'rgb(192,192,192)',
  9: 'rgb(128,128,128)',
  10: 'rgb(128,0,0)',
  11: 'rgb(128,128,0)',
  12: 'rgb(0,128,0)',
  13: 'rgb(128,0,128)',
  14: 'rgb(0,128,128)',
  15: 'rgb(0,0,128)',
};

/** Shared state and JavaScript output for one transpilation. */
export default class TranslationContext {
  constructor(expressions) {
    this.expressions = expressions;

    // Sections of the generated program, joined in this order by getJavaScript()
    this.colorMapping = { ...DEFAULT_COLOR_MAPPING };
    this.palette = `const colorMapping = ${JSON.stringify(this.colorMapping, null, 2)};\n`;
    this.globalVariables = '';
    this.functionDeclarationSupport = '';
    const colorRuntime = [
      validateAmigaColor,
      cssRgbToAmiga12Bit,
      amiga12BitToRgb,
      amiga12BitToCssRgb,
      amiga12BitToHex,
    ]
      .map((helper) => helper.toString())
      .join('\n');
    this.preamble = `\n${colorRuntime}\n${runtimeScript}\n`;
    this.output = '';

    // Translation state
    this.scopes = [{}]; // [main program, Procedure being translated]
    this.currentLoop = 0;
    this.globalVariablesSet = new Set(); // names listed in a `Global` statement
    this.hasDataMatrix = false;
    this.usedExtensions = new Set();
  }

  /** Appends JavaScript to the program body. */
  emit(code) {
    this.output += code;
  }

  /** Includes an extension's optional runtime once, when its first statement is used. */
  includeExtensionRuntime(extension) {
    if (this.usedExtensions.has(extension)) return;
    this.usedExtensions.add(extension);
    if (extension.runtimeSource) this.preamble += `\n${extension.runtimeSource}\n`;
  }

  /** AMOS default value of a new variable: "" for strings (NAME$), 0 otherwise. */
  defaultValueFor(name) {
    return name.endsWith('$') ? '""' : 0;
  }

  /** The innermost scope: the main program, or the Procedure being translated. */
  get currentScope() {
    return this.scopes[this.scopes.length - 1];
  }

  get isRootScope() {
    return this.scopes.length === 1;
  }

  incrementCurrentLoop() {
    this.currentLoop++;
  }

  decrementCurrentLoop() {
    this.currentLoop--;
  }

  isVariableDeclared(name) {
    const isLocal = this.currentScope[name] !== undefined;
    const isGlobal = this.globalVariablesSet.has(name);

    return isLocal || isGlobal;
  }

  /** Emits `let name = <default>;` the first time an AMOS variable is seen. */
  declareVariable(name) {
    if (this.isVariableDeclared(name)) return;

    const defaultValue = this.defaultValueFor(name);
    const declaration = `let ${name} = ${defaultValue};\n`;
    if (this.isRootScope) {
      this.globalVariables += declaration;
    } else {
      this.output += declaration;
    }
    this.currentScope[name] = defaultValue;
  }

  getJavaScript() {
    return (
      '// Using Version 2.0.0 of the AMOS to JavaScript Transpiler\n' +
      this.palette +
      this.globalVariables +
      this.functionDeclarationSupport +
      this.preamble +
      this.output
    );
  }
}
