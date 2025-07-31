/**
 * EVE Online ESI API Client
 */
export class ESIClient {
    baseUrl = 'https://esi.evetech.net/latest';
    userAgent = 'EVE-Traffic-MCP/1.0.0';
    /**
     * Convert names to IDs using ESI /universe/ids endpoint
     */
    async namesToIds(names) {
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
        return await response.json();
    }
    /**
     * Convert IDs to names using ESI /universe/names endpoint
     */
    async idsToNames(ids) {
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
        return await response.json();
    }
    /**
     * Get solar system IDs from names
     */
    async getSolarSystemIds(systemNames) {
        const result = await this.namesToIds(systemNames);
        return result.systems || [];
    }
    /**
     * Get station IDs from names
     */
    async getStationIds(stationNames) {
        const result = await this.namesToIds(stationNames);
        return result.stations || [];
    }
    /**
     * Get region IDs from names
     */
    async getRegionIds(regionNames) {
        const result = await this.namesToIds(regionNames);
        return result.regions || [];
    }
    /**
     * Get all solar system IDs
     */
    async getAllSolarSystemIds() {
        const response = await fetch(`${this.baseUrl}/universe/systems/`, {
            method: 'GET',
            headers: {
                'User-Agent': this.userAgent,
            },
        });
        if (!response.ok) {
            throw new Error(`ESI API error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get solar system information by ID
     */
    async getSolarSystemInfo(systemId) {
        const response = await fetch(`${this.baseUrl}/universe/systems/${systemId}/`, {
            method: 'GET',
            headers: {
                'User-Agent': this.userAgent,
            },
        });
        if (!response.ok) {
            throw new Error(`ESI API error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get stargate information by ID
     */
    async getStargateInfo(stargateId) {
        const response = await fetch(`${this.baseUrl}/universe/stargates/${stargateId}/`, {
            method: 'GET',
            headers: {
                'User-Agent': this.userAgent,
            },
        });
        if (!response.ok) {
            throw new Error(`ESI API error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get multiple solar system information by IDs
     */
    async getMultipleSolarSystemInfo(systemIds) {
        const promises = systemIds.map(id => this.getSolarSystemInfo(id));
        const results = await Promise.allSettled(promises);
        return results
            .filter((result) => result.status === 'fulfilled')
            .map(result => result.value);
    }
    /**
     * Calculate route between two solar systems
     */
    async calculateRoute(originId, destinationId, flag = 'shortest', avoidSystems) {
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
        return await response.json();
    }
    /**
     * Calculate route with detailed information
     */
    async calculateRouteWithDetails(originId, destinationId, flag = 'shortest', avoidSystems) {
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
