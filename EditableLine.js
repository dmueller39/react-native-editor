// @flow
import React, { PureComponent } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import type { Edit } from './Edit';

const styles = StyleSheet.create({
  textInput: {
    fontFamily: 'Courier New',
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
    backgroundColor: '#FDDD81',
  },
});

type KeyPressEvent = { nativeEvent: { key: string } };
type TextInputEvent = {
  nativeEvent: {
    eventCount: number,
    previousText: string,
    range: { end: number, start: number },
    target: number,
    text: string,
  },
};

type SelectionChangeEvent = {
  nativeEvent: { selection: { start: number, end: number } },
};

type Props = {
  selection: ?{
    start: number,
    end: number,
  },
  text: string,
  onCommitingEdit: (Edit[]) => void,
  onDeleteNewline: (Edit[]) => void,
};

type State = {
  selection: {
    start: number,
    end: number,
  },
  needsSelectionMatch: boolean,
};

export default class EditableLine extends PureComponent<void, Props, State> {
  edits: Edit[] = [];

  state: State = {
    selection: {
      start: 0,
      end: 0,
    },
    needsSelectionMatch: false,
  };

  constructor(props: Props) {
    super();
    const selection = props.selection;
    if (selection != null) {
      this.state = { ...this.state, selection, needsSelectionMatch: true };
    }
  }

  onComponentWillReceiveProps(props: Props) {
    if (props.text != this.props.text) {
      this.edits = [];
    }
    const selection = props.selection;
    if (
      selection != null &&
      selection.start != this.state.selection.start &&
      selection.end != this.state.selection.end
    ) {
      this.setState(() => ({
        selection,
        needsSelectionMatch: true,
      }));
    }
  }

  getEdits(): Edit[] {
    return this.edits;
  }

  onKeyPress = (event: KeyPressEvent) => {
    if (
      event.nativeEvent.key === 'Backspace' &&
      this.state.selection.start === 0 &&
      this.state.selection.end === 0
    ) {
      this.props.onDeleteNewline(this.edits);
      this.edits = [];
    }
  };

  onTextInput = (event: TextInputEvent) => {
    const edit: Edit = {
      ...event.nativeEvent.range,
      replacement: event.nativeEvent.text,
    };
    this.edits.push(edit);
    if (edit.replacement.includes('\n')) {
      // commit the edits on newlines and reset
      this.props.onCommitingEdit(this.edits);
      this.edits = [];
    }
  };

  onSelectionChange = (event: SelectionChangeEvent) => {
    const { selection } = event.nativeEvent;
    if (this.state.needsSelectionMatch) {
      this.setState(() => ({
        needsSelectionMatch: false,
      }));
    } else {
      this.setState(() => ({
        needsSelectionMatch: false,
        selection,
      }));
    }
  };

  render() {
    return (
      <TextInput
        multiline
        style={styles.textInput}
        defaultValue={this.props.text}
        autoCorrect={false}
        autoFocus
        autoCapitalize="none"
        onTextInput={this.onTextInput}
        onKeyPress={this.onKeyPress}
        onSelectionChange={this.onSelectionChange}
        selection={this.state.selection}
      />
    );
  }
}
