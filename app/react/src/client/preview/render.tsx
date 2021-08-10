import global from 'global';
import React, { Component, FunctionComponent, ReactElement, StrictMode, Fragment } from 'react';
import ReactDOM from 'react-dom';

import { StoryContext, RenderContext } from './types';

const { document, FRAMEWORK_OPTIONS } = global;

const render = (node: ReactElement, el: Element) =>
  new Promise((resolve) => {
    ReactDOM.render(node, el, resolve);
  });

class ErrorBoundary extends Component<{
  showException: (err: Error) => void;
  showMain: () => void;
}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidMount() {
    const { hasError } = this.state;
    const { showMain } = this.props;
    if (!hasError) {
      showMain();
    }
  }

  componentDidCatch(err: Error) {
    const { showException } = this.props;
    // message partially duplicates stack, strip it
    showException(err);
  }

  render() {
    const { hasError } = this.state;
    const { children } = this.props;

    return hasError ? null : children;
  }
}

const Wrapper = FRAMEWORK_OPTIONS?.strictMode ? StrictMode : Fragment;

export default async function renderMain(
  // @ts-ignore FIXME refactor in progress
  { storyContext, unboundStoryFn, showMain, showException, forceRemount }: RenderContext,
  domElement: Element
) {
  const Story = unboundStoryFn as FunctionComponent<StoryContext>;

  const content = (
    <ErrorBoundary showMain={showMain} showException={showException}>
      <Story {...storyContext} />
    </ErrorBoundary>
  );

  // For React 15, StrictMode & Fragment doesn't exists.
  const element = Wrapper ? <Wrapper>{content}</Wrapper> : content;

  // In most cases, we need to unmount the existing set of components in the DOM node.
  // Otherwise, React may not recreate instances for every story run.
  // This could leads to issues like below:
  // https://github.com/storybookjs/react-storybook/issues/81
  // (This is not the case when we change args or globals to the story however)
  if (forceRemount) {
    ReactDOM.unmountComponentAtNode(domElement);
  }

  await render(element, domElement);
}
