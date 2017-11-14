// @flow
import React, { Component } from "react";

import { TextInput, KeyboardAvoidingView } from "react-native";

import {
  type StyleObj
} from "react-native/Libraries/StyleSheet/StyleSheetTypes";

export type Props = {
  data: string,
  onUpdateData: (string) => void,
  style?: ?StyleObj
};

type State = {
  data: string
};

export default class Editor extends Component<Props, State> {
  static defaultProps = {
    data: "",
    onUpdateData: () => {}
  };

  constructor({ data }: Props) {
    super();
    this.state = { data };
  }

  state: State = { data: "" };

  onUpdateData = (data: string) => {
    this.props.onUpdateData(data);
    this.setState({ data });
  };

  render() {
    return (
      <KeyboardAvoidingView style={[this.props.style]} behavior="padding">
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          value={this.state.data}
          multiline
          onChangeText={this.onUpdateData}
        />
      </KeyboardAvoidingView>
    );
  }
}
