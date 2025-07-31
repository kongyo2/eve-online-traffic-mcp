/**
 * Solar System Information tools for EVE Online
 */

import { z } from "zod";
import { ESIClient, ESISolarSystemInfo, ESIStargateInfo } from "./esi-client.js";
import { SDEClient, SDESolarSystemInfo, SDEStargateInfo } from "./sde-client.js";

const esiClient = new ESIClient();
const sdeClient = new SDEClient();

/**
 * Helper function to get names for IDs and format them as "ID (Name)"
 */
async function formatIdsWithNames(ids: number[]): Promise<string[]> {
  if (ids.length === 0) return [];
  
  try {
    const nameResults = await esiClient.idsToNames(ids);
    const nameMap = new Map(nameResults.map(result => [result.id, result.name]));
    
    return ids.map(id => {
      const name = nameMap.get(id);
      return name ? `${id} (${name})` : `${id}`;
    });
  } catch (error) {
    console.warn('Failed to fetch names for IDs:', error);
    return ids.map(id => `${id}`);
  }
}



export interface CombinedSolarSystemInfo {
  system_id: number;
  name: string;
  constellation_id: number;
  constellation_name?: string;
  region_id?: number;
  region_name?: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  security_status: number;
  security_class?: string;
  star_id?: number;
  star_name?: string;
  stargates?: string[];
  stations?: string[];
  planets?: Array<{
    planet_id: number;
    planet_name?: string;
    moons?: string[];
    asteroid_belts?: string[];
  }>;
  source: {
    esi: boolean;
    sde: boolean;
  };
  esi_data?: ESISolarSystemInfo;
  sde_data?: SDESolarSystemInfo;
}

export interface CombinedStargateInfo {
  stargate_id: number;
  name?: string;
  system_id: number;
  system_name?: string;
  type_id?: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  destination: {
    stargate_id: number;
    stargate_name?: string;
    system_id: number;
    system_name?: string;
  };
  source: {
    esi: boolean;
    sde: boolean;
  };
  esi_data?: ESIStargateInfo;
  sde_data?: SDEStargateInfo;
}

/**
 * Combine ESI and SDE solar system data
 */
async function combineSolarSystemData(
  esiData?: ESISolarSystemInfo,
  sdeData?: SDESolarSystemInfo
): Promise<CombinedSolarSystemInfo | null> {
  if (!esiData && !sdeData) return null;

  const systemId = esiData?.system_id || sdeData?.solarSystemID;
  if (!systemId) return null;

  // Collect all IDs that need names
  const idsToResolve: number[] = [];
  const constellationId = esiData?.constellation_id || sdeData?.constellationID || 0;
  const regionId = sdeData?.regionID;
  const starId = esiData?.star_id || sdeData?.star?.id;
  const stargateIds = esiData?.stargates || (sdeData?.stargates?.map(id => parseInt(id)) || []);
  const stationIds = esiData?.stations || [];

  if (constellationId) idsToResolve.push(constellationId);
  if (regionId) idsToResolve.push(regionId);
  if (starId) idsToResolve.push(starId);
  idsToResolve.push(...stargateIds, ...stationIds);

  // Get planet and moon IDs
  const planetIds: number[] = [];
  const moonIds: number[] = [];
  const asteroidBeltIds: number[] = [];
  
  if (esiData?.planets) {
    for (const planet of esiData.planets) {
      planetIds.push(planet.planet_id);
      if (planet.moons) moonIds.push(...planet.moons);
      if (planet.asteroid_belts) asteroidBeltIds.push(...planet.asteroid_belts);
    }
  }
  
  idsToResolve.push(...planetIds, ...moonIds, ...asteroidBeltIds);

  // Resolve names
  let nameMap = new Map<number, string>();
  if (idsToResolve.length > 0) {
    try {
      const nameResults = await esiClient.idsToNames(idsToResolve);
      nameMap = new Map(nameResults.map(result => [result.id, result.name]));
    } catch (error) {
      console.warn('Failed to fetch names for system data:', error);
    }
  }

  // Format planets with names
  const planetsWithNames = esiData?.planets?.map(planet => ({
    planet_id: planet.planet_id,
    planet_name: nameMap.get(planet.planet_id),
    moons: planet.moons?.map(moonId => {
      const name = nameMap.get(moonId);
      return name ? `${moonId} (${name})` : `${moonId}`;
    }),
    asteroid_belts: planet.asteroid_belts?.map(beltId => {
      const name = nameMap.get(beltId);
      return name ? `${beltId} (${name})` : `${beltId}`;
    }),
  }));

  return {
    system_id: systemId,
    name: esiData?.name || `System ${systemId}`,
    constellation_id: constellationId,
    constellation_name: nameMap.get(constellationId),
    region_id: regionId,
    region_name: regionId ? nameMap.get(regionId) : undefined,
    position: {
      x: esiData?.position?.x || (sdeData?.center ? sdeData.center[0] : 0),
      y: esiData?.position?.y || (sdeData?.center ? sdeData.center[1] : 0),
      z: esiData?.position?.z || (sdeData?.center ? sdeData.center[2] : 0),
    },
    security_status: esiData?.security_status || sdeData?.security || 0,
    security_class: esiData?.security_class || sdeData?.securityClass,
    star_id: starId,
    star_name: starId ? nameMap.get(starId) : undefined,
    stargates: stargateIds.map(id => {
      const name = nameMap.get(id);
      return name ? `${id} (${name})` : `${id}`;
    }),
    stations: stationIds.map(id => {
      const name = nameMap.get(id);
      return name ? `${id} (${name})` : `${id}`;
    }),
    planets: planetsWithNames,
    source: {
      esi: !!esiData,
      sde: !!sdeData,
    },
    esi_data: esiData,
    sde_data: sdeData,
  };
}

/**
 * Combine ESI and SDE stargate data
 */
async function combineStargateData(
  esiData?: ESIStargateInfo,
  sdeData?: SDEStargateInfo
): Promise<CombinedStargateInfo | null> {
  if (!esiData && !sdeData) return null;

  const stargateId = esiData?.stargate_id || sdeData?.stargateID;
  if (!stargateId) return null;

  // Collect IDs that need names
  const idsToResolve: number[] = [];
  const systemId = esiData?.system_id || sdeData?.solarSystemID || 0;
  const destStargateId = esiData?.destination?.stargate_id || sdeData?.destinationStargateID || 0;
  const destSystemId = esiData?.destination?.system_id || sdeData?.destinationSolarSystemID || 0;

  if (systemId) idsToResolve.push(systemId);
  if (destStargateId) idsToResolve.push(destStargateId);
  if (destSystemId) idsToResolve.push(destSystemId);

  // Resolve names
  let nameMap = new Map<number, string>();
  if (idsToResolve.length > 0) {
    try {
      const nameResults = await esiClient.idsToNames(idsToResolve);
      nameMap = new Map(nameResults.map(result => [result.id, result.name]));
    } catch (error) {
      console.warn('Failed to fetch names for stargate data:', error);
    }
  }

  return {
    stargate_id: stargateId,
    name: esiData?.name,
    system_id: systemId,
    system_name: nameMap.get(systemId),
    type_id: esiData?.type_id || sdeData?.typeID,
    position: {
      x: esiData?.position?.x || (sdeData?.position ? sdeData.position[0] : 0),
      y: esiData?.position?.y || (sdeData?.position ? sdeData.position[1] : 0),
      z: esiData?.position?.z || (sdeData?.position ? sdeData.position[2] : 0),
    },
    destination: {
      stargate_id: destStargateId,
      stargate_name: nameMap.get(destStargateId),
      system_id: destSystemId,
      system_name: nameMap.get(destSystemId),
    },
    source: {
      esi: !!esiData,
      sde: !!sdeData,
    },
    esi_data: esiData,
    sde_data: sdeData,
  };
}

/**
 * Solar System Information tool
 */
export const solarSystemInfoTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external APIs
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Solar System Information",
  },
  description: "Get comprehensive solar system information from both ESI and SDE APIs, including security status, connections, and celestial objects",
  execute: async (args: { systemIds: number[] }) => {
    try {
      const results: CombinedSolarSystemInfo[] = [];

      for (const systemId of args.systemIds) {
        let esiData: ESISolarSystemInfo | undefined;
        let sdeData: SDESolarSystemInfo | undefined;

        // Fetch from ESI
        try {
          esiData = await esiClient.getSolarSystemInfo(systemId);
        } catch (error) {
          console.warn(`Failed to fetch ESI data for system ${systemId}:`, error);
        }

        // Fetch from SDE
        try {
          sdeData = await sdeClient.getSolarSystemInfo(systemId);
        } catch (error) {
          console.warn(`Failed to fetch SDE data for system ${systemId}:`, error);
        }

        const combined = await combineSolarSystemData(esiData, sdeData);
        if (combined) {
          results.push(combined);
        }
      }

      if (results.length === 0) {
        return JSON.stringify({
          success: false,
          message: "No solar system information found for the provided IDs",
          results: []
        });
      }

      return JSON.stringify({
        success: true,
        message: `Found information for ${results.length} solar system(s)`,
        results: results
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: []
      });
    }
  },
  name: "solar_system_info",
  parameters: z.object({
    systemIds: z.array(z.number()).min(1).max(100).describe("Array of solar system IDs to get information for (max 100)")
  }),
};

/**
 * Stargate Information tool
 */
export const stargateInfoTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external APIs
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Stargate Information",
  },
  description: "Get comprehensive stargate information from both ESI and SDE APIs, including connections and positions",
  execute: async (args: { stargateIds: number[] }) => {
    try {
      const results: CombinedStargateInfo[] = [];

      for (const stargateId of args.stargateIds) {
        let esiData: ESIStargateInfo | undefined;
        let sdeData: SDEStargateInfo | undefined;

        // Fetch from ESI
        try {
          esiData = await esiClient.getStargateInfo(stargateId);
        } catch (error) {
          console.warn(`Failed to fetch ESI data for stargate ${stargateId}:`, error);
        }

        // Fetch from SDE
        try {
          sdeData = await sdeClient.getStargateInfo(stargateId);
        } catch (error) {
          console.warn(`Failed to fetch SDE data for stargate ${stargateId}:`, error);
        }

        const combined = await combineStargateData(esiData, sdeData);
        if (combined) {
          results.push(combined);
        }
      }

      if (results.length === 0) {
        return JSON.stringify({
          success: false,
          message: "No stargate information found for the provided IDs",
          results: []
        });
      }

      return JSON.stringify({
        success: true,
        message: `Found information for ${results.length} stargate(s)`,
        results: results
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: []
      });
    }
  },
  name: "stargate_info",
  parameters: z.object({
    stargateIds: z.array(z.number()).min(1).max(50).describe("Array of stargate IDs to get information for (max 50)")
  }),
};

/**
 * System Connection Map tool
 */
export const systemConnectionMapTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external APIs
    readOnlyHint: true, // This tool doesn't modify anything
    title: "System Connection Map",
  },
  description: "Get a map of system connections by analyzing stargate data for given solar systems",
  execute: async (args: { systemIds: number[] }) => {
    try {
      const systemConnections: Record<number, {
        system_id: number;
        system_name?: string;
        security_status?: number;
        connections: Array<{
          destination_system_id: number;
          destination_system_name?: string;
          stargate_id: number;
          stargate_name?: string;
          destination_stargate_id: number;
          destination_stargate_name?: string;
        }>;
      }> = {};

      // First, get system information
      for (const systemId of args.systemIds) {
        try {
          const esiSystemData = await esiClient.getSolarSystemInfo(systemId);
          
          systemConnections[systemId] = {
            system_id: systemId,
            system_name: esiSystemData.name,
            security_status: esiSystemData.security_status,
            connections: []
          };

          // Get stargate connections
          if (esiSystemData.stargates) {
            // Collect all IDs that need names
            const allIds: number[] = [];
            const stargateConnections: Array<{
              stargate_id: number;
              destination_system_id: number;
              destination_stargate_id: number;
            }> = [];

            for (const stargateId of esiSystemData.stargates) {
              try {
                const stargateData = await esiClient.getStargateInfo(stargateId);
                stargateConnections.push({
                  stargate_id: stargateId,
                  destination_system_id: stargateData.destination.system_id,
                  destination_stargate_id: stargateData.destination.stargate_id
                });
                
                allIds.push(
                  stargateId,
                  stargateData.destination.system_id,
                  stargateData.destination.stargate_id
                );
              } catch (error) {
                console.warn(`Failed to fetch stargate ${stargateId}:`, error);
              }
            }

            // Get names for all IDs
            let nameMap = new Map<number, string>();
            if (allIds.length > 0) {
              try {
                const nameResults = await esiClient.idsToNames(allIds);
                nameMap = new Map(nameResults.map(result => [result.id, result.name]));
              } catch (error) {
                console.warn('Failed to fetch names for connection map:', error);
              }
            }

            // Add connections with names
            for (const conn of stargateConnections) {
              systemConnections[systemId].connections.push({
                destination_system_id: conn.destination_system_id,
                destination_system_name: nameMap.get(conn.destination_system_id),
                stargate_id: conn.stargate_id,
                stargate_name: nameMap.get(conn.stargate_id),
                destination_stargate_id: conn.destination_stargate_id,
                destination_stargate_name: nameMap.get(conn.destination_stargate_id),
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch system ${systemId}:`, error);
        }
      }

      const results = Object.values(systemConnections);

      if (results.length === 0) {
        return JSON.stringify({
          success: false,
          message: "No system connection information found for the provided IDs",
          results: []
        });
      }

      return JSON.stringify({
        success: true,
        message: `Generated connection map for ${results.length} system(s)`,
        results: results
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: []
      });
    }
  },
  name: "system_connection_map",
  parameters: z.object({
    systemIds: z.array(z.number()).min(1).max(50).describe("Array of solar system IDs to generate connection map for (max 50)")
  }),
};