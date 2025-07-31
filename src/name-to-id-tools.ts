/**
 * Name to ID conversion tools for EVE Online entities
 */

import { z } from "zod";
import { ESIClient } from "./esi-client.js";

const esiClient = new ESIClient();

/**
 * Solar System Name to ID conversion tool
 */
export const solarSystemNameToIdTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external ESI API
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Solar System Name to ID",
  },
  description: "Convert EVE Online solar system names to their corresponding IDs using ESI API",
  execute: async (args: { systemNames: string[] }) => {
    try {
      const results = await esiClient.getSolarSystemIds(args.systemNames);
      
      if (results.length === 0) {
        return JSON.stringify({
          success: false,
          message: "No solar systems found with the provided names",
          results: []
        });
      }

      return JSON.stringify({
        success: true,
        message: `Found ${results.length} solar system(s)`,
        results: results.map(system => ({
          id: system.id,
          name: system.name,
          type: "solar_system"
        }))
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: []
      });
    }
  },
  name: "solar_system_name_to_id",
  parameters: z.object({
    systemNames: z.array(z.string()).min(1).max(500).describe("Array of solar system names to convert to IDs (max 500)")
  }),
};

/**
 * Station Name to ID conversion tool
 */
export const stationNameToIdTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external ESI API
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Station Name to ID",
  },
  description: "Convert EVE Online station names to their corresponding IDs using ESI API",
  execute: async (args: { stationNames: string[] }) => {
    try {
      const results = await esiClient.getStationIds(args.stationNames);
      
      if (results.length === 0) {
        return JSON.stringify({
          success: false,
          message: "No stations found with the provided names",
          results: []
        });
      }

      return JSON.stringify({
        success: true,
        message: `Found ${results.length} station(s)`,
        results: results.map(station => ({
          id: station.id,
          name: station.name,
          type: "station"
        }))
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: []
      });
    }
  },
  name: "station_name_to_id",
  parameters: z.object({
    stationNames: z.array(z.string()).min(1).max(500).describe("Array of station names to convert to IDs (max 500)")
  }),
};

/**
 * Region Name to ID conversion tool
 */
export const regionNameToIdTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external ESI API
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Region Name to ID",
  },
  description: "Convert EVE Online region names to their corresponding IDs using ESI API",
  execute: async (args: { regionNames: string[] }) => {
    try {
      const results = await esiClient.getRegionIds(args.regionNames);
      
      if (results.length === 0) {
        return JSON.stringify({
          success: false,
          message: "No regions found with the provided names",
          results: []
        });
      }

      return JSON.stringify({
        success: true,
        message: `Found ${results.length} region(s)`,
        results: results.map(region => ({
          id: region.id,
          name: region.name,
          type: "region"
        }))
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: []
      });
    }
  },
  name: "region_name_to_id",
  parameters: z.object({
    regionNames: z.array(z.string()).min(1).max(500).describe("Array of region names to convert to IDs (max 500)")
  }),
};

/**
 * Universal Name to ID conversion tool (all types)
 */
export const universalNameToIdTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external ESI API
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Universal Name to ID",
  },
  description: "Convert EVE Online entity names (systems, stations, regions, etc.) to their corresponding IDs using ESI API",
  execute: async (args: { names: string[] }) => {
    try {
      const results = await esiClient.namesToIds(args.names);
      
      const allResults: Array<{ id: number; name: string; type: string }> = [];
      
      // Collect all results from different categories
      if (results.systems) {
        allResults.push(...results.systems.map(item => ({ ...item, type: "solar_system" })));
      }
      if (results.stations) {
        allResults.push(...results.stations.map(item => ({ ...item, type: "station" })));
      }
      if (results.regions) {
        allResults.push(...results.regions.map(item => ({ ...item, type: "region" })));
      }
      if (results.constellations) {
        allResults.push(...results.constellations.map(item => ({ ...item, type: "constellation" })));
      }
      if (results.corporations) {
        allResults.push(...results.corporations.map(item => ({ ...item, type: "corporation" })));
      }
      if (results.alliances) {
        allResults.push(...results.alliances.map(item => ({ ...item, type: "alliance" })));
      }
      if (results.characters) {
        allResults.push(...results.characters.map(item => ({ ...item, type: "character" })));
      }
      if (results.factions) {
        allResults.push(...results.factions.map(item => ({ ...item, type: "faction" })));
      }
      if (results.inventory_types) {
        allResults.push(...results.inventory_types.map(item => ({ ...item, type: "inventory_type" })));
      }
      if (results.agents) {
        allResults.push(...results.agents.map(item => ({ ...item, type: "agent" })));
      }

      if (allResults.length === 0) {
        return JSON.stringify({
          success: false,
          message: "No entities found with the provided names",
          results: []
        });
      }

      return JSON.stringify({
        success: true,
        message: `Found ${allResults.length} entity/entities`,
        results: allResults
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: []
      });
    }
  },
  name: "universal_name_to_id",
  parameters: z.object({
    names: z.array(z.string()).min(1).max(500).describe("Array of entity names to convert to IDs (max 500)")
  }),
};