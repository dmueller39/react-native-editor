// @flow
import React, { PureComponent } from 'react';
import { Text, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';

import {
  type TextSection,
  type Location,
  type Item,
  type Lines,
  type PressEvent,
  type RawLocation,
} from './types';

import {
  CONTINUED_STRING,
  CONTINUING_STRING,
  CHARACTER_REGEXP,
  CHARACTER_WIDTH,
} from './constants';

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Courier New',
    fontSize: 14,
  },
  line: {},
  selectedLine: {
    backgroundColor: '#FDDD81',
  },
  continued: {
    backgroundColor: '#EEEEEE',
    color: '#888888',
  },
  continuing: {
    backgroundColor: '#EEEEEE',
    color: '#888888',
  },
  normal: {},
  highlight: {
    backgroundColor: '#FFBBBB',
  },
  current: {
    backgroundColor: '#FF8888',
  },
});

// map from locations based on the items that can be line wrapped
// to locations based on the original data separated by newlines
export function getRawLocation(
  locations: Array<Location>,
  item: Item,
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

const isCharacterIndexSelectedWord = (
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
function locateWord(text: string, index: number) {
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

function multilineLocateWord(
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
        ...nextLocation,
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

type Props = {
  item: Item,
  index: number,
  lines: Lines,
  onSelectLine: (number) => void,
  // FIXME use a single type for describing a location
  onSelectWord: (string, RawLocation) => void,
  onSelectSelectedWord: () => void,
  selectedLineIndex: number,
};

export default class BufferLine extends PureComponent<void, Props, void> {
  onLinePress = (evt: PressEvent) => {
    const {
      item,
      index,
      lines,
      onSelectWord,
      onSelectSelectedWord,
      onSelectLine,
      item: { textSections },
    } = this.props;
    // item.text is the raw string without the padding characters
    // evt.nativeEvent.locationX is the position of the tap in the screen with character
    // we want to find the character position in item.text
    // subtract the length of the padding string (if it exists)
    // locationX/characterWidth = characterIndex
    // find the full word at that index

    const continuingOffset = item.continuing
      ? CONTINUING_STRING.length * CHARACTER_WIDTH
      : 0;

    const characterIndex = Math.floor(
      (evt.nativeEvent.locationX - continuingOffset) / CHARACTER_WIDTH
    );

    if (isCharacterIndexSelectedWord(characterIndex, textSections)) {
      onSelectSelectedWord();
      return;
    }

    const { word, locations } = multilineLocateWord(
      characterIndex,
      index,
      lines
    );

    if (word != null) {
      const location = getRawLocation(locations, item, index);
      onSelectWord(word, location);
      return;
    }

    onSelectLine(item.rawLineIndex);
  };

  render() {
    const {
      item: { continuing, continued, textSections, rawLineIndex },
      selectedLineIndex,
    } = this.props;

    const textComponents = textSections.map(textSection => {
      const style = styles[textSection.highlight];
      return (
        <Text key={`${textSection.start}-index`} style={style}>
          {textSection.text}
        </Text>
      );
    });

    if (continuing) {
      textComponents.unshift(
        <Text style={styles.continuing} key="continuing-index">
          {CONTINUING_STRING}
        </Text>
      );
    }

    if (continued) {
      textComponents.push(
        <Text style={styles.continued} key="continued-index">
          {CONTINUED_STRING}
        </Text>
      );
    }

    const lineStyle = rawLineIndex === selectedLineIndex
      ? styles.selectedLine
      : styles.line;

    return (
      <TouchableWithoutFeedback onPress={this.onLinePress}>
        <View>
          <Text style={[lineStyle, styles.text]}>
            {textComponents}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}
