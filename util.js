// @flow

import _ from 'underscore';

import {
  type TextSection,
  type Lines,
  type Line,
  type RawLocation,
} from './types';

import {
  CONTINUED_STRING,
  CONTINUING_STRING,
  CHARACTER_WIDTH,
  CHARACTER_HEIGHT,
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
    const endsInSection =
      section.start < index + length && index + length <= section.end;
    const overlapsSection =
      index <= section.start && section.end <= index + length;
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
    const isCurrent =
      selectedLocation != null &&
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

export function processLines(
  data: string,
  width: number,
  selectedWord: ?string,
  selectedLocation: ?RawLocation,
  selectedLineIndex: ?number,
  activeLineText: ?string
): Lines {
  if (width < CHARACTER_WIDTH) {
    throw new Error('invalid width provided');
  }
  const maxCharacters = Math.floor(width / CHARACTER_WIDTH);
  const combinedLines: Array<Line | Lines> = data
    .split('\n')
    .map((text, rawLineIndex) => {
      if (rawLineIndex === selectedLineIndex && activeLineText != null) {
        return {
          start: 0,
          text,
          rawLineIndex,
          activeLineText,
          isEditing: true,
          continuing: false,
          continued: false,
          textSections: [],
        };
      }
      const textSections = getTextSections(
        text,
        selectedWord,
        selectedLocation,
        rawLineIndex
      );
      if (text.length <= maxCharacters) {
        return {
          text,
          textSections,
          rawLineIndex,
          start: 0,
          end: text.length,
          continuing: false,
          continued: false,
          activeLineText,
        };
      }
      let index = 0;
      const entries: Lines = [];
      while (index < text.length) {
        const continuing = index > 0;
        const maxLength =
          maxCharacters - (continuing ? CONTINUING_STRING.length : 0);
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
          activeLineText,
        });
        index += length;
      }
      return entries;
    });
  const flattened: Lines = [];
  combinedLines.forEach(item => {
    if (Array.isArray(item)) {
      item.forEach(subitem => {
        flattened.push(subitem);
      });
    } else {
      flattened.push(item);
    }
  });
  // TODO resolve this
  return flattened;
}

export function getLineLayout(data: string, index: number) {
  return { length: CHARACTER_HEIGHT, offset: index * CHARACTER_HEIGHT, index };
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
      getMatchLocations(line, word, index)
    )
  );
}

export function getNextLocation(
  word: string,
  location: RawLocation,
  haystack: string
) {
  const locations = getAllMatchLocations(word, haystack);
  if (location === null) {
    return locations[0];
  }
  const nextLocation = _.find(
    locations,
    l =>
      l.lineIndex > location.lineIndex ||
      (l.lineIndex === location.lineIndex && l.start > location.start)
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
  const charactersBeforeLine: number =
    lines.map(line => line.length).reduce((sum, length) => length + sum, 0) +
    newlineCharacterCount;
  const start = charactersBeforeLine + selectedLocation.start;
  const end = charactersBeforeLine + selectedLocation.end;

  return data.slice(0, start) + replacementWord + data.slice(end);
}

export function getStartOfLineIndex(
  index: number,
  lines: Array<string>
): number {
  return lines
    .slice(0, index)
    .map(line => line.length + 1)
    .reduce((sum, el) => sum + el, 0);
}
