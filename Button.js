import React from 'react';
import PropTypes from 'prop-types';
import { TouchableHighlight, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  buttonText: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    minWidth: 44,
    textAlign: 'center',
    fontFamily: 'Courier New',
  },
  button: {
    alignSelf: 'center',
  },
  selected: {
    textDecorationLine: 'underline',
  },
});

const getTextStyles = ({ selected }) =>
  selected ? [styles.selected, styles.buttonText] : styles.buttonText;

export default function Button(props) {
  return (
    <TouchableHighlight style={styles.button} onPress={props.onPress}>
      <Text style={getTextStyles(props)}>{props.text}</Text>
    </TouchableHighlight>
  );
}

Button.propTypes = {
  text: PropTypes.string,
  onPress: PropTypes.func,
};

Button.defaultProps = {
  text: '',
  onPress: () => {},
};
