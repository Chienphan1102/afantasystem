import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {description ?? 'Page sẽ được hoàn thiện ở các Prompt sau của Phase 1.'}
        </CardContent>
      </Card>
    </div>
  );
}
