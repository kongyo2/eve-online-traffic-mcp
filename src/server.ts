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
import {
  regionInfoTool,
  constellationInfoTool,
  regionSystemsListTool
} from "./region-info-tools.js";
import {
  calculateRouteTool,
  calculateMultipleRoutesTool,
  findSystemsInRangeTool
} from "./route-tools.js";
import {
  getSystemCombatStatsTool
} from "./combat-stats-tools.js";
import {
  getStationServicesTool,
  getSystemStationsTool,
  findStationsWithServicesTool,
  getStationAgentsTool
} from "./station-services-tools.js";
import {
  findNearestLandmarksTool
} from "./landmark-tools.js";
import {
  findNearestTradeHubTool
} from "./nearest-trade-hub-tool.js";

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

// Add region information tools
server.addTool(regionInfoTool);
server.addTool(constellationInfoTool);
server.addTool(regionSystemsListTool);

// Add route calculation tools
server.addTool(calculateRouteTool);
server.addTool(calculateMultipleRoutesTool);
server.addTool(findSystemsInRangeTool);

// Add combat statistics tool
server.addTool(getSystemCombatStatsTool);

// Add station services tools
server.addTool(getStationServicesTool);
server.addTool(getSystemStationsTool);
server.addTool(findStationsWithServicesTool);
server.addTool(getStationAgentsTool);

// Add landmark tools
server.addTool(findNearestLandmarksTool);

// Add trade hub tools
server.addTool(findNearestTradeHubTool);

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

Station Services:
- get_station_services: Get comprehensive station information including available services and agents
- get_system_stations: Get all stations in specified solar systems with their services
- find_stations_with_services: Find stations that offer specific services within specified areas
- get_station_agents: Get detailed information about agents located at specific stations

Region Information:
- region_info: Get comprehensive region information including constellations and systems
- constellation_info: Get constellation information including systems and boundaries
- region_systems_list: Get detailed lists of all systems in specified regions

Route Calculation:
- calculate_route: Calculate the shortest route between two solar systems
- calculate_multiple_routes: Calculate routes from one origin to multiple destinations
- find_systems_in_range: Find all systems within a specified jump range

Combat Statistics:
- get_system_combat_stats: Get comprehensive combat statistics for a solar system
- get_multiple_system_combat_stats: Get combat statistics for multiple systems
- find_dangerous_systems: Find the most dangerous systems based on PvP activity

Landmark Information:
- find_nearest_landmarks: Find the nearest EVE Online landmarks to a specified solar system

Trade Hub Information:
- find_nearest_trade_hub: Find the nearest trade hub to a specified solar system with detailed route information

All tools use the official EVE Online ESI API, EVE-KILL API, and SDE data.
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

server.addPrompt({
  arguments: [
    {
      description: "Solar system name or ID to analyze",
      name: "system",
      required: true,
    },
  ],
  description: "Analyze combat activity and danger level for a solar system",
  load: async (args) => {
    return `Please analyze the combat activity and danger level for ${args.system}. Provide detailed information about:\n\n- Current PvP activity (ship and pod kills)\n- Recent killmail analysis\n- Battle history\n- Danger assessment and recommendations\n- Best times to avoid the system\n\nUse the get_system_combat_stats tool and provide actionable intelligence for pilots.`;
  },
  name: "eve-combat-analysis",
});

server.addPrompt({
  arguments: [
    {
      description: "Region ID, constellation ID, or comma-separated system IDs",
      name: "search_area",
      required: true,
    },
    {
      description: "Maximum number of systems to analyze",
      name: "limit",
      required: false,
    },
  ],
  description: "Find the most dangerous systems in a region or area",
  load: async (args) => {
    const limit = args.limit || '10';
    return `Please find the most dangerous systems in ${args.search_area}. Analyze up to ${limit} systems and provide:\n\n- Ranking by danger level\n- Current PvP activity levels\n- Recent high-value kills\n- Threat assessment for each system\n- Recommendations for safe travel\n\nUse the find_dangerous_systems tool and provide a comprehensive threat report.`;
  },
  name: "eve-danger-assessment",
});

server.addPrompt({
  arguments: [
    {
      description: "Station names or IDs to analyze",
      name: "stations",
      required: true,
    },
  ],
  description: "Analyze station services and facilities",
  load: async (args) => {
    return `Please analyze these EVE Online stations and provide detailed information about their services and facilities:\n\n${args.stations}\n\nUse the get_station_services tool to provide:\n\n- Available services at each station\n- Docking capabilities and restrictions\n- Reprocessing efficiency and fees\n- Security status of the system\n- Owner and faction information\n- Recommendations for specific activities`;
  },
  name: "eve-station-analysis",
});

server.addPrompt({
  arguments: [
    {
      description: "Required services (e.g., market, reprocessing, cloning)",
      name: "services",
      required: true,
    },
    {
      description: "Search area: system names, region names, or 'nearby'",
      name: "location",
      required: true,
    },
    {
      description: "Security preference: high-sec, low-sec, null-sec, or any",
      name: "security",
      required: false,
    },
  ],
  description: "Find stations with specific services in a given area",
  load: async (args) => {
    const security = args.security || 'any';
    return `Please find stations that offer these services: ${args.services}\n\nSearch in: ${args.location}\nSecurity preference: ${security}\n\nUse the find_stations_with_services tool and provide:\n\n- List of matching stations with their locations\n- Service availability at each station\n- Security status and travel safety\n- Distance and route information if applicable\n- Recommendations for the best options`;
  },
  name: "eve-service-finder",
});

server.addPrompt({
  arguments: [
    {
      description: "Station names or IDs to analyze for agents",
      name: "stations",
      required: true,
    },
    {
      description: "Whether to include research agents (slower)",
      name: "include_research",
      required: false,
    },
  ],
  description: "Analyze agents available at specific stations",
  load: async (args) => {
    const includeResearch = args.include_research === 'true' || args.include_research === 'yes';
    return `Please analyze the agents available at these EVE Online stations: ${args.stations}\n\nInclude research agents: ${includeResearch}\n\nUse the get_station_agents tool and provide:\n\n- List of all agents at each station\n- Agent types and specializations\n- Agent levels and quality ratings\n- Corporation affiliations\n- Research agent identification\n- Recommendations for mission running or research`;
  },
  name: "eve-agent-finder",
});

server.addPrompt({
  arguments: [
    {
      description: "Solar system name or ID to search from",
      name: "system",
      required: true,
    },
    {
      description: "Maximum number of landmarks to return (1-50)",
      name: "limit",
      required: false,
    },
    {
      description: "Maximum jump distance to search",
      name: "max_jumps",
      required: false,
    },
  ],
  description: "Find the nearest EVE Online landmarks to a solar system",
  load: async (args) => {
    const limit = args.limit || '10';
    const maxJumps = args.max_jumps ? ` within ${args.max_jumps} jumps` : '';
    return `Please find the nearest EVE Online landmarks to ${args.system}${maxJumps}. Return up to ${limit} landmarks and provide:\n\n- Landmark names and descriptions\n- Location information (system, security status, region)\n- Distance in jumps and AU\n- Route availability\n- Recommendations for exploration or navigation\n\nUse the find_nearest_landmarks tool to provide comprehensive landmark information for pilots.`;
  },
  name: "eve-landmark-finder",
});

server.start({
  transportType: "stdio",
});
