// @flow
import React, { PureComponent } from 'react';
import { FlatList } from 'react-native';

import {
  type Line,
  type Lines,
  type RawLocation,
  isLocationEqual,
} from './types';

import EditableLine from './EditableLine';
import BufferLine from './BufferLine';

import { processLines, getLineLayout } from './util';

const defaultProps = {
  selectedWord: null,
  selectedLineIndex: null,
  activeLineText: null,
  data: '',
  width: 320,
  selectedLocation: null,
};

type DefaultProps = typeof defaultProps;

type Props = {
  onSelectLine: number => void,
  onSelectWord: (string, RawLocation) => void,
  onSelectSelectedWord: () => void,
  onChangeActiveLine: string => void,
  onDeleteNewline: () => void,
  data: string,
  selectedWord: ?string,
  selectedLineIndex: ?number,
  activeLineText: ?string,
  width: number,
  selectedLocation: ?RawLocation,
};

export default class Buffer extends PureComponent<DefaultProps, Props, void> {
  static defaultProps = defaultProps;

  constructor(props: Props) {
    super();
    if (props.width)
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
      prevProps.selectedLocation != null &&
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

  onViewableItemsChanged = (info: { viewableItems: Array<{ item: Line }> }) => {
    this.viewableItems = info.viewableItems;
  };

  flatListRef: FlatList<Line>;
  lines: Lines = [];
  viewableItems: Array<{ item: Line }> = [];
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

  captureRef = (ref: FlatList<Line>) => {
    this.flatListRef = ref;
  };

  renderItem = (param: { item: Line, index: number }) => {
    if (param.item.isEditing && param.item.activeLineText != null) {
      return (
        <EditableLine
          onChangeActiveLine={this.props.onChangeActiveLine}
          onDeleteNewline={this.props.onDeleteNewline}
          text={param.item.activeLineText}
        />
      );
    }
    return (
      <BufferLine
        selectedLineIndex={this.props.selectedLineIndex}
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
