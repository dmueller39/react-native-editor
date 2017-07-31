import React from 'react';

import PropTypes from 'prop-types';

import { StyleSheet, TextInput, View, Button } from 'react-native';

const styles = StyleSheet.create({
  textInput: {
    height: 44,
    fontFamily: 'Courier New',
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

export default function TextInputBar(props) {
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

TextInputBar.propTypes = {
  text: PropTypes.string,
  keyboardType: PropTypes.string,
  onChangeText: PropTypes.func,
  onConfirmText: PropTypes.func,
};

TextInputBar.defaultProps = {
  text: '',
  keyboardType: null,
  onChangeText: () => {},
  onConfirmText: () => {},
};
