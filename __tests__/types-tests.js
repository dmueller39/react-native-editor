// @flow

import { isLocationEqual } from '../types';

describe('isLocationEqual', () => {
  it('checks location inequality', () => {
    expect(
      isLocationEqual(
        { start: 0, end: 1, lineIndex: 0 },
        { start: 1, end: 2, lineIndex: 0 }
      )
    ).toBe(false);
  });
  it('checks location equality', () => {
    expect(
      isLocationEqual(
        { start: 0, end: 1, lineIndex: 0 },
        { start: 0, end: 1, lineIndex: 0 }
      )
    ).toBe(true);
  });
});
