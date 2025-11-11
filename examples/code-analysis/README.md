# Code Analysis Example

This example demonstrates code analysis and documentation generation.

## Task
Analyze a codebase and generate documentation.

## Expected Behavior
The agent should:
1. Use list_directory and read_file tools to explore the code
2. Analyze the code structure and functionality
3. Generate markdown documentation
4. Create a summary report

## Running the Example

```bash
node dist/cli.js run "Analyze the src/core directory and document the key components" \
  --workspace . \
  --max-cycles 15
```

## Expected Output

The agent will:
- List all files in the target directory
- Read and analyze key source files
- Identify main components and their relationships
- Generate comprehensive documentation

