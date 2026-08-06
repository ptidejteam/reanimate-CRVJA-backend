import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AMOSListener from './grammar/generated/AMOSListener.js';
import ScopeHandler from './handlers/scope-handler.js';
import ExpressionHandler from './handlers/expression-handler.js';
import ScreenHandler from './handlers/screen-handler.js';
import DrawingHandler from './handlers/drawing-handler.js';
import ControlFlowHandler from './handlers/control-flow-handler.js';
import SoundHandler from './handlers/sound-handler.js';
import DataHandler from './handlers/data-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeScript = fs.readFileSync(path.join(__dirname, 'runtime', 'amos-runtime.js'), 'utf8');

class AmosTranslator extends AMOSListener {
  constructor() {
    super();

    // Initialize state
    this.imports = '';
    this.output = '';
    this.id = 0;
    this.colorMapping = {
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
    this.palette = `const colorMapping = ${JSON.stringify(this.colorMapping, null, 2)};\n`;
    this.lineData = [];
    this.globalVariables = '';
    this.functionDeclarationSupport = '';
    this.scopes = [{}];
    this.globalVariablesSet = new Set();
    this.hasDataMatrix = false;
    this.preamble = `\n${runtimeScript}\n`;

    // Delegate modules
    this.scopeHandler = new ScopeHandler(this);
    this.expressionHandler = new ExpressionHandler(this);
    this.screenHandler = new ScreenHandler(this);
    this.drawingHandler = new DrawingHandler(this);
    this.controlFlowHandler = new ControlFlowHandler(this);
    this.soundHandler = new SoundHandler(this);
    this.dataHandler = new DataHandler(this);
  }

  // ScopeHandler
  enterNewScope() { this.scopeHandler.enterNewScope(); }
  exitCurrentScope() { this.scopeHandler.exitCurrentScope(); }
  get currentScope() { return this.scopeHandler.currentScope; }
  get isRootScope() { return this.scopeHandler.isRootScope; }
  isVariableDeclared(name) { return this.scopeHandler.isVariableDeclared(name); }
  enterGlobal(ctx) { this.scopeHandler.enterGlobal(ctx); }
  enterVariable_starter(ctx) { this.scopeHandler.enterVariable_starter(ctx); }
  enterAdd(ctx) { this.scopeHandler.enterAdd(ctx); }
  enterProcedure(ctx) { this.scopeHandler.enterProcedure(ctx); }
  exitProcedure(ctx) { this.scopeHandler.exitProcedure(ctx); }
  enterProcedure_call(ctx) { this.scopeHandler.enterProcedure_call(ctx); }

  // ScreenHandler
  enterScreen_open(ctx) {
    this.screenHandler.enterScreen_open(ctx);
  }
  enterCls(ctx) {
    this.screenHandler.enterCls(ctx);
  }
  enterCurs_off(ctx) {
    this.screenHandler.enterCurs_off(ctx);
  }
  enterCurs_on(ctx) {
    this.screenHandler.enterCurs_on(ctx);
  }
  enterPalette(ctx) {
    this.screenHandler.enterPalette(ctx);
  }
  enterInk(ctx) {
    this.screenHandler.enterInk(ctx);
  }
  enterPen(ctx) {
    this.screenHandler.enterPen(ctx);
  }
  enterPaper(ctx) {
    this.screenHandler.enterPaper(ctx);
  }

  // DrawingHandler
  enterBar(ctx) {
    this.drawingHandler.enterBar(ctx);
  }
  enterBox(ctx) {
    this.drawingHandler.enterBox(ctx);
  }
  enterCircle(ctx) {
    this.drawingHandler.enterCircle(ctx);
  }
  enterText(ctx) {
    this.drawingHandler.enterText(ctx);
  }
  enterTurbo_draw(ctx) {
    this.drawingHandler.enterTurbo_draw(ctx);
  }
  enterBlitter_fill(ctx) {
    this.drawingHandler.enterBlitter_fill(ctx);
  }
  enterBlitter_clear(ctx) {
    this.drawingHandler.enterBlitter_clear(ctx);
  }
  enterLoadBank(ctx) {
    this.drawingHandler.enterLoadBank(ctx);
  }
  enterLoadBankImgToSprite(ctx) {
    this.drawingHandler.enterLoadBankImgToSprite(ctx);
  }

  // ControlFlowHandler
  enterIf_statement(ctx) {
    this.controlFlowHandler.enterIf_statement(ctx);
  }
  exitIf_statement(ctx) {
    this.controlFlowHandler.exitIf_statement(ctx);
  }
  enterElse_statement(ctx) {
    this.controlFlowHandler.enterElse_statement(ctx);
  }
  exitElse_statement(ctx) {
    this.controlFlowHandler.exitElse_statement(ctx);
  }
  enterIf_statement_key_state(ctx) {
    this.controlFlowHandler.enterIf_statement_key_state(ctx);
  }
  exitIf_statement_key_state(ctx) {
    this.controlFlowHandler.exitIf_statement_key_state(ctx);
  }
  enterFor_loop(ctx) {
    this.controlFlowHandler.enterFor_loop(ctx);
  }
  exitFor_loop(ctx) {
    this.controlFlowHandler.exitFor_loop(ctx);
  }
  enterDo_loop(ctx) {
    this.controlFlowHandler.enterDo_loop(ctx);
  }
  exitDo_loop(ctx) {
    this.controlFlowHandler.exitDo_loop(ctx);
  }
  enterWhile_wend(ctx) {
    this.controlFlowHandler.enterWhile_wend(ctx);
  }
  exitWhile_wend(ctx) {
    this.controlFlowHandler.exitWhile_wend(ctx);
  }
  enterRepeat_key(ctx) {
    this.controlFlowHandler.enterRepeat_key(ctx);
  }
  exitRepeat_key(ctx) {
    this.controlFlowHandler.exitRepeat_key(ctx);
  }
  enterWait_key(ctx) {
    this.controlFlowHandler.enterWait_key(ctx);
  }

  // SoundHandler
  enterPlay_sound(ctx) {
    this.soundHandler.enterPlay_sound(ctx);
  }

  // DataHandler
  enterOpen_out_readfile(ctx) {
    this.dataHandler.enterOpen_out_readfile(ctx);
  }
  enterOpen_in_writefile(ctx) {
    this.dataHandler.enterOpen_in_writefile(ctx);
  }
  enterInput_variable(ctx) {
    this.dataHandler.enterInput_variable(ctx);
  }
  enterClose_file(ctx) {
    this.dataHandler.enterClose_file(ctx);
  }
  enterPrint_something(ctx) {
    this.dataHandler.enterPrint_something(ctx);
  }
  enterData_statement(ctx) {
    this.dataHandler.enterData_statement(ctx);
  }
  enterRead_statement(ctx) {
    this.dataHandler.enterRead_statement(ctx);
  }
  enterArray_create(ctx) {
    this.dataHandler.enterArray_create(ctx);
  }
  enterArray_update(ctx) {
    this.dataHandler.enterArray_update(ctx);
  }

  // ExpressionHandler
  handleFactor(accumulator, factorContext) { this.expressionHandler.handleFactor(accumulator, factorContext); }
  handleArrayAccess(accumulator, arrayStructure) { this.expressionHandler.handleArrayAccess(accumulator, arrayStructure); }
  handleSymbol(accumulator, symbol) { this.expressionHandler.handleSymbol(accumulator, symbol); }
  handleTerm(accumulator, termContext) { this.expressionHandler.handleTerm(accumulator, termContext); }
  handleExpr(accumulator, expressionContext) { this.expressionHandler.handleExpr(accumulator, expressionContext); }
  handleExpression(expressionContext) { return this.expressionHandler.handleExpression(expressionContext); }

  getJavaScript() {
    let result =
      '// Using Version 2.0.0 of the AMOS to JavaScript Transpiler\n' +
      this.imports +
      this.palette +
      this.globalVariables +
      this.functionDeclarationSupport +
      this.preamble +
      this.output;

    // console.log(result);
    return result;
  }
}

export default AmosTranslator;
