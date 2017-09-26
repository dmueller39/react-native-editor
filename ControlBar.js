import React from 'react';
import { View, StyleSheet } from 'react-native';

import Button from './Button';
import { COMMANDS, FONT_FAMILY } from './constants';

const TEXT_STYLES = {
  flex: 1,
  fontFamily: FONT_FAMILY,
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

type Props = {
  command: ?string,
  actions: {
    onPressNextSelection: () => void,
    onPressPreviousSelection: () => void,
    onPressNextLine: () => void,
    onPressPreviousLine: () => void,
    onPressX: () => void,
    onPressInsertDone: () => void,
    onPressSearch: () => void,
    onPressEnterLine: () => void,
    onPressReplaceAll: () => void,
    onPressReplace: () => void,
    onPressEdit: () => void,
    onPressPaste: () => void,
  },
};

const defaultProps = {
  command: null,
  actions: {
    onPressNextSelection: () => {},
    onPressPreviousSelection: () => {},
    onPressNextLine: () => {},
    onPressPreviousLine: () => {},
    onPressX: () => {},
    onPressInsertDone: () => {},
    onPressSearch: () => {},
    onPressEnterLine: () => {},
    onPressReplaceAll: () => {},
    onPressEdit: () => {},
    onPressPaste: () => {},
  },
};

export default function ControlBar(props: Props) {
  switch (props.command) {
    case COMMANDS.search:
      return (
        <View style={styles.container}>
          <Button onPress={props.actions.onPressX} text="x" />
        </View>
      );
    case COMMANDS.selectedWord:
      return (
        <View style={styles.container}>
          <Button onPress={props.actions.onPressX} text="x" />
          <Button onPress={props.actions.onPressPreviousSelection} text="←" />
          <Button onPress={props.actions.onPressNextSelection} text="→" />
          <Button onPress={props.actions.onPressReplace} text="replace" />
        </View>
      );
    case COMMANDS.selectedLine:
      return (
        <View style={styles.container}>
          <Button onPress={props.actions.onPressX} text="x" />
          <Button onPress={props.actions.onPressPreviousLine} text="↑" />
          <Button onPress={props.actions.onPressNextLine} text="↓" />
          <Button onPress={props.actions.onPressPaste} text="v" />
          <View style={styles.spacer} />
          <Button onPress={props.actions.onPressEdit} text="✎" />
        </View>
      );
    case COMMANDS.replace:
      return (
        <View style={styles.container}>
          <Button onPress={props.actions.onPressX} text="x" />
          <Button
            selected
            onPress={props.actions.onPressReplace}
            text="replace"
          />
          <Button
            onPress={props.actions.onPressReplaceAll}
            text="replace all"
          />
        </View>
      );
    case COMMANDS.replaceAll:
      return (
        <View style={styles.container}>
          <Button onPress={props.actions.onPressX} text="x" />
          <Button onPress={props.actions.onPressReplace} text="replace" />
          <Button
            selected
            onPress={props.actions.onPressReplaceAll}
            text="replace all"
          />
        </View>
      );
    case COMMANDS.goToLine:
      return (
        <View style={styles.container}>
          <Button onPress={props.actions.onPressX} text="x" />
        </View>
      );
    case COMMANDS.insert:
      return (
        <View style={styles.container}>
          <View style={styles.spacer} />
          <Button onPress={props.actions.onPressInsertDone} text="done" />
        </View>
      );
    default:
      return (
        <View style={styles.container}>
          <Button onPress={props.actions.onPressSearch} text="/abc/" />
          <Button onPress={props.actions.onPressEnterLine} text="#" />
          <View style={styles.spacer} />
        </View>
      );
  }
}

ControlBar.defaultProps = defaultProps;
