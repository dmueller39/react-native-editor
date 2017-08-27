// @flow
import {
  processLines,
  multilineLocateWord,
  isCharacterIndexSelectedWord,
  getRawLocation,
} from '../util';

describe('processLines', () => {
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

describe('multilineLocateWord', () => {
  it('locates a word on a single line', () => {
    const data = `abc
abcdefghijklmnopqrstuvwxyz`;
    const lines = processLines(data, 320, null, null, null, null);

    const location = multilineLocateWord(0, 0, lines);

    expect(location).toEqual({
      word: 'abc',
      locations: [{ start: 0, length: 3, lineIndex: 0 }],
    });
  });
  it('locates a word on a multiple lines looking forward', () => {
    const data = `abc
abcdefghijklmnopqrstuvwxyz`;
    const lines = processLines(data, 160, null, null, null, null);

    const location = multilineLocateWord(0, 1, lines);

    expect(location).toEqual({
      locations: [
        { length: 17, lineIndex: 1, start: 0 },
        { length: 9, lineIndex: 2, start: 0 },
      ],
      word: 'abcdefghijklmnopqrstuvwxyz',
    });
  });

  it('locates a word on a multiple lines looking backward', () => {
    const data = `abc
abcdefghijklmnopqrstuvwxyz`;
    const lines = processLines(data, 160, null, null, null, null);

    const location = multilineLocateWord(1, 2, lines);

    expect(location).toEqual({
      locations: [
        { length: 17, lineIndex: 1, start: 0 },
        { length: 9, lineIndex: 2, start: 0 },
      ],
      word: 'abcdefghijklmnopqrstuvwxyz',
    });
  });

  it('does not locate a word because there is a space', () => {
    const data = 'abc     \nabcdefghijklmnopqrstuvwxyz';
    const lines = processLines(data, 160, null, null, null, null);

    const location = multilineLocateWord(5, 0, lines);

    expect(location).toEqual({
      locations: [],
      word: null,
    });
  });
  it('does not locate a word because it is past the end of the line', () => {
    const data = 'abc\nabcdefghijklmnopqrstuvwxyz';
    const lines = processLines(data, 160, null, null, null, null);

    const location = multilineLocateWord(5, 0, lines);

    expect(location).toEqual({
      locations: [],
      word: null,
    });
  });
});

describe('isCharacterIndexSelectedWord', () => {
  it('does not find a selected word in an empty array', () => {
    const result = isCharacterIndexSelectedWord(0, []);
    expect(result).toBe(false);
  });
  it('does not find a selected word in full array with no match', () => {
    const result = isCharacterIndexSelectedWord(0, [
      { start: 0, end: 5, text: 'abcde', highlight: 'normal' },
    ]);
    expect(result).toBe(false);
  });
  it('finds a selected word', () => {
    const result = isCharacterIndexSelectedWord(0, [
      { start: 0, end: 5, text: 'abcde', highlight: 'highlight' },
    ]);
    expect(result).toBe(false);
  });
});
