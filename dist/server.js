import { FastMCP } from "fastmcp";
import { solarSystemNameToIdTool, stationNameToIdTool, regionNameToIdTool, universalNameToIdTool } from "./name-to-id-tools.js";
import { solarSystemInfoTool, stargateInfoTool, systemConnectionMapTool } from "./system-info-tools.js";
import { calculateRouteTool, calculateMultipleRoutesTool, findSystemsInRangeTool } from "./route-tools.js";
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
// Add route calculation tools
server.addTool(calculateRouteTool);
server.addTool(calculateMultipleRoutesTool);
server.addTool(findSystemsInRangeTool);
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

Route Calculation:
- calculate_route: Calculate the shortest route between two solar systems
- calculate_multiple_routes: Calculate routes from one origin to multiple destinations
- find_systems_in_range: Find all systems within a specified jump range

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
server.addPrompt({
    arguments: [
        {
            description: "Origin solar system name or ID",
            name: "origin",
            required: true,
        },
        {
            description: "Destination solar system name or ID",
            name: "destination",
            required: true,
        },
        {
            description: "Route preference: shortest, secure, or insecure",
            name: "route_type",
            required: false,
        },
    ],
    description: "Calculate and analyze a route between two EVE Online solar systems",
    load: async (args) => {
        const routeType = args.route_type || 'shortest';
        return `Please calculate a route from ${args.origin} to ${args.destination} using ${routeType} routing. Provide detailed information about the route including:\n\n- Total jump count\n- Systems along the route\n- Security status of systems\n- Any notable waypoints or dangerous areas\n\nUse the calculate_route tool and supplement with system information as needed.`;
    },
    name: "eve-route-planning",
});
server.addPrompt({
    arguments: [
        {
            description: "Origin solar system name or ID",
            name: "origin",
            required: true,
        },
        {
            description: "Maximum number of jumps to search",
            name: "max_jumps",
            required: true,
        },
        {
            description: "Route preference: shortest, secure, or insecure",
            name: "route_type",
            required: false,
        },
    ],
    description: "Find systems within jump range for activity planning",
    load: async (args) => {
        const routeType = args.route_type || 'shortest';
        return `Please find all solar systems within ${args.max_jumps} jumps of ${args.origin} using ${routeType} routing. Provide analysis of:\n\n- Systems by jump distance\n- Security status distribution\n- Potential activities in nearby systems\n- Strategic locations\n\nUse the find_systems_in_range tool and supplement with system information as needed.`;
    },
    name: "eve-range-analysis",
});
server.start({
    transportType: "stdio",
});
