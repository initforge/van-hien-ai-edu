import { Component, type ReactNode } from 'react';
import { ErrorResetButton } from './ErrorResetButton';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; message?: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(e: Error): State {
    return { hasError: true, message: e.message };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <ErrorResetButton message={this.state.message} />;
    }
    return this.props.children;
  }
}
