// @flow
import React, { Component } from 'react';

import { StyleSheet, KeyboardAvoidingView } from 'react-native';

import _ from 'underscore';
import {
  type StyleObj,
} from 'react-native/Libraries/StyleSheet/StyleSheetTypes';

import Buffer from './Buffer';
import ControlBar from './ControlBar';
import TextInputBar from './TextInputBar';
import text, { replaceRange } from './text';

import { COMMANDS } from './constants';

import { type RawLocation } from './types';

import {
  getNextLocation,
  getPreviousLocation,
  getStartOfLineIndex,
  getDataWithReplaceWord,
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
  style: null,
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

  componentDidUpdate() {
    this.props.onUpdateData(this.state.data);
  }

  onChangeData = () => {};

  onPressNextSelection() {
    const { data, selectedWord } = this.state;
    let { selectedLocation } = this.state;
    if (selectedWord == null || selectedLocation == null || data == null) {
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
      data.split('\n').length - 1
    );
    this.setState({ selectedLineIndex });
  }

  onPressDone() {
    const { selectedLineIndex } = this.state;
    let { data } = this.state;
    if (selectedLineIndex == null || data == null) {
      return;
    }
    // when we see a new line, we handle this as a committed action,
    // so that we are only ever editing a single line at a time
    // this means that every individual newline action can be undone
    const lines = data.split('\n');
    const start = getStartOfLineIndex(selectedLineIndex, lines);
    const end = start + lines[selectedLineIndex].length;
    // poor mans redux :)

    // FIXME get atomic changes from Buffer
    const action = replaceRange(data, start, end, '');
    data = text({ data }, action).data;

    this.setState({
      data,
      command: COMMANDS.selectedLine,
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
    if (data == null || selectedLocation == null) {
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
    onPressDone: () => this.onPressDone(),
  };

  renderTextInputBar() {
    let actions = null;
    let label: ?string = null;
    let keyboardType = 'default';
    switch (this.state.command) {
      case COMMANDS.search:
        actions = {
          onChangeText: word => this.onChangeSelectedWord(word),
          onConfirmText: word => this.onConfirmSelectedWord(word),
        };
        label = this.state.selectedWord;
        break;
      case COMMANDS.goToLine:
        actions = {
          onChangeText: line => this.onChangeGoToLineText(line),
          onConfirmText: line => this.onConfirmGoToLine(line),
        };
        keyboardType = 'numeric';
        label = this.state.goToLineText;
        break;
      case COMMANDS.replace:
        actions = {
          onChangeText: word => this.onChangeReplacementWord(word),
          onConfirmText: word => this.onConfirmReplaceWord(word),
        };
        label = this.state.replacementWord;
        break;
      case COMMANDS.replaceAll:
        actions = {
          onChangeText: word => this.onChangeReplacementWord(word),
          onConfirmText: word => this.onConfirmReplaceAll(word),
        };
        label = this.state.replacementWord;
        break;
      default:
        break;
    }
    // if there are no actions to take, then we shouldn't render the bar
    if (actions === null || label == null) {
      return null;
    }
    return (
      <TextInputBar text={label} keyboardType={keyboardType} {...actions} />
    );
  }

  render() {
    return (
      <KeyboardAvoidingView style={[this.props.style]} behavior="padding">
        <Buffer
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
