// @flow
import React, { PureComponent } from 'react';
import { StyleSheet, TextInput, View, Text } from 'react-native';
import type { Edit } from './Edit';
import { getTextWithEdit } from './util';
import type { LayoutEvent } from './types';
import { FONT_FAMILY, FONT_SIZE, CHARACTER_HEIGHT } from './constants';

const styles = StyleSheet.create({
  textInput: {
    fontFamily: FONT_FAMILY,
    fontWeight: 'bold',
    fontSize: FONT_SIZE,
    backgroundColor: '#FDDD81',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    paddingTop: 0,
  },
  textMeasure: {
    fontFamily: FONT_FAMILY,
    fontWeight: 'bold',
    fontSize: FONT_SIZE,
    backgroundColor: '#FDDD81',
    paddingTop: 0,
    minHeight: CHARACTER_HEIGHT,
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
  onLayout: (LayoutEvent) => void,
};

type State = {
  selection: {
    start: number,
    end: number,
  },
  needsSelectionMatch: boolean,
  text: string,
};

export default class EditableLine extends PureComponent<void, Props, State> {
  edits: Edit[] = [];

  state: State = {
    selection: {
      start: 0,
      end: 0,
    },
    needsSelectionMatch: false,
    text: '',
  };

  constructor(props: Props) {
    super(props);
    const selection = props.selection;
    if (selection != null) {
      this.state = { ...this.state, selection, needsSelectionMatch: true };
    }
    this.state.text = props.text;
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

    this.setState((state: State) => ({
      text: getTextWithEdit(state.text, edit),
    }));

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
    // The Text does the measuring, the TextInput floats over the top,
    // matching the height
    return (
      <View onLayout={this.props.onLayout}>
        <Text style={styles.textMeasure}>
          {this.state.text}
        </Text>
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
          underlineColorAndroid="transparent"
        />
      </View>
    );
  }
}
