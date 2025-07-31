/**
 * EVE Online ESI API Client
 */

export interface ESINameToIdResult {
  agents?: Array<{ id: number; name: string }>;
  alliances?: Array<{ id: number; name: string }>;
  characters?: Array<{ id: number; name: string }>;
  constellations?: Array<{ id: number; name: string }>;
  corporations?: Array<{ id: number; name: string }>;
  factions?: Array<{ id: number; name: string }>;
  inventory_types?: Array<{ id: number; name: string }>;
  regions?: Array<{ id: number; name: string }>;
  stations?: Array<{ id: number; name: string }>;
  systems?: Array<{ id: number; name: string }>;
}

export interface ESIIdToNameResult {
  id: number;
  name: string;
  category: 'alliance' | 'character' | 'constellation' | 'corporation' | 'inventory_type' | 'region' | 'solar_system' | 'station' | 'faction';
}

export interface ESISolarSystemInfo {
  system_id: number;
  name: string;
  constellation_id: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  security_status: number;
  security_class?: string;
  star_id?: number;
  stargates?: number[];
  stations?: number[];
  planets?: Array<{
    planet_id: number;
    moons?: number[];
    asteroid_belts?: number[];
  }>;
}

export interface ESIStargateInfo {
  stargate_id: number;
  name: string;
  system_id: number;
  type_id: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  destination: {
    stargate_id: number;
    system_id: number;
  };
}

export interface ESIRouteInfo {
  route: number[];
  jumps: number;
  origin: {
    id: number;
    name: string;
  };
  destination: {
    id: number;
    name: string;
  };
  flag: 'shortest' | 'secure' | 'insecure';
  avoided_systems?: number[];
}

export class ESIClient {
  private readonly baseUrl = 'https://esi.evetech.net/latest';
  private readonly userAgent = 'EVE-Traffic-MCP/1.0.0';

  /**
   * Convert names to IDs using ESI /universe/ids endpoint
   */
  async namesToIds(names: string[]): Promise<ESINameToIdResult> {
    if (names.length === 0) {
      throw new Error('Names array cannot be empty');
    }
    if (names.length > 500) {
      throw new Error('Maximum 500 names allowed per request');
    }

    const response = await fetch(`${this.baseUrl}/universe/ids/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.userAgent,
      },
      body: JSON.stringify(names),
    });

    if (!response.ok) {
      throw new Error(`ESI API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as ESINameToIdResult;
  }

  /**
   * Convert IDs to names using ESI /universe/names endpoint
   */
  async idsToNames(ids: number[]): Promise<ESIIdToNameResult[]> {
    if (ids.length === 0) {
      throw new Error('IDs array cannot be empty');
    }
    if (ids.length > 1000) {
      throw new Error('Maximum 1000 IDs allowed per request');
    }

    const response = await fetch(`${this.baseUrl}/universe/names/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.userAgent,
      },
      body: JSON.stringify(ids),
    });

    if (!response.ok) {
      throw new Error(`ESI API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as ESIIdToNameResult[];
  }

  /**
   * Get solar system IDs from names
   */
  async getSolarSystemIds(systemNames: string[]): Promise<Array<{ id: number; name: string }>> {
    const result = await this.namesToIds(systemNames);
    return result.systems || [];
  }

  /**
   * Get station IDs from names
   */
  async getStationIds(stationNames: string[]): Promise<Array<{ id: number; name: string }>> {
    const result = await this.namesToIds(stationNames);
    return result.stations || [];
  }

  /**
   * Get region IDs from names
   */
  async getRegionIds(regionNames: string[]): Promise<Array<{ id: number; name: string }>> {
    const result = await this.namesToIds(regionNames);
    return result.regions || [];
  }

  /**
   * Get all solar system IDs
   */
  async getAllSolarSystemIds(): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/universe/systems/`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`ESI API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as number[];
  }

  /**
   * Get solar system information by ID
   */
  async getSolarSystemInfo(systemId: number): Promise<ESISolarSystemInfo> {
    const response = await fetch(`${this.baseUrl}/universe/systems/${systemId}/`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`ESI API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as ESISolarSystemInfo;
  }

  /**
   * Get stargate information by ID
   */
  async getStargateInfo(stargateId: number): Promise<ESIStargateInfo> {
    const response = await fetch(`${this.baseUrl}/universe/stargates/${stargateId}/`, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`ESI API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as ESIStargateInfo;
  }

  /**
   * Get multiple solar system information by IDs
   */
  async getMultipleSolarSystemInfo(systemIds: number[]): Promise<ESISolarSystemInfo[]> {
    const promises = systemIds.map(id => this.getSolarSystemInfo(id));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<ESISolarSystemInfo> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  /**
   * Calculate route between two solar systems
   */
  async calculateRoute(
    originId: number,
    destinationId: number,
    flag: 'shortest' | 'secure' | 'insecure' = 'shortest',
    avoidSystems?: number[]
  ): Promise<number[]> {
    let url = `${this.baseUrl}/route/${originId}/${destinationId}/?flag=${flag}`;
    
    if (avoidSystems && avoidSystems.length > 0) {
      const avoidParams = avoidSystems.map(id => `avoid=${id}`).join('&');
      url += `&${avoidParams}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No route found between the specified systems');
      }
      throw new Error(`ESI API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as number[];
  }

  /**
   * Calculate route with detailed information
   */
  async calculateRouteWithDetails(
    originId: number,
    destinationId: number,
    flag: 'shortest' | 'secure' | 'insecure' = 'shortest',
    avoidSystems?: number[]
  ): Promise<ESIRouteInfo> {
    // Get the route
    const route = await this.calculateRoute(originId, destinationId, flag, avoidSystems);
    
    // Get system names for origin and destination
    const systemNames = await this.idsToNames([originId, destinationId]);
    const originName = systemNames.find(s => s.id === originId)?.name || `System ${originId}`;
    const destinationName = systemNames.find(s => s.id === destinationId)?.name || `System ${destinationId}`;

    return {
      route,
      jumps: route.length - 1, // Number of jumps is route length minus 1
      origin: {
        id: originId,
        name: originName
      },
      destination: {
        id: destinationId,
        name: destinationName
      },
      flag,
      avoided_systems: avoidSystems
    };
  }
}