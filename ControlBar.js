import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import Button from './Button';
import { COMMANDS } from './constants';

const TEXT_STYLES = {
  flex: 1,
  fontFamily: 'Courier New',
  fontSize: 15,
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#AAAAAA',
    flexDirection: 'row',
    height: 44,
    paddingLeft: 10,
    paddingRight: 10,
  },
  spacer: {
    flex: 1,
  },
  textInput: TEXT_STYLES,
  text: {
    ...TEXT_STYLES,
    alignSelf: 'center',
  },
});

export default function ControlBar(props) {
  const { actions } = props;
  switch (props.command) {
    case COMMANDS.search:
      return (
        <View style={styles.container}>
          <Button onPress={actions.onPressX} text="x" />
        </View>
      );
    case COMMANDS.selectedWord:
      return (
        <View style={styles.container}>
          <Button onPress={actions.onPressX} text="x" />
          <Button onPress={actions.onPressPreviousSelection} text="←" />
          <Button onPress={actions.onPressNextSelection} text="→" />
          <Button onPress={actions.onPressReplace} text="replace" />
        </View>
      );
    case COMMANDS.selectedLine:
      return (
        <View style={styles.container}>
          <Button onPress={actions.onPressX} text="x" />
          <Button onPress={actions.onPressPreviousLine} text="↑" />
          <Button onPress={actions.onPressNextLine} text="↓" />
          <View style={styles.spacer} />
          <Button onPress={actions.onPressEdit} text="✎" />
        </View>
      );
    case COMMANDS.replace:
      return (
        <View style={styles.container}>
          <Button onPress={actions.onPressX} text="x" />
          <Button selected onPress={actions.onPressReplace} text="replace" />
          <Button onPress={actions.onPressReplaceAll} text="replace all" />
        </View>
      );
    case COMMANDS.replaceAll:
      return (
        <View style={styles.container}>
          <Button onPress={actions.onPressX} text="x" />
          <Button onPress={actions.onPressReplace} text="replace" />
          <Button
            selected
            onPress={actions.onPressReplaceAll}
            text="replace all"
          />
        </View>
      );
    case COMMANDS.goToLine:
      return (
        <View style={styles.container}>
          <Button onPress={actions.onPressX} text="x" />
        </View>
      );
    case COMMANDS.insert:
      return (
        <View style={styles.container}>
          <Button onPress={actions.onPressX} text="x" />
          <View style={styles.spacer} />
          <Button onPress={actions.onPressDone} text="done" />
        </View>
      );
    default:
      return (
        <View style={styles.container}>
          <Button onPress={actions.onPressSearch} text="/abc/" />
          <Button onPress={actions.onPressEnterLine} text="#" />
          <View style={styles.spacer} />
        </View>
      );
  }
}

ControlBar.propTypes = {
  command: PropTypes.string,
  actions: PropTypes.shape({
    onPressNextSelection: PropTypes.func,
    onPressPreviousSelection: PropTypes.func,
    onPressNextLine: PropTypes.func,
    onPressPreviousLine: PropTypes.func,
    onPressX: PropTypes.func,
    onPressDone: PropTypes.func,
    onPressSearch: PropTypes.func,
    onPressEnterLine: PropTypes.func,
    onChangeSelectedWord: PropTypes.func,
    onPressReplaceAll: PropTypes.func,
    onPressRun: PropTypes.func,
  }),
};

ControlBar.defaultProps = {
  command: null,
  actions: {
    onPressNextSelection: () => {},
    onPressPreviousSelection: () => {},
    onPressNextLine: () => {},
    onPressPreviousLine: () => {},
    onPressX: () => {},
    onPressDone: () => {},
    onPressSearch: () => {},
    onPressEnterLine: () => {},
    onChangeSelectedWord: () => {},
    onPressReplaceAll: () => {},
    onPressRun: () => {},
  },
};
