// @flow
import React, { PureComponent } from 'react';
import { StyleSheet, TextInput } from 'react-native';

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
type SelectionChangeEvent = {
  nativeEvent: { selection: { start: number, end: number } },
};
type State = {
  selection: {
    start: number,
    end: number,
  },
};

type Props = {
  text: string,
  onChangeActiveLine: (string) => void,
  onDeleteNewline: () => void,
};

export default class EditableLine extends PureComponent<void, Props, State> {
  state: State = {
    selection: {
      start: 0,
      end: 0,
    },
  };

  onKeyPress = (event: KeyPressEvent) => {
    if (
      event.nativeEvent.key === 'Backspace' &&
      this.state.selection.start === 0 &&
      this.state.selection.end === 0
    ) {
      this.props.onDeleteNewline();
    }
  };

  onChangeActiveLine = (text: string) => {
    this.props.onChangeActiveLine(text);
  };

  onSelectionChange = (event: SelectionChangeEvent) => {
    const { selection } = event.nativeEvent;
    this.setState(() => ({
      selection,
    }));
  };

  render() {
    return (
      <TextInput
        style={styles.textInput}
        value={this.props.text}
        autoFocus
        autoCapitalize="none"
        onChangeText={this.onChangeActiveLine}
        onKeyPress={this.onKeyPress}
        onSelectionChange={this.onSelectionChange}
        multiline
      />
    );
  }
}
