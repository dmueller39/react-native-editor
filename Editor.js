// @flow
import React, { Component } from 'react';

import { StyleSheet, KeyboardAvoidingView, Clipboard } from 'react-native';

import _ from 'underscore';
import {
  type StyleObj,
} from 'react-native/Libraries/StyleSheet/StyleSheetTypes';

import Buffer from './Buffer';
import ControlBar from './ControlBar';
import TextInputBar from './TextInputBar';
import WarningView from './WarningView';
import text, { replaceRange } from './text';

import { COMMANDS } from './constants';

import { type RawLocation } from './types';

import {
  getNextLocation,
  getPreviousLocation,
  getDataWithReplaceWord,
  getIndexOfNewline,
} from './util';

const styles = StyleSheet.create({
  buffer: {
    overflow: 'hidden',
  },
  controlBar: {
    height: 44,
  },
});

const defaultProps = {
  data: '',
  onUpdateData: () => {},
};

type Props = {
  dimensions: {
    width: number,
  },
  data: string,
  onUpdateData: () => void,
  style?: ?StyleObj,
};

type State = {
  data?: string,
  selectedWord?: ?string,
  selectedLocation?: ?RawLocation,
  selectedLineIndex?: ?number,
  command?: ?string,
  replacementWord?: ?string,
  goToLineText?: ?string,
  selectedLineTimestamp?: ?number,
};

type DefaultProps = typeof defaultProps;

export default class Editor extends Component<DefaultProps, Props, State> {
  static defaultProps = defaultProps;

  constructor({ data }: Props) {
    super();
    this.state = { data };
  }

  state: State = {};

  bufferRef: ?Buffer = null;

  captureBufferRef = (buffer: Buffer) => {
    this.bufferRef = buffer;
  };

  componentDidUpdate() {
    this.props.onUpdateData(this.state.data);
  }

  onChangeData = () => {};

  onPressNextSelection() {
    const { data, selectedWord } = this.state;
    let { selectedLocation } = this.state;
    if (selectedWord == null || data == null) {
      return;
    }
    selectedLocation = getNextLocation(selectedWord, selectedLocation, data);
    this.setState({ selectedLocation });
  }

  onPressPreviousSelection() {
    const { data, selectedWord } = this.state;
    let { selectedLocation } = this.state;
    if (selectedWord == null || selectedLocation == null || data == null) {
      return;
    }
    selectedLocation = getPreviousLocation(
      selectedWord,
      selectedLocation,
      data
    );
    this.setState({ selectedLocation });
  }

  onPressNextLine() {
    const { data } = this.state;
    let { selectedLineIndex } = this.state;
    if (selectedLineIndex == null || data == null) {
      return;
    }
    selectedLineIndex = Math.min(
      selectedLineIndex + 1,
      data.split('\n').length - 1 // FIXME
    );
    this.setState({ selectedLineIndex });
  }

  onPressPaste() {
    Clipboard.getString().then(contents => {
      const { selectedLineIndex, data } = this.state;
      if (selectedLineIndex == null || data == null) {
        return;
      }

      const index = getIndexOfNewline(data, selectedLineIndex);

      const newData = data.substring(0, index) +
        contents +
        data.substring(index);

      if (typeof contents === 'string' && typeof data === 'string') {
        this.setState({
          data: newData,
        });
      }
    });
  }

  onPressInsertDone() {
    const buffer = this.bufferRef;
    if (buffer == null) {
      return;
    }

    const initialData = this.state.data;

    if (initialData == null) {
      return;
    }

    const edits = buffer.getEdits();

    // TODO clean this section up, and figure out exactly what is going on with
    // ./text
    const textState = edits.reduce(
      (textState: { data: string }, edit) => {
        const action = replaceRange(
          textState.data,
          edit.start,
          edit.end,
          edit.replacement
        );
        return text(textState, action);
      },
      { data: initialData }
    );

    const selectedLineIndex = buffer.getEditingLineIndex();

    this.setState({
      data: textState.data,
      command: COMMANDS.selectedLine,
      selectedLineIndex,
    });
  }

  onPressPreviousLine() {
    let { selectedLineIndex } = this.state;
    if (selectedLineIndex == null) {
      return;
    }
    selectedLineIndex = Math.max(0, selectedLineIndex - 1);
    this.setState({ selectedLineIndex });
  }

  onPressX() {
    if (
      [COMMANDS.replace, COMMANDS.replaceAll].includes(this.state.command) &&
      this.state.selectedWord != null
    ) {
      this.setState({
        command: COMMANDS.selectedWord,
      });
    } else if (
      [COMMANDS.insert].includes(this.state.command) &&
      this.state.selectedLineIndex != null
    ) {
      this.setState({
        command: COMMANDS.selectedWord,
      });
    } else {
      this.setState({
        command: null,
        selectedLocation: null,
        selectedWord: null,
        selectedLineIndex: null,
      });
    }
  }

  onSelectLine = (selectedLineIndex: number) => {
    const selectedLineTimestamp = +new Date();
    this.setState((oldState: State) => {
      const { data } = oldState;
      if (data == null) {
        return {};
      }
      if (
        oldState.command === COMMANDS.selectedLine &&
        oldState.selectedLineIndex === selectedLineIndex &&
        selectedLineTimestamp - (oldState.selectedLineTimestamp || 0) < 1000
      ) {
        return {
          command: COMMANDS.insert,
          selectedLineIndex,
        };
      }
      return {
        selectedLineTimestamp,
        selectedLineIndex,
        command: COMMANDS.selectedLine,
        selectedWord: null,
        selectedLocation: null,
      };
    });
  };

  onSelectWord = (word: string, location: RawLocation) => {
    this.setState({
      command: COMMANDS.selectedWord,
      selectedWord: word,
      selectedLocation: location,
      selectedLineIndex: null,
    });
  };

  onSelectSelectedWord() {
    this.setState({
      command: COMMANDS.replace,
      replacementWord: this.state.selectedWord,
    });
  }

  onPressSearch() {
    this.setState({ command: COMMANDS.search });
  }

  onPressEnterLine() {
    this.setState({ command: COMMANDS.goToLine });
  }

  onChangeSelectedWord(selectedWord: string) {
    this.setState({
      selectedWord,
      selectedLocation: null,
    });
  }

  onConfirmGoToLine(line: string) {
    const selectedLineIndex = Number(line);
    this.setState({
      selectedWord: null,
      selectedLocation: null,
      selectedLineIndex,
      command: COMMANDS.selectedLine,
    });
  }

  onChangeGoToLineText(goToLineText: string) {
    this.setState({
      goToLineText,
      selectedWord: null,
      selectedLocation: null,
    });
  }

  onConfirmSelectedWord(selectedWord: string) {
    let { selectedLocation } = this.state;
    const { data } = this.state;
    if (data == null) {
      return;
    }

    selectedLocation = getNextLocation(selectedWord, selectedLocation, data);
    this.setState({
      command: selectedWord != null ? COMMANDS.selectedWord : null,
      selectedWord,
      selectedLocation,
    });
  }

  onChangeReplacementWord(replacementWord: string) {
    this.setState({
      replacementWord,
    });
  }

  onConfirmReplaceAll(replacementWord: string) {
    let { data } = this.state;
    const { selectedWord } = this.state;
    if (data == null || selectedWord == null) {
      return;
    }

    const regex = RegExp(selectedWord, 'g');
    // TODO handle this with ./text
    data = data.replace(regex, replacementWord);

    this.setState({
      data,
      command: COMMANDS.selectedWord,
      selectedWord: replacementWord,
      selectedLocation: null,
    });
  }

  onConfirmReplaceWord(replacementWord: string) {
    let { data } = this.state;
    const { selectedLocation } = this.state;
    if (data == null || selectedLocation == null) {
      return;
    }
    // TODO handle this with ./text
    data = getDataWithReplaceWord(replacementWord, selectedLocation, data);

    this.setState({
      data,
      command: COMMANDS.selectedWord,
      replacementWord,
    });
  }

  onPressReplace() {
    this.setState({
      command: COMMANDS.replace,
    });
  }

  onPressReplaceAll() {
    this.setState({
      command: COMMANDS.replaceAll,
    });
  }

  onPressEdit() {
    const { data, selectedLineIndex } = this.state;
    if (data == null || selectedLineIndex == null) {
      return;
    }
    this.setState({
      command: COMMANDS.insert,
    });
  }

  controlBarActions = {
    onPressNextSelection: () => this.onPressNextSelection(),
    onPressPreviousSelection: () => this.onPressPreviousSelection(),
    onPressX: () => this.onPressX(),
    onPressSearch: () => this.onPressSearch(),
    onChangeSelectedWord: (t: string) => this.onChangeSelectedWord(t),
    onPressEdit: () => this.onPressEdit(),
    onPressReplace: () => this.onPressReplace(),
    onPressReplaceAll: () => this.onPressReplaceAll(),
    onPressEnterLine: () => this.onPressEnterLine(),
    onPressPreviousLine: () => this.onPressPreviousLine(),
    onPressNextLine: () => this.onPressNextLine(),
    onPressInsertDone: () => this.onPressInsertDone(),
    onPressPaste: () => this.onPressPaste(),
  };

  renderTextInputBar() {
    let actions = null;
    let label: string = '';
    let keyboardType = 'default';
    switch (this.state.command) {
      case COMMANDS.search:
        actions = {
          onChangeText: word => this.onChangeSelectedWord(word),
          onConfirmText: word => this.onConfirmSelectedWord(word),
        };
        label = this.state.selectedWord || '';
        break;
      case COMMANDS.goToLine:
        actions = {
          onChangeText: line => this.onChangeGoToLineText(line),
          onConfirmText: line => this.onConfirmGoToLine(line),
        };
        keyboardType = 'numeric';
        label = this.state.goToLineText || '';
        break;
      case COMMANDS.replace:
        actions = {
          onChangeText: word => this.onChangeReplacementWord(word),
          onConfirmText: word => this.onConfirmReplaceWord(word),
        };
        label = this.state.replacementWord || '';
        break;
      case COMMANDS.replaceAll:
        actions = {
          onChangeText: word => this.onChangeReplacementWord(word),
          onConfirmText: word => this.onConfirmReplaceAll(word),
        };
        label = this.state.replacementWord || '';
        break;
      default:
        break;
    }
    // if there are no actions to take, then we shouldn't render the bar
    if (actions === null) {
      return null;
    }
    return (
      <TextInputBar text={label} keyboardType={keyboardType} {...actions} />
    );
  }

  render() {
    return (
      <KeyboardAvoidingView style={[this.props.style]} behavior="padding">
        <WarningView />
        <Buffer
          ref={this.captureBufferRef}
          onSelectWord={this.onSelectWord}
          onSelectLine={this.onSelectLine}
          onChangeData={this.onChangeData}
          style={styles.buffer}
          width={this.props.dimensions.width}
          isEditing={this.state.command === COMMANDS.insert}
          data={this.state.data}
          selectedWord={this.state.selectedWord}
          selectedLineIndex={this.state.selectedLineIndex}
          selectedLocation={this.state.selectedLocation}
        />
        {this.renderTextInputBar()}
        <ControlBar
          {...this.props}
          {...this.state}
          actions={this.controlBarActions}
          style={styles.controlBar}
        />
      </KeyboardAvoidingView>
    );
  }
}
