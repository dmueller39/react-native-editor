import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FlatList } from 'react-native';

import _ from 'lodash';

import EditableLine from './EditableLine';
import BufferLine from './BufferLine';

import {
  CONTINUED_STRING,
  CONTINUING_STRING,
  CHARACTER_WIDTH,
  CHARACTER_HEIGHT,
} from './constants';

function getTextOnlySection(text) {
  return [{ text, start: 0, end: text.length, highlight: 'normal' }];
}

export function getTextSubsections(textSections, index, length) {
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
  text,
  selectedWord,
  selectedLocation,
  lineIndex
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
  data,
  width,
  selectedWord,
  selectedLocation,
  selectedLineIndex,
  activeLineText
) {
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
  return _.flatten(combinedLines);
}

function getLineLayout(data, index) {
  return { length: CHARACTER_HEIGHT, offset: index * CHARACTER_HEIGHT, index };
}

export default class Buffer extends PureComponent {
  static defaultProps = {
    selectedWord: null,
    selectedLineIndex: null,
    activeLineText: null,
  };

  static propTypes = {
    // TODO fix these eslint errors by properly implementing flow
    onSelectLine: PropTypes.func.isRequired,
    onSelectWord: PropTypes.func.isRequired,
    onSelectSelectedWord: PropTypes.func.isRequired,
    data: PropTypes.string.isRequired,
    selectedWord: PropTypes.string,
    selectedLineIndex: PropTypes.number,
    activeLineText: PropTypes.string,
    width: PropTypes.number.isRequired,
    selectedLocation: PropTypes.number.isRequired,
  };

  constructor(props) {
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

  componentWillReceiveProps(nextProps) {
    this.lines = processLines(
      nextProps.data,
      nextProps.width,
      nextProps.selectedWord,
      nextProps.selectedLocation,
      nextProps.selectedLineIndex,
      nextProps.activeLineText
    );
  }
  componentDidUpdate(prevProps) {
    if (
      this.props.selectedLocation != null &&
      !_.isEqual(this.props.selectedLocation, prevProps.selectedLocation)
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

  onViewableItemsChanged = ({ viewableItems }) => {
    this.viewableItems = viewableItems;
  };

  scrollToRawLineIndex(rawLineIndex) {
    const viewableSelectedItem = _.find(
      this.viewableItems,
      viewableItem => viewableItem.item.rawLineIndex === rawLineIndex
    );

    // don't scroll if the line is already visible
    if (viewableSelectedItem == null) {
      const index = _.findIndex(
        this.lines,
        line => line.rawLineIndex === rawLineIndex
      );
      this.flatListRef.scrollToIndex({
        index,
        viewPosition: 0.5,
        animated: false,
      });
    }
  }

  captureRef = ref => {
    this.flatListRef = ref;
  };

  renderItem = param => {
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
        keyExtractor={(item, index) => `line-${index}`}
        windowSize={5}
        data={this.lines}
        renderItem={this.renderItem}
      />
    );
  }
}
