// These identifiers name labels, whose spelling must survive case normalization.
const labelRules = new Set(['label', 'gotoLabel', 'gosub', 'onError', 'resume', 'resumeLabel']);

/** Normalize accepted AMOS trees, including those owned by an imported grammar. */
export function normalizeIdentifiers(tree) {
  function visit(ctx) {
    const rule = ctx.parser.ruleNames[ctx.ruleIndex];
    // RESTORE's expression denotes a data position/label; it has no translator yet.
    if (rule === 'restore') return;

    let identifierIndex = 0;
    for (const child of ctx.children ?? []) {
      if (!child.symbol) {
        visit(child);
        continue;
      }
      // Each parser has its own token IDs. Never compare with AMOSLexer's IDs here.
      if (ctx.parser.symbolicNames[child.symbol.type] !== 'IDENTIFIER') continue;
      const isLabel = labelRules.has(rule) || (rule === 'onGosub' && identifierIndex > 0);
      identifierIndex++;
      if (isLabel) continue;

      const name = child.symbol.text.toUpperCase();
      child.symbol.text = name.endsWith('#')
        ? `${name.slice(0, -1)}_f`
        : name === 'TIMER'
          ? 'Timer'
          : name;
    }
  }

  visit(tree);
}
