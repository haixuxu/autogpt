# Web Research Example

This example demonstrates web search and content summarization.

## Task
Research the latest trends in AI and create a summary document.

## Expected Behavior
The agent should:
1. Use web_search tool to find relevant articles
2. Use scrape_webpage tool to read article content
3. Synthesize information from multiple sources
4. Create a markdown summary document

## Running the Example

```bash
node dist/cli.js run "Research the top 3 trends in AI for 2024 and create a summary" \
  --workspace ./examples/web-research/workspace \
  --max-cycles 10
```

## Expected Output

The agent will:
- Search for AI trends
- Visit and scrape multiple webpages
- Create a well-structured markdown document
- Include sources and references

