// @flow
import { processLines } from '../util';

describe('procssLines', () => {
  it('processes a single line', () => {
    const lines = processLines('foo', 100, null, null, null, null);
    expect(lines).toEqual([
      {
        activeLineText: null,
        continued: false,
        continuing: false,
        end: 3,
        rawLineIndex: 0,
        start: 0,
        text: 'foo',
        textSections: [{ end: 3, highlight: 'normal', start: 0, text: 'foo' }],
      },
    ]);
  });
});
