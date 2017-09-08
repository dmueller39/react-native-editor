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

import {
  processLines,
  getLineLayout,
  getMaxCharacters,
  processLine,
  updateLinesWithActiveText,
  updateLinesByDeletingNewline,
} from './util';

const defaultProps = {
  data: '',
  width: 320,
};

type DefaultProps = typeof defaultProps;

type Props = {
  onSelectLine: (number) => void,
  onSelectWord: (string, RawLocation) => void,
  onChangeData: () => void,
  data: string,
  width: number,
  isEditing: boolean,
  selectedWord: ?string,
  selectedLineIndex: ?number,
  selectedLocation: ?RawLocation,
};

type State = {
  lines: Lines,
};

export default class Buffer extends PureComponent<DefaultProps, Props, State> {
  static defaultProps = defaultProps;
  state = {
    lines: [],
  };

  constructor(props: Props) {
    super();

    if (props.width > 0) {
      const maxCharacters = getMaxCharacters(props.width);
      this.state = {
        lines: processLines(
          props.data,
          maxCharacters,
          props.selectedWord,
          props.selectedLocation,
          props.selectedLineIndex,
          props.isEditing
        ),
      };
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    this.updateLines(nextProps);
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

  updateLines(props: Props) {
    if (props.width > 0) {
      const maxCharacters = getMaxCharacters(props.width);
      this.setState(() => ({
        lines: processLines(
          props.data,
          maxCharacters,
          props.selectedWord,
          props.selectedLocation,
          props.selectedLineIndex,
          props.isEditing
        ),
      }));
    }
  }

  onViewableItemsChanged = (info: { viewableItems: Array<{ item: Line }> }) => {
    this.viewableItems = info.viewableItems;
  };

  onChangeActiveLine = (text: string) => {
    const index = this.props.selectedLineIndex;
    if (index == null) {
      throw new Error(
        'Cannot change a line when the selectedLineIndex is null'
      );
    }
    this.setState((oldState: State) => {
      return {
        lines: updateLinesWithActiveText(
          oldState.lines,
          text,
          this.props.width,
          this.props.selectedWord,
          this.props.selectedLocation
        ),
      };
    });
  };

  onDeleteNewline = () => {
    this.setState((oldState: State) => {
      return {
        lines: updateLinesByDeletingNewline(
          oldState.lines,
          this.props.width,
          this.props.selectedWord,
          this.props.selectedLocation
        ),
      };
    });
  };

  onSelectLine = (line: Line) => {
    this.props.onSelectLine(line.rawLineIndex);
  };

  onSelectWord = (word: string, location: RawLocation) => {
    this.props.onSelectWord(word, location);
  };

  flatListRef: FlatList<Line>;
  viewableItems: Array<{ item: Line }> = [];
  scrollToRawLineIndex(rawLineIndex: number) {
    const viewableSelectedItem = this.viewableItems.find(
      viewableItem => viewableItem.item.rawLineIndex === rawLineIndex
    );

    // don't scroll if the line is already visible
    if (viewableSelectedItem == null) {
      const index = this.state.lines.findIndex(
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
    if (param.item.isEditing) {
      return (
        <EditableLine
          onChangeActiveLine={this.onChangeActiveLine}
          onDeleteNewline={this.onDeleteNewline}
          text={param.item.text}
        />
      );
    }
    return (
      <BufferLine
        selectedLineIndex={this.props.selectedLineIndex}
        onSelectLine={this.props.onSelectLine}
        onSelectWord={this.props.onSelectWord}
        {...param}
        lines={this.state.lines}
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
        data={this.state.lines}
        renderItem={this.renderItem}
      />
    );
  }
}
