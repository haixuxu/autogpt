# Contributing to AutoGPT Node.js

Thank you for your interest in contributing to AutoGPT!

## Development Setup

### Prerequisites
- Node.js >= 20.9.0
- npm or pnpm
- Docker (for Chroma vector database)
- OpenAI API key

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/haixuxu/autogpt.git
   cd autogpt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

4. **Start Chroma (optional)**
   ```bash
   docker run -d -p 8000:8000 chromadb/chroma
   ```

5. **Setup database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

6. **Build and test**
   ```bash
   npm run build
   npm test
   ```

## Project Structure

```
/src
  /core        - Core agent logic
    /agent     - Agent loop, thought process, memory
    /cli       - CLI commands and UI
    /config    - Configuration system
    /plugins   - Plugin system
    /tools     - Tool registry and built-in tools
    /telemetry - Logging and monitoring
  /infra       - Infrastructure adapters
    /database  - Prisma database client
    /vectorstore - Chroma vector store
    /executor  - Code execution sandbox
    /llm       - OpenAI provider
  /shared      - Shared types and utilities
/prisma        - Database schema and migrations
/tests         - Test suites
/examples      - Example tasks
/docs          - Documentation
```

## Development Workflow

### Making Changes

1. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
   - Follow TypeScript best practices
   - Add types for all new code
   - Keep functions focused and testable

3. Test your changes
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

4. Commit your changes
   ```bash
   git commit -m "feat: add your feature description"
   ```

### Commit Message Format

We follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use meaningful variable names

### Testing

- Write unit tests for new functions
- Add integration tests for features
- Ensure all tests pass before submitting PR
- Aim for >80% code coverage

### Adding New Tools

To add a new tool:

1. Create a new file in `src/core/tools/builtin/`
2. Implement the `Tool` interface
3. Add parameters with types and descriptions
4. Register the tool in `builtin/index.ts`
5. Add tests for the tool
6. Update documentation

Example:
```typescript
export class MyTool implements Tool<Args, Result> {
  readonly name = 'my_tool';
  readonly description = 'What this tool does';
  readonly parameters = [
    {
      name: 'param1',
      type: 'string',
      description: 'Parameter description',
      required: true,
    },
  ];

  async invoke(args: Args, context: ToolExecutionContext): Promise<Result> {
    // Implementation
  }
}
```

### Adding Plugins

To create a plugin:

1. Create a new directory in `plugins/`
2. Add `autogpt-plugin.json` manifest
3. Implement the plugin module
4. Export manifest and register function
5. Add tests and documentation

Example manifest:
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "entry": "dist/index.js",
  "commands": [
    {
      "name": "my_command",
      "description": "Command description",
      "parameters": {}
    }
  ]
}
```

## Pull Request Process

1. Update README.md with any new features
2. Update IMPLEMENTATION_STATUS.md if applicable
3. Add or update tests
4. Ensure all checks pass
5. Request review from maintainers
6. Address review feedback
7. Squash commits if requested

## Code Review Guidelines

Reviewers will check for:
- Code quality and style
- Test coverage
- Documentation completeness
- Performance considerations
- Security implications
- Breaking changes

## Questions?

- Open an issue for bugs or feature requests
- Join discussions for questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.

