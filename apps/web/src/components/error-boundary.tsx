import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reload = (): void => {
    this.setState({ error: null });
    window.location.reload();
  };

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="max-w-md">
          <h1 className="text-2xl font-bold">Đã xảy ra lỗi không mong đợi</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {this.state.error.message || 'Lỗi không xác định'}
          </p>
        </div>
        <details className="max-w-2xl text-left text-xs text-muted-foreground">
          <summary className="cursor-pointer">Chi tiết kỹ thuật</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md bg-muted p-3">
            {this.state.error.stack ?? this.state.error.toString()}
          </pre>
        </details>
        <Button onClick={this.reload}>
          <RefreshCw className="mr-2 h-4 w-4" /> Tải lại trang
        </Button>
      </div>
    );
  }
}
