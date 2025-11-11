'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AgentDetails {
  id: string;
  name: string;
  status: string;
  task: string | null;
  profile: Record<string, unknown> | null;
  directives: Record<string, unknown> | null;
  config: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<AgentDetails | null>(null);
  const [cyclesCount, setCyclesCount] = useState<number>(0);
  const [memoriesCount, setMemoriesCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      if (!agentId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:3001/api/agents/${agentId}`);

        if (response.status === 404) {
          throw new Error('Agent not found');
        }

        if (!response.ok) {
          throw new Error('Failed to fetch agent');
        }

        const data = await response.json();

        setAgent(data.agent);
        setCyclesCount(data.agent?.cyclesCount ?? data.cyclesCount ?? 0);
        setMemoriesCount(data.agent?.memoriesCount ?? data.memoriesCount ?? 0);
      } catch (err: any) {
        setError(err.message || 'Unable to load agent');
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [agentId]);

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

  const renderJson = (value: Record<string, unknown> | null, emptyLabel: string) => {
    if (!value || Object.keys(value).length === 0) {
      return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
    }

    return (
      <pre className="rounded bg-muted p-4 text-sm overflow-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading agent details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/agents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Link>
        </Button>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>Failed to load agent details</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/agents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Link>
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              <Badge className={getStatusColor(agent.status)}>
                {agent.status}
              </Badge>
            </div>
            {agent.task && <p className="text-muted-foreground mt-2">{agent.task}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">{cyclesCount}</span> cycles
            </div>
            <div>
              <span className="font-medium">{memoriesCount}</span> memories
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Agent ID</p>
              <p className="text-sm font-mono break-words">{agent.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">{new Date(agent.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm">{new Date(agent.updatedAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {renderJson(agent.profile, 'No profile information')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Directives</CardTitle>
          </CardHeader>
          <CardContent>
            {renderJson(agent.directives, 'No directives available')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {renderJson(agent.config, 'No configuration data')}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


