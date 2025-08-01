/**
 * Station Services Information tools for EVE Online
 */

import { z } from "zod";
import { ESIClient, ESIStationInfo, ESIStructureInfo } from "./esi-client.js";
import { SDEClient, SDEAgentInfo, SDEAgentTypeInfo } from "./sde-client.js";

const esiClient = new ESIClient();
const sdeClient = new SDEClient();

/**
 * Station service type mapping
 */
const STATION_SERVICES = {
  'bounty-missions': 'Bounty Missions',
  'assasination-missions': 'Assassination Missions',
  'courier-missions': 'Courier Missions',
  'interbus': 'Interbus',
  'reprocessing-plant': 'Reprocessing Plant',
  'refinery': 'Refinery',
  'market': 'Market',
  'black-market': 'Black Market',
  'stock-exchange': 'Stock Exchange',
  'cloning': 'Cloning',
  'surgery': 'Surgery',
  'dna-therapy': 'DNA Therapy',
  'repair-facilities': 'Repair Facilities',
  'factory': 'Factory',
  'labratory': 'Laboratory',
  'gambling': 'Gambling',
  'fitting': 'Fitting',
  'paintshop': 'Paintshop',
  'news': 'News',
  'storage': 'Storage',
  'insurance': 'Insurance',
  'docking': 'Docking',
  'office-rental': 'Office Rental',
  'jump-clone-facility': 'Jump Clone Facility',
  'loyalty-point-store': 'Loyalty Point Store',
  'navy-offices': 'Navy Offices',
  'security-offices': 'Security Offices'
} as const;

export interface CombinedStationInfo {
  station_id: number;
  name: string;
  system_id: number;
  system_name?: string;
  region_id?: number;
  region_name?: string;
  type_id: number;
  type_name?: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  owner_id: number;
  owner_name?: string;
  race_id?: number;
  race_name?: string;
  services: Array<{
    service_key: string;
    service_name: string;
    available: boolean;
  }>;
  docking_info: {
    max_dockable_ship_volume: number;
    office_rental_cost: number;
  };
  reprocessing_info: {
    efficiency: number;
    stations_take: number;
  };
  security_status?: number;
  security_class?: string;
  agents?: Array<{
    agent_id: number;
    agent_name?: string;
    agent_type?: string;
    corporation_name?: string;
    division_id?: number;
    level?: number;
    quality?: number;
    is_locator?: boolean;
    is_research_agent?: boolean;
  }>;
}

/**
 * Get station agents information
 */
export const getStationAgentsTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external APIs
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Get Station Agents",
  },
  description: "Get information about agents located at specific stations, including their types, levels, and specializations",
  execute: async (args: { 
    stations: (string | number)[];
    includeResearchAgents?: boolean;
  }) => {
    try {
      if (args.stations.length === 0) {
        return JSON.stringify({
          success: false,
          message: "At least one station must be provided",
          stations: []
        });
      }

      if (args.stations.length > 20) {
        return JSON.stringify({
          success: false,
          message: "Maximum 20 stations allowed per request",
          stations: []
        });
      }

      const results: Array<{
        station_id: number;
        station_name?: string;
        system_name?: string;
        agents: Array<{
          agent_id: number;
          agent_name?: string;
          agent_type?: string;
          corporation_name?: string;
          division_id?: number;
          level?: number;
          quality?: number;
          is_locator?: boolean;
          is_research_agent?: boolean;
        }>;
      }> = [];
      const errors: string[] = [];

      // Convert station names to IDs if needed
      const stationIds: number[] = [];
      const stringStations = args.stations.filter(s => typeof s === 'string') as string[];
      const numericStations = args.stations.filter(s => typeof s === 'number') as number[];

      stationIds.push(...numericStations);

      if (stringStations.length > 0) {
        try {
          const stationIdResults = await esiClient.getStationIds(stringStations);
          stationIds.push(...stationIdResults.map(s => s.id));
          
          // Check for stations that weren't found
          const foundNames = stationIdResults.map(s => s.name.toLowerCase());
          const notFound = stringStations.filter(name => 
            !foundNames.includes(name.toLowerCase())
          );
          notFound.forEach(name => {
            errors.push(`Station '${name}' not found`);
          });
        } catch (error) {
          errors.push(`Error converting station names to IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Get research agent IDs if requested
      let researchAgentIds: Set<number> = new Set();
      if (args.includeResearchAgents) {
        try {
          const researchIds = await sdeClient.getAllResearchAgentIds();
          researchAgentIds = new Set(researchIds);
        } catch (error) {
          console.warn('Failed to get research agent IDs:', error);
        }
      }

      // Process each station
      for (const stationId of stationIds) {
        try {
          // Get station basic info
          let stationName: string | undefined;
          let systemName: string | undefined;
          
          try {
            const stationInfo = await esiClient.getStationInfo(stationId);
            stationName = stationInfo.name;
            
            const systemInfo = await esiClient.getSolarSystemInfo(stationInfo.system_id);
            systemName = systemInfo.name;
          } catch (error) {
            console.warn(`Failed to get station info for ${stationId}:`, error);
          }

          // Get agents at this station
          const agents = await sdeClient.getAgentsByLocation(stationId);
          
          const agentInfos: Array<{
            agent_id: number;
            agent_name?: string;
            agent_type?: string;
            corporation_name?: string;
            division_id?: number;
            level?: number;
            quality?: number;
            is_locator?: boolean;
            is_research_agent?: boolean;
          }> = [];

          // Process each agent
          for (const agent of agents) {
            try {
              // Get agent name and corporation info
              const idsToResolve: number[] = [agent.characterID];
              if (agent.corporationID) idsToResolve.push(agent.corporationID);
              
              let nameMap = new Map<number, string>();
              try {
                const nameResults = await esiClient.idsToNames(idsToResolve);
                nameMap = new Map(nameResults.map(result => [result.id, result.name]));
              } catch (error) {
                console.warn('Failed to resolve agent names:', error);
              }

              // Get agent type info
              let agentTypeName: string | undefined;
              if (agent.agentTypeID) {
                try {
                  const agentTypeInfo = await sdeClient.getAgentTypeInfo(agent.agentTypeID);
                  agentTypeName = agentTypeInfo.agentType;
                } catch (error) {
                  console.warn(`Failed to get agent type ${agent.agentTypeID}:`, error);
                }
              }

              agentInfos.push({
                agent_id: agent.characterID,
                agent_name: nameMap.get(agent.characterID),
                agent_type: agentTypeName,
                corporation_name: agent.corporationID ? nameMap.get(agent.corporationID) : undefined,
                division_id: agent.divisionID,
                level: agent.level,
                quality: agent.quality,
                is_locator: agent.isLocator || false,
                is_research_agent: researchAgentIds.has(agent.characterID)
              });
            } catch (error) {
              console.warn(`Failed to process agent ${agent.characterID}:`, error);
            }
          }

          results.push({
            station_id: stationId,
            station_name: stationName,
            system_name: systemName,
            agents: agentInfos
          });
        } catch (error) {
          errors.push(`Error processing station ${stationId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const totalAgents = results.reduce((sum, station) => sum + station.agents.length, 0);

      return JSON.stringify({
        success: results.length > 0,
        message: `Found ${totalAgents} agent(s) across ${results.length} station(s)`,
        stations: results,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total_stations_requested: args.stations.length,
          successful_stations: results.length,
          failed_stations: errors.length,
          total_agents_found: totalAgents,
          research_agents_included: args.includeResearchAgents || false
        }
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error getting station agents: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stations: []
      });
    }
  },
  name: "get_station_agents",
  parameters: z.object({
    stations: z.array(z.union([z.string(), z.number()])).min(1).max(20).describe("Array of station names or IDs to get agent information for (max 20)"),
    includeResearchAgents: z.boolean().optional().default(false).describe("Whether to identify research agents (may be slower)")
  }),
};

/**
 * Get comprehensive station information including services
 */
export const getStationServicesTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external ESI API
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Get Station Services",
  },
  description: "Get comprehensive station information including available services, docking capabilities, and reprocessing facilities. Supports both station IDs and names.",
  execute: async (args: { 
    stations: (string | number)[];
    includeSystemInfo?: boolean;
    includeAgents?: boolean;
  }) => {
    try {
      if (args.stations.length === 0) {
        return JSON.stringify({
          success: false,
          message: "At least one station must be provided",
          stations: []
        });
      }

      if (args.stations.length > 50) {
        return JSON.stringify({
          success: false,
          message: "Maximum 50 stations allowed per request",
          stations: []
        });
      }

      const results: CombinedStationInfo[] = [];
      const errors: string[] = [];

      // Convert station names to IDs if needed
      const stationIds: number[] = [];
      const stringStations = args.stations.filter(s => typeof s === 'string') as string[];
      const numericStations = args.stations.filter(s => typeof s === 'number') as number[];

      stationIds.push(...numericStations);

      if (stringStations.length > 0) {
        try {
          const stationIdResults = await esiClient.getStationIds(stringStations);
          stationIds.push(...stationIdResults.map(s => s.id));
          
          // Check for stations that weren't found
          const foundNames = stationIdResults.map(s => s.name.toLowerCase());
          const notFound = stringStations.filter(name => 
            !foundNames.includes(name.toLowerCase())
          );
          notFound.forEach(name => {
            errors.push(`Station '${name}' not found`);
          });
        } catch (error) {
          errors.push(`Error converting station names to IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Get station information
      for (const stationId of stationIds) {
        try {
          const stationInfo = await esiClient.getStationInfo(stationId);
          
          // Collect IDs for name resolution
          const idsToResolve: number[] = [
            stationInfo.system_id,
            stationInfo.type_id,
            stationInfo.owner
          ];
          
          if (stationInfo.race_id) {
            idsToResolve.push(stationInfo.race_id);
          }

          // Get system info for region and security status
          let systemInfo;
          let regionId: number | undefined;
          let securityStatus: number | undefined;
          let securityClass: string | undefined;

          if (args.includeSystemInfo !== false) {
            try {
              systemInfo = await esiClient.getSolarSystemInfo(stationInfo.system_id);
              regionId = systemInfo.constellation_id; // We'll need to get region from constellation
              securityStatus = systemInfo.security_status;
              securityClass = systemInfo.security_class;
              
              // Get constellation info to get region
              try {
                const constellationInfo = await esiClient.getConstellationInfo(systemInfo.constellation_id);
                regionId = constellationInfo.region_id;
                idsToResolve.push(regionId);
              } catch (error) {
                console.warn(`Failed to get constellation info for ${systemInfo.constellation_id}:`, error);
              }
            } catch (error) {
              console.warn(`Failed to get system info for ${stationInfo.system_id}:`, error);
            }
          }

          // Resolve names
          let nameMap = new Map<number, string>();
          try {
            const nameResults = await esiClient.idsToNames(idsToResolve);
            nameMap = new Map(nameResults.map(result => [result.id, result.name]));
          } catch (error) {
            console.warn('Failed to fetch names for station data:', error);
          }

          // Process services
          const services = stationInfo.services.map(serviceKey => ({
            service_key: serviceKey,
            service_name: STATION_SERVICES[serviceKey as keyof typeof STATION_SERVICES] || serviceKey,
            available: true
          }));

          // Get agents if requested
          let agentInfos: Array<{
            agent_id: number;
            agent_name?: string;
            agent_type?: string;
            corporation_name?: string;
            division_id?: number;
            level?: number;
            quality?: number;
            is_locator?: boolean;
            is_research_agent?: boolean;
          }> | undefined;

          if (args.includeAgents) {
            try {
              const agents = await sdeClient.getAgentsByLocation(stationInfo.station_id);
              agentInfos = [];

              for (const agent of agents) {
                try {
                  // Get agent name and corporation info
                  const agentIdsToResolve: number[] = [agent.characterID];
                  if (agent.corporationID) agentIdsToResolve.push(agent.corporationID);
                  
                  let agentNameMap = new Map<number, string>();
                  try {
                    const agentNameResults = await esiClient.idsToNames(agentIdsToResolve);
                    agentNameMap = new Map(agentNameResults.map(result => [result.id, result.name]));
                  } catch (error) {
                    console.warn('Failed to resolve agent names:', error);
                  }

                  // Get agent type info
                  let agentTypeName: string | undefined;
                  if (agent.agentTypeID) {
                    try {
                      const agentTypeInfo = await sdeClient.getAgentTypeInfo(agent.agentTypeID);
                      agentTypeName = agentTypeInfo.agentType;
                    } catch (error) {
                      console.warn(`Failed to get agent type ${agent.agentTypeID}:`, error);
                    }
                  }

                  agentInfos.push({
                    agent_id: agent.characterID,
                    agent_name: agentNameMap.get(agent.characterID),
                    agent_type: agentTypeName,
                    corporation_name: agent.corporationID ? agentNameMap.get(agent.corporationID) : undefined,
                    division_id: agent.divisionID,
                    level: agent.level,
                    quality: agent.quality,
                    is_locator: agent.isLocator || false,
                    is_research_agent: false // We don't check research agents here for performance
                  });
                } catch (error) {
                  console.warn(`Failed to process agent ${agent.characterID}:`, error);
                }
              }
            } catch (error) {
              console.warn(`Failed to get agents for station ${stationInfo.station_id}:`, error);
            }
          }

          const combinedInfo: CombinedStationInfo = {
            station_id: stationInfo.station_id,
            name: stationInfo.name,
            system_id: stationInfo.system_id,
            system_name: nameMap.get(stationInfo.system_id),
            region_id: regionId,
            region_name: regionId ? nameMap.get(regionId) : undefined,
            type_id: stationInfo.type_id,
            type_name: nameMap.get(stationInfo.type_id),
            position: stationInfo.position,
            owner_id: stationInfo.owner,
            owner_name: nameMap.get(stationInfo.owner),
            race_id: stationInfo.race_id,
            race_name: stationInfo.race_id ? nameMap.get(stationInfo.race_id) : undefined,
            services,
            docking_info: {
              max_dockable_ship_volume: stationInfo.max_dockable_ship_volume,
              office_rental_cost: stationInfo.office_rental_cost
            },
            reprocessing_info: {
              efficiency: stationInfo.reprocessing_efficiency,
              stations_take: stationInfo.reprocessing_stations_take
            },
            security_status: securityStatus,
            security_class: securityClass,
            agents: agentInfos
          };

          results.push(combinedInfo);
        } catch (error) {
          errors.push(`Error fetching station ${stationId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return JSON.stringify({
        success: results.length > 0,
        message: `Found information for ${results.length} station(s)`,
        stations: results,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total_stations_requested: args.stations.length,
          successful_stations: results.length,
          failed_stations: errors.length,
          service_summary: {
            most_common_services: getMostCommonServices(results),
            unique_services: getUniqueServices(results)
          }
        }
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error getting station services: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stations: []
      });
    }
  },
  name: "get_station_services",
  parameters: z.object({
    stations: z.array(z.union([z.string(), z.number()])).min(1).max(50).describe("Array of station names or IDs to get service information for (max 50)"),
    includeSystemInfo: z.boolean().optional().default(true).describe("Whether to include system security status and region information"),
    includeAgents: z.boolean().optional().default(false).describe("Whether to include agent information (may be slower)")
  }),
};

/**
 * Get stations in a solar system with their services
 */
export const getSystemStationsTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external ESI API
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Get System Stations",
  },
  description: "Get all stations in specified solar systems with their available services and facilities information.",
  execute: async (args: { 
    systems: (string | number)[];
    serviceFilter?: string[];
  }) => {
    try {
      if (args.systems.length === 0) {
        return JSON.stringify({
          success: false,
          message: "At least one system must be provided",
          systems: []
        });
      }

      if (args.systems.length > 20) {
        return JSON.stringify({
          success: false,
          message: "Maximum 20 systems allowed per request",
          systems: []
        });
      }

      const results: Array<{
        system_id: number;
        system_name: string;
        security_status: number;
        security_class?: string;
        region_name?: string;
        stations: CombinedStationInfo[];
      }> = [];
      const errors: string[] = [];

      // Convert system names to IDs if needed
      const systemIds: number[] = [];
      const stringSystems = args.systems.filter(s => typeof s === 'string') as string[];
      const numericSystems = args.systems.filter(s => typeof s === 'number') as number[];

      systemIds.push(...numericSystems);

      if (stringSystems.length > 0) {
        try {
          const systemIdResults = await esiClient.getSolarSystemIds(stringSystems);
          systemIds.push(...systemIdResults.map(s => s.id));
          
          // Check for systems that weren't found
          const foundNames = systemIdResults.map(s => s.name.toLowerCase());
          const notFound = stringSystems.filter(name => 
            !foundNames.includes(name.toLowerCase())
          );
          notFound.forEach(name => {
            errors.push(`System '${name}' not found`);
          });
        } catch (error) {
          errors.push(`Error converting system names to IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Process each system
      for (const systemId of systemIds) {
        try {
          // Get system information
          const systemInfo = await esiClient.getSolarSystemInfo(systemId);
          
          // Get region information
          let regionName: string | undefined;
          try {
            const constellationInfo = await esiClient.getConstellationInfo(systemInfo.constellation_id);
            const regionInfo = await esiClient.getRegionInfo(constellationInfo.region_id);
            regionName = regionInfo.name;
          } catch (error) {
            console.warn(`Failed to get region info for system ${systemId}:`, error);
          }

          // Get stations in the system
          const stations = await esiClient.getSystemStations(systemId);
          
          const stationInfos: CombinedStationInfo[] = [];
          
          for (const station of stations) {
            // Get additional names
            const idsToResolve = [station.type_id, station.owner];
            if (station.race_id) idsToResolve.push(station.race_id);
            
            let nameMap = new Map<number, string>();
            try {
              const nameResults = await esiClient.idsToNames(idsToResolve);
              nameMap = new Map(nameResults.map(result => [result.id, result.name]));
            } catch (error) {
              console.warn('Failed to fetch names for station data:', error);
            }

            // Process services
            const services = station.services.map(serviceKey => ({
              service_key: serviceKey,
              service_name: STATION_SERVICES[serviceKey as keyof typeof STATION_SERVICES] || serviceKey,
              available: true
            }));

            // Apply service filter if provided
            if (args.serviceFilter && args.serviceFilter.length > 0) {
              const hasRequiredService = services.some(service => 
                args.serviceFilter!.some(filter => 
                  service.service_key.toLowerCase().includes(filter.toLowerCase()) ||
                  service.service_name.toLowerCase().includes(filter.toLowerCase())
                )
              );
              
              if (!hasRequiredService) {
                continue; // Skip this station if it doesn't have required services
              }
            }

            const stationInfo: CombinedStationInfo = {
              station_id: station.station_id,
              name: station.name,
              system_id: station.system_id,
              system_name: systemInfo.name,
              region_id: undefined, // Will be set if we got region info
              region_name: regionName,
              type_id: station.type_id,
              type_name: nameMap.get(station.type_id),
              position: station.position,
              owner_id: station.owner,
              owner_name: nameMap.get(station.owner),
              race_id: station.race_id,
              race_name: station.race_id ? nameMap.get(station.race_id) : undefined,
              services,
              docking_info: {
                max_dockable_ship_volume: station.max_dockable_ship_volume,
                office_rental_cost: station.office_rental_cost
              },
              reprocessing_info: {
                efficiency: station.reprocessing_efficiency,
                stations_take: station.reprocessing_stations_take
              },
              security_status: systemInfo.security_status,
              security_class: systemInfo.security_class
            };

            stationInfos.push(stationInfo);
          }

          results.push({
            system_id: systemId,
            system_name: systemInfo.name,
            security_status: systemInfo.security_status,
            security_class: systemInfo.security_class,
            region_name: regionName,
            stations: stationInfos
          });
        } catch (error) {
          errors.push(`Error processing system ${systemId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const totalStations = results.reduce((sum, system) => sum + system.stations.length, 0);

      return JSON.stringify({
        success: results.length > 0,
        message: `Found ${totalStations} station(s) across ${results.length} system(s)`,
        systems: results,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total_systems_requested: args.systems.length,
          successful_systems: results.length,
          failed_systems: errors.length,
          total_stations_found: totalStations,
          service_filter_applied: args.serviceFilter && args.serviceFilter.length > 0,
          filtered_services: args.serviceFilter
        }
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error getting system stations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        systems: []
      });
    }
  },
  name: "get_system_stations",
  parameters: z.object({
    systems: z.array(z.union([z.string(), z.number()])).min(1).max(20).describe("Array of solar system names or IDs to get station information for (max 20)"),
    serviceFilter: z.array(z.string()).optional().describe("Optional array of service names or keywords to filter stations by (e.g., ['market', 'reprocessing', 'cloning'])")
  }),
};

/**
 * Find stations with specific services across multiple systems or regions
 */
export const findStationsWithServicesTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external ESI API
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Find Stations with Services",
  },
  description: "Find stations that offer specific services within specified systems or regions. Useful for finding trading hubs, reprocessing facilities, or other specialized services.",
  execute: async (args: { 
    requiredServices: string[];
    searchArea: {
      systems?: (string | number)[];
      regions?: (string | number)[];
    };
    securityFilter?: {
      minSecurity?: number;
      maxSecurity?: number;
    };
    limit?: number;
  }) => {
    try {
      if (args.requiredServices.length === 0) {
        return JSON.stringify({
          success: false,
          message: "At least one required service must be specified",
          stations: []
        });
      }

      const limit = args.limit || 50;
      if (limit > 100) {
        return JSON.stringify({
          success: false,
          message: "Maximum limit is 100 stations",
          stations: []
        });
      }

      const results: CombinedStationInfo[] = [];
      const errors: string[] = [];
      let systemsToSearch: number[] = [];

      // Determine systems to search
      if (args.searchArea.systems && args.searchArea.systems.length > 0) {
        // Convert system names to IDs if needed
        const stringSystems = args.searchArea.systems.filter(s => typeof s === 'string') as string[];
        const numericSystems = args.searchArea.systems.filter(s => typeof s === 'number') as number[];
        
        systemsToSearch.push(...numericSystems);
        
        if (stringSystems.length > 0) {
          try {
            const systemIdResults = await esiClient.getSolarSystemIds(stringSystems);
            systemsToSearch.push(...systemIdResults.map(s => s.id));
          } catch (error) {
            errors.push(`Error converting system names to IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      if (args.searchArea.regions && args.searchArea.regions.length > 0) {
        // Get systems from regions
        const stringRegions = args.searchArea.regions.filter(r => typeof r === 'string') as string[];
        const numericRegions = args.searchArea.regions.filter(r => typeof r === 'number') as number[];
        
        let regionIds = [...numericRegions];
        
        if (stringRegions.length > 0) {
          try {
            const regionIdResults = await esiClient.getRegionIds(stringRegions);
            regionIds.push(...regionIdResults.map(r => r.id));
          } catch (error) {
            errors.push(`Error converting region names to IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Get systems from regions
        for (const regionId of regionIds) {
          try {
            const regionInfo = await esiClient.getRegionInfo(regionId);
            for (const constellationId of regionInfo.constellations) {
              try {
                const constellationInfo = await esiClient.getConstellationInfo(constellationId);
                systemsToSearch.push(...constellationInfo.systems);
              } catch (error) {
                console.warn(`Failed to get constellation ${constellationId}:`, error);
              }
            }
          } catch (error) {
            errors.push(`Error processing region ${regionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // If no search area specified, use a sample of systems
      if (systemsToSearch.length === 0) {
        try {
          const allSystems = await esiClient.getAllSolarSystemIds();
          systemsToSearch = allSystems.slice(0, 100); // Sample first 100 systems
        } catch (error) {
          return JSON.stringify({
            success: false,
            message: `Error getting systems to search: ${error instanceof Error ? error.message : 'Unknown error'}`,
            stations: []
          });
        }
      }

      // Remove duplicates and limit search scope
      systemsToSearch = [...new Set(systemsToSearch)].slice(0, 200); // Limit to 200 systems max

      // Search stations in systems
      let stationsFound = 0;
      for (const systemId of systemsToSearch) {
        if (stationsFound >= limit) break;

        try {
          const systemInfo = await esiClient.getSolarSystemInfo(systemId);
          
          // Apply security filter
          if (args.securityFilter) {
            if (args.securityFilter.minSecurity !== undefined && systemInfo.security_status < args.securityFilter.minSecurity) {
              continue;
            }
            if (args.securityFilter.maxSecurity !== undefined && systemInfo.security_status > args.securityFilter.maxSecurity) {
              continue;
            }
          }

          const stations = await esiClient.getSystemStations(systemId);
          
          for (const station of stations) {
            if (stationsFound >= limit) break;

            // Check if station has required services
            const hasAllServices = args.requiredServices.every(requiredService => 
              station.services.some(stationService => 
                stationService.toLowerCase().includes(requiredService.toLowerCase()) ||
                (STATION_SERVICES[stationService as keyof typeof STATION_SERVICES] || stationService)
                  .toLowerCase().includes(requiredService.toLowerCase())
              )
            );

            if (!hasAllServices) continue;

            // Get additional information
            const idsToResolve = [station.type_id, station.owner];
            if (station.race_id) idsToResolve.push(station.race_id);
            
            let nameMap = new Map<number, string>();
            try {
              const nameResults = await esiClient.idsToNames(idsToResolve);
              nameMap = new Map(nameResults.map(result => [result.id, result.name]));
            } catch (error) {
              console.warn('Failed to fetch names for station data:', error);
            }

            // Get region information
            let regionName: string | undefined;
            try {
              const constellationInfo = await esiClient.getConstellationInfo(systemInfo.constellation_id);
              const regionInfo = await esiClient.getRegionInfo(constellationInfo.region_id);
              regionName = regionInfo.name;
            } catch (error) {
              console.warn(`Failed to get region info for system ${systemId}:`, error);
            }

            const services = station.services.map(serviceKey => ({
              service_key: serviceKey,
              service_name: STATION_SERVICES[serviceKey as keyof typeof STATION_SERVICES] || serviceKey,
              available: true
            }));

            const stationInfo: CombinedStationInfo = {
              station_id: station.station_id,
              name: station.name,
              system_id: station.system_id,
              system_name: systemInfo.name,
              region_id: undefined,
              region_name: regionName,
              type_id: station.type_id,
              type_name: nameMap.get(station.type_id),
              position: station.position,
              owner_id: station.owner,
              owner_name: nameMap.get(station.owner),
              race_id: station.race_id,
              race_name: station.race_id ? nameMap.get(station.race_id) : undefined,
              services,
              docking_info: {
                max_dockable_ship_volume: station.max_dockable_ship_volume,
                office_rental_cost: station.office_rental_cost
              },
              reprocessing_info: {
                efficiency: station.reprocessing_efficiency,
                stations_take: station.reprocessing_stations_take
              },
              security_status: systemInfo.security_status,
              security_class: systemInfo.security_class
            };

            results.push(stationInfo);
            stationsFound++;
          }
        } catch (error) {
          // Continue with other systems if one fails
          continue;
        }
      }

      return JSON.stringify({
        success: results.length > 0,
        message: `Found ${results.length} station(s) with required services`,
        stations: results,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          required_services: args.requiredServices,
          systems_searched: systemsToSearch.length,
          stations_found: results.length,
          security_filter: args.securityFilter,
          search_area: args.searchArea
        }
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Error finding stations with services: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stations: []
      });
    }
  },
  name: "find_stations_with_services",
  parameters: z.object({
    requiredServices: z.array(z.string()).min(1).describe("Array of required service names or keywords (e.g., ['market', 'reprocessing', 'cloning'])"),
    searchArea: z.object({
      systems: z.array(z.union([z.string(), z.number()])).optional().describe("Optional array of solar system names or IDs to search in"),
      regions: z.array(z.union([z.string(), z.number()])).optional().describe("Optional array of region names or IDs to search in")
    }).describe("Area to search for stations (specify either systems or regions or both)"),
    securityFilter: z.object({
      minSecurity: z.number().min(-1).max(1).optional().describe("Minimum security status (e.g., 0.5 for high-sec only)"),
      maxSecurity: z.number().min(-1).max(1).optional().describe("Maximum security status (e.g., 0.0 for low-sec and below)")
    }).optional().describe("Optional security status filter"),
    limit: z.number().min(1).max(100).optional().default(50).describe("Maximum number of stations to return (default: 50, max: 100)")
  }),
};

/**
 * Helper function to get most common services across stations
 */
function getMostCommonServices(stations: CombinedStationInfo[]): Array<{ service: string; count: number }> {
  const serviceCounts = new Map<string, number>();
  
  stations.forEach(station => {
    station.services.forEach(service => {
      serviceCounts.set(service.service_name, (serviceCounts.get(service.service_name) || 0) + 1);
    });
  });

  return Array.from(serviceCounts.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Helper function to get unique services across stations
 */
function getUniqueServices(stations: CombinedStationInfo[]): string[] {
  const uniqueServices = new Set<string>();
  
  stations.forEach(station => {
    station.services.forEach(service => {
      uniqueServices.add(service.service_name);
    });
  });

  return Array.from(uniqueServices).sort();
}