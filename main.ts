import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
//import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express, { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {z} from "zod";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Load environment variables from .env file
// Ensure you have a .env file with USERNAME and API_TOKEN defined
const username = process.env.USERNAME;
const token = process.env.API_TOKEN;

// Encode credentials in base64
//const auth = Buffer.from(`${username}:${token}`).toString('base64');


// Create an MCP server
const server = new McpServer({
  name: "confluence-mcp-server",
  version: "1.0.0"
});





server.tool(
    'get-Wikicontent',
    'Tool to get Wiki content information',

    {
        spacekey: z.string().describe("Space key to get the Wiki content for"),

    },
    async({ spacekey }) => {
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://14k2c.atlassian.net/wiki/rest/api/content?spaceKey=${spacekey}&expand=space,body.view,version,container`,
            headers: { 
                'Authorization': "Basic ZGV2X20zNjVhZG1pbnVzZXJAMTRrMmMub25taWNyb3NvZnQuY29tOkFUQVRUM3hGZkdGMHFaQmxOcW1YU0ZCVHJtZS1EN2U2ZHlFUmE4MDJ4VUtkYnFmQVRMVk8wYlRNdXZIYkN3bUMweDRtMEFNVmhXdzlMMkpyTTVHVklZdGNiWXdMVE8wd2FMWE5pM1dxalRjN0hvQkhpOUJ6eEZHU1duRnI1ZEplSDF1MTA0SFFwcXpMWmtRUkl0UlFxLWZaNHliSWRIbngxMG42RnNhbmtKWGt0eGZUSDlYVVJKMD0zMDdEQkJGMA==",
                'Accept': 'application/json'
            }
        };

        try {
            const response = await axios.request(config);
            const data = response.data;

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({data}, null, 1),
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error}`
                    }
                ]
            };
        }
    }
);
    
server.tool(
    'get-EnvVars',
    'Tool to get environment variables',
    {},
    async () => {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(process.env.API_TOKEN, null, 2)
                }
            ]
        };
    }
);

// Start receiving messages on stdin and sending messages on stdout
//const transport = new StdioServerTransport();
//await server.connect(transport);





const app = express();
app.use(express.json());

const transport: StreamableHTTPServerTransport =
  new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // set to undefined for stateless servers
  });

// Setup routes for the server
const setupServer = async () => {
  await server.connect(transport);
};

app.post("/mcp", async (req: Request, res: Response) => {
  console.log("Received MCP request:", req.body);
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

app.get("/mcp", async (req: Request, res: Response) => {
  console.log("Received GET MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

app.delete("/mcp", async (req: Request, res: Response) => {
  console.log("Received DELETE MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

// Start the server
const PORT = process.env.PORT || 3000;
setupServer()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MCP Streamable HTTP Server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to set up the server:", error);
    process.exit(1);
  });


