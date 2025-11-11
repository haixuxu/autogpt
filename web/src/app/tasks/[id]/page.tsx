'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  task: string;
  status: string;
  profile: string;
  directives: string;
  config: string;
  createdAt: string;
  updatedAt: string;
  cycles?: any[];
  memories?: any[];
  workspaces?: any[];
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/tasks/${taskId}`);
        if (!response.ok) {
          throw new Error('Task not found');
        }
        const data = await response.json();
        setTask(data.task);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/tasks');
      } else {
        alert('Failed to delete task');
      }
    } catch (err) {
      alert('Error deleting task');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'COMPLETED':
        return 'bg-blue-500';
      case 'FAILED':
        return 'bg-red-500';
      case 'PAUSED':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading task details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/tasks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Link>
        </Button>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>Failed to load task details</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profile = task.profile ? JSON.parse(task.profile) : {};
  const directives = task.directives ? JSON.parse(task.directives) : {};
  const config = task.config ? JSON.parse(task.config) : {};

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/tasks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{task.name}</h1>
              <Badge className={getStatusColor(task.status)}>
                {task.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">{task.task}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Task Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Task ID</p>
              <p className="text-sm font-mono">{task.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">{new Date(task.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm">{new Date(task.updatedAt).toLocaleString()}</p>
            </div>
            {config.workspace && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Workspace</p>
                <p className="text-sm font-mono">{config.workspace}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.description ? (
              <p className="text-sm">{profile.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No profile information</p>
            )}
          </CardContent>
        </Card>

        {directives.constraints && directives.constraints.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Constraints</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {directives.constraints.map((constraint: string, index: number) => (
                  <li key={index} className="text-sm">
                    {index + 1}. {constraint}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {directives.resources && directives.resources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {directives.resources.map((resource: string, index: number) => (
                  <li key={index} className="text-sm">
                    {index + 1}. {resource}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Execution Cycles</CardTitle>
            <CardDescription>
              {task.cycles?.length || 0} cycle{task.cycles?.length !== 1 ? 's' : ''} completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {task.cycles && task.cycles.length > 0 ? (
              <div className="space-y-4">
                {task.cycles.slice(0, 5).map((cycle: any, index: number) => (
                  <div key={cycle.id} className="border-l-2 border-primary pl-4">
                    <p className="text-sm font-medium">Cycle {index + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(cycle.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
                {task.cycles.length > 5 && (
                  <p className="text-sm text-muted-foreground">
                    And {task.cycles.length - 5} more...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No cycles yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

