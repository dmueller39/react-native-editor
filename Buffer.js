// @flow
import React, { PureComponent } from 'react';
import { FlatList } from 'react-native';

import {
  type Line,
  type Lines,
  type RawLocation,
  isLocationEqual,
} from './types';

import type { Edit } from './Edit';

import EditableLine from './EditableLine';
import BufferLine from './BufferLine';

import {
  processLines,
  getLineLayout,
  getMaxCharacters,
  processLine,
  updateLinesWithEdit,
  updateLinesByDeletingNewline,
  getEditingLineIndex,
  getChangeTextEdit,
  getDeleteLineEdit,
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
  edits: (?Edit)[],
};

export default class Buffer extends PureComponent<DefaultProps, Props, State> {
  static defaultProps = defaultProps;
  state = {
    lines: [],
    edits: [],
  };

  editableLineRef: ?EditableLine = null;

  constructor(props: Props) {
    super();

    if (props.width > 0) {
      const maxCharacters = getMaxCharacters(props.width);
      this.state = {
        edits: [],
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
    if (nextProps.width > 0) {
      const maxCharacters = getMaxCharacters(nextProps.width);
      const didChangeIsEditing = nextProps.isEditing != this.props.isEditing;
      this.setState(oldState => {
        // reset the edits if isEditing changes value
        const edits = didChangeIsEditing ? [] : oldState.edits;
        return {
          edits,
          lines: processLines(
            nextProps.data,
            maxCharacters,
            nextProps.selectedWord,
            nextProps.selectedLocation,
            nextProps.selectedLineIndex,
            nextProps.isEditing
          ),
        };
      });
    }
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

  captureEditableLineRef = (editableLine: EditableLine) => {
    this.editableLineRef = editableLine;
  };

  getUpdatedStateWithRawEdits(state: State, rawEdits: Edit[]): State {
    let lines = this.state.lines;

    const partialEdits = rawEdits.map(edit => {
      const absoluteEdit = getChangeTextEdit(lines, edit);
      lines = updateLinesWithEdit(
        lines,
        edit,
        this.props.width,
        this.props.selectedWord,
        this.props.selectedLocation
      );
      return absoluteEdit;
    });
    const edits = [...this.state.edits, ...partialEdits].filter(
      edit => edit != null
    );

    return { edits, lines };
  }

  getUpdatedStateWithRef(state: State, editableLine: ?EditableLine): State {
    if (editableLine == null) {
      return state;
    }
    return this.getUpdatedStateWithRawEdits(state, editableLine.getEdits());
  }

  getEdits(): Edit[] {
    const state = this.getUpdatedStateWithRef(this.state, this.editableLineRef);
    console.log(state.lines);
    console.log(state.edits);
    return state.edits;
  }

  getEditingLineIndex(): ?number {
    return getEditingLineIndex(this.state.lines);
  }

  onViewableItemsChanged = (info: { viewableItems: Array<{ item: Line }> }) => {
    this.viewableItems = info.viewableItems;
  };

  onChangeData = () => {
    // TODO determine if its the right pattern to pass `this` here. (No?)
    this.props.onChangeData();
  };

  onCommitingEdit = (rawEdits: Edit[]) => {
    this.setState(
      (oldState: State) => this.getUpdatedStateWithRawEdits(oldState, rawEdits),
      this.onChangeData
    );
  };

  onDeleteNewline = (rawEdits: Edit[]) => {
    this.setState(
      (oldState: State) => {
        const state = this.getUpdatedStateWithRawEdits(oldState, rawEdits);
        return {
          edits: [...state.edits, getDeleteLineEdit(state.lines)],
          lines: updateLinesByDeletingNewline(
            state.lines,
            this.props.width,
            this.props.selectedWord,
            this.props.selectedLocation
          ),
        };
      },
      this.onChangeData
    );
  };

  onSelectLine = (line: Line) => {
    const editingLine = this.state.lines.find(line => line.isEditing);
    if (editingLine != null) {
      // TODO if editing start editing selected line
      return;
    }
    this.props.onSelectLine(line.rawLineIndex);
  };

  onSelectWord = (word: string, location: RawLocation) => {
    const editingLine = this.state.lines.find(line => line.isEditing);
    if (editingLine != null) {
      // TODO if editing start editing selected line
      return;
    }
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

      if (index < 0) {
        throw new Error(`raw index not found (${rawLineIndex})`);
      }

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
          ref={this.captureEditableLineRef}
          onCommitingEdit={this.onCommitingEdit}
          onDeleteNewline={this.onDeleteNewline}
          text={param.item.text}
        />
      );
    }
    return (
      <BufferLine
        selectedLineIndex={this.props.selectedLineIndex}
        onSelectLine={this.onSelectLine}
        onSelectWord={this.onSelectWord}
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
