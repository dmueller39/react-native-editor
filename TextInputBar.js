// @flow
import React from 'react';

import { StyleSheet, TextInput, View, Button } from 'react-native';
import { FONT_FAMILY } from './constants';

const styles = StyleSheet.create({
  textInput: {
    height: 44,
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    flex: 1,
  },
  container: {
    borderTopWidth: 1,
    borderTopColor: '#AAAAAA',
    flexDirection: 'row',
    height: 44,
    paddingLeft: 10,
    paddingRight: 10,
  },
});

type Props = {
  text: string,
  keyboardType: string,
  onChangeText: (string) => void,
  onConfirmText: (string) => void,
};

const defaultProps = {
  text: '',
  keyboardType: null,
  onChangeText: () => {},
  onConfirmText: () => {},
};

// TODO fix inline closure and callback to parent (this.state.text)

export default function TextInputBar(props: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        onChangeText={props.onChangeText}
        value={props.text}
        autoFocus
        keyboardType={props.keyboardType}
        autoCapitalize="none"
      />
      <Button title="✔" onPress={() => props.onConfirmText(props.text)} />
    </View>
  );
}

TextInputBar.defaultProps = defaultProps;
