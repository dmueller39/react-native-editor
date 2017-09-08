// @flow
import React, { PureComponent } from 'react';
import { Text, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';

import {
  getRawLocation,
  multilineLocateWord,
  isCharacterIndexSelectedWord,
} from './util';

import {
  type TextSection,
  type BufferLocation,
  type Lines,
  type Line,
  type PressEvent,
  type RawLocation,
} from './types';

import {
  CONTINUED_STRING,
  CONTINUING_STRING,
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

type Props = {
  item: Line,
  index: number,
  lines: Lines,
  onSelectLine: (Line) => void,
  // FIXME use a single type for describing a location
  onSelectWord: (string, RawLocation) => void,
};

export default class BufferLine extends PureComponent<void, Props, void> {
  onLinePress = (evt: PressEvent) => {
    const {
      item,
      index,
      lines,
      onSelectWord,
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

    onSelectLine(item);
  };

  render() {
    const {
      item: { continuing, continued, textSections, rawLineIndex, isSelected },
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

    const lineStyle = isSelected ? styles.selectedLine : styles.line;

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
