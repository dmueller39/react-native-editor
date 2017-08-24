// @flow
import 'react-native';
import React from 'react';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

import Editor from '../Editor';

it('renders correctly', () => {
  const tree = renderer.create(
    <Editor data="foo" dimensions={{ width: 320 }} onUpdateData={() => {}} />
  );

  expect(tree).toMatchSnapshot();
});
