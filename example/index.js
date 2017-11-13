import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View, Dimensions } from 'react-native';

import Editor from 'react-native-editor';

const data = `
foo
a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a
booo
`;

export default class EditorExample extends Component {
  render() {
    const dimensions = Dimensions.get('window');
    return (
      <View style={styles.container}>
        <Text style={styles.title}>react-native-editor - example</Text>
        <Editor
          dimensions={dimensions}
          data={data}
          style={styles.editor}
          isEditing={true}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editor: {
    flex: 1,
  },
  title: {
    backgroundColor: '#AAAAAA',
    paddingTop: 20,
  },
});

AppRegistry.registerComponent('EditorExample', () => EditorExample);
