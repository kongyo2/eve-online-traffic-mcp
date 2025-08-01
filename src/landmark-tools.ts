/**
 * Landmark tools for EVE Online
 */

import { z } from "zod";
import { ESIClient } from "./esi-client.js";
import { SDEClient } from "./sde-client.js";

const esiClient = new ESIClient();
const sdeClient = new SDEClient();

/**
 * Helper function for euclidean distance calculation
 */
function calculateEuclideanDistance(pos1: {x: number, y: number, z: number}, pos2: number[]): number {
  if (!pos2 || pos2.length < 3) return 0;
  
  const dx = pos1.x - pos2[0];
  const dy = pos1.y - pos2[1];
  const dz = pos1.z - pos2[2];
  
  // Convert from meters to AU (1 AU = 149,597,870.7 km = 149,597,870,700 m)
  const distanceMeters = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const distanceAU = distanceMeters / 149597870700;
  
  return Math.round(distanceAU * 100) / 100; // Round to 2 decimal places
}

/**
 * Find nearest landmarks to a solar system
 */
export const findNearestLandmarksTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external APIs
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Find Nearest Landmarks",
  },
  description: "Find the nearest EVE Online landmarks to a specified solar system. Returns landmarks sorted by distance with detailed information including descriptions and positions.",
  execute: async (args: { 
    system: string | number; 
    limit?: number;
    maxJumps?: number;
  }) => {
    try {
      let systemId: number;

      // Convert system to ID if it's a string
      if (typeof args.system === 'string') {
        const systemResult = await esiClient.getSolarSystemIds([args.system]);
        if (systemResult.length === 0) {
          return JSON.stringify({
            success: false,
            message: `System '${args.system}' not found`,
            landmarks: []
          });
        }
        systemId = systemResult[0].id;
      } else {
        systemId = args.system;
      }

      // Get system information
      const systemInfo = await esiClient.getSolarSystemInfo(systemId);
      const systemNames = await esiClient.idsToNames([systemId]);
      const systemName = systemNames[0]?.name || `System ${systemId}`;

      // Get all landmarks from SDE
      const landmarkIds = await sdeClient.getAllLandmarkIds();
      
      if (landmarkIds.length === 0) {
        return JSON.stringify({
          success: false,
          message: "No landmarks found in database",
          landmarks: []
        });
      }

      const landmarkResults = [];

      // Process each landmark
      for (const landmarkId of landmarkIds) {
        try {
          const landmark = await sdeClient.getLandmarkById(landmarkId);
          
          // Skip if no location ID
          if (!landmark.locationID) {
            continue;
          }

          // Get landmark system information
          const landmarkSystemInfo = await esiClient.getSolarSystemInfo(landmark.locationID);
          const landmarkSystemNames = await esiClient.idsToNames([landmark.locationID]);
          const landmarkSystemName = landmarkSystemNames[0]?.name || `System ${landmark.locationID}`;

          // Get constellation info to determine region
          let regionId = null;
          try {
            const constellationInfo = await esiClient.getConstellationInfo(landmarkSystemInfo.constellation_id);
            regionId = constellationInfo.region_id;
          } catch (error) {
            // Skip region info if constellation lookup fails
          }

          // Calculate route distance
          let jumps = 0;
          let routeAvailable = true;
          
          try {
            const route = await esiClient.calculateRoute(systemId, landmark.locationID);
            jumps = route.length - 1;
          } catch (error) {
            routeAvailable = false;
          }

          // Skip if max jumps specified and exceeded
          if (args.maxJumps && jumps > args.maxJumps) {
            continue;
          }

          // Calculate euclidean distance if both positions are available
          let euclideanDistanceAU = null;
          if (landmark.position && systemInfo.position) {
            euclideanDistanceAU = calculateEuclideanDistance(systemInfo.position, landmark.position);
          }

          landmarkResults.push({
            landmark: {
              id: landmarkId,
              name: `Landmark ${landmarkId}`,
              description: `EVE Online landmark located in ${landmarkSystemName}`,
              position: landmark.position || null,
            },
            location: {
              system_id: landmark.locationID,
              system_name: landmarkSystemName,
              security_status: landmarkSystemInfo.security_status,
              constellation_id: landmarkSystemInfo.constellation_id,
              region_id: regionId,
            },
            distance: {
              jumps: routeAvailable ? jumps : null,
              route_available: routeAvailable,
              euclidean_distance_au: euclideanDistanceAU
            }
          });
        } catch (error) {
          // Skip problematic landmarks
          continue;
        }
      }

      // Sort by jumps (null values last), then by euclidean distance
      landmarkResults.sort((a, b) => {
        if (a.distance.jumps === null && b.distance.jumps === null) {
          // Both have no route, sort by euclidean distance
          if (a.distance.euclidean_distance_au === null && b.distance.euclidean_distance_au === null) return 0;
          if (a.distance.euclidean_distance_au === null) return 1;
          if (b.distance.euclidean_distance_au === null) return -1;
          return a.distance.euclidean_distance_au - b.distance.euclidean_distance_au;
        }
        if (a.distance.jumps === null) return 1;
        if (b.distance.jumps === null) return -1;
        
        // Both have routes, sort by jumps first
        if (a.distance.jumps !== b.distance.jumps) {
          return a.distance.jumps - b.distance.jumps;
        }
        
        // Same jump count, sort by euclidean distance
        if (a.distance.euclidean_distance_au === null && b.distance.euclidean_distance_au === null) return 0;
        if (a.distance.euclidean_distance_au === null) return 1;
        if (b.distance.euclidean_distance_au === null) return -1;
        return a.distance.euclidean_distance_au - b.distance.euclidean_distance_au;
      });

      // Apply limit
      const limit = args.limit || 10;
      const limitedResults = landmarkResults.slice(0, limit);

      return JSON.stringify({
        success: true,
        message: `Found ${limitedResults.length} nearest landmarks to ${systemName}`,
        origin: {
          system_id: systemId,
          system_name: systemName,
          security_status: systemInfo.security_status,
          position: systemInfo.position
        },
        landmarks: limitedResults,
        summary: {
          total_landmarks_checked: landmarkIds.length,
          landmarks_returned: limitedResults.length,
          closest_landmark: limitedResults.length > 0 ? {
            name: limitedResults[0].landmark.name,
            jumps: limitedResults[0].distance.jumps,
            description: limitedResults[0].landmark.description,
            euclidean_distance_au: limitedResults[0].distance.euclidean_distance_au
          } : null
        }
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error finding nearest landmarks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        landmarks: []
      });
    }
  },
  name: "find_nearest_landmarks",
  parameters: z.object({
    system: z.union([z.string(), z.number()]).describe("Solar system name (English proper noun like 'Jita') or ID to search from"),
    limit: z.number().min(1).max(50).optional().default(10).describe("Maximum number of landmarks to return (1-50, default: 10)"),
    maxJumps: z.number().min(1).max(20).optional().describe("Maximum jump distance to search (optional, filters out distant landmarks)")
  }),
};