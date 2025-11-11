# AutoGPT Quick Start Guide

Get up and running with AutoGPT in 5 minutes.

## Prerequisites

- Node.js 20.9.0 or higher
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- Docker (optional, for vector search)

## Installation

### Step 1: Clone and Install

```bash
git clone https://github.com/haixuxu/autogpt.git
cd autogpt
npm install
```

### Step 2: Configure

```bash
# Create .env file
cp .env.example .env

# Edit .env and add your OpenAI API key
nano .env  # or use your favorite editor
```

Required in `.env`:
```env
OPENAI_API_KEY=sk-your-api-key-here
```

### Step 3: Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

### Step 4: Build

```bash
npm run build
```

### Step 5 (Optional): Start Chroma for Vector Search

```bash
docker run -d -p 8000:8000 -v chroma-data:/chroma/chroma chromadb/chroma
```

## First Run

### Hello World Example

```bash
node dist/cli.js run "Create a Python Hello World program and execute it" \
  --workspace ./workspace \
  --max-cycles 5
```

This will:
1. Agent thinks about the task
2. Creates a Python file with Hello World code
3. Executes the Python file
4. Reports the output

### Web Research Example

```bash
node dist/cli.js run "Research the top 3 AI frameworks and summarize" \
  --workspace ./research \
  --max-cycles 10
```

This will:
1. Search the web for AI frameworks
2. Visit and scrape relevant webpages
3. Synthesize information
4. Create a summary document

## Common Options

| Option | Description | Example |
|--------|-------------|---------|
| `-w, --workspace <path>` | Workspace directory | `--workspace ./my-workspace` |
| `-c, --continuous` | Run without confirmations | `--continuous` |
| `-m, --max-cycles <n>` | Maximum cycles | `--max-cycles 20` |

## What Happens During Execution?

1. **Initialization**
   - Loads configuration
   - Connects to OpenAI
   - Sets up workspace

2. **Agent Loop** (repeats until task complete)
   - 🤔 **Think**: Agent reasons about the task
   - 🔧 **Act**: Executes a tool (read/write file, search web, etc.)
   - 📝 **Remember**: Stores experience in memory
   - ✅ **Confirm** (optional): Asks for your approval

3. **Completion**
   - Reports final status
   - Saves to database
   - Logs everything

## Available Tools

Agent has access to:

- **read_file** - Read file contents
- **write_file** - Write to files
- **list_directory** - List files
- **web_search** - Search the web
- **scrape_webpage** - Extract webpage content
- **execute_code** - Run Python/JavaScript/Bash

## Safety Features

- ✅ Workspace isolation (agent can only access specified directory)
- ✅ Action confirmation (approve each action before execution)
- ✅ Resource limits (timeout, memory limits on code execution)
- ✅ Detailed logging (see `logs/` directory)

## Troubleshooting

### "OpenAI API key not found"
- Check `.env` file exists
- Verify `OPENAI_API_KEY` is set
- No spaces around `=` in `.env`

### "Database error"
- Run `npx prisma generate`
- Run `npx prisma migrate dev`

### "Chroma connection failed"
- Not required for basic operation
- Start Chroma if you want vector search
- Or comment out `CHROMA_URL` in `.env`

### Agent isn't completing the task
- Increase `--max-cycles`
- Check logs in `logs/combined.log`
- Try a more specific task description

## Next Steps

1. **Try Examples**: See `examples/` directory for more use cases
2. **Read User Guide**: `docs/USER_GUIDE.md` for advanced features
3. **Create Plugins**: `docs/CONTRIBUTING.md` for custom extensions
4. **Explore Architecture**: `docs/architecture/` for system design

## Getting Help

- 📖 **Documentation**: `docs/USER_GUIDE.md`
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions
- 📝 **Logs**: Check `logs/` directory

## Continuous Mode (Advanced)

⚠️ **Warning**: Agent has full tool access! Use with caution.

```bash
node dist/cli.js run "Build a calculator app" \
  --continuous \
  --max-cycles 20 \
  --workspace ./calculator
```

In continuous mode:
- No confirmations required
- Agent runs autonomously
- Faster execution
- Higher risk

## Tips for Success

1. **Be Specific**: Clear task descriptions = better results
2. **Start Small**: Simple tasks first to understand behavior
3. **Use Workspace**: Always specify a workspace directory
4. **Set Limits**: Use `--max-cycles` to prevent runaway execution
5. **Review Logs**: Monitor `logs/combined.log` for issues
6. **Backup Data**: Agent can modify files - backup important data

---

Happy automating! 🚀

For more details, see the [complete documentation](./docs/USER_GUIDE.md).
