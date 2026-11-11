import { translate } from './helpers/translate.js';

// FN: calls a function made with Def Fn. https://amospromanual.dev/05-01-the-bare-bones.html
// Even an integer Fn returns its value as it is: only storing it in an integer variable truncates
// it. Checked on creepycat: Def Fn A(X)=X/2 gives Fn A(7) = 3.5, and Y=Fn A(7) stores 3.

test.each([
  ['the definition', 'Def Fn A(X)=X/2', 'A = (X) => X / 2;'],
  ['a call stored in an integer', 'Def Fn A(X)=X/2\nY=Fn A(7)', 'Y = Math.trunc(A(7));'],
  ['a call stored in a float', 'Def Fn A(X)=X/2\nZ#=Fn A(7)', 'Z_f = A(7);'],
])('Fn translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
