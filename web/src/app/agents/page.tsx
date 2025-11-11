'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Agent {
  id: string;
  name: string;
  status: string;
  task: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    cycles: number;
    memories: number;
  };
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/agents');
        if (!response.ok) {
          throw new Error('Failed to fetch agents');
        }
        const data = await response.json();
        setAgents(data.agents || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

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
            <p className="mt-4 text-muted-foreground">Loading agents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>Failed to load agents</CardDescription>
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
        <h1 className="text-3xl font-bold">Agents</h1>
        <p className="text-muted-foreground mt-2">
          View all autonomous agents and their execution status
        </p>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No agents found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1">{agent.name}</CardTitle>
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {agent.task}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">{agent._count?.cycles || 0}</span> cycles
                    </div>
                    <div>
                      <span className="font-medium">{agent._count?.memories || 0}</span> memories
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Created {new Date(agent.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

