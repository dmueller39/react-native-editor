import React from 'react';
import { Text, StyleSheet, Platform, Alert, Linking } from 'react-native';

const styles = StyleSheet.create({
  warning: {
    fontWeight: 'bold',
    backgroundColor: '#FFA500',
    color: 'white',
  },
});

const ISSUE_URL = 'https://github.com/dmueller39/react-native-editor/issues/4';

function showWarningExplanation() {
  Alert.alert(
    null,
    `Searching and navigation are supported, but editing is not. Please see ${ISSUE_URL} for more details.`,
    [
      { text: 'Close' },
      {
        text: 'Go To Issue',
        onPress: () => Linking.openURL(ISSUE_URL),
      },
    ]
  );
}

export default function WarningView() {
  if (Platform.OS == 'android') {
    return (
      <Text onPress={showWarningExplanation} style={styles.warning}>
        Android not supported. Tap for more details.
      </Text>
    );
  }
  return null;
}
