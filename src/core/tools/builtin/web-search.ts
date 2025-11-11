import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Tool, ToolExecutionContext } from '../index';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class WebSearchTool
  implements Tool<{ query: string }, SearchResult[]>
{
  readonly name = 'web_search';
  readonly description = 'Search the web for information';
  readonly parameters = [
    {
      name: 'query',
      type: 'string',
      description: 'Search query',
      required: true,
    },
  ];

  async invoke(
    args: { query: string },
    context: ToolExecutionContext
  ): Promise<SearchResult[]> {
    context.logger.info(`Searching web: ${args.query}`);

    // Simple DuckDuckGo HTML scraping (no API key required)
    // Note: For production, consider using official search APIs
    try {
      const response = await axios.get(
        `https://html.duckduckgo.com/html/`,
        {
          params: { q: args.query },
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; AutoGPT/1.0; +http://github.com/autogpt)',
          },
          timeout: 10000,
        }
      );

      const $ = cheerio.load(response.data);
      const results: SearchResult[] = [];

      $('.result').each((_, elem) => {
        const $elem = $(elem);
        const title = $elem.find('.result__title').text().trim();
        const url = $elem.find('.result__url').text().trim();
        const snippet = $elem.find('.result__snippet').text().trim();

        if (title && url) {
          results.push({
            title,
            url: url.startsWith('http') ? url : `https://${url}`,
            snippet,
          });
        }
      });

      context.logger.info(`Found ${results.length} search results`);
      return results.slice(0, 5); // Return top 5 results
    } catch (error) {
      context.logger.error('Web search failed', { error });
      throw new Error(`Web search failed: ${error}`);
    }
  }
}

export class WebScrapeTool
  implements Tool<{ url: string }, { content: string; title: string }>
{
  readonly name = 'scrape_webpage';
  readonly description = 'Scrape and extract text content from a webpage';
  readonly parameters = [
    {
      name: 'url',
      type: 'string',
      description: 'URL of the webpage to scrape',
      required: true,
    },
  ];

  async invoke(
    args: { url: string },
    context: ToolExecutionContext
  ): Promise<{ content: string; title: string }> {
    context.logger.info(`Scraping webpage: ${args.url}`);

    try {
      const response = await axios.get(args.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; AutoGPT/1.0; +http://github.com/autogpt)',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);

      // Remove script and style elements
      $('script, style, nav, header, footer').remove();

      // Extract title
      const title = $('title').text().trim() || 'Untitled';

      // Extract main content
      const content = $('body').text().trim().replace(/\s+/g, ' ');

      // Limit content length
      const truncated = content.substring(0, 5000);

      context.logger.info(`Scraped webpage: ${title}`, {
        length: truncated.length,
      });

      return {
        title,
        content: truncated,
      };
    } catch (error) {
      context.logger.error('Web scraping failed', { error });
      throw new Error(`Failed to scrape webpage: ${error}`);
    }
  }
}

