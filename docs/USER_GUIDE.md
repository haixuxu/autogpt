# AutoGPT User Guide

Complete guide to using AutoGPT Node.js implementation.

## Table of Contents
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Basic Usage](#basic-usage)
4. [Available Tools](#available-tools)
5. [Advanced Features](#advanced-features)
6. [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites
- Node.js 20.9.0 or higher
- OpenAI API key
- Docker (optional, for Chroma vector database)

### Quick Start

```bash
# Install globally
npm install -g autogpt

# Or use locally
git clone https://github.com/haixuxu/autogpt.git
cd autogpt
npm install
npm run build
```

### Setup Environment

Create a `.env` file:

```env
# Required
OPENAI_API_KEY=sk-your-api-key-here

# Optional
DATABASE_URL=file:./autogpt.db
CHROMA_URL=http://localhost:8000
OPENAI_MODEL=gpt-4
LOG_LEVEL=info
WORKSPACE_ROOT=./workspace
```

### Start Chroma (Optional)

For vector search capabilities:

```bash
docker run -d -p 8000:8000 -v chroma-data:/chroma/chroma chromadb/chroma
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `OPENAI_MODEL` | LLM model to use | `gpt-4` |
| `OPENAI_TEMPERATURE` | Temperature (0-2) | `0.7` |
| `OPENAI_MAX_TOKENS` | Max tokens per request | `2000` |
| `DATABASE_URL` | SQLite database path | `file:./autogpt.db` |
| `CHROMA_URL` | Chroma server URL | `http://localhost:8000` |
| `LOG_LEVEL` | Log level | `info` |
| `WORKSPACE_ROOT` | Workspace directory | `./workspace` |
| `MAX_CYCLES` | Max agent cycles | `50` |

### Config File

Create `config.json` to override defaults:

```json
{
  "llm": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 2000
  },
  "workspace": {
    "root": "./my-workspace",
    "restrictToWorkspace": true
  },
  "plugins": {
    "enabled": true,
    "directories": ["./plugins", "./custom-plugins"]
  }
}
```

## Basic Usage

### Running a Task

```bash
# Simple task
autogpt run "Create a Hello World program in Python"

# With options
autogpt run "Research AI trends and create a report" \
  --workspace ./research \
  --max-cycles 15 \
  --continuous
```

### CLI Options

| Option | Description |
|--------|-------------|
| `-w, --workspace <path>` | Workspace directory |
| `-c, --continuous` | Run without asking confirmation |
| `-m, --max-cycles <number>` | Maximum execution cycles |

### Managing Agents

```bash
# List all agents
autogpt list

# Show agent details
autogpt show <agent-id>
```

## Available Tools

### Filesystem Tools

**read_file**
- Read content from a file
- Parameters: `path` (string)

**write_file**
- Write content to a file
- Parameters: `path` (string), `content` (string)

**list_directory**
- List files in a directory
- Parameters: `path` (string, optional)

### Web Tools

**web_search**
- Search the web using DuckDuckGo
- Parameters: `query` (string)
- Returns: Top 5 search results

**scrape_webpage**
- Extract text content from a webpage
- Parameters: `url` (string)
- Returns: Page title and content (truncated to 5000 chars)

### Code Execution

**execute_code**
- Execute code in a sandboxed environment
- Parameters: `language` (python|javascript|bash), `code` (string)
- Returns: stdout, stderr, exit code, duration

## Advanced Features

### Continuous Mode

Run agent autonomously without confirmations:

```bash
autogpt run "Build a calculator app" --continuous --max-cycles 20
```

**Warning**: Use with caution as agent has full tool access!

### Memory System

The agent maintains:
- **Short-term memory**: Last 10 cycles
- **Long-term memory**: Vector-indexed past experiences

Memory is automatically managed and used for context.

### Plugin System

Create custom plugins to extend functionality:

1. Create plugin directory structure:
```
my-plugin/
├── autogpt-plugin.json
├── package.json
└── src/
    └── index.ts
```

2. Define manifest:
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "entry": "dist/index.js",
  "commands": [...]
}
```

3. Implement plugin:
```typescript
export const manifest = { /* ... */ };
export async function register(context: PluginContext) {
  context.registerCommand(/* ... */);
}
```

### Custom Directives

Modify agent behavior with directives in config:

```json
{
  "agent": {
    "directives": {
      "constraints": [
        "Always explain your reasoning",
        "Verify results before proceeding"
      ],
      "resources": [
        "Use filesystem carefully",
        "Search web for unknown information"
      ]
    }
  }
}
```

## Troubleshooting

### Common Issues

**"OpenAI API key not found"**
- Ensure `.env` file exists with `OPENAI_API_KEY`
- Check environment variable is set: `echo $OPENAI_API_KEY`

**"Database error"**
- Run migrations: `npx prisma migrate dev`
- Check DATABASE_URL in `.env`

**"Chroma connection failed"**
- Start Chroma: `docker run -d -p 8000:8000 chromadb/chroma`
- Check CHROMA_URL matches running instance

**"Tool execution timeout"**
- Increase timeout in sandbox policy
- Check network connectivity for web tools

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug autogpt run "your task"
```

### Logs

Logs are written to:
- Console (colored output)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

### Getting Help

- Check examples: `examples/`
- Read architecture docs: `docs/architecture/`
- Open an issue: GitHub Issues
- View logs: `logs/` directory

## Best Practices

1. **Start Small**: Begin with simple tasks to understand behavior
2. **Use Workspace**: Always specify a workspace directory
3. **Set Limits**: Use `--max-cycles` to prevent runaway execution
4. **Monitor Logs**: Watch logs for issues
5. **Backup Data**: Agent can modify files - backup important data
6. **Review Actions**: Use non-continuous mode for important tasks
7. **Update Regularly**: Keep AutoGPT and dependencies updated

## Examples

See `examples/` directory for:
- `simple-task/` - Basic Hello World example
- `web-research/` - Web search and summarization
- `code-analysis/` - Code analysis and documentation

## Next Steps

- Explore example tasks
- Create custom plugins
- Read architecture documentation
- Join the community

---

For more information, visit the [GitHub repository](https://github.com/haixuxu/autogpt).

