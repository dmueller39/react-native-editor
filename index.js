// @flow
import React from "react";
import Editor, { type Props as EditorProps } from "./Editor";
import TextView, { type Props as TextViewProps } from "./TextView";

type EditorType = "editor" | "textview";

type HOCProps = { editorType?: ?EditorType };

type Props = EditorProps & TextViewProps & HOCProps;

export default function(props: Props) {
  const hocProps: HOCProps = props;
  if (hocProps.editorType === "textview") {
    const textViewProps: TextViewProps = props;
    return <TextView {...textViewProps} />;
  }
  const editorProps: EditorProps = props;
  return <Editor {...editorProps} />;
}
