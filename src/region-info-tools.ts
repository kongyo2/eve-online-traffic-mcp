/**
 * Region Information tools for EVE Online
 */

import { z } from "zod";
import { ESIClient, ESIRegionInfo, ESIConstellationInfo } from "./esi-client.js";
import { SDEClient, SDERegionInfo, SDEConstellationInfo } from "./sde-client.js";

const esiClient = new ESIClient();
const sdeClient = new SDEClient();

export interface CombinedRegionInfo {
  region_id: number;
  name: string;
  description?: string;
  position?: {
    x: number;
    y: number;
    z: number;
  };
  bounds?: {
    max: { x: number; y: number; z: number };
    min: { x: number; y: number; z: number };
  };
  constellations: string[];
  systems?: string[];
  source: {
    esi: boolean;
    sde: boolean;
  };
  esi_data?: ESIRegionInfo;
  sde_data?: SDERegionInfo;
}

export interface CombinedConstellationInfo {
  constellation_id: number;
  name: string;
  region_id: number;
  region_name?: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  bounds?: {
    max: { x: number; y: number; z: number };
    min: { x: number; y: number; z: number };
  };
  systems: string[];
  source: {
    esi: boolean;
    sde: boolean;
  };
  esi_data?: ESIConstellationInfo;
  sde_data?: SDEConstellationInfo;
}

/**
 * Combine ESI and SDE region data
 */
async function combineRegionData(
  esiData?: ESIRegionInfo,
  sdeData?: SDERegionInfo
): Promise<CombinedRegionInfo | null> {
  if (!esiData && !sdeData) return null;

  const regionId = esiData?.region_id || sdeData?.regionID;
  if (!regionId) return null;

  // Collect all IDs that need names
  const idsToResolve: number[] = [];
  const constellationIds = esiData?.constellations || (sdeData?.constellations?.map(id => parseInt(id)) || []);
  
  idsToResolve.push(...constellationIds);

  // Get all systems in the region by fetching constellation data
  const systemIds: number[] = [];
  if (constellationIds.length > 0) {
    for (const constId of constellationIds) {
      try {
        const constInfo = await esiClient.getConstellationInfo(constId);
        systemIds.push(...constInfo.systems);
      } catch (error) {
        console.warn(`Failed to fetch constellation ${constId}:`, error);
      }
    }
  }

  idsToResolve.push(...systemIds);

  // Resolve names
  let nameMap = new Map<number, string>();
  if (idsToResolve.length > 0) {
    try {
      const nameResults = await esiClient.idsToNames(idsToResolve);
      nameMap = new Map(nameResults.map(result => [result.id, result.name]));
    } catch (error) {
      console.warn('Failed to fetch names for region data:', error);
    }
  }

  return {
    region_id: regionId,
    name: esiData?.name || `Region ${regionId}`,
    description: esiData?.description,
    position: sdeData?.center ? {
      x: sdeData.center[0],
      y: sdeData.center[1],
      z: sdeData.center[2],
    } : undefined,
    bounds: (sdeData?.max && sdeData?.min) ? {
      max: { x: sdeData.max[0], y: sdeData.max[1], z: sdeData.max[2] },
      min: { x: sdeData.min[0], y: sdeData.min[1], z: sdeData.min[2] },
    } : undefined,
    constellations: constellationIds.map(id => {
      const name = nameMap.get(id);
      return name ? `${id} (${name})` : `${id}`;
    }),
    systems: systemIds.length > 0 ? systemIds.map(id => {
      const name = nameMap.get(id);
      return name ? `${id} (${name})` : `${id}`;
    }) : undefined,
    source: {
      esi: !!esiData,
      sde: !!sdeData,
    },
    esi_data: esiData,
    sde_data: sdeData,
  };
}

/**
 * Combine ESI and SDE constellation data
 */
async function combineConstellationData(
  esiData?: ESIConstellationInfo,
  sdeData?: SDEConstellationInfo
): Promise<CombinedConstellationInfo | null> {
  if (!esiData && !sdeData) return null;

  const constellationId = esiData?.constellation_id || sdeData?.constellationID;
  if (!constellationId) return null;

  // Collect IDs that need names
  const idsToResolve: number[] = [];
  const regionId = esiData?.region_id || sdeData?.regionID || 0;
  const systemIds = esiData?.systems || (sdeData?.solarSystems?.map(id => parseInt(id)) || []);

  if (regionId) idsToResolve.push(regionId);
  idsToResolve.push(...systemIds);

  // Resolve names
  let nameMap = new Map<number, string>();
  if (idsToResolve.length > 0) {
    try {
      const nameResults = await esiClient.idsToNames(idsToResolve);
      nameMap = new Map(nameResults.map(result => [result.id, result.name]));
    } catch (error) {
      console.warn('Failed to fetch names for constellation data:', error);
    }
  }

  return {
    constellation_id: constellationId,
    name: esiData?.name || `Constellation ${constellationId}`,
    region_id: regionId,
    region_name: nameMap.get(regionId),
    position: {
      x: esiData?.position?.x || (sdeData?.center ? sdeData.center[0] : 0),
      y: esiData?.position?.y || (sdeData?.center ? sdeData.center[1] : 0),
      z: esiData?.position?.z || (sdeData?.center ? sdeData.center[2] : 0),
    },
    bounds: (sdeData?.max && sdeData?.min) ? {
      max: { x: sdeData.max[0], y: sdeData.max[1], z: sdeData.max[2] },
      min: { x: sdeData.min[0], y: sdeData.min[1], z: sdeData.min[2] },
    } : undefined,
    systems: systemIds.map(id => {
      const name = nameMap.get(id);
      return name ? `${id} (${name})` : `${id}`;
    }),
    source: {
      esi: !!esiData,
      sde: !!sdeData,
    },
    esi_data: esiData,
    sde_data: sdeData,
  };
}

/**
 * Region Information tool
 */
export const regionInfoTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external APIs
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Region Information",
  },
  description: "Get comprehensive region information from both ESI and SDE APIs, including constellations, systems, and boundaries",
  execute: async (args: { regionIds: number[] }) => {
    try {
      const results: CombinedRegionInfo[] = [];

      for (const regionId of args.regionIds) {
        let esiData: ESIRegionInfo | undefined;
        let sdeData: SDERegionInfo | undefined;

        // Fetch from ESI
        try {
          esiData = await esiClient.getRegionInfo(regionId);
        } catch (error) {
          console.warn(`Failed to fetch ESI data for region ${regionId}:`, error);
        }

        // Fetch from SDE
        try {
          sdeData = await sdeClient.getRegionInfo(regionId);
        } catch (error) {
          console.warn(`Failed to fetch SDE data for region ${regionId}:`, error);
        }

        const combined = await combineRegionData(esiData, sdeData);
        if (combined) {
          results.push(combined);
        }
      }

      if (results.length === 0) {
        return JSON.stringify({
          success: false,
          message: "No region information found for the provided IDs",
          results: []
        });
      }

      return JSON.stringify({
        success: true,
        message: `Found information for ${results.length} region(s)`,
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
  name: "region_info",
  parameters: z.object({
    regionIds: z.array(z.number()).min(1).max(50).describe("Array of region IDs to get information for (max 50)")
  }),
};

/**
 * Constellation Information tool
 */
export const constellationInfoTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external APIs
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Constellation Information",
  },
  description: "Get comprehensive constellation information from both ESI and SDE APIs, including systems and boundaries",
  execute: async (args: { constellationIds: number[] }) => {
    try {
      const results: CombinedConstellationInfo[] = [];

      for (const constellationId of args.constellationIds) {
        let esiData: ESIConstellationInfo | undefined;
        let sdeData: SDEConstellationInfo | undefined;

        // Fetch from ESI
        try {
          esiData = await esiClient.getConstellationInfo(constellationId);
        } catch (error) {
          console.warn(`Failed to fetch ESI data for constellation ${constellationId}:`, error);
        }

        // Fetch from SDE
        try {
          sdeData = await sdeClient.getConstellationInfo(constellationId);
        } catch (error) {
          console.warn(`Failed to fetch SDE data for constellation ${constellationId}:`, error);
        }

        const combined = await combineConstellationData(esiData, sdeData);
        if (combined) {
          results.push(combined);
        }
      }

      if (results.length === 0) {
        return JSON.stringify({
          success: false,
          message: "No constellation information found for the provided IDs",
          results: []
        });
      }

      return JSON.stringify({
        success: true,
        message: `Found information for ${results.length} constellation(s)`,
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
  name: "constellation_info",
  parameters: z.object({
    constellationIds: z.array(z.number()).min(1).max(50).describe("Array of constellation IDs to get information for (max 50)")
  }),
};

/**
 * Region Systems List tool
 */
export const regionSystemsListTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external APIs
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Region Systems List",
  },
  description: "Get a comprehensive list of all solar systems in specified regions with their security status and constellation information",
  execute: async (args: { regionIds: number[] }) => {
    try {
      const results: Array<{
        region_id: number;
        region_name: string;
        total_systems: number;
        constellations: Array<{
          constellation_id: number;
          constellation_name: string;
          systems: Array<{
            system_id: number;
            system_name: string;
            security_status: number;
            security_class?: string;
          }>;
        }>;
      }> = [];

      for (const regionId of args.regionIds) {
        try {
          // Get region info
          const regionInfo = await esiClient.getRegionInfo(regionId);
          
          const regionResult = {
            region_id: regionId,
            region_name: regionInfo.name,
            total_systems: 0,
            constellations: [] as Array<{
              constellation_id: number;
              constellation_name: string;
              systems: Array<{
                system_id: number;
                system_name: string;
                security_status: number;
                security_class?: string;
              }>;
            }>
          };

          // Process each constellation
          for (const constellationId of regionInfo.constellations) {
            try {
              const constellationInfo = await esiClient.getConstellationInfo(constellationId);
              
              const constellationResult = {
                constellation_id: constellationId,
                constellation_name: constellationInfo.name,
                systems: [] as Array<{
                  system_id: number;
                  system_name: string;
                  security_status: number;
                  security_class?: string;
                }>
              };

              // Get system information
              for (const systemId of constellationInfo.systems) {
                try {
                  const systemInfo = await esiClient.getSolarSystemInfo(systemId);
                  constellationResult.systems.push({
                    system_id: systemId,
                    system_name: systemInfo.name,
                    security_status: systemInfo.security_status,
                    security_class: systemInfo.security_class,
                  });
                } catch (error) {
                  console.warn(`Failed to fetch system ${systemId}:`, error);
                }
              }

              regionResult.constellations.push(constellationResult);
              regionResult.total_systems += constellationResult.systems.length;
            } catch (error) {
              console.warn(`Failed to fetch constellation ${constellationId}:`, error);
            }
          }

          results.push(regionResult);
        } catch (error) {
          console.warn(`Failed to fetch region ${regionId}:`, error);
        }
      }

      if (results.length === 0) {
        return JSON.stringify({
          success: false,
          message: "No region system information found for the provided IDs",
          results: []
        });
      }

      return JSON.stringify({
        success: true,
        message: `Found system information for ${results.length} region(s)`,
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
  name: "region_systems_list",
  parameters: z.object({
    regionIds: z.array(z.number()).min(1).max(10).describe("Array of region IDs to get system lists for (max 10)")
  }),
};