// @flow
export const CHANGE_TEXT = 'text-redux/CHANGE_TEXT';

type Operation = {
  startIndex: number,
  endIndex: number,
  replacement: string,
};

type Action = {
  actionType: string,
  ops: Array<Operation>,
  undoOps: Array<Operation>,
};

type State = {
  data: string,
};

export const makeOperation = (
  startIndex: number,
  endIndex: number,
  replacement: string
): Operation => ({
  startIndex,
  endIndex,
  replacement,
});

export const makeAction = (
  actionType: string,
  ops: Array<Operation>,
  undoOps: Array<Operation>
): Action => ({
  actionType,
  ops,
  undoOps,
});

export function changeText(data: string, ops: Array<Operation>) {
  const changeTextRange = (_data, _ops, _offset) => {
    if (_ops == null || _ops.length === 0) {
      return _data;
    }
    const op = _ops[0];
    const otherOps = _ops.slice(1);

    const prefix = _data.slice(0, op.startIndex - _offset);
    const dataLength = _data.length;
    const remainder = _data.slice(op.endIndex - _offset, dataLength);
    const postfix = changeTextRange(remainder, otherOps, op.endIndex);

    return ''.concat(prefix, op.replacement, postfix);
  };

  return changeTextRange(data, ops, 0);
}

export function replaceRange(
  data: string,
  startIndex: number,
  endIndex: number,
  replacement: string
) {
  const undoReplacement = data.slice(startIndex, endIndex);
  const undoEnd = startIndex + replacement.length;

  const ops = [makeOperation(startIndex, endIndex, replacement)];
  const undoOps = [makeOperation(startIndex, undoEnd, undoReplacement)];

  return makeAction(CHANGE_TEXT, ops, undoOps);
}

export function replaceAllString(
  data: string,
  target: string,
  replacement: string
) {
  let undoFromIndex = 0;
  let fromIndex = 0;
  const ops = [];
  const undoOps = [];

  while (fromIndex !== -1) {
    const index = data.indexOf(target, fromIndex);
    if (index !== -1) {
      const undoStart = index + undoFromIndex - fromIndex;
      undoFromIndex = undoStart + replacement.length;
      undoOps.push(
        makeOperation(undoStart, undoStart + replacement.length, target)
      );

      fromIndex = index + target.length;
      ops.push(makeOperation(index, fromIndex, replacement));
    } else {
      fromIndex = -1;
    }
  }

  return {
    actionType: CHANGE_TEXT,
    ops,
    undoOps,
  };
}

export function replaceAll(data: string, target: string, replacement: string) {
  if (typeof data === 'string') {
    return replaceAllString(data, target, replacement);
  }
  // TODO: add RegExp support in the future
  throw new Error('replaceAll only supports strings');
}

const INITIAL_STATE = {
  data: '',
};

export default function text(
  state: State = INITIAL_STATE,
  action: ?Action = null
): State {
  if (action == null) {
    return state;
  }
  switch (action.actionType) {
    case CHANGE_TEXT:
      return {
        data: changeText(state.data, action.ops),
      };
    default:
      return state;
  }
}
