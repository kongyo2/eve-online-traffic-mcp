import { FastMCP } from "fastmcp";
import { 
  solarSystemNameToIdTool,
  stationNameToIdTool,
  regionNameToIdTool,
  universalNameToIdTool
} from "./name-to-id-tools.js";
import {
  solarSystemInfoTool,
  stargateInfoTool,
  systemConnectionMapTool
} from "./system-info-tools.js";

const server = new FastMCP({
  name: "EVE Online Traffic MCP",
  version: "1.0.0",
});

// Add name to ID conversion tools
server.addTool(solarSystemNameToIdTool);
server.addTool(stationNameToIdTool);
server.addTool(regionNameToIdTool);
server.addTool(universalNameToIdTool);

// Add system information tools
server.addTool(solarSystemInfoTool);
server.addTool(stargateInfoTool);
server.addTool(systemConnectionMapTool);

server.addResource({
  async load() {
    return {
      text: `EVE Online Traffic MCP Server

This server provides tools for EVE Online traffic and navigation:

Available Tools:

Name to ID Conversion:
- solar_system_name_to_id: Convert solar system names to IDs
- station_name_to_id: Convert station names to IDs  
- region_name_to_id: Convert region names to IDs
- universal_name_to_id: Convert any entity names to IDs

System Information:
- solar_system_info: Get comprehensive solar system information from ESI and SDE
- stargate_info: Get stargate information and connections
- system_connection_map: Generate connection maps for solar systems

All tools use the official EVE Online ESI API and SDE data.
`,
    };
  },
  mimeType: "text/plain",
  name: "EVE Traffic MCP Info",
  uri: "file:///info/eve-traffic-mcp.txt",
});

server.addPrompt({
  arguments: [
    {
      description: "EVE Online entity names (systems, stations, regions, etc.)",
      name: "names",
      required: true,
    },
  ],
  description: "Generate a summary of EVE Online entities with their IDs",
  load: async (args) => {
    return `Please use the universal_name_to_id tool to look up these EVE Online entities and provide a summary:\n\n${args.names}`;
  },
  name: "eve-entity-lookup",
});

server.addPrompt({
  arguments: [
    {
      description: "Solar system names or IDs to analyze",
      name: "systems",
      required: true,
    },
  ],
  description: "Analyze solar system information and connections",
  load: async (args) => {
    return `Please analyze these EVE Online solar systems and provide detailed information including security status, connections, and traffic data:\n\n${args.systems}\n\nUse the appropriate tools to first convert names to IDs if needed, then get system information and connection maps.`;
  },
  name: "eve-system-analysis",
});

server.start({
  transportType: "stdio",
});
