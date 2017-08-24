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

const styles = StyleSheet.create({
  buffer: {
    overflow: 'hidden',
  },
  controlBar: {
    height: 44,
  },
});

export function getMatchLocations(
  haystack: string,
  word: string,
  lineIndex: number
) {
  let index = haystack.indexOf(word);
  if (index === -1) {
    return [];
  }
  let fromIndex = 0;
  const locations = [];
  while (index !== -1) {
    fromIndex = word.length + index;
    locations.push({
      start: index,
      end: fromIndex,
      lineIndex,
    });
    index = haystack.indexOf(word, fromIndex);
  }
  return locations;
}

function getAllMatchLocations(word: string, haystack: string) {
  return _.flatten(
    _.map(haystack.split('\n'), (line, index) =>
      getMatchLocations(line, word, index))
  );
}

function getNextLocation(
  word: string,
  location: RawLocation,
  haystack: string
) {
  const locations = getAllMatchLocations(word, haystack);
  if (location === null) {
    return locations[0];
  }
  const nextLocation = _.find(
    locations,
    l =>
      l.lineIndex > location.lineIndex ||
      (l.lineIndex === location.lineIndex && l.start > location.start)
  );
  return nextLocation || locations[0];
}

function getPreviousLocation(
  word: string,
  location: RawLocation,
  haystack: string
) {
  const locations = getAllMatchLocations(word, haystack).reverse();
  if (location === null) {
    return locations[0];
  }
  const nextLocation = _.find(
    locations,
    l =>
      l.lineIndex < location.lineIndex ||
      (l.lineIndex === location.lineIndex && l.start < location.start)
  );
  return nextLocation || locations[0];
}

function getDataWithReplaceWord(
  replacementWord: string,
  selectedLocation: RawLocation,
  data: string
) {
  const lines = data.split('\n').slice(0, selectedLocation.lineIndex);
  const newlineCharacterCount = selectedLocation.lineIndex;
  const charactersBeforeLine: number = lines
    .map(line => line.length)
    .reduce((sum, length) => length + sum, 0) + newlineCharacterCount;
  const start = charactersBeforeLine + selectedLocation.start;
  const end = charactersBeforeLine + selectedLocation.end;

  return data.slice(0, start) + replacementWord + data.slice(end);
}

function getStartOfLineIndex(index: number, lines: Array<string>): number {
  return lines
    .slice(0, index)
    .map(line => line.length + 1)
    .reduce((sum, el) => sum + el, 0);
}

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
  onUpdateData: () => {},
  style?: ?StyleObj,
};

type State = {
  data?: string,
  selectedWord?: ?string,
  selectedLocation?: ?RawLocation,
  selectedLineIndex?: ?number,
  command?: ?string,
  activeLineText?: ?string,
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
    const { selectedLineIndex, activeLineText } = this.state;
    let { data } = this.state;
    if (selectedLineIndex == null || data == null || activeLineText == null) {
      return;
    }
    // when we see a new line, we handle this as a committed action,
    // so that we are only ever editing a single line at a time
    // this means that every individual newline action can be undone
    const lines = data.split('\n');
    const start = getStartOfLineIndex(selectedLineIndex, lines);
    const end = start + lines[selectedLineIndex].length;
    // poor mans redux :)
    const action = replaceRange(data, start, end, activeLineText);
    data = text({ data }, action).data;

    this.setState({
      data,
      command: COMMANDS.selectedLine,
      activeLineText: null,
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
        activeLineText: null,
      });
    } else {
      this.setState({
        command: null,
        selectedLocation: null,
        selectedWord: null,
        selectedLineIndex: null,
        activeLineText: null,
      });
    }
  }

  onSelectLine(selectedLineIndex: number) {
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
        const activeLineText = data.split('\n')[selectedLineIndex];
        return {
          command: COMMANDS.insert,
          activeLineText,
          selectedLineIndex,
        };
      }
      return {
        activeLineText: null,
        selectedLineTimestamp,
        selectedLineIndex,
        command: COMMANDS.selectedLine,
        selectedWord: null,
        selectedLocation: null,
      };
    });
  }

  onSelectWord(word: string, location: RawLocation) {
    this.setState({
      command: COMMANDS.selectedWord,
      selectedWord: word,
      selectedLocation: location,
      selectedLineIndex: null,
    });
  }

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
    const activeLineText = data.split('\n')[selectedLineIndex];
    this.setState({
      command: COMMANDS.insert,
      activeLineText,
    });
  }

  onChangeActiveLine(activeLineText: string) {
    const activeLines = activeLineText.split('\n');
    if (activeLines.length <= 1) {
      this.setState({
        activeLineText,
      });
      return;
    }
    let { data, selectedLineIndex } = this.state;
    if (data == null || selectedLineIndex == null) {
      return;
    }
    // when we see a new line, we handle this as a committed action,
    // so that we are only ever editing a single line at a time
    // this means that every individual newline action can be undone
    const lines = data.split('\n');
    // line.length + 1 because we split on newlines
    const start = getStartOfLineIndex(selectedLineIndex, lines);
    const end = start + lines[selectedLineIndex].length;
    // poor mans redux :)
    let replacement = activeLineText;
    let newLineText = activeLines[1];
    if (activeLines[1] === '') {
      const spacing = activeLines[0].split(activeLines[0].trim())[0];
      replacement += spacing;
      newLineText += spacing;
    }

    const action = replaceRange(data, start, end, replacement);
    data = text({ data }, action).data;

    selectedLineIndex += 1;

    this.setState({
      selectedLineIndex,
      activeLineText: newLineText,
      data,
    });
  }

  onDeleteNewline() {
    let { selectedLineIndex, data } = this.state;
    if (data == null || selectedLineIndex == null || selectedLineIndex === 0) {
      return;
    }

    const lines = data.split('\n');

    const end = getStartOfLineIndex(selectedLineIndex, lines);

    const start = end - 1;
    // poor mans redux :)
    const action = replaceRange(data, start, end, '');
    data = text({ data }, action).data;

    selectedLineIndex -= 1;
    const activeLineText = data.split('\n')[selectedLineIndex];

    this.setState({
      selectedLineIndex,
      activeLineText,
      data,
    });
  }

  bufferActions = {
    onSelectWord: (word: string, location: RawLocation) =>
      this.onSelectWord(word, location),
    onSelectSelectedWord: () => this.onSelectSelectedWord(),
    onSelectLine: (index: number) => this.onSelectLine(index),
    onChangeActiveLine: (t: string) => this.onChangeActiveLine(t),
    onDeleteNewline: () => this.onDeleteNewline(),
  };

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
          {...this.props}
          {...this.state}
          {...this.bufferActions}
          style={styles.buffer}
          width={this.props.dimensions.width}
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
