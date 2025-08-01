/**
 * EVE Online SDE API Client
 */

export interface SDESolarSystemInfo {
  solarSystemID: number;
  solarSystemNameID?: number;
  regionID: number;
  constellationID: number;
  center?: number[];
  security: number;
  securityClass?: string;
  star?: {
    id: number;
    typeID: number;
    solarSystemID: number;
    constellationID: number;
    regionID: number;
  };
  stargates?: string[];
  planets?: string[];
}

export interface SDEStargateInfo {
  stargateID: number;
  solarSystemID: number;
  typeID: number;
  position?: number[];
  destinationStargateID?: number;
  destinationSolarSystemID?: number;
}

export interface SDERegionInfo {
  regionID: number;
  regionNameID?: number;
  center?: number[];
  max?: number[];
  min?: number[];
  constellations?: string[];
}

export interface SDEConstellationInfo {
  constellationID: number;
  constellationNameID?: number;
  regionID: number;
  center?: number[];
  max?: number[];
  min?: number[];
  solarSystems?: string[];
}

export interface SDEAgentInfo {
  characterID: number;
  agentTypeID?: number;
  corporationID?: number;
  divisionID?: number;
  isLocator?: boolean;
  level?: number;
  locationID?: number;
  quality?: number;
}

export interface SDEAgentTypeInfo {
  agentTypeID: number;
  agentType?: string;
}

export interface SDEResearchAgentInfo {
  characterID: number;
  typeID?: number;
}

export class SDEClient {
  private readonly baseUrl = 'https://sde.jita.space/latest';
  private readonly userAgent = 'EVE-Traffic-MCP/1.0.0';

  /**
   * Get all solar system IDs from SDE
   */
  async getAllSolarSystemIds(): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/universe/solarSystems`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`SDE API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as number[];
  }

  /**
   * Get solar system information by ID from SDE
   */
  async getSolarSystemInfo(systemId: number): Promise<SDESolarSystemInfo> {
    const response = await fetch(`${this.baseUrl}/universe/solarSystems/${systemId}`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`SDE API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as SDESolarSystemInfo;
  }

  /**
   * Get all stargate IDs from SDE
   */
  async getAllStargateIds(): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/universe/stargates`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`SDE API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as number[];
  }

  /**
   * Get stargate information by ID from SDE
   */
  async getStargateInfo(stargateId: number): Promise<SDEStargateInfo> {
    const response = await fetch(`${this.baseUrl}/universe/stargates/${stargateId}`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`SDE API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as SDEStargateInfo;
  }

  /**
   * Get multiple solar system information by IDs from SDE
   */
  async getMultipleSolarSystemInfo(systemIds: number[]): Promise<SDESolarSystemInfo[]> {
    const promises = systemIds.map(id => this.getSolarSystemInfo(id));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<SDESolarSystemInfo> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  /**
   * Get all region IDs from SDE
   */
  async getAllRegionIds(): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/universe/regions`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`SDE API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as number[];
  }

  /**
   * Get region information by ID from SDE
   */
  async getRegionInfo(regionId: number): Promise<SDERegionInfo> {
    const response = await fetch(`${this.baseUrl}/universe/regions/${regionId}`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`SDE API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as SDERegionInfo;
  }

  /**
   * Get all constellation IDs from SDE
   */
  async getAllConstellationIds(): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/universe/constellations`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`SDE API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as number[];
  }

  /**
   * Get constellation information by ID from SDE
   */
  async getConstellationInfo(constellationId: number): Promise<SDEConstellationInfo> {
    const response = await fetch(`${this.baseUrl}/universe/constellations/${constellationId}`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`SDE API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as SDEConstellationInfo;
  }

  /**
   * Get all agent IDs
   */
  async getAllAgentIds(): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/characters/agents`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`SDE API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as number[];
  }

  /**
   * Get agent information by ID
   */
  async getAgentInfo(agentId: number): Promise<SDEAgentInfo> {
    const response = await fetch(`${this.baseUrl}/characters/agents/${agentId}`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`SDE API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as SDEAgentInfo;
  }

  /**
   * Get multiple agent information by IDs
   */
  async getMultipleAgentInfo(agentIds: number[]): Promise<SDEAgentInfo[]> {
    const promises = agentIds.map(id => this.getAgentInfo(id));
    const results = await Promise.allSettled(promises);

    return results
      .filter((result): result is PromiseFulfilledResult<SDEAgentInfo> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  /**
   * Get agent type information by ID
   */
  async getAgentTypeInfo(agentTypeId: number): Promise<SDEAgentTypeInfo> {
    const response = await fetch(`${this.baseUrl}/characters/agentTypes/${agentTypeId}`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`SDE API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as SDEAgentTypeInfo;
  }

  /**
   * Get all research agent IDs
   */
  async getAllResearchAgentIds(): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/characters/researchAgents`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`SDE API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as number[];
  }

  /**
   * Get research agent information by ID
   */
  async getResearchAgentInfo(agentId: number): Promise<SDEResearchAgentInfo> {
    const response = await fetch(`${this.baseUrl}/characters/researchAgents/${agentId}`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`SDE API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as SDEResearchAgentInfo;
  }

  /**
   * Get agents by location (station/structure)
   */
  async getAgentsByLocation(locationId: number): Promise<SDEAgentInfo[]> {
    try {
      // Get all agent IDs first
      const allAgentIds = await this.getAllAgentIds();
      
      // Filter agents by location (this requires fetching all agents, which might be expensive)
      // For better performance, we'll sample a subset
      const sampleSize = Math.min(1000, allAgentIds.length);
      const sampledAgentIds = allAgentIds.slice(0, sampleSize);
      
      const agents = await this.getMultipleAgentInfo(sampledAgentIds);
      
      return agents.filter(agent => agent.locationID === locationId);
    } catch (error) {
      console.warn(`Failed to get agents by location ${locationId}:`, error);
      return [];
    }
  }
}