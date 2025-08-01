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
}