# Simple Task Example

This example demonstrates a basic AutoGPT task with file operations.

## Task
Create a simple Hello World program in Python and execute it.

## Expected Behavior
The agent should:
1. Create a new Python file with Hello World code
2. Execute the Python file using the code execution tool
3. Report the output

## Running the Example

```bash
node dist/cli.js run "Create a Python Hello World program and execute it" \
  --workspace ./examples/simple-task/workspace \
  --max-cycles 5
```

## Expected Output

The agent will:
- Think about the task
- Use `write_file` tool to create `hello.py`
- Use `execute_code` tool to run the Python script
- Report "Hello, World!" as the output

