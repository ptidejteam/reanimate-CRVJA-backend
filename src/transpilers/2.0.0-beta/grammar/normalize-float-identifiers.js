/** Use the owning lexer: independently generated grammars have different token IDs. */
export function normalizeFloatIdentifiers(tokens, Lexer) {
  for (const token of tokens) {
    if (token.type === Lexer.IDENTIFIER && token.text.endsWith('#')) {
      token.text = `${token.text.slice(0, -1)}_f`;
    }
  }
}
