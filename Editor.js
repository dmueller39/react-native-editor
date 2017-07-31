import React, { Component } from 'react';

import PropTypes from 'prop-types';

import { StyleSheet, KeyboardAvoidingView, ViewPropTypes } from 'react-native';

import _ from 'lodash';

import Buffer from './Buffer';
import ControlBar from './ControlBar';
import TextInputBar from './TextInputBar';
import text, { replaceRange } from './text';

import { COMMANDS } from './constants';

const styles = StyleSheet.create({
  buffer: {
    overflow: 'hidden',
  },
  controlBar: {
    height: 44,
  },
});

export function getMatchLocations(haystack, word, lineIndex) {
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

function getAllMatchLocations(word, haystack) {
  return _.flatten(
    _.map(haystack.split('\n'), (line, index) =>
      getMatchLocations(line, word, index))
  );
}

function getNextLocation(word, location, haystack) {
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

function getPreviousLocation(word, location) {
  const locations = _.reverse(getAllMatchLocations(word, text));
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

function getDataWithReplaceWord(replacementWord, selectedLocation, data) {
  const lines = data.split('\n').slice(0, selectedLocation.lineIndex);
  const newlineCharacterCount = selectedLocation.lineIndex;
  const charactersBeforeLine = _.sum(_.map(lines, line => line.length)) +
    newlineCharacterCount;
  const start = charactersBeforeLine + selectedLocation.start;
  const end = charactersBeforeLine + selectedLocation.end;

  return data.slice(0, start) + replacementWord + data.slice(end);
}

export default class Editor extends Component {
  static defaultProps = {
    data: null,
    onUpdateData: () => {},
    style: null,
  };

  static propTypes = {
    dimensions: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
    }).isRequired,
    data: PropTypes.string,
    onUpdateData: PropTypes.func,
    style: ViewPropTypes.style,
  };

  constructor({ data }) {
    super();
    this.state = { data };
  }

  componentDidUpdate() {
    this.props.onUpdateData(this.state.data);
  }

  onPressNextSelection() {
    const selectedLocation = getNextLocation(
      this.state.selectedWord,
      this.state.selectedLocation,
      this.state.data
    );
    this.setState({ selectedLocation });
  }

  onPressPreviousSelection() {
    const selectedLocation = getPreviousLocation(
      this.state.selectedWord,
      this.state.selectedLocation,
      this.state.data
    );
    this.setState({ selectedLocation });
  }

  onPressNextLine() {
    const selectedLineIndex = Math.min(
      this.state.selectedLineIndex + 1,
      this.state.data.split('\n').length - 1
    );
    this.setState({ selectedLineIndex });
  }

  onPressDone() {
    // when we see a new line, we handle this as a committed action,
    // so that we are only ever editing a single line at a time
    // this means that every individual newline action can be undone
    const lines = this.state.data.split('\n');
    // line.length + 1 because we split on newlines
    const start = _.sum(
      lines.slice(0, this.state.selectedLineIndex).map(line => line.length + 1)
    );
    const end = start + lines[this.state.selectedLineIndex].length;
    // poor mans redux :)
    const action = replaceRange(
      this.state.data,
      start,
      end,
      this.state.activeLineText
    );
    const { data } = text(this.state, action);

    this.setState({
      data,
      command: COMMANDS.selectedLine,
      activeLineText: null,
    });
  }

  onPressPreviousLine() {
    const selectedLineIndex = Math.max(0, this.state.selectedLineIndex - 1);
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

  onSelectLine(selectedLineIndex) {
    const selectedLineTimestamp = +new Date();
    this.setState(oldState => {
      if (
        oldState.command === COMMANDS.selectedLine &&
        oldState.selectedLineIndex === selectedLineIndex &&
        selectedLineTimestamp - oldState.selectedLineTimestamp < 1000
      ) {
        const activeLineText = this.state.data.split('\n')[selectedLineIndex];
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

  onSelectWord(word, location) {
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

  onViewableItemsChanged(viewableItems) {
    this.setState({ viewableItems });
  }

  onChangeSelectedWord(selectedWord) {
    this.setState({
      selectedWord,
      selectedLocation: null,
    });
  }

  onConfirmGoToLine(line) {
    const selectedLineIndex = Number(line);
    this.setState({
      selectedWord: null,
      selectedLocation: null,
      selectedLineIndex,
      command: COMMANDS.selectedLine,
    });
  }

  onChangeGoToLineText(goToLineText) {
    this.setState({
      goToLineText,
      selectedWord: null,
      selectedLocation: null,
    });
  }

  onConfirmSelectedWord(selectedWord) {
    const selectedLocation = getNextLocation(
      selectedWord,
      this.state.selectedLocation,
      this.state.data
    );
    this.setState({
      command: selectedWord != null ? COMMANDS.selectedWord : null,
      selectedWord,
      selectedLocation,
    });
  }

  onChangeReplacementWord(replacementWord) {
    this.setState({
      replacementWord,
    });
  }

  onConfirmReplaceAll(replacementWord) {
    const regex = RegExp(this.state.selectedWord, 'g');
    const data = this.state.data.replace(regex, replacementWord);

    this.setState({
      data,
      command: COMMANDS.selectedWord,
      selectedWord: replacementWord,
      selectedLocation: null,
    });
  }

  onConfirmReplaceWord(replacementWord) {
    const data = getDataWithReplaceWord(
      replacementWord,
      this.state.selectedLocation,
      this.state.data
    );

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
    const activeLineText = this.state.data.split('\n')[
      this.state.selectedLineIndex
    ];
    this.setState({
      command: COMMANDS.insert,
      activeLineText,
    });
  }

  onChangeActiveLine(activeLineText) {
    const activeLines = activeLineText.split('\n');
    if (activeLines.length > 1) {
      // when we see a new line, we handle this as a committed action,
      // so that we are only ever editing a single line at a time
      // this means that every individual newline action can be undone
      const lines = this.state.data.split('\n');
      // line.length + 1 because we split on newlines
      const start = _.sum(
        lines
          .slice(0, this.state.selectedLineIndex)
          .map(line => line.length + 1)
      );
      const end = start + lines[this.state.selectedLineIndex].length;
      // poor mans redux :)
      let replacement = activeLineText;
      let newLineText = activeLines[1];
      if (activeLines[1] === '') {
        const spacing = activeLines[0].split(activeLines[0].trim())[0];
        replacement += spacing;
        newLineText += spacing;
      }

      const action = replaceRange(this.state.data, start, end, replacement);
      const { data } = text(this.state, action);

      const selectedLineIndex = this.state.selectedLineIndex + 1;

      this.setState({
        selectedLineIndex,
        activeLineText: newLineText,
        data,
      });
    } else {
      this.setState({
        activeLineText,
      });
    }
  }

  onDeleteNewline() {
    if (this.state.selectedLineIndex === 0) {
      return;
    }

    const lines = this.state.data.split('\n');

    const end = lines
      .slice(0, this.state.selectedLineIndex)
      .map(line => line.length + 1)
      .reduce((characters, accum) => characters + accum);

    const start = end - 1;
    // poor mans redux :)
    const action = replaceRange(this.state.data, start, end, '');
    const { data } = text(this.state, action);

    const selectedLineIndex = this.state.selectedLineIndex - 1;
    const activeLineText = data.split('\n')[selectedLineIndex];

    this.setState({
      selectedLineIndex,
      activeLineText,
      data,
    });
  }

  bufferActions = {
    onSelectWord: (word, location) => this.onSelectWord(word, location),
    onSelectSelectedWord: () => this.onSelectSelectedWord(),
    onSelectLine: index => this.onSelectLine(index),
    onChangeActiveLine: index => this.onChangeActiveLine(index),
    onDeleteNewline: () => this.onDeleteNewline(),
  };

  controlBarActions = {
    onPressNextSelection: () => this.onPressNextSelection(),
    onPressPreviousSelection: () => this.onPressPreviousSelection(),
    onPressX: () => this.onPressX(),
    onPressSearch: () => this.onPressSearch(),
    onChangeSelectedWord: t => this.onChangeSelectedWord(t),
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
    let label = null;
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
