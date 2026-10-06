import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AMOSListener from './grammar/generated/AMOSListener.js';
import AMOSParser from './grammar/generated/AMOSParser.js';
import ExpressionVisitor from './expression-visitor.js';
import Instructions from './commands/instructions.js';
import Structures from './commands/structures.js';
import Functions from './commands/functions.js';
import Amcaf from './commands/amcaf.js';
import { amiga12BitToHex, amiga12BitToRgb, validateAmigaColor } from '../../utils/amiga-color.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeScript = fs.readFileSync(path.join(__dirname, 'runtime', 'amos-runtime.js'), 'utf8');

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

/**
 * Walks the AMOS parse tree and builds the JavaScript program. The translation of
 * each command is in commands/, one file per category (see TRANSPILER.md at the backend root).
 */
class AmosTranslator extends AMOSListener {
  constructor() {
    super();

    // Sections of the generated program, joined in this order by getJavaScript()
    this.colorMapping = { ...DEFAULT_COLOR_MAPPING };
    this.palette = `const colorMapping = ${JSON.stringify(this.colorMapping, null, 2)};\n`;
    this.globalVariables = '';
    this.functionDeclarationSupport = '';
    const colorRuntime = [validateAmigaColor, amiga12BitToRgb, amiga12BitToHex]
      .map((helper) => helper.toString())
      .join('\n');
    this.preamble = `\n${colorRuntime}\n${runtimeScript}\n`;
    this.output = '';

    // Translation state
    this.scopes = [{}]; // [main program, Procedure being translated]
    this.globalVariablesSet = new Set(); // names listed in a `Global` statement
    this.hasDataMatrix = false;
    this.expressionVisitor = new ExpressionVisitor(this);

    // One object per command category
    this.commandFiles = [
      new Instructions(this),
      new Structures(this),
      new Functions(this),
      new Amcaf(this),
    ];
  }

  // ---- Command dispatch ----------------------------------------------------

  // ANTLR calls enterEveryRule / exitEveryRule for every node of the parse tree.
  enterEveryRule(ctx) {
    this.forwardToCommands('enter', ctx);
  }

  exitEveryRule(ctx) {
    this.forwardToCommands('exit', ctx);
  }

  /**
   * Calls the method of commands/ named after the grammar rule of ctx, if there is one:
   * rule `cls` -> enterCls(ctx) and exitCls(ctx), rule `absFunction` -> visitAbsFunction(ctx).
   */
  forwardToCommands(prefix, ctx) {
    const rule = AMOSParser.ruleNames[ctx.ruleIndex];
    const method = prefix + rule[0].toUpperCase() + rule.slice(1);
    const commandFile = this.commandFiles.find((file) => file[method]);
    return commandFile?.[method](ctx);
  }

  // ---- Helpers used by the command files -----------------------------------

  handleExpression(expressionContext) {
    if (!expressionContext) return '';
    return this.expressionVisitor.visit(expressionContext);
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

export default AmosTranslator;
