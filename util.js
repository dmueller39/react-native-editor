// @flow

import _ from 'lodash';

import type { Edit } from './Edit';

import {
  type TextSection,
  type Lines,
  type Line,
  type RawLocation,
  type BufferLocation,
} from './types';

import {
  CONTINUED_STRING,
  CONTINUING_STRING,
  CHARACTER_WIDTH,
  CHARACTER_HEIGHT,
  CHARACTER_REGEXP,
} from './constants';

export function getTextOnlySection(text: string): Array<TextSection> {
  return [{ text, start: 0, end: text.length, highlight: 'normal' }];
}

export function getTextSubsections(
  textSections: Array<TextSection>,
  index: number,
  length: number
): Array<TextSection> {
  const textSubsections = [];

  textSections.forEach(section => {
    const beginsInSection = section.start <= index && index < section.end;
    const endsInSection = section.start < index + length &&
      index + length <= section.end;
    const overlapsSection = index <= section.start &&
      section.end <= index + length;
    const doesIntersect = beginsInSection || endsInSection || overlapsSection;

    if (doesIntersect) {
      const sectionStart = section.start - index;
      const start = Math.max(0, sectionStart);
      const sectionEnd = section.end - index;
      const end = Math.min(length, sectionEnd);

      textSubsections.push({
        ...section,
        start,
        end,
        text: section.text.substr(start - sectionStart, end - start),
      });
    }
  });
  return textSubsections;
}

export function getTextSections(
  text: string,
  selectedWord: ?string,
  selectedLocation: ?RawLocation,
  lineIndex: number
) {
  if (selectedWord == null) {
    return getTextOnlySection(text);
  }
  let index = text.indexOf(selectedWord);
  if (index === -1) {
    return getTextOnlySection(text);
  }
  const sections = [];
  let fromIndex = 0;
  while (index !== -1) {
    if (index > fromIndex) {
      sections.push({
        text: text.substr(fromIndex, index - fromIndex),
        start: fromIndex,
        end: index,
        highlight: 'normal',
      });
    }
    fromIndex = selectedWord.length + index;
    const isCurrent = selectedLocation != null &&
      lineIndex === selectedLocation.lineIndex &&
      index === selectedLocation.start;
    sections.push({
      text: selectedWord,
      start: index,
      end: fromIndex,
      highlight: isCurrent ? 'current' : 'highlight',
    });
    index = text.indexOf(selectedWord, fromIndex);
  }
  if (text.length > fromIndex) {
    sections.push({
      text: text.substr(fromIndex, text.length - fromIndex),
      start: fromIndex,
      end: text.length,
      highlight: 'normal',
    });
  }
  return sections;
}

export function processLine(
  text: string,
  rawLineIndex: number,
  maxCharacters: number,
  selectedWord: ?string,
  selectedLocation: ?RawLocation,
  selectedLineIndex: ?number,
  isEditing: boolean
): Lines {
  const isSelected = rawLineIndex === selectedLineIndex;
  if (rawLineIndex === selectedLineIndex && isEditing) {
    return [
      {
        start: 0,
        text,
        rawLineIndex,
        isEditing: true,
        continuing: false,
        continued: false,
        textSections: [],
        isSelected,
      },
    ];
  }

  const textSections = getTextSections(
    text,
    selectedWord,
    selectedLocation,
    rawLineIndex
  );
  if (text.length <= maxCharacters) {
    return [
      {
        text,
        textSections,
        rawLineIndex,
        start: 0,
        end: text.length,
        continuing: false,
        continued: false,
        isEditing: false,
        isSelected,
      },
    ];
  }
  let index = 0;
  const entries: Lines = [];

  while (index < text.length) {
    const continuing = index > 0;
    const maxLength = maxCharacters -
      (continuing ? CONTINUING_STRING.length : 0);
    const continued = index + maxLength < text.length;
    const length = maxLength - (continued ? CONTINUED_STRING.length : 0);
    entries.push({
      text: text.substr(index, length),
      textSections: getTextSubsections(textSections, index, length),
      continued,
      continuing,
      rawLineIndex,
      start: index,
      end: index + length,
      isEditing: false,
      isSelected,
    });
    index += length;
  }
  return entries;
}

export function getMaxCharacters(width: number): number {
  const maxCharacters = Math.floor(width / CHARACTER_WIDTH);
  // the math gets messed up if the maxCharacters is too small
  if (maxCharacters - CONTINUED_STRING.length - CONTINUING_STRING.length < 1) {
    throw new Error('invalid width provided');
  }
  return maxCharacters;
}

export function processLines(
  data: string,
  maxCharacters: number,
  selectedWord: ?string,
  selectedLocation: ?RawLocation,
  selectedLineIndex: ?number,
  isEditing: boolean
): Lines {
  const combinedLines: Array<Lines> = data
    .split('\n')
    .map((text, rawLineIndex) =>
      processLine(
        text,
        rawLineIndex,
        maxCharacters,
        selectedWord,
        selectedLocation,
        selectedLineIndex,
        isEditing
      ));
  const flattened: Lines = [];
  combinedLines.forEach(item => {
    item.forEach(subitem => {
      flattened.push(subitem);
    });
  });
  return flattened;
}

export function getEditingRawLineIndex(lines: Lines): ?number {
  const line = lines.find((line: Line) => line.isEditing);
  if (line == null) {
    return null;
  }
  return line.rawLineIndex;
}

function getEditingLineIndex(lines: Lines): ?number {
  const index = lines.findIndex((line: Line) => line.isEditing);
  if (index < 0) {
    return null;
  }
  return index;
}

export const getTextWithEdit = (original: string, edit: Edit) =>
  original.substring(0, edit.start) +
  edit.replacement +
  original.substring(edit.end);

export function updateLinesWithEdit(
  lines: Lines,
  edit: Edit,
  width: number,
  selectedWord: ?string,
  selectedLocation: ?RawLocation
): Lines {
  const selectedLineIndex = getEditingLineIndex(lines);
  if (selectedLineIndex == null) {
    return lines;
  }

  const originalText = lines[selectedLineIndex].text;

  const text = getTextWithEdit(originalText, edit);

  const rawLineIndex = lines[selectedLineIndex].rawLineIndex;

  if (text.includes('\n')) {
    const pieces = text.split('\n');

    const maxCharacters = getMaxCharacters(width);

    const lines1 = processLine(
      pieces[0],
      rawLineIndex,
      maxCharacters,
      selectedWord,
      selectedLocation,
      selectedLineIndex + 1,
      true
    );

    const line2 = {
      start: 0,
      text: pieces[1],
      rawLineIndex: rawLineIndex + 1,
      isEditing: true,
      continuing: false,
      continued: false,
      isSelected: true,
      textSections: [],
    };

    const pre = lines.slice(0, selectedLineIndex);

    const post = lines.slice(selectedLineIndex + 1).map(line => ({
      ...line,
      rawLineIndex: line.rawLineIndex + 1,
    }));

    return [...pre, ...lines1, line2, ...post];
  }

  const line = {
    start: 0,
    text,
    rawLineIndex,
    isEditing: true,
    continuing: false,
    continued: false,
    isSelected: true,
    textSections: [],
    selection: null,
  };

  const pre = lines.slice(0, selectedLineIndex);

  const post = lines.slice(selectedLineIndex + 1);

  return [...pre, line, ...post];
}

export function updateLinesByDeletingNewline(
  lines: Lines,
  width: number,
  selectedWord: ?string,
  selectedLocation: ?RawLocation
): Lines {
  const selectedLineIndex = getEditingLineIndex(lines);
  if (selectedLineIndex == null || selectedLineIndex < 1) {
    return lines;
  }

  const line2 = lines[selectedLineIndex];

  const previousLineRawLineIndex = line2.rawLineIndex - 1;

  const previousLineIndex = lines.findIndex(
    line => line.rawLineIndex === previousLineRawLineIndex
  );

  const previousText = lines
    .filter(line => line.rawLineIndex === previousLineRawLineIndex)
    .map(line => line.text)
    .join('');

  const text = previousText + line2.text;

  const line = {
    start: 0,
    text,
    rawLineIndex: previousLineRawLineIndex,
    isEditing: true,
    continuing: false,
    continued: false,
    textSections: [],
    isSelected: true,
    selection: { start: previousText.length, end: previousText.length },
  };

  const pre = lines.slice(0, previousLineIndex);

  const post = lines.slice(selectedLineIndex + 1).map(l => ({
    ...l,
    rawLineIndex: l.rawLineIndex - 1,
  }));

  return [...pre, line, ...post];
}

function guessEditingLineHeight(line: Line, width: number) {
  const approxNumOfLines = Math.max(
    1,
    Math.ceil(line.text.length * CHARACTER_WIDTH / width)
  );
  return approxNumOfLines * CHARACTER_HEIGHT;
}

export function getLineLayout(
  data: Lines,
  index: number,
  editableLineHeight: ?number,
  width: number
) {
  const editingIndex = data.findIndex(line => line.isEditing);
  if (editingIndex == -1 || index < editingIndex) {
    return {
      length: CHARACTER_HEIGHT,
      offset: index * CHARACTER_HEIGHT,
      index,
    };
  }
  const calcEditableLineHeight = editableLineHeight ||
    guessEditingLineHeight(data[index], width);
  if (editingIndex == index) {
    return {
      length: calcEditableLineHeight,
      offset: index * CHARACTER_HEIGHT,
      index,
    };
  }

  return {
    length: CHARACTER_HEIGHT,
    offset: (index - 1) * CHARACTER_HEIGHT + calcEditableLineHeight,
    index,
  };
}

export function getMatchLocations(
  haystack: string,
  word: string,
  lineIndex: number
) {
  let index = haystack.indexOf(word);
  if (index === -1) {
    return [];
  }
  let fromIndex = 0;
  const locations = [];
  while (index !== -1) {
    fromIndex = word.length + index;
    locations.push({
      start: index,
      end: fromIndex,
      lineIndex,
    });
    index = haystack.indexOf(word, fromIndex);
  }
  return locations;
}

export function getAllMatchLocations(word: string, haystack: string) {
  return _.flatten(
    _.map(haystack.split('\n'), (line, index) =>
      getMatchLocations(line, word, index))
  );
}

export function getNextLocation(
  word: string,
  location: ?RawLocation,
  haystack: string
) {
  const lineIndex = location ? location.lineIndex : -1;
  const start = location ? location.start : -1;
  const locations = getAllMatchLocations(word, haystack);
  if (location === null) {
    return locations[0];
  }
  const nextLocation = _.find(
    locations,
    l =>
      l.lineIndex > lineIndex || (l.lineIndex === lineIndex && l.start > start)
  );
  return nextLocation || locations[0];
}

export function getPreviousLocation(
  word: string,
  location: RawLocation,
  haystack: string
) {
  const locations = getAllMatchLocations(word, haystack).reverse();
  if (location === null) {
    return locations[0];
  }
  const nextLocation = _.find(
    locations,
    l =>
      l.lineIndex < location.lineIndex ||
      (l.lineIndex === location.lineIndex && l.start < location.start)
  );
  return nextLocation || locations[0];
}

export function getDataWithReplaceWord(
  replacementWord: string,
  selectedLocation: RawLocation,
  data: string
) {
  const lines = data.split('\n').slice(0, selectedLocation.lineIndex);
  const newlineCharacterCount = selectedLocation.lineIndex;
  const charactersBeforeLine: number = lines
    .map(line => line.length)
    .reduce((sum, length) => length + sum, 0) + newlineCharacterCount;
  const start = charactersBeforeLine + selectedLocation.start;
  const end = charactersBeforeLine + selectedLocation.end;

  return data.slice(0, start) + replacementWord + data.slice(end);
}

// map from locations based on the items that can be line wrapped
// to locations based on the original data separated by newlines
export function getRawLocation(
  locations: Array<BufferLocation>,
  item: Line,
  itemIndex: number
) {
  let length = 0;
  let offsetStart = 0;
  locations.forEach(location => {
    if (location.lineIndex < itemIndex) {
      offsetStart -= location.length;
    }
    length += location.length;
  });

  if (offsetStart === 0) {
    offsetStart = locations[0].start;
  }

  const start = item.start + offsetStart;
  return {
    start,
    end: start + length,
    lineIndex: item.rawLineIndex,
  };
}

export const isCharacterIndexSelectedWord = (
  characterIndex: number,
  textSections: Array<TextSection>
): boolean =>
  textSections.find(
    textSection =>
      textSection.highlight === 'current' &&
      textSection.start <= characterIndex &&
      characterIndex < textSection.end
  ) !== undefined;

// returns the start index, the length, and if the word goes to the end of the
// string
export function locateWord(text: string, index: number) {
  if (!CHARACTER_REGEXP.test(text.charAt(index))) {
    return {
      hasWord: false,
      start: -1,
      length: 0,
      nextLinePossible: false,
      previousLinePossible: false,
    };
  }
  // start is the index of the first character that IS a word character
  // minimum value is 0
  let start = index;
  while (start > 0 && CHARACTER_REGEXP.test(text.charAt(start - 1))) {
    start -= 1;
  }
  // endIndex is the index of the first character, greater than start
  // that IS NOT a word character. maximum value is text.length
  let endIndex = index + 1;
  while (
    endIndex < text.length && CHARACTER_REGEXP.test(text.charAt(endIndex))
  ) {
    endIndex += 1;
  }
  return {
    hasWord: true,
    start,
    length: endIndex - start,
    nextLinePossible: endIndex === text.length,
    previousLinePossible: start === 0,
  };
}

export function multilineLocateWord(
  characterIndex: number,
  lineIndex: number,
  lines: Lines
) {
  let startLine = lines[lineIndex];
  const { text } = startLine;

  if (!(characterIndex < text.length)) {
    return { word: null, locations: [] };
  }

  let startLocation = locateWord(text, characterIndex);

  if (!startLocation.hasWord) {
    return { word: null, locations: [] };
  }

  let startLineIndex = lineIndex;
  let hasPrev = startLine.continuing && startLocation.previousLinePossible;
  while (hasPrev) {
    const prevLine = lines[startLineIndex - 1];
    const prevLocation = locateWord(prevLine.text, prevLine.text.length - 1);
    if (prevLocation.hasWord) {
      startLocation = prevLocation;
      startLine = prevLine;
      startLineIndex -= 1;
      hasPrev = prevLine.continuing && prevLocation.previousLinePossible;
    }
  }

  let word = '';

  const locations = [];

  let hasMore = true;
  let nextLineIndex = startLineIndex;
  let nextCharacterIndex = startLocation.start;
  while (hasMore) {
    const nextLine = lines[nextLineIndex];
    const nextLocation = locateWord(nextLine.text, nextCharacterIndex);
    if (nextLocation.hasWord) {
      locations.push({
        start: nextLocation.start,
        length: nextLocation.length,
        lineIndex: nextLineIndex,
      });
      word = word.concat(
        nextLine.text.substr(nextLocation.start, nextLocation.length)
      );
    }
    hasMore = nextLocation.hasWord &&
      nextLocation.nextLinePossible &&
      nextLine.continued;
    nextCharacterIndex = 0;
    nextLineIndex += 1;
  }

  return {
    word,
    locations,
  };
}

function getStartOfLine(lines: Lines, index: number): number {
  const sublines = lines.slice(0, index);
  const textLength = sublines.reduce(
    (total: number, line: Line) => line.text.length + total,
    0
  );
  const newlines = lines[index].rawLineIndex;
  return textLength + newlines;
}

function getHasMatchingIndex(text1: string, text2: string, index: number) {
  return index < text1.length &&
    index < text2.length &&
    text1[index] === text2[index];
}

export function getChangeTextEdit(lines: Lines, edit: Edit): ?Edit {
  const editingLineIndex = getEditingLineIndex(lines);
  if (editingLineIndex == null) {
    return null;
  }
  const lineStart = getStartOfLine(lines, editingLineIndex);

  return {
    ...edit,
    start: edit.start + lineStart,
    end: edit.end + lineStart,
  };
}

export function getDeleteLineEdit(lines: Lines): ?Edit {
  const editingLineIndex = getEditingLineIndex(lines);
  if (editingLineIndex == null || editingLineIndex < 1) {
    return null;
  }

  const end = getStartOfLine(lines, editingLineIndex);
  const start = end - 1;

  return {
    start,
    end,
    replacement: '',
  };
}

export function getIndexOfNewline(str: string, num: number): number {
  let index = -1;
  let newlineNum = -1;
  while (newlineNum < num && (index != -1 || newlineNum === -1)) {
    index = str.indexOf('\n', index + 1);
    newlineNum++;
  }
  return index;
}
