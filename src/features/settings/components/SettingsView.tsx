import React, { useState, useEffect, useCallback } from 'react';
import { 
  RiKey2Line, 
  RiCodeSSlashLine, 
  RiBuilding4Line, 
  RiBrainLine, 
  RiShieldCheckLine, 
  RiAddLine, 
  RiFileCopyLine, 
  RiCheckLine, 
  RiDeleteBin6Line, 
  RiTerminalBoxLine,
  RiSparklingFill,
  RiTimeLine,
  RiLockLine,
  RiPlayLine,
  RiLoader4Line,
  RiCloseLine,
  RiFlashlightLine,
  RiDatabase2Line,
  RiCheckboxCircleLine,
  RiFoldersLine,
  RiBarChartBoxLine,
  RiArrowRightUpLine,
  RiUserSettingsLine,
  RiCpuLine,
  RiRefreshLine
} from 'react-icons/ri';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/api';

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

interface WorkspaceUsageStats {
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    price: string;
    createdAt: string;
  };
  metrics: {
    requestsUsed: number;
    maxRequests: number;
    requestsPercent: number;
    ragQueriesUsed: number;
    maxRagQueries: number;
    ragQueriesPercent: number;
    minutesUsed: number;
    maxMinutes: number;
    minutesPercent: number;
    totalMeetings: number;
    totalDecisions: number;
    totalActionItems: number;
    activeKeysCount: number;
    rateLimitReqPerMin: number;
  };
}

type SettingsSection = 'keys' | 'docs' | 'usage' | 'workspace' | 'pipeline';
type CodeLanguage = 'curl' | 'typescript' | 'python' | 'go';

export const SettingsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('keys');
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  
  // Real usage telemetry state
  const [usageData, setUsageData] = useState<WorkspaceUsageStats | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  // New key form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['meetings:read', 'meetings:write', 'rag:query']);
  const [newKeyExpiry, setNewKeyExpiry] = useState<number>(90);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Interactive Code Snippet Tabs
  const [selectedEndpoint, setSelectedEndpoint] = useState<'ask' | 'upload' | 'getMeeting' | 'export'>('ask');
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('curl');

  // Live API Playground Tester state
  const [testQuery, setTestQuery] = useState('What decisions were made about our database architecture?');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testLatency, setTestLatency] = useState<number | null>(null);

  // Preference toggles
  const [summaryStyle, setSummaryStyle] = useState('executive');
  const [autoExtractActions, setAutoExtractActions] = useState(true);
  const [autoSyncCalendar, setAutoSyncCalendar] = useState(true);

  // Fetch real usage and organization telemetry
  const fetchUsageStats = useCallback(async () => {
    setIsLoadingUsage(true);
    try {
      const res = await apiClient.get<WorkspaceUsageStats, any>({
        url: '/api/v1/api-keys/usage',
      });
      if (res.data) {
        setUsageData(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch workspace usage telemetry:', err);
    } finally {
      setIsLoadingUsage(false);
    }
  }, []);

  // Fetch real active API keys
  const fetchApiKeys = useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      const res = await apiClient.get<ApiKeyItem[], any>({
        url: '/api/v1/api-keys',
      });
      if (res.data) {
        setApiKeys(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch API keys:', err);
    } finally {
      setIsLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
    fetchUsageStats();
  }, [fetchApiKeys, fetchUsageStats]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || isCreatingKey) return;

    setIsCreatingKey(true);
    try {
      const res = await apiClient.post<any, any>({
        url: '/api/v1/api-keys',
        body: {
          name: newKeyName.trim(),
          scopes: newKeyScopes,
          expiresInDays: newKeyExpiry > 0 ? newKeyExpiry : undefined,
        },
      });

      if (res.data?.secretKey) {
        setRevealedSecret(res.data.secretKey);
        setIsCreateModalOpen(false);
        setNewKeyName('');
        fetchApiKeys();
        fetchUsageStats();
      }
    } catch (err: any) {
      alert(`Failed to create API key: ${err.message || 'Server error'}`);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this API key? Applications using it will immediately be rejected.')) {
      return;
    }

    try {
      await apiClient.patch<any, any>({
        url: `/api/v1/api-keys/${id}/revoke`,
      });
      fetchApiKeys();
      fetchUsageStats();
    } catch (err: any) {
      alert(`Failed to revoke key: ${err.message || 'Server error'}`);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Permanently delete this API key record?')) {
      return;
    }

    try {
      await apiClient.delete<any, any>({
        url: `/api/v1/api-keys/${id}`,
      });
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      fetchUsageStats();
    } catch (err: any) {
      alert(`Failed to delete key: ${err.message || 'Server error'}`);
    }
  };

  const toggleScope = (scope: string) => {
    setNewKeyScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  // Run Live Test Request in Playground
  const handleRunLiveTest = async () => {
    if (!testQuery.trim() || isTestingApi) return;
    setIsTestingApi(true);
    setTestResponse(null);
    setTestLatency(null);
    const start = performance.now();

    try {
      const res = await apiClient.post<any, any>({
        url: '/api/v1/search/ask',
        body: { query: testQuery.trim() },
      });
      const end = performance.now();
      setTestLatency(Math.round(end - start));
      setTestResponse(JSON.stringify(res.data, null, 2));
      fetchUsageStats();
    } catch (err: any) {
      const end = performance.now();
      setTestLatency(Math.round(end - start));
      setTestResponse(
        JSON.stringify(
          {
            statusCode: err.statusCode || 500,
            error: 'LiveTestError',
            message: err.message || 'Failed to execute live request',
          },
          null,
          2
        )
      );
    } finally {
      setIsTestingApi(false);
    }
  };

  const getEndpointSnippet = (endpoint: 'ask' | 'upload' | 'getMeeting' | 'export', lang: CodeLanguage) => {
    const apiKeyPlaceholder = apiKeys.length > 0 ? apiKeys[0].keyPrefix.replace('••••••', '...') : '<YOUR_API_KEY>';
    
    if (endpoint === 'ask') {
      if (lang === 'curl') {
        return `curl -X POST https://api.meetingos.ai/api/v1/search/ask \\
  -H "Authorization: Bearer ${apiKeyPlaceholder}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "What decisions were made about our database architecture?"
  }'`;
      }
      if (lang === 'typescript') {
        return `import axios from 'axios';

const response = await axios.post(
  'https://api.meetingos.ai/api/v1/search/ask',
  { query: 'What decisions were made about our database architecture?' },
  {
    headers: {
      Authorization: 'Bearer ${apiKeyPlaceholder}',
      'Content-Type': 'application/json',
    },
  }
);

console.log('AI Answer:', response.data.answer);
console.log('Evidence Citations:', response.data.citations);`;
      }
      if (lang === 'python') {
        return `import requests

url = "https://api.meetingos.ai/api/v1/search/ask"
headers = {
    "Authorization": "Bearer ${apiKeyPlaceholder}",
    "Content-Type": "application/json"
}
payload = {
    "query": "What decisions were made about our database architecture?"
}

response = requests.post(url, json=payload, headers=headers)
print("Answer:", response.json().get("answer"))`;
      }
      if (lang === 'go') {
        return `package main

import (
    "bytes"
    "fmt"
    "net/http"
    "io/ioutil"
)

func main() {
    url := "https://api.meetingos.ai/api/v1/search/ask"
    payload := []byte(\`{"query": "What decisions were made about our database architecture?"}\`)
    
    req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer ${apiKeyPlaceholder}")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
}`;
      }
    }

    if (endpoint === 'upload') {
      if (lang === 'curl') {
        return `curl -X POST https://api.meetingos.ai/api/v1/transcripts/upload \\
  -H "Authorization: Bearer ${apiKeyPlaceholder}" \\
  -F "file=@meeting_transcript.vtt" \\
  -F "title=Q4 Product Roadmap Sync"`;
      }
      if (lang === 'typescript') {
        return `import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

const form = new FormData();
form.append('file', fs.createReadStream('./meeting.vtt'));
form.append('title', 'Q4 Product Roadmap Sync');

const response = await axios.post(
  'https://api.meetingos.ai/api/v1/transcripts/upload',
  form,
  {
    headers: {
      Authorization: 'Bearer ${apiKeyPlaceholder}',
      ...form.getHeaders(),
    },
  }
);
console.log('Meeting ID:', response.data.meetingId);`;
      }
      if (lang === 'python') {
        return `import requests

url = "https://api.meetingos.ai/api/v1/transcripts/upload"
headers = {"Authorization": "Bearer ${apiKeyPlaceholder}"}
files = {"file": open("meeting.vtt", "rb")}
data = {"title": "Q4 Product Roadmap Sync"}

response = requests.post(url, headers=headers, files=files, data=data)
print("Meeting ID:", response.json().get("meetingId"))`;
      }
      if (lang === 'go') {
        return `// Use multipart/form-data with file buffer and title field
// Endpoint: POST https://api.meetingos.ai/api/v1/transcripts/upload`;
      }
    }

    if (endpoint === 'getMeeting') {
      if (lang === 'curl') {
        return `curl -X GET https://api.meetingos.ai/api/v1/meetings/meet_8a7f9c2d \\
  -H "Authorization: Bearer ${apiKeyPlaceholder}"`;
      }
      if (lang === 'typescript') {
        return `const response = await axios.get(
  'https://api.meetingos.ai/api/v1/meetings/meet_8a7f9c2d',
  { headers: { Authorization: 'Bearer ${apiKeyPlaceholder}' } }
);
console.log('Summary:', response.data.summary);
console.log('Decisions:', response.data.decisions);`;
      }
      if (lang === 'python') {
        return `response = requests.get(
    "https://api.meetingos.ai/api/v1/meetings/meet_8a7f9c2d",
    headers={"Authorization": "Bearer ${apiKeyPlaceholder}"}
)
print("Decisions:", response.json().get("decisions"))`;
      }
      if (lang === 'go') {
        return `// HTTP GET with Bearer token
// Endpoint: https://api.meetingos.ai/api/v1/meetings/meet_8a7f9c2d`;
      }
    }

    if (endpoint === 'export') {
      if (lang === 'curl') {
        return `curl -X GET https://api.meetingos.ai/api/v1/documents/docx/meet_8a7f9c2d \\
  -H "Authorization: Bearer ${apiKeyPlaceholder}" \\
  -o "Meeting_Report.docx"`;
      }
      if (lang === 'typescript') {
        return `const response = await axios.get(
  'https://api.meetingos.ai/api/v1/documents/docx/meet_8a7f9c2d',
  {
    headers: { Authorization: 'Bearer ${apiKeyPlaceholder}' },
    responseType: 'arraybuffer',
  }
);
fs.writeFileSync('Meeting_Report.docx', response.data);`;
      }
      if (lang === 'python') {
        return `response = requests.get(
    "https://api.meetingos.ai/api/v1/documents/docx/meet_8a7f9c2d",
    headers={"Authorization": "Bearer ${apiKeyPlaceholder}"}
)
with open("Meeting_Report.docx", "wb") as f:
    f.write(response.content)`;
      }
      if (lang === 'go') {
        return `// Download Word DOCX report binary stream
// Endpoint: https://api.meetingos.ai/api/v1/documents/docx/meet_8a7f9c2d`;
      }
    }

    return '';
  };

  const metrics = usageData?.metrics;
  const organization = usageData?.organization;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span>Settings &amp; Developer Platform</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your workspace configuration, developer secret keys, commercial API telemetry, and intelligence pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsPricingModalOpen(true)}
            size="sm"
            variant="outline"
            className="h-8 text-xs font-medium gap-1.5 cursor-pointer shadow-2xs"
          >
            <RiFlashlightLine className="h-3.5 w-3.5 text-primary" />
            <span>API Pricing &amp; Plans</span>
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            size="sm"
            className="h-8 text-xs font-medium gap-1.5 cursor-pointer shadow-2xs"
          >
            <RiAddLine className="h-4 w-4" />
            <span>Generate Key</span>
          </Button>
        </div>
      </div>

      {/* Main Two-Pane Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sub-Navigation Rail */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          <div className="p-1.5 rounded-2xl border border-border bg-sidebar-background space-y-4 shadow-2xs">
            {/* Group 1: Developer Platform */}
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Developer API
              </div>

              <button
                type="button"
                onClick={() => setActiveSection('keys')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeSection === 'keys'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <RiKey2Line className="h-4 w-4 text-primary" />
                  <span>Secret Keys</span>
                </div>
                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.2 rounded border border-border">
                  {apiKeys.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('docs')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeSection === 'docs'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <RiCodeSSlashLine className="h-4 w-4 text-primary" />
                  <span>API Docs &amp; Explorer</span>
                </div>
                <Badge variant="outline" className="text-[9px] py-0 px-1 border-primary/20 text-primary">
                  Interactive
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('usage')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeSection === 'usage'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <RiBarChartBoxLine className="h-4 w-4 text-primary" />
                  <span>Usage &amp; Quotas</span>
                </div>
                <span className="text-[10px] font-mono text-primary font-semibold">
                  {organization?.plan || 'PRO'}
                </span>
              </button>
            </div>

            {/* Group 2: Workspace & Governance */}
            <div className="space-y-1 pt-2 border-t border-border/70">
              <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Workspace
              </div>

              <button
                type="button"
                onClick={() => setActiveSection('workspace')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeSection === 'workspace'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <RiBuilding4Line className="h-4 w-4 text-primary" />
                  <span>General Profile</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('pipeline')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeSection === 'pipeline'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <RiCpuLine className="h-4 w-4 text-primary" />
                  <span>AI Engine &amp; Security</span>
                </div>
              </button>
            </div>
          </div>

          {/* Plan Summary Badge */}
          <div className="p-3.5 rounded-2xl border border-border bg-card/60 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">
                {organization?.name || 'Workspace'}
              </span>
              <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                {organization?.plan || 'PRO'}
              </Badge>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Rate limit: <strong>{metrics?.rateLimitReqPerMin || 60} req/min</strong> • 99.9% SLA
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPricingModalOpen(true)}
              className="w-full h-7 text-[11px] cursor-pointer"
            >
              Manage Tier
            </Button>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 w-full space-y-6 overflow-hidden">
          {/* SECTION 1: SECRET KEYS */}
          {activeSection === 'keys' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Newly Created Key Alert Banner */}
              {revealedSecret && (
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 space-y-2 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                      <RiSparklingFill className="h-4 w-4" />
                      <span>New Secret Key Generated</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRevealedSecret(null)}
                      className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                    >
                      <RiCloseLine className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Copy your secret key now. <strong>For security, it will never be displayed again.</strong>
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <code className="flex-1 p-2.5 rounded-xl bg-card border border-border text-foreground font-mono text-xs overflow-x-auto select-all">
                      {revealedSecret}
                    </code>
                    <Button
                      size="sm"
                      onClick={() => handleCopy('new-secret', revealedSecret)}
                      className="h-9 gap-1.5 text-xs shrink-0 cursor-pointer"
                    >
                      {copiedId === 'new-secret' ? (
                        <>
                          <RiCheckLine className="h-3.5 w-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <RiFileCopyLine className="h-3.5 w-3.5" />
                          <span>Copy Key</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <Card className="border-border bg-card shadow-xs rounded-2xl">
                <CardHeader className="p-5 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <RiKey2Line className="h-4 w-4 text-primary" />
                      <span>Active Secret Keys</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {apiKeys.length} keys
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Bearer authentication keys for server-to-server and client integrations.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    size="sm"
                    className="h-8 text-xs font-medium gap-1.5 cursor-pointer shrink-0"
                  >
                    <RiAddLine className="h-4 w-4" />
                    <span>Create New Key</span>
                  </Button>
                </CardHeader>

                <CardContent className="p-5 pt-2">
                  {isLoadingKeys ? (
                    <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <RiLoader4Line className="h-4 w-4 animate-spin text-primary" />
                      <span>Loading secret keys...</span>
                    </div>
                  ) : apiKeys.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-muted/20 space-y-3">
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <RiKey2Line className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-foreground font-semibold">No secret keys generated yet</p>
                        <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                          Generate an API key to programmatically ingest transcripts, run RAG queries, or fetch meeting summaries.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-8 text-xs font-medium cursor-pointer"
                      >
                        <RiAddLine className="h-4 w-4 mr-1" />
                        Generate Key
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {apiKeys.map((key) => (
                        <div
                          key={key.id}
                          className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground text-[12px]">{key.name}</span>
                              <span className="font-mono text-muted-foreground text-[11px] bg-muted px-2 py-0.5 rounded-md border border-border font-medium">
                                {key.keyPrefix}
                              </span>
                              <Badge
                                variant={key.isActive ? 'default' : 'secondary'}
                                className={`text-[9px] py-0 ${
                                  key.isActive ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {key.isActive ? 'Active' : 'Revoked'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-muted-foreground">
                              <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                              {key.expiresAt && (
                                <span>• Expires {new Date(key.expiresAt).toLocaleDateString()}</span>
                              )}
                              <span>• Permissions:</span>
                              {key.scopes.map((s) => (
                                <span key={s} className="font-mono bg-secondary px-1.5 py-0.2 rounded border border-border text-[9.5px]">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {key.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeApiKey(key.id)}
                                className="h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                Deactivate
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteApiKey(key.id)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                              title="Delete key"
                            >
                              <RiDeleteBin6Line className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* SECTION 2: API DOCS & INTERACTIVE EXPLORER */}
          {activeSection === 'docs' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <Card className="border-border bg-card shadow-xs rounded-2xl">
                <CardHeader className="p-5 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <RiCodeSSlashLine className="h-4 w-4 text-primary" />
                        <span>Interactive Endpoint Reference</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        Test core endpoints, inspect request schemas, and copy production-ready code recipes.
                      </CardDescription>
                    </div>

                    {/* Language Selector */}
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
                      {(['curl', 'typescript', 'python', 'go'] as CodeLanguage[]).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setSelectedLanguage(lang)}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono transition-all cursor-pointer ${
                            selectedLanguage === lang
                              ? 'bg-card text-foreground font-semibold shadow-2xs border border-border'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {lang === 'curl' ? 'cURL' : lang === 'typescript' ? 'Node.js' : lang === 'python' ? 'Python' : 'Go'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Endpoint Selector Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-border/70 mt-3">
                    {[
                      { id: 'ask', method: 'POST', label: '/search/ask (Meeting Intelligence & RAG)' },
                      { id: 'upload', method: 'POST', label: '/transcripts/upload (Ingestion Pipeline)' },
                      { id: 'getMeeting', method: 'GET', label: '/meetings/:id (Structured Intelligence)' },
                      { id: 'export', method: 'GET', label: '/documents/docx/:id (Document Export Engine)' },
                    ].map((ep) => (
                      <button
                        key={ep.id}
                        type="button"
                        onClick={() => setSelectedEndpoint(ep.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all cursor-pointer whitespace-nowrap border ${
                          selectedEndpoint === ep.id
                            ? 'bg-secondary text-foreground border-primary/40 font-semibold'
                            : 'bg-card/60 text-muted-foreground border-border hover:bg-muted/40 hover:text-foreground'
                        }`}
                      >
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                            ep.method === 'POST'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span>{ep.label}</span>
                      </button>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-2 space-y-4">
                  <div className="relative">
                    <div className="flex items-center justify-between pb-1.5 text-xs text-muted-foreground">
                      <span className="text-[11px] font-medium text-foreground">Code Recipe</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy('active-code', getEndpointSnippet(selectedEndpoint, selectedLanguage))
                        }
                        className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === 'active-code' ? (
                          <>
                            <RiCheckLine className="h-3 w-3 text-primary" />
                            <span className="text-primary font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <RiFileCopyLine className="h-3 w-3" />
                            <span>Copy Snippet</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 rounded-2xl bg-muted/70 border border-border text-foreground font-mono text-[11px] overflow-x-auto leading-relaxed max-h-72">
                      {getEndpointSnippet(selectedEndpoint, selectedLanguage)}
                    </pre>
                  </div>

                  {/* Endpoint Documentation Table */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-1.5">
                      <div className="font-semibold text-foreground text-[11px]">Authentication Headers</div>
                      <div className="font-mono text-[10.5px] text-muted-foreground space-y-1">
                        <div>Authorization: Bearer &lt;API_KEY&gt;</div>
                        <div>Content-Type: application/json</div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-1.5">
                      <div className="font-semibold text-foreground text-[11px]">HTTP Response Codes</div>
                      <div className="font-mono text-[10.5px] text-muted-foreground space-y-1">
                        <div>200 OK • Success with formatted JSON</div>
                        <div>401 Unauthorized • Invalid or revoked key</div>
                        <div>429 Rate Limit • Backoff required</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* LIVE PLAYGROUND CARD */}
              <Card className="border-border bg-card shadow-xs rounded-2xl">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <RiTerminalBoxLine className="h-4 w-4 text-primary" />
                    <span>Live Testing Playground</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Execute queries against your live workspace RAG endpoint and inspect real-time JSON responses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-2 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      placeholder="Enter query for POST /api/v1/search/ask..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                    <Button
                      onClick={handleRunLiveTest}
                      disabled={isTestingApi || !testQuery.trim()}
                      className="gap-1.5 text-xs h-9 cursor-pointer shrink-0 rounded-xl"
                    >
                      {isTestingApi ? (
                        <>
                          <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <RiPlayLine className="h-3.5 w-3.5" />
                          <span>Execute Test</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {testLatency !== null && (
                    <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground font-mono">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>Status: <strong>200 OK</strong></span>
                      <span>• Latency: <strong>{testLatency} ms</strong></span>
                      <span>• Format: <strong>JSON</strong></span>
                    </div>
                  )}

                  {testResponse && (
                    <div className="relative">
                      <pre className="p-4 rounded-2xl bg-muted/80 border border-border text-foreground font-mono text-[11px] overflow-x-auto leading-relaxed max-h-64">
                        {testResponse}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* SECTION 3: USAGE & QUOTAS */}
          {activeSection === 'usage' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <Card className="border-border bg-card shadow-xs rounded-2xl">
                <CardHeader className="p-5 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
                        {organization ? `${organization.plan} Plan` : 'Pro Developer'}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {organization?.price || '$49 / mo'}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-semibold text-foreground mt-1">
                      Monthly Usage Quotas &amp; Rate Limits
                    </CardTitle>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPricingModalOpen(true)}
                    className="h-8 text-xs font-medium cursor-pointer"
                  >
                    Upgrade Tier
                  </Button>
                </CardHeader>

                <CardContent className="p-5 pt-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Meter 1: Real Requests */}
                    <div className="p-4 rounded-2xl border border-border bg-card/80 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">API Requests</span>
                        <span className="font-mono text-foreground font-semibold">
                          {metrics?.requestsUsed ?? 0} / {metrics?.maxRequests?.toLocaleString() ?? '2,500'}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(2, metrics?.requestsPercent ?? 0)}%` }} 
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {((metrics?.maxRequests ?? 2500) - (metrics?.requestsUsed ?? 0)).toLocaleString()} requests remaining
                      </div>
                    </div>

                    {/* Meter 2: Real RAG Queries */}
                    <div className="p-4 rounded-2xl border border-border bg-card/80 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Knowledge Base Queries</span>
                        <span className="font-mono text-foreground font-semibold">
                          {metrics?.ragQueriesUsed ?? 0} / {metrics?.maxRagQueries?.toLocaleString() ?? '1,000'}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(2, metrics?.ragQueriesPercent ?? 0)}%` }} 
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {((metrics?.maxRagQueries ?? 1000) - (metrics?.ragQueriesUsed ?? 0)).toLocaleString()} queries remaining
                      </div>
                    </div>

                    {/* Meter 3: Real Ingestion Minutes */}
                    <div className="p-4 rounded-2xl border border-border bg-card/80 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Transcript Ingestion</span>
                        <span className="font-mono text-foreground font-semibold">
                          {metrics?.minutesUsed ?? 0} / {metrics?.maxMinutes?.toLocaleString() ?? '500'} mins
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(2, metrics?.minutesPercent ?? 0)}%` }} 
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {((metrics?.maxMinutes ?? 500) - (metrics?.minutesUsed ?? 0)).toLocaleString()} mins remaining
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SECTION 4: WORKSPACE & PREFERENCES */}
          {activeSection === 'workspace' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>Stored Meetings</span>
                    <RiFoldersLine className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-xl font-bold text-foreground font-mono">
                    {metrics?.totalMeetings ?? 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">In active workspace</div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>Decisions Logged</span>
                    <RiCheckboxCircleLine className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-xl font-bold text-foreground font-mono">
                    {metrics?.totalDecisions ?? 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">AI verified</div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>Action Items</span>
                    <RiCheckLine className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-xl font-bold text-foreground font-mono">
                    {metrics?.totalActionItems ?? 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Assigned to team</div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>Active Tokens</span>
                    <RiKey2Line className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-xl font-bold text-foreground font-mono">
                    {metrics?.activeKeysCount ?? 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">API access keys</div>
                </div>
              </div>

              <Card className="border-border bg-card shadow-xs rounded-2xl">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <RiBuilding4Line className="h-4 w-4 text-primary" />
                    <span>Workspace Profile &amp; Preferences</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Organization details and automated AI extraction preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold">Organization Name</div>
                      <div className="font-semibold text-foreground text-[12px]">{organization?.name || 'MeetingOS Workspace'}</div>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold">Workspace Slug</div>
                      <div className="font-mono text-foreground text-[11px]">{organization?.slug || 'default'}</div>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold">Tenant ID</div>
                      <div className="font-mono text-muted-foreground text-[10px] truncate">{organization?.id || '—'}</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-semibold text-foreground">
                      Default AI Summary Style
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: 'executive', title: 'Executive Brief', desc: 'Key takeaways, critical decisions, and top risks' },
                        { id: 'engineering', title: 'Technical Spec', desc: 'Architecture notes, schema changes, and pull requests' },
                        { id: 'action', title: 'Action Oriented', desc: 'Task ownership, deadlines, and follow-up matrix' }
                      ].map((tpl) => (
                        <div
                          key={tpl.id}
                          onClick={() => setSummaryStyle(tpl.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            summaryStyle === tpl.id
                              ? 'border-primary bg-primary/5 text-foreground font-medium ring-1 ring-primary/30'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                          }`}
                        >
                          <div className="font-semibold text-foreground text-[11px]">{tpl.title}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{tpl.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-foreground">Auto-Extract Action Items</div>
                        <div className="text-[11px] text-muted-foreground">Detect tasks, assignees, and deadlines upon transcript ingestion.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoExtractActions}
                        onChange={(e) => setAutoExtractActions(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary cursor-pointer accent-primary"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-foreground">Calendar Meeting Synchronization</div>
                        <div className="text-[11px] text-muted-foreground">Poll connected Google Calendar &amp; MS Teams for newly ended calls.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoSyncCalendar}
                        onChange={(e) => setAutoSyncCalendar(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SECTION 5: AI PIPELINE & SECURITY */}
          {activeSection === 'pipeline' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <Card className="border-border bg-card shadow-xs rounded-2xl">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <RiBrainLine className="h-4 w-4 text-primary" />
                    <span>AI Pipeline &amp; Models</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Foundational LLMs, embeddings engines, and vector store configuration.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl border border-border bg-card/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Core Synthesis Engine</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px]">
                          Connected
                        </Badge>
                      </div>
                      <div className="text-sm font-bold text-foreground">Google Gemini 2.0 Flash</div>
                      <p className="text-[10.5px] text-muted-foreground">
                        Powers transcript comprehension, structured JSON output, risk analysis, and RAG synthesis.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Embedding Vectorizer</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px]">
                          768 Dimensions
                        </Badge>
                      </div>
                      <div className="text-sm font-bold text-foreground">text-embedding-004</div>
                      <p className="text-[10.5px] text-muted-foreground">
                        Generates dense semantic vector vectors for fast cosine similarity RAG retrieval.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-xs rounded-2xl">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <RiShieldCheckLine className="h-4 w-4 text-primary" />
                    <span>Tenant Data Isolation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-2 space-y-3">
                  <div className="p-3.5 rounded-xl bg-secondary/50 border border-border text-xs space-y-1">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <RiLockLine className="h-3.5 w-3.5 text-primary" />
                      <span>Multi-Tenant Cryptographic Isolation</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      All meetings, transcript chunks, vector embeddings, and persistent chat sessions are strictly keyed to your tenant organization ID with database foreign key cascade constraints.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <div className="text-xs font-semibold text-foreground">Export Workspace Intelligence</div>
                      <div className="text-[11px] text-muted-foreground">Download a complete JSON export of all meetings and decisions.</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert('Exporting workspace meeting records to JSON...')}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CREATE API KEY */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <RiKey2Line className="h-4 w-4 text-primary" />
                <span>Generate Developer Secret Key</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <RiCloseLine className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateApiKey} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Key Name / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Ingestion Service"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Permissions (Scopes)</label>
                <div className="space-y-1.5">
                  {[
                    { id: 'meetings:read', label: 'Read Meetings & Summaries', desc: 'Query transcripts and summaries' },
                    { id: 'meetings:write', label: 'Write Transcripts & Ingest', desc: 'Upload audio and create meetings' },
                    { id: 'rag:query', label: 'Ask Knowledge Base (RAG)', desc: 'Execute semantic AI search' }
                  ].map((sc) => (
                    <label
                      key={sc.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border bg-card/60 cursor-pointer hover:bg-muted/40"
                    >
                      <input
                        type="checkbox"
                        checked={newKeyScopes.includes(sc.id)}
                        onChange={() => toggleScope(sc.id)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-border text-primary accent-primary"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground text-[11px]">{sc.label}</span>
                        <span className="text-[10px] text-muted-foreground">{sc.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Expiration</label>
                <select
                  value={newKeyExpiry}
                  onChange={(e) => setNewKeyExpiry(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={365}>1 Year</option>
                  <option value={0}>Never Expire</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-8 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreatingKey || !newKeyName.trim()}
                  className="h-8 text-xs font-medium cursor-pointer"
                >
                  {isCreatingKey ? 'Generating...' : 'Generate Key'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COMMERCIAL API PRICING & TIERS */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <RiFlashlightLine className="h-5 w-5 text-primary" />
                  <span>MeetingOS Commercial API Tiers</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  High-throughput, enterprise-ready meeting intelligence APIs for software platforms and LLM pipelines.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPricingModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <RiCloseLine className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              {/* Free Tier */}
              <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="font-semibold text-foreground text-sm">Starter</div>
                  <div className="text-xl font-bold text-foreground">$0 <span className="text-xs text-muted-foreground font-normal">/ mo</span></div>
                  <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                    <li>✓ 100 API Requests / mo</li>
                    <li>✓ 60 Ingestion minutes</li>
                    <li>✓ 1 Active secret key</li>
                    <li>✓ Community support</li>
                  </ul>
                </div>
                <Button variant="outline" size="sm" disabled className="w-full text-xs">
                  {organization?.plan === 'STARTER' ? 'Current Plan' : 'Select'}
                </Button>
              </div>

              {/* Pro Tier (Active) */}
              <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 flex flex-col justify-between space-y-3 relative shadow-xs">
                <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[9px] py-0">
                  {organization?.plan === 'PRO' ? 'Current Plan' : 'Recommended'}
                </Badge>
                <div className="space-y-2">
                  <div className="font-semibold text-foreground text-sm">Pro Developer</div>
                  <div className="text-xl font-bold text-foreground">$49 <span className="text-xs text-muted-foreground font-normal">/ mo</span></div>
                  <ul className="space-y-1.5 text-[11px] text-foreground/90">
                    <li>✓ 2,500 API Requests / mo</li>
                    <li>✓ 500 Ingestion minutes</li>
                    <li>✓ 1,000 RAG Q&amp;A queries</li>
                    <li>✓ Unlimited API Keys</li>
                    <li>✓ 60 req/min rate limit</li>
                    <li>✓ Webhook event delivery</li>
                  </ul>
                </div>
                <Button size="sm" className="w-full text-xs cursor-pointer">
                  {organization?.plan === 'PRO' ? 'Manage Plan' : 'Upgrade to Pro'}
                </Button>
              </div>

              {/* Enterprise Tier */}
              <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="font-semibold text-foreground text-sm">Enterprise</div>
                  <div className="text-xl font-bold text-foreground">$299 <span className="text-xs text-muted-foreground font-normal">/ mo</span></div>
                  <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                    <li>✓ 50,000 API Requests</li>
                    <li>✓ 10,000+ Ingestion mins</li>
                    <li>✓ Dedicated Gemini 2.0 pool</li>
                    <li>✓ Custom LLM fine-tuning</li>
                    <li>✓ 99.99% Uptime SLA</li>
                    <li>✓ Dedicated Slack support</li>
                  </ul>
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs cursor-pointer">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
