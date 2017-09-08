// @flow
import 'react-native';
import React from 'react';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

import Buffer from '../Buffer';

it('renders correctly', () => {
  const tree = renderer.create(
    <Buffer
      onSelectLine={() => {}}
      onSelectWord={() => {}}
      onChangeData={() => {}}
      data="foo"
      selectedWord={null}
      selectedLineIndex={null}
      width={320}
      selectedLocation={null}
      isEditing={false}
    />
  );

  expect(tree).toMatchSnapshot();
});
