import { translate } from './helpers/translate.js';

// RADIAN: angles are given in radians again (the default). https://amospromanual.dev/05-03-maths.html

test('Radian goes back to radians after Degree', async () => {
  const javascript = await translate('Degree\nA# = Sin(90)\nRadian\nB# = Sin(1)');

  expect(javascript).toContain('A_f = Math.sin((90 * Math.PI) / 180);');
  expect(javascript).toContain('B_f = Math.sin(1);');
});

test('Radian on its own changes nothing', async () => {
  expect(await translate('Radian\nX# = Asin(1)')).toContain('X_f = Math.asin(1);');
});
