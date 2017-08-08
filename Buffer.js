import React, { PureComponent } from 'react';
import { FlatList } from 'react-native';

import _ from 'lodash';

import {
  type TextSection,
  type Item,
  type Lines,
  type RawLocation,
  isLocationEqual,
} from './types';

import EditableLine from './EditableLine';
import BufferLine from './BufferLine';

import {
  CONTINUED_STRING,
  CONTINUING_STRING,
  CHARACTER_WIDTH,
  CHARACTER_HEIGHT,
} from './constants';

function getTextOnlySection(text: string): Array<TextSection> {
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
  selectedWord: string,
  selectedLocation: RawLocation,
  lineIndex: number
) {
  let index = selectedWord ? text.indexOf(selectedWord) : -1;
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

function processLines(
  data: string,
  width: number,
  selectedWord: string,
  selectedLocation: RawLocation,
  selectedLineIndex: number,
  activeLineText: string
): Lines {
  const maxCharacters = Math.floor(width / CHARACTER_WIDTH);
  const combinedLines = data.split('\n').map((text, rawLineIndex) => {
    if (rawLineIndex === selectedLineIndex && activeLineText != null) {
      return { text, rawLineIndex, activeLineText, isEditing: true };
    }
    const textSections = getTextSections(
      text,
      selectedWord,
      selectedLocation,
      rawLineIndex
    );
    if (text.length <= maxCharacters) {
      return { text, textSections, rawLineIndex, start: 0, end: text.length };
    }
    let index = 0;
    const entries = [];
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
      });
      index += length;
    }
    return entries;
  });
  const flattened = [];
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

function getLineLayout(data: string, index: number) {
  return { length: CHARACTER_HEIGHT, offset: index * CHARACTER_HEIGHT, index };
}

const defaultProps = {
  selectedWord: null,
  selectedLineIndex: null,
  activeLineText: null,
};

type DefaultProps = typeof defaultProps;

type Props = {
  onSelectLine: (number) => void,
  onSelectWord: (string, RawLocation) => void,
  onSelectSelectedWord: () => void,
  data: string,
  selectedWord: string,
  selectedLineIndex: number,
  activeLineText: string,
  width: number,
  selectedLocation: RawLocation,
};

export default class Buffer extends PureComponent<DefaultProps, Props, void> {
  static defaultProps = defaultProps;

  constructor(props: Props) {
    super();
    this.lines = processLines(
      props.data,
      props.width,
      props.selectedWord,
      props.selectedLocation,
      props.selectedLineIndex,
      props.activeLineText
    );
  }

  componentWillReceiveProps(nextProps: Props) {
    this.lines = processLines(
      nextProps.data,
      nextProps.width,
      nextProps.selectedWord,
      nextProps.selectedLocation,
      nextProps.selectedLineIndex,
      nextProps.activeLineText
    );
  }
  componentDidUpdate(prevProps: Props) {
    if (
      this.props.selectedLocation != null &&
      isLocationEqual(this.props.selectedLocation, prevProps.selectedLocation)
    ) {
      this.scrollToRawLineIndex(this.props.selectedLocation.lineIndex);
    }

    if (
      this.props.selectedLineIndex != null &&
      this.props.selectedLineIndex !== prevProps.selectedLineIndex
    ) {
      this.scrollToRawLineIndex(this.props.selectedLineIndex);
    }
  }

  onViewableItemsChanged = (info: { viewableItems: Array<{ item: Item }> }) => {
    this.viewableItems = info.viewableItems;
  };

  flatListRef: FlatList<Item>;
  lines: Lines = [];
  viewableItems: Array<{ item: Item }> = [];
  scrollToRawLineIndex(rawLineIndex: number) {
    const viewableSelectedItem = this.viewableItems.find(
      viewableItem => viewableItem.item.rawLineIndex === rawLineIndex
    );

    // don't scroll if the line is already visible
    if (viewableSelectedItem == null) {
      const index = this.lines.findIndex(
        line => line.rawLineIndex === rawLineIndex
      );
      this.flatListRef.scrollToIndex({
        index,
        viewPosition: 0.5,
        animated: false,
      });
    }
  }

  captureRef = (ref: FlatList<Item>) => {
    this.flatListRef = ref;
  };

  renderItem = (param: { item: Item }) => {
    if (param.item.isEditing) {
      return <EditableLine {...this.props} text={param.item.activeLineText} />;
    }
    return (
      <BufferLine
        {...this.props}
        onSelectLine={this.props.onSelectLine}
        onSelectWord={this.props.onSelectWord}
        onSelectSelectedWord={this.props.onSelectSelectedWord}
        {...param}
        lines={this.lines}
      />
    );
  };

  render() {
    return (
      <FlatList
        {...this.props}
        ref={this.captureRef}
        getItemLayout={getLineLayout}
        onViewableItemsChanged={this.onViewableItemsChanged}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item: void, index: number) => `line-${String(index)}`}
        windowSize={5}
        data={this.lines}
        renderItem={this.renderItem}
      />
    );
  }
}
