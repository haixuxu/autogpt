'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type AgentProfile = {
  description?: string;
  [key: string]: unknown;
};

type AgentDirectives = {
  constraints?: string[];
  resources?: string[];
  bestPractices?: string[];
  [key: string]: unknown;
};

type AgentConfig = {
  workspace?: string;
  [key: string]: unknown;
};

type AgentCycle = {
  id: string;
  cycleIndex: number;
  userFeedback?: string | null;
  startedAt: string;
  completedAt?: string | null;
  proposal: {
    id: string;
    command: string;
    arguments: Record<string, unknown>;
    reasoning: string[];
    plan: string[] | Record<string, unknown> | null;
    createdAt: string;
  } | null;
  result: {
    id: string;
    success: boolean;
    output: Record<string, unknown> | null;
    summary: string;
    error: Record<string, unknown> | null;
    createdAt: string;
  } | null;
};

type AgentMemory = {
  id: string;
  type: string;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  cycleId?: string | null;
};

type AgentWorkspace = {
  id: string;
  rootPath: string;
  createdAt: string;
  updatedAt: string;
  files: Array<{
    id: string;
    path: string;
    kind: string;
    hash: string;
    sizeBytes: number;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

interface AgentDetails {
  id: string;
  name: string;
  status: string;
  task: string | null;
  profile: AgentProfile | null;
  directives: AgentDirectives | null;
  config: AgentConfig | null;
  createdAt: string;
  updatedAt: string;
  cycles: AgentCycle[];
  memories: AgentMemory[];
  workspaces: AgentWorkspace[];
}

type TabKey = 'overview' | 'cycles' | 'memories' | 'workspace';

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<AgentDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const fetchAgent = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!agentId) {
        return;
      }

      if (!opts?.silent) {
        setLoading(true);
      }
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
      } catch (err: any) {
        setError(err.message || 'Unable to load agent');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [agentId]
  );

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAgent({ silent: true });
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

  const directives = agent?.directives;
  const profile = agent?.profile;
  const constraints = useMemo(
    () => (Array.isArray(directives?.constraints) ? directives.constraints : []),
    [directives?.constraints]
  );

  const resources = useMemo(
    () => (Array.isArray(directives?.resources) ? directives.resources : []),
    [directives?.resources]
  );

  const profileDescription =
    profile && typeof profile.description === 'string' ? profile.description : null;

  const cycles = useMemo(() => agent?.cycles ?? [], [agent?.cycles]);
  const memories = useMemo(() => agent?.memories ?? [], [agent?.memories]);
  const workspaces = useMemo(() => agent?.workspaces ?? [], [agent?.workspaces]);

  const renderJson = (value: unknown, emptyLabel: string) => {
    if (
      value === null ||
      value === undefined ||
      (typeof value === 'object' &&
        value !== null &&
        Object.keys(value as Record<string, unknown>).length === 0)
    ) {
      return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
    }

    return (
      <pre className="max-h-64 overflow-auto rounded bg-muted p-4 text-sm">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  };

  const formatDateTime = (input: string | null | undefined) => {
    if (!input) {
      return '—';
    }
    try {
      return new Date(input).toLocaleString();
    } catch {
      return input;
    }
  };

  const formatSize = (bytes: number) => {
    if (!Number.isFinite(bytes)) {
      return '—';
    }
    if (bytes === 0) {
      return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, index);
    return `${size.toFixed(1)} ${units[index]}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
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
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/agents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agents
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
            </div>
            {agent.task && <p className="mt-2 text-muted-foreground">{agent.task}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground md:text-sm">
            <span className="rounded bg-muted px-3 py-1">
              {cycles.length} cycles ({cycles.filter((c) => c.result?.success).length} success)
            </span>
            <span className="rounded bg-muted px-3 py-1">{memories.length} memories</span>
            <span className="rounded bg-muted px-3 py-1">{workspaces.length} workspaces</span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 border-b pb-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'cycles', label: `Cycles (${cycles.length})` },
          { id: 'memories', label: `Memories (${memories.length})` },
          { id: 'workspace', label: `Workspace (${workspaces.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabKey)}
            className={`rounded-full px-4 py-1 text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto text-xs text-muted-foreground">
          Last updated {formatDateTime(agent.updatedAt)}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Agent Information</CardTitle>
              <CardDescription>Core metadata and lifecycle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Agent ID</p>
                <p className="break-all font-mono text-xs">{agent.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Created
                  </p>
                  <p>{formatDateTime(agent.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Updated
                  </p>
                  <p>{formatDateTime(agent.updatedAt)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Assigned Task
                </p>
                <p>{agent.task || '—'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Agent persona and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileDescription ? (
                <p className="text-sm leading-relaxed">{profileDescription}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No profile description provided.
                </p>
              )}
              {renderJson(agent.profile, 'No additional profile metadata')}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Directives</CardTitle>
              <CardDescription>Constraints, resources, and configuration</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3 text-sm">
              <div>
                <h3 className="mb-2 font-medium">Constraints</h3>
                {constraints.length > 0 ? (
                  <ul className="list-disc space-y-2">
                    {constraints.map((constraint, idx) => (
                      <li key={constraint + idx}>{constraint}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No constraints defined.</p>
                )}
              </div>
              <div>
                <h3 className="mb-2 font-medium">Resources</h3>
                {resources.length > 0 ? (
                  <ul className="list-disc space-y-2">
                    {resources.map((resource, idx) => (
                      <li key={resource + idx}>{resource}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No resources listed.</p>
                )}
              </div>
              <div>
                <h3 className="mb-2 font-medium">Configuration</h3>
                {renderJson(agent.config, 'No custom configuration')}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'cycles' && (
        <Card>
          <CardHeader>
            <CardTitle>Execution Cycles</CardTitle>
            <CardDescription>
              Detailed record of agent reasoning and tool execution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cycles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No cycles recorded yet. Start the agent to see execution steps.
              </p>
            ) : (
              <div className="space-y-4">
                {cycles.map((cycle) => (
                  <div key={cycle.id} className="rounded-lg border bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">
                          Cycle {cycle.cycleIndex + 1}
                        </span>
                        {cycle.result?.success !== undefined && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              cycle.result.success
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {cycle.result.success ? 'Success' : 'Failed'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Started {formatDateTime(cycle.startedAt)}
                        {cycle.completedAt &&
                          ` • Completed ${formatDateTime(cycle.completedAt)}`}
                      </span>
                    </div>

                    {cycle.userFeedback && (
                      <div className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
                        <strong>User feedback:</strong> {cycle.userFeedback}
                      </div>
                    )}

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Proposed Action
                        </p>
                        {cycle.proposal ? (
                          <div className="rounded-md border border-dashed border-muted-foreground/40 p-3 text-sm">
                            <p className="font-medium">{cycle.proposal.command}</p>
                            {cycle.proposal.reasoning.length > 0 && (
                              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                {cycle.proposal.reasoning.map((reason, idx) => (
                                  <li key={idx}>• {reason}</li>
                                ))}
                              </ul>
                            )}
                            {cycle.proposal.plan && (
                              <div className="mt-2 text-xs">
                                <p className="font-medium text-muted-foreground">Plan</p>
                                {Array.isArray(cycle.proposal.plan) ? (
                                  <ul className="mt-1 list-disc space-y-1">
                                    {cycle.proposal.plan.map((step, idx) => (
                                      <li key={idx}>{step as string}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  renderJson(cycle.proposal.plan, 'No plan details')
                                )}
                              </div>
                            )}
                            {renderJson(
                              cycle.proposal.arguments,
                              'No command arguments'
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No action proposal recorded.
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Result
                        </p>
                        {cycle.result ? (
                          <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/40 p-3 text-sm">
                            <p className="font-medium">{cycle.result.summary}</p>
                            {cycle.result.output && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                  Output
                                </p>
                                {renderJson(
                                  cycle.result.output,
                                  'Action produced no structured output'
                                )}
                              </div>
                            )}
                            {cycle.result.error && (
                              <div className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">
                                <p className="font-semibold">Error</p>
                                {renderJson(
                                  cycle.result.error,
                                  'No additional error context'
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Action result not recorded.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'memories' && (
        <Card>
          <CardHeader>
            <CardTitle>Memory Records</CardTitle>
            <CardDescription>Most recent 100 memories captured during execution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {memories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No memory entries recorded yet.
              </p>
            ) : (
              memories.map((memory) => (
                <div key={memory.id} className="rounded-lg border bg-card p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {memory.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(memory.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 leading-relaxed">{memory.content}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {memory.cycleId && (
                      <span>Cycle {memory.cycleId.slice(0, 8)}…</span>
                    )}
                    {memory.metadata && (
                      <span className="rounded bg-muted px-2 py-1">Metadata attached</span>
                    )}
                  </div>
                  {memory.metadata && (
                    <div className="mt-3">
                      {renderJson(memory.metadata, 'No metadata')}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'workspace' && (
        <Card>
          <CardHeader>
            <CardTitle>Workspace Files</CardTitle>
            <CardDescription>
              Recently tracked files across agent workspaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {workspaces.length === 0 ? (
              <p className="text-muted-foreground">
                No workspace information recorded for this agent.
              </p>
            ) : (
              workspaces.map((workspace) => (
                <div key={workspace.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{workspace.rootPath}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDateTime(workspace.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs">
                      {workspace.files.length} tracked file
                      {workspace.files.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {workspace.files.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No file snapshots found for this workspace.
                      </p>
                    ) : (
                      workspace.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded border border-dashed border-muted-foreground/40 px-3 py-2"
                        >
                          <div className="flex flex-col">
                            <span className="font-mono text-xs">{file.path}</span>
                            <span className="text-xs text-muted-foreground">
                              {file.kind} • {formatSize(file.sizeBytes)}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDateTime(file.updatedAt)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


