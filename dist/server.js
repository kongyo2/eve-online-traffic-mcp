import { FastMCP } from "fastmcp";
import { solarSystemNameToIdTool, stationNameToIdTool, regionNameToIdTool, universalNameToIdTool } from "./name-to-id-tools.js";
const server = new FastMCP({
    name: "EVE Online Traffic MCP",
    version: "1.0.0",
});
// Add name to ID conversion tools
server.addTool(solarSystemNameToIdTool);
server.addTool(stationNameToIdTool);
server.addTool(regionNameToIdTool);
server.addTool(universalNameToIdTool);
server.addResource({
    async load() {
        return {
            text: `EVE Online Traffic MCP Server

This server provides tools for EVE Online traffic and navigation:

Available Tools:
- solar_system_name_to_id: Convert solar system names to IDs
- station_name_to_id: Convert station names to IDs  
- region_name_to_id: Convert region names to IDs
- universal_name_to_id: Convert any entity names to IDs

All tools use the official EVE Online ESI API.
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
server.start({
    transportType: "stdio",
});
