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
}
