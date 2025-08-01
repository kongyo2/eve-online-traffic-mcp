import { z } from "zod";
import { ESIClient } from "./esi-client.js";
import { ALL_TRADE_HUBS, TradeHub } from "./trade-hub-data.js";

const esiClient = new ESIClient();

interface TradeHubWithDistance {
  tradeHub: TradeHub;
  distance: number;
  route: number[];
  jumps: number;
}

export const findNearestTradeHubTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external ESI API
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Find Nearest Trade Hub",
  },
  description: "Find the nearest trade hub to a specified solar system and provide detailed route information.",
  execute: async (args: { 
    origin: string | number;
    maxJumps?: number;
    includeSecondaryHubs?: boolean;
  }) => {
    try {
      // Convert origin to ID if it's a string
      let originId: number;
      if (typeof args.origin === 'string') {
        const originResult = await esiClient.getSolarSystemIds([args.origin]);
        if (!originResult || originResult.length === 0) {
          return JSON.stringify({
            success: false,
            message: `Origin system '${args.origin}' not found`,
            nearestHub: null
          });
        }
        originId = originResult[0].id;
      } else {
        originId = args.origin;
      }

      // Get origin system name
      const originNames = await esiClient.idsToNames([originId]);
      const originName = originNames && originNames.length > 0 ? originNames[0].name : `System ${originId}`;

      // Determine which trade hubs to consider
      const tradeHubsToCheck = args.includeSecondaryHubs ? ALL_TRADE_HUBS : ALL_TRADE_HUBS.filter(hub => hub.isPrimary);

      // Calculate distances to all trade hubs
      const tradeHubDistances: TradeHubWithDistance[] = [];
      
      for (const tradeHub of tradeHubsToCheck) {
        try {
          // Calculate route to trade hub
          const routeInfo = await esiClient.calculateRouteWithDetails(
            originId,
            tradeHub.systemId,
            'shortest'
          );
          
          tradeHubDistances.push({
            tradeHub,
            distance: routeInfo.jumps,
            route: routeInfo.route,
            jumps: routeInfo.jumps
          });
        } catch (error) {
          // Skip trade hubs we can't route to
          console.warn(`Could not calculate route to ${tradeHub.name}:`, error);
          continue;
        }
      }

      // Sort by distance (jumps)
      tradeHubDistances.sort((a, b) => a.distance - b.distance);

      // Apply max jumps filter if specified
      const filteredResults = args.maxJumps 
        ? tradeHubDistances.filter(th => th.distance <= args.maxJumps!)
        : tradeHubDistances;

      if (filteredResults.length === 0) {
        return JSON.stringify({
          success: false,
          message: `No trade hubs found within ${args.maxJumps || 'any number of'} jumps from ${originName}`,
          nearestHub: null
        });
      }

      // Get the nearest hub
      const nearestHub = filteredResults[0];

      // Get system names for the route
      const routeSystemNames = await esiClient.idsToNames(nearestHub.route);
      const routeWithNames = nearestHub.route.map(systemId => {
        const systemName = routeSystemNames && routeSystemNames.find(s => s.id === systemId);
        return {
          id: systemId,
          name: systemName ? systemName.name : `System ${systemId}`
        };
      });

      // Get trade hub system name
      const hubSystemNames = await esiClient.idsToNames([nearestHub.tradeHub.systemId]);
      const hubSystemName = hubSystemNames && hubSystemNames.length > 0 ? hubSystemNames[0].name : `System ${nearestHub.tradeHub.systemId}`;

      return JSON.stringify({
        success: true,
        message: `Found nearest trade hub to ${originName}`,
        nearestHub: {
          hubInfo: {
            id: nearestHub.tradeHub.id,
            name: nearestHub.tradeHub.name,
            systemId: nearestHub.tradeHub.systemId,
            systemName: hubSystemName,
            regionId: nearestHub.tradeHub.regionId,
            isPrimary: nearestHub.tradeHub.isPrimary
          },
          distance: {
            jumps: nearestHub.jumps,
            route: routeWithNames
          }
        },
        summary: {
          origin: originName,
          totalHubsChecked: tradeHubsToCheck.length,
          hubsWithinRange: filteredResults.length,
          maxJumps: args.maxJumps
        }
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error finding nearest trade hub: ${error instanceof Error ? error.message : 'Unknown error'}`,
        nearestHub: null
      });
    }
  },
  name: "find_nearest_trade_hub",
  parameters: z.object({
    origin: z.union([z.string(), z.number()]).describe("Origin solar system name (English proper noun like 'Jita') or ID"),
    maxJumps: z.number().min(1).max(20).optional().describe("Maximum number of jumps to consider (1-20)"),
    includeSecondaryHubs: z.boolean().optional().default(false).describe("Whether to include secondary trade hubs in the search")
  }),
};