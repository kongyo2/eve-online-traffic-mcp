/**
 * Route calculation tools for EVE Online
 */

import { z } from "zod";
import { ESIClient } from "./esi-client.js";

const esiClient = new ESIClient();

/**
 * Calculate route between two solar systems
 */
export const calculateRouteTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external ESI API
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Calculate Route",
  },
  description: "Calculate the shortest route between two EVE Online solar systems using ESI API. Supports system names or IDs.",
  execute: async (args: { 
    origin: string | number; 
    destination: string | number; 
    flag?: 'shortest' | 'secure' | 'insecure';
    avoidSystems?: (string | number)[];
  }) => {
    try {
      let originId: number;
      let destinationId: number;
      let avoidSystemIds: number[] | undefined;

      // Convert origin to ID if it's a string
      if (typeof args.origin === 'string') {
        const originResult = await esiClient.getSolarSystemIds([args.origin]);
        if (originResult.length === 0) {
          return JSON.stringify({
            success: false,
            message: `Origin system '${args.origin}' not found`,
            route: null
          });
        }
        originId = originResult[0].id;
      } else {
        originId = args.origin;
      }

      // Convert destination to ID if it's a string
      if (typeof args.destination === 'string') {
        const destinationResult = await esiClient.getSolarSystemIds([args.destination]);
        if (destinationResult.length === 0) {
          return JSON.stringify({
            success: false,
            message: `Destination system '${args.destination}' not found`,
            route: null
          });
        }
        destinationId = destinationResult[0].id;
      } else {
        destinationId = args.destination;
      }

      // Convert avoid systems to IDs if provided
      if (args.avoidSystems && args.avoidSystems.length > 0) {
        avoidSystemIds = [];
        for (const system of args.avoidSystems) {
          if (typeof system === 'string') {
            const avoidResult = await esiClient.getSolarSystemIds([system]);
            if (avoidResult.length > 0) {
              avoidSystemIds.push(avoidResult[0].id);
            }
          } else {
            avoidSystemIds.push(system);
          }
        }
      }

      // Calculate route with details
      const routeInfo = await esiClient.calculateRouteWithDetails(
        originId,
        destinationId,
        args.flag || 'shortest',
        avoidSystemIds
      );

      // Get system names for the route
      const routeNames = await esiClient.idsToNames(routeInfo.route);
      const routeWithNames = routeInfo.route.map(systemId => {
        const systemName = routeNames.find(s => s.id === systemId);
        return {
          id: systemId,
          name: systemName?.name || `System ${systemId}`
        };
      });

      return JSON.stringify({
        success: true,
        message: `Route calculated: ${routeInfo.jumps} jumps from ${routeInfo.origin.name} to ${routeInfo.destination.name}`,
        route: {
          ...routeInfo,
          route_with_names: routeWithNames,
          summary: {
            total_systems: routeInfo.route.length,
            total_jumps: routeInfo.jumps,
            route_type: routeInfo.flag,
            avoided_systems_count: avoidSystemIds?.length || 0
          }
        }
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error calculating route: ${error instanceof Error ? error.message : 'Unknown error'}`,
        route: null
      });
    }
  },
  name: "calculate_route",
  parameters: z.object({
    origin: z.union([z.string(), z.number()]).describe("Origin solar system name or ID"),
    destination: z.union([z.string(), z.number()]).describe("Destination solar system name or ID"),
    flag: z.enum(['shortest', 'secure', 'insecure']).optional().default('shortest').describe("Route preference: shortest (default), secure (high-sec only), or insecure (low/null-sec allowed)"),
    avoidSystems: z.array(z.union([z.string(), z.number()])).optional().describe("Optional array of solar system names or IDs to avoid in the route")
  }),
};

/**
 * Calculate multiple routes from one origin to multiple destinations
 */
export const calculateMultipleRoutesTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external ESI API
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Calculate Multiple Routes",
  },
  description: "Calculate routes from one origin system to multiple destination systems. Useful for finding the best destination or comparing routes.",
  execute: async (args: { 
    origin: string | number; 
    destinations: (string | number)[]; 
    flag?: 'shortest' | 'secure' | 'insecure';
    avoidSystems?: (string | number)[];
  }) => {
    try {
      if (args.destinations.length === 0) {
        return JSON.stringify({
          success: false,
          message: "At least one destination must be provided",
          routes: []
        });
      }

      if (args.destinations.length > 20) {
        return JSON.stringify({
          success: false,
          message: "Maximum 20 destinations allowed per request",
          routes: []
        });
      }

      let originId: number;
      let avoidSystemIds: number[] | undefined;

      // Convert origin to ID if it's a string
      if (typeof args.origin === 'string') {
        const originResult = await esiClient.getSolarSystemIds([args.origin]);
        if (originResult.length === 0) {
          return JSON.stringify({
            success: false,
            message: `Origin system '${args.origin}' not found`,
            routes: []
          });
        }
        originId = originResult[0].id;
      } else {
        originId = args.origin;
      }

      // Convert avoid systems to IDs if provided
      if (args.avoidSystems && args.avoidSystems.length > 0) {
        avoidSystemIds = [];
        for (const system of args.avoidSystems) {
          if (typeof system === 'string') {
            const avoidResult = await esiClient.getSolarSystemIds([system]);
            if (avoidResult.length > 0) {
              avoidSystemIds.push(avoidResult[0].id);
            }
          } else {
            avoidSystemIds.push(system);
          }
        }
      }

      const routes = [];
      const errors = [];

      // Calculate routes to each destination
      for (const destination of args.destinations) {
        try {
          let destinationId: number;

          // Convert destination to ID if it's a string
          if (typeof destination === 'string') {
            const destinationResult = await esiClient.getSolarSystemIds([destination]);
            if (destinationResult.length === 0) {
              errors.push(`Destination system '${destination}' not found`);
              continue;
            }
            destinationId = destinationResult[0].id;
          } else {
            destinationId = destination;
          }

          // Calculate route
          const routeInfo = await esiClient.calculateRouteWithDetails(
            originId,
            destinationId,
            args.flag || 'shortest',
            avoidSystemIds
          );

          routes.push({
            destination: routeInfo.destination,
            jumps: routeInfo.jumps,
            route_length: routeInfo.route.length,
            route_type: routeInfo.flag
          });
        } catch (error) {
          errors.push(`Error calculating route to ${destination}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Sort routes by jump count (shortest first)
      routes.sort((a, b) => a.jumps - b.jumps);

      return JSON.stringify({
        success: routes.length > 0,
        message: `Calculated ${routes.length} route(s) from ${typeof args.origin === 'string' ? args.origin : `System ${args.origin}`}`,
        routes,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total_destinations_requested: args.destinations.length,
          successful_routes: routes.length,
          failed_routes: errors.length,
          shortest_route: routes.length > 0 ? {
            destination: routes[0].destination.name,
            jumps: routes[0].jumps
          } : null,
          longest_route: routes.length > 0 ? {
            destination: routes[routes.length - 1].destination.name,
            jumps: routes[routes.length - 1].jumps
          } : null
        }
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error calculating multiple routes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        routes: []
      });
    }
  },
  name: "calculate_multiple_routes",
  parameters: z.object({
    origin: z.union([z.string(), z.number()]).describe("Origin solar system name or ID"),
    destinations: z.array(z.union([z.string(), z.number()])).min(1).max(20).describe("Array of destination solar system names or IDs (max 20)"),
    flag: z.enum(['shortest', 'secure', 'insecure']).optional().default('shortest').describe("Route preference: shortest (default), secure (high-sec only), or insecure (low/null-sec allowed)"),
    avoidSystems: z.array(z.union([z.string(), z.number()])).optional().describe("Optional array of solar system names or IDs to avoid in all routes")
  }),
};

/**
 * Find systems within a certain jump range using graph traversal
 */
export const findSystemsInRangeTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external ESI API
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Find Systems in Range",
  },
  description: "Find all solar systems within a specified jump range from an origin system using efficient graph traversal. Builds a stargate connection graph for accurate results.",
  execute: async (args: { 
    origin: string | number; 
    maxJumps: number;
    flag?: 'shortest' | 'secure' | 'insecure';
    avoidSystems?: (string | number)[];
  }) => {
    try {
      if (args.maxJumps < 1 || args.maxJumps > 10) {
        return JSON.stringify({
          success: false,
          message: "Maximum jumps must be between 1 and 10",
          systems: []
        });
      }

      let originId: number;

      // Convert origin to ID if it's a string
      if (typeof args.origin === 'string') {
        const originResult = await esiClient.getSolarSystemIds([args.origin]);
        if (originResult.length === 0) {
          return JSON.stringify({
            success: false,
            message: `Origin system '${args.origin}' not found`,
            systems: []
          });
        }
        originId = originResult[0].id;
      } else {
        originId = args.origin;
      }

      // Convert avoid systems to IDs if provided
      let avoidSystemIds: Set<number> = new Set();
      if (args.avoidSystems && args.avoidSystems.length > 0) {
        for (const system of args.avoidSystems) {
          if (typeof system === 'string') {
            const avoidResult = await esiClient.getSolarSystemIds([system]);
            if (avoidResult.length > 0) {
              avoidSystemIds.add(avoidResult[0].id);
            }
          } else {
            avoidSystemIds.add(system);
          }
        }
      }

      // Build adjacency graph using stargate connections
      const adjacencyGraph = new Map<number, number[]>();
      const systemsInRange = new Map<number, { id: number; name: string; jumps: number }>();
      const visited = new Set<number>();
      const queue: Array<{ systemId: number; jumps: number }> = [];

      // Start BFS from origin
      queue.push({ systemId: originId, jumps: 0 });
      visited.add(originId);

      // Get origin system name
      const originNames = await esiClient.idsToNames([originId]);
      const originName = originNames[0]?.name || `System ${originId}`;

      let systemsProcessed = 0;
      const maxSystemsToProcess = 1000; // Limit to prevent excessive API calls

      while (queue.length > 0 && systemsProcessed < maxSystemsToProcess) {
        const { systemId, jumps } = queue.shift()!;
        systemsProcessed++;

        // Skip if we've reached max jumps or if system should be avoided
        if (jumps >= args.maxJumps || avoidSystemIds.has(systemId)) {
          continue;
        }

        try {
          // Get system info to find connected stargates
          const systemInfo = await esiClient.getSolarSystemInfo(systemId);
          
          if (!systemInfo.stargates || systemInfo.stargates.length === 0) {
            continue;
          }

          // Process each stargate to find connected systems
          for (const stargateId of systemInfo.stargates) {
            try {
              const stargateInfo = await esiClient.getStargateInfo(stargateId);
              const connectedSystemId = stargateInfo.destination.system_id;

              // Skip if already visited, is the origin, or should be avoided
              if (visited.has(connectedSystemId) || connectedSystemId === originId || avoidSystemIds.has(connectedSystemId)) {
                continue;
              }

              // Apply security filtering based on flag
              if (args.flag === 'secure') {
                const connectedSystemInfo = await esiClient.getSolarSystemInfo(connectedSystemId);
                if (connectedSystemInfo.security_status < 0.5) {
                  continue; // Skip low-sec and null-sec systems
                }
              }

              visited.add(connectedSystemId);
              const nextJumps = jumps + 1;

              // Add to results if within range
              if (nextJumps <= args.maxJumps) {
                const systemNames = await esiClient.idsToNames([connectedSystemId]);
                const systemName = systemNames[0]?.name || `System ${connectedSystemId}`;
                
                systemsInRange.set(connectedSystemId, {
                  id: connectedSystemId,
                  name: systemName,
                  jumps: nextJumps
                });

                // Add to queue for further exploration if not at max jumps
                if (nextJumps < args.maxJumps) {
                  queue.push({ systemId: connectedSystemId, jumps: nextJumps });
                }
              }
            } catch (stargateError) {
              // Skip problematic stargates
              continue;
            }
          }
        } catch (systemError) {
          // Skip problematic systems
          continue;
        }
      }

      // Convert to array and sort by jump count
      const results = Array.from(systemsInRange.values()).sort((a, b) => a.jumps - b.jumps);

      return JSON.stringify({
        success: true,
        message: `Found ${results.length} systems within ${args.maxJumps} jumps of ${originName} using graph traversal`,
        systems: results,
        summary: {
          origin: originName,
          max_jumps: args.maxJumps,
          systems_found: results.length,
          systems_processed: systemsProcessed,
          route_type: args.flag || 'shortest',
          avoided_systems_count: avoidSystemIds.size,
          jump_distribution: {
            "1_jump": results.filter(s => s.jumps === 1).length,
            "2_jumps": results.filter(s => s.jumps === 2).length,
            "3_jumps": results.filter(s => s.jumps === 3).length,
            "4_jumps": results.filter(s => s.jumps === 4).length,
            "5_plus_jumps": results.filter(s => s.jumps >= 5).length
          }
        }
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error finding systems in range: ${error instanceof Error ? error.message : 'Unknown error'}`,
        systems: []
      });
    }
  },
  name: "find_systems_in_range",
  parameters: z.object({
    origin: z.union([z.string(), z.number()]).describe("Origin solar system name or ID"),
    maxJumps: z.number().min(1).max(10).describe("Maximum number of jumps to search (1-10)"),
    flag: z.enum(['shortest', 'secure', 'insecure']).optional().default('shortest').describe("Route preference: shortest (default), secure (high-sec only), or insecure (low/null-sec allowed)"),
    avoidSystems: z.array(z.union([z.string(), z.number()])).optional().describe("Optional array of solar system names or IDs to avoid in routes")
  }),
};