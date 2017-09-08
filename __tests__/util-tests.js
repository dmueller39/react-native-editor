// @flow
import {
  processLines,
  multilineLocateWord,
  isCharacterIndexSelectedWord,
  getRawLocation,
  updateLinesWithActiveText,
  updateLinesByDeletingNewline,
} from '../util';

describe('processLines', () => {
  it('processes a single line', () => {
    const lines = processLines('foo', 10, null, null, null, false);
    expect(lines).toEqual([
      {
        continued: false,
        continuing: false,
        end: 3,
        isEditing: false,
        isSelected: false,
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
    const lines = processLines(data, 38, null, null, null, false);

    const location = multilineLocateWord(0, 0, lines);

    expect(location).toEqual({
      word: 'abc',
      locations: [{ start: 0, length: 3, lineIndex: 0 }],
    });
  });
  it('locates a word on a multiple lines looking forward', () => {
    const data = `abc
abcdefghijklmnopqrstuvwxyz`;
    const lines = processLines(data, 18, null, null, null, false);

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
    const lines = processLines(data, 18, null, null, null, false);

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
    const lines = processLines(data, 18, null, null, null, false);

    const location = multilineLocateWord(5, 0, lines);

    expect(location).toEqual({
      locations: [],
      word: null,
    });
  });
  it('does not locate a word because it is past the end of the line', () => {
    const data = 'abc\nabcdefghijklmnopqrstuvwxyz';
    const lines = processLines(data, 18, null, null, null, false);

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

describe('updateLinesByDeletingNewline', () => {
  it('does not delete when its the very beginning of the text', () => {
    const lines = [
      {
        start: 0,
        text: '',
        rawLineIndex: 0,
        isEditing: true,
        isSelected: true,
        continuing: false,
        continued: false,
        textSections: [],
      },
      {
        start: 0,
        text: 'foo',
        rawLineIndex: 1,
        isEditing: false,
        isSelected: false,
        continuing: false,
        continued: false,
        textSections: [],
      },
    ];
    const result = updateLinesByDeletingNewline(
      lines,
      414,
      undefined,
      undefined
    );
    expect(result).toEqual(lines);
  });
  it('does delete when its not the first line', () => {
    const lines = [
      {
        start: 0,
        text: '',
        rawLineIndex: 0,
        isEditing: false,
        isSelected: false,
        continuing: false,
        continued: false,
        textSections: [],
      },
      {
        start: 0,
        text: 'foo',
        rawLineIndex: 1,
        isEditing: true,
        isSelected: false,
        continuing: false,
        continued: false,
        textSections: [],
      },
    ];
    const result = updateLinesByDeletingNewline(
      lines,
      414,
      undefined,
      undefined
    );
    const expectedLines = [
      {
        start: 0,
        text: 'foo',
        rawLineIndex: 0,
        isEditing: true,
        isSelected: true,
        continuing: false,
        continued: false,
        textSections: [],
      },
    ];

    expect(result).toEqual(expectedLines);
  });
  it('properly modifies surrounding lines when deleting', () => {
    const lines = [
      {
        start: 0,
        text: 'foo',
        rawLineIndex: 0,
        isEditing: false,
        isSelected: false,
        continuing: false,
        continued: false,
        textSections: [],
      },
      {
        start: 0,
        text: 'bar',
        rawLineIndex: 1,
        isEditing: false,
        isSelected: false,
        continuing: false,
        continued: false,
        textSections: [],
      },
      {
        start: 0,
        text: 'baz',
        rawLineIndex: 2,
        isEditing: true,
        isSelected: true,
        continuing: false,
        continued: false,
        textSections: [],
      },
      {
        start: 0,
        text: 'biz',
        rawLineIndex: 3,
        isEditing: false,
        isSelected: false,
        continuing: false,
        continued: false,
        textSections: [],
      },
    ];
    const result = updateLinesByDeletingNewline(
      lines,
      414,
      undefined,
      undefined
    );
    const expectedLines = [
      {
        start: 0,
        text: 'foo',
        rawLineIndex: 0,
        isEditing: false,
        isSelected: false,
        continuing: false,
        continued: false,
        textSections: [],
      },
      {
        start: 0,
        text: 'barbaz',
        rawLineIndex: 1,
        isEditing: true,
        isSelected: true,
        continuing: false,
        continued: false,
        textSections: [],
      },
      {
        start: 0,
        text: 'biz',
        rawLineIndex: 2,
        isEditing: false,
        isSelected: false,
        continuing: false,
        continued: false,
        textSections: [],
      },
    ];

    expect(result).toEqual(expectedLines);
  });
});

describe('updateLinesWithActiveText', () => {
  it('does not update if none of the lines are editing', () => {
    const lines = [
      {
        start: 0,
        text: 'foo',
        rawLineIndex: 0,
        isEditing: false,
        isSelected: false,
        continuing: false,
        continued: false,
        textSections: [],
      },
    ];
    const result = updateLinesWithActiveText(
      lines,
      'text',
      414,
      undefined,
      undefined
    );
    expect(result).toEqual(lines);
  });
  it('updates when there is no newline', () => {
    const lines = [
      {
        start: 0,
        text: '',
        rawLineIndex: 0,
        isEditing: false,
        isSelected: false,
        continuing: false,
        continued: false,
        textSections: [],
      },
      {
        start: 0,
        text: 'foo',
        rawLineIndex: 1,
        isEditing: true,
        isSelected: true,
        continuing: false,
        continued: false,
        textSections: [],
      },
    ];
    const result = updateLinesWithActiveText(
      lines,
      'bar',
      414,
      undefined,
      undefined
    );
    const expectedLines = [
      {
        start: 0,
        text: '',
        rawLineIndex: 0,
        isEditing: false,
        isSelected: false,
        continuing: false,
        continued: false,
        textSections: [],
      },
      {
        start: 0,
        text: 'bar',
        rawLineIndex: 1,
        isEditing: true,
        isSelected: true,
        continuing: false,
        continued: false,
        textSections: [],
      },
    ];

    expect(result).toEqual(expectedLines);
  });
  it('updates when there is no newline 2', () => {
    const initialData = `
foo`;
    const lines = processLines(initialData, 10, null, null, 1, true);

    const expectedData = `
bar`;
    const expectedLines = processLines(expectedData, 10, null, null, 1, true);

    const text = `bar`;
    const result = updateLinesWithActiveText(
      lines,
      text,
      414,
      undefined,
      undefined
    );

    expect(result).toEqual(expectedLines);
  });
  it('modifies lines in an expected manner when inserting a new line', () => {
    const initialData = `foo
barbaz
12345678901234567890`;
    const lines = processLines(initialData, 10, null, null, 1, true);

    const expectedData = `foo
bar
baz
12345678901234567890`;
    const expectedLines = processLines(expectedData, 10, null, null, 2, true);

    const text = `bar
baz`;
    const result = updateLinesWithActiveText(
      lines,
      text,
      414,
      undefined,
      undefined
    );

    expect(result).toEqual(expectedLines);
  });
});
