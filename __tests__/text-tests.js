import text, {
  CHANGE_TEXT,
  changeText,
  replaceRange,
  replaceAll,
  makeAction,
  makeOperation,
} from '../text';

describe('makeOperation', () => {
  it('makes an operation', () => {
    const op = makeOperation(0, 1, '3');
    expect(op).toEqual({
      startIndex: 0,
      endIndex: 1,
      replacement: '3',
    });
  });
});

describe('makeAction', () => {
  it('makes an action', () => {
    const action = makeAction(
      'foo',
      [makeOperation(0, 1, 'a')],
      [makeOperation(0, 1, 'b')]
    );

    expect(action).toEqual({
      actionType: 'foo',
      ops: [{ startIndex: 0, endIndex: 1, replacement: 'a' }],
      undoOps: [{ startIndex: 0, endIndex: 1, replacement: 'b' }],
    });
  });
});

describe('changeText', () => {
  it('changes text to a short length', () => {
    const result = changeText('aaaaaa', [
      makeOperation(0, 2, 'b'),
      makeOperation(2, 4, 'b'),
      makeOperation(4, 6, 'b'),
    ]);
    expect(result).toBe('bbb');
  });

  it('changes text to a long length', () => {
    const result = changeText('aaaaaa', [
      makeOperation(0, 2, 'bbb'),
      makeOperation(2, 4, 'bbb'),
      makeOperation(4, 6, 'bbb'),
    ]);
    expect(result).toBe('bbbbbbbbb');
  });
});

describe('replaceRange', () => {
  it('makes a replace range action', () => {
    const action = replaceRange('aaaaaaa', 1, 3, 'bbb');
    expect(action).toEqual({
      actionType: CHANGE_TEXT,
      ops: [makeOperation(1, 3, 'bbb')],
      undoOps: [makeOperation(1, 4, 'aa')],
    });
  });
});

describe('main function', () => {
  it('performs operations on a zero length string', () => {
    const state = { data: '' };
    const action = {
      actionType: CHANGE_TEXT,
      ops: [{ startIndex: 0, endIndex: 0, replacement: 'foo' }],
    };
    const result = text(state, action);

    expect(result.data).toBe('foo');
  });
  it('performs operations on the end of a string', () => {
    const state = { data: 'foo' };
    const action = {
      actionType: CHANGE_TEXT,
      ops: [{ startIndex: 3, endIndex: 3, replacement: 'bar' }],
    };
    const result = text(state, action);

    expect(result.data).toBe('foobar');
  });
  it('performs operations on the beginning of a string', () => {
    const state = { data: 'bar' };
    const action = {
      actionType: CHANGE_TEXT,
      ops: [{ startIndex: 0, endIndex: 0, replacement: 'foo' }],
    };
    const result = text(state, action);

    expect(result.data).toBe('foobar');
  });
  it('performs multiple operations on the string', () => {
    const state = { data: 'acdwezg' };
    const action = {
      actionType: CHANGE_TEXT,
      ops: [
        { startIndex: 1, endIndex: 1, replacement: 'b' },
        { startIndex: 3, endIndex: 4, replacement: '' },
        { startIndex: 5, endIndex: 6, replacement: 'f' },
        { startIndex: 7, endIndex: 7, replacement: 'h' },
      ],
    };
    const result = text(state, action);

    expect(result.data).toBe('abcdefgh');
  });
});

const testReplaceRange = (start, end, replacement, before, after) => {
  const state = { data: before };

  const action = replaceRange(state.data, start, end, replacement);

  const doState = text(state, action);
  expect(doState.data).toBe(after);
  const undoAction = {
    actionType: action.actionType,
    ops: action.undoOps,
    undoOps: action.ops,
  };
  const undoState = text(doState, undoAction);
  expect(undoState.data).toBe(before);
};

describe('replaceRange', () => {
  it('inserts text', () => {
    testReplaceRange(2, 2, 'c', 'abde', 'abcde');
  });

  it('deletes text', () => {
    testReplaceRange(2, 3, '', 'abcde', 'abde');
  });

  it('replaces text', () => {
    testReplaceRange(2, 6, 'really love', 'I like text', 'I really love text');
  });
});

const testReplaceAll = (target, replacement, before, after) => {
  const state = { data: before };

  const action = replaceAll(state.data, target, replacement);

  const doState = text(state, action);
  expect(doState.data).toBe(after);
  const undoAction = {
    actionType: action.actionType,
    ops: action.undoOps,
    undoOps: action.ops,
  };
  const undoState = text(doState, undoAction);
  expect(undoState.data).toBe(before);
};

describe('replaceAll', () => {
  it('replaces same length text', () => {
    testReplaceAll('a', 'c', 'abababababa', 'cbcbcbcbcbc');
  });
  it('replaces different length text', () => {
    testReplaceAll('ab', 'c', 'abdabdabdabdabda', 'cdcdcdcdcda');
    testReplaceAll('c', 'ab', 'cdcdcdcdcda', 'abdabdabdabdabda');
  });
  it('deletes text', () => {
    testReplaceAll('ab', '', 'abdabdabdabdabda', 'ddddda');
  });
});
