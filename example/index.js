import React, { Component } from "react";
import { AppRegistry, StyleSheet, Text, View, Dimensions } from "react-native";

import Editor from "react-native-editor";

const data = `console.log('hello world');`;

export default class EditorExample extends Component {
  state = { isTextView: false };
  render() {
    const dimensions = Dimensions.get("window");
    return (
      <View style={styles.container}>
        <Text
          onPress={() => this.setState({ isTextView: !this.state.isTextView })}
          style={styles.title}
        >
          react-native-editor - tap to toggle types
        </Text>
        <Editor
          dimensions={dimensions}
          data={data}
          style={styles.editor}
          isEditing={true}
          editorType={this.state.isTextView ? "textview" : "editor"}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  editor: {
    flex: 1
  },
  title: {
    backgroundColor: "#AAAAAA",
    paddingTop: 20
  }
});

AppRegistry.registerComponent("EditorExample", () => EditorExample);
