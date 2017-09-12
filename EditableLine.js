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
  text: string,
  onCommitingEdit: (Edit[]) => void,
  onDeleteNewline: () => void,
};

export default class EditableLine extends PureComponent<void, Props, void> {
  edits: Edit[] = [];

  selection: {
    start: number,
    end: number,
  } = { start: 0, end: 0 };

  onComponentWillReceiveProps(props: Props) {
    if (props.text != this.props.text) {
      this.edits = [];
    }
  }

  getEdits(): Edit[] {
    return this.edits;
  }

  onKeyPress = (event: KeyPressEvent) => {
    if (
      event.nativeEvent.key === 'Backspace' &&
      this.selection.start === 0 &&
      this.selection.end === 0
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
    this.selection = selection;
  };

  render() {
    if (this.edits.length > 0) {
      throw new Error('Rendering inconsistency');
    }
    return (
      <TextInput
        style={styles.textInput}
        defaultValue={this.props.text}
        autoCorrect={false}
        autoFocus
        autoCapitalize="none"
        onTextInput={this.onTextInput}
        onKeyPress={this.onKeyPress}
        onSelectionChange={this.onSelectionChange}
        multiline
      />
    );
  }
}
