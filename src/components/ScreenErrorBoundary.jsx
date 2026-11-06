// Catches a screen that fails to load or crashes, and shows a way out instead of a
// blank page. The usual cause is a lazy-loaded screen whose file can't be downloaded
// (the connection dropped). React only supports this as a class component.
import { Component } from 'react';
import { Button } from './Button.jsx';
import EmptyState from './EmptyState.jsx';
import { AlertIcon } from './icons.jsx';

export default class ScreenErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Screen failed to load:', error);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <EmptyState
        icon={AlertIcon}
        tone="error"
        title="This screen couldn’t load"
        headingLevel={1}
        actions={<Button onClick={() => window.location.reload()}>Reload</Button>}
      >
        Check the connection, then reload the page.
      </EmptyState>
    );
  }
}
