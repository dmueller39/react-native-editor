// @flow
export type Location = {
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

export type Item = {
  text: string,
  rawLineIndex: number,
  start: number,
  textSections: Array<TextSection>,
  continuing: boolean,
  continued: boolean,
  activeLineText: string,
};

export type Lines = Array<Item>;

export type PressEvent = { nativeEvent: { locationX: number } };

// eslint-disable-next-line import/prefer-default-export
export function isLocationEqual(location1: Location, location2: Location) {
  return location1.lineIndex === location2.lineIndex &&
    location1.start === location2.start &&
    location1.length === location2.length;
}
