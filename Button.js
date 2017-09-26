// @flow
import React from 'react';
import { TouchableHighlight, Text, StyleSheet } from 'react-native';
import { FONT_FAMILY } from './constants';

const styles = StyleSheet.create({
  buttonText: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    minWidth: 44,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  button: {
    alignSelf: 'center',
  },
  selected: {
    textDecorationLine: 'underline',
  },
});

const getTextStyles = (selected: boolean) =>
  selected ? [styles.selected, styles.buttonText] : styles.buttonText;

type Props = {
  selected: boolean,
  text: string,
  onPress: () => void,
};

const defaultProps = {
  text: '',
  onPress: () => {},
};

export default function Button(props: Props) {
  return (
    <TouchableHighlight style={styles.button} onPress={props.onPress}>
      <Text style={getTextStyles(props.selected)}>{props.text}</Text>
    </TouchableHighlight>
  );
}

Button.defaultProps = defaultProps;
