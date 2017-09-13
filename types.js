// @flow
export type BufferLocation = {
  lineIndex: number,
  start: number,
  length: number,
};

export type RawLocation = {
  start: number,
  end: number,
  lineIndex: number,
};

export type TextSection = {
  highlight: 'normal' | 'highlight' | 'current',
  start: number,
  end: number,
  text: string,
};

export type Line = {
  text: string,
  rawLineIndex: number,
  start: number,
  textSections: Array<TextSection>,
  continuing: boolean,
  continued: boolean,
  isEditing: boolean,
  isSelected: boolean,
  selection?: ?{
    start: number,
    end: number,
  },
};

export type Lines = Array<Line>;

export type PressEvent = { nativeEvent: { locationX: number } };

// eslint-disable-next-line import/prefer-default-export
export function isLocationEqual(
  location1: RawLocation,
  location2: RawLocation
) {
  return location1.lineIndex === location2.lineIndex &&
    location1.start === location2.start &&
    location1.end === location2.end;
}
