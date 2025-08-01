/**
 * Integration tests for Station Services tools using real EVE Online ESI API
 * These tests make actual API calls and may be slower
 */

import { describe, it, expect } from 'vitest';
import { 
  getStationServicesTool,
  getSystemStationsTool,
  findStationsWithServicesTool
} from './station-services-tools.js';

// Skip these tests in CI or if SKIP_INTEGRATION_TESTS is set
const skipIntegration = process.env.SKIP_INTEGRATION_TESTS === 'true' || process.env.CI === 'true';

describe.skipIf(skipIntegration)('Station Services Tools - Integration Tests', () => {
  // Increase timeout for real API calls
  const timeout = 30000;

  describe('getStationServicesTool', () => {
    it('should get station services for Jita 4-4', async () => {
      const result = await getStationServicesTool.execute({
        stations: [60003760], // Jita IV - Moon 4 - Caldari Navy Assembly Plant
        includeSystemInfo: true
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.stations).toHaveLength(1);
      
      const station = parsed.stations[0];
      expect(station.station_id).toBe(60003760);
      expect(station.name).toContain('Jita');
      expect(station.system_name).toBe('Jita');
      expect(station.services).toBeDefined();
      expect(station.services.length).toBeGreaterThan(0);
      expect(station.security_status).toBeCloseTo(0.946, 2);
      
      // Check that it has market service (Jita 4-4 is the main trade hub)
      const hasMarket = station.services.some(s => 
        s.service_key === 'market' || s.service_name.toLowerCase().includes('market')
      );
      expect(hasMarket).toBe(true);
    }, timeout);

    it('should handle station names', async () => {
      const result = await getStationServicesTool.execute({
        stations: ['Jita IV - Moon 4 - Caldari Navy Assembly Plant'],
        includeSystemInfo: true
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.stations).toHaveLength(1);
      expect(parsed.stations[0].name).toContain('Jita');
    }, timeout);

    it('should handle multiple stations', async () => {
      const result = await getStationServicesTool.execute({
        stations: [
          60003760, // Jita IV - Moon 4
          60008494  // Amarr VIII (Oris) - Emperor Family Academy
        ],
        includeSystemInfo: true
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.stations).toHaveLength(2);
      
      const stationNames = parsed.stations.map(s => s.name);
      expect(stationNames.some(name => name.includes('Jita'))).toBe(true);
      expect(stationNames.some(name => name.includes('Amarr'))).toBe(true);
    }, timeout);
  });

  describe('getSystemStationsTool', () => {
    it('should get all stations in Jita system', async () => {
      const result = await getSystemStationsTool.execute({
        systems: ['Jita']
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.systems).toHaveLength(1);
      
      const system = parsed.systems[0];
      expect(system.system_name).toBe('Jita');
      expect(system.security_status).toBeCloseTo(0.946, 2);
      expect(system.stations).toBeDefined();
      expect(system.stations.length).toBeGreaterThan(0);
      
      // Jita should have the famous 4-4 station
      const has44Station = system.stations.some(s => 
        s.name.includes('Moon 4') && s.name.includes('Caldari Navy')
      );
      expect(has44Station).toBe(true);
    }, timeout);

    it('should filter stations by market service', async () => {
      const result = await getSystemStationsTool.execute({
        systems: ['Jita'],
        serviceFilter: ['market']
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.systems[0].stations.length).toBeGreaterThan(0);
      
      // All returned stations should have market service
      for (const station of parsed.systems[0].stations) {
        const hasMarket = station.services.some(s => 
          s.service_key === 'market' || s.service_name.toLowerCase().includes('market')
        );
        expect(hasMarket).toBe(true);
      }
    }, timeout);

    it('should handle system IDs', async () => {
      const result = await getSystemStationsTool.execute({
        systems: [30000142] // Jita system ID
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.systems[0].system_name).toBe('Jita');
    }, timeout);
  });

  describe('findStationsWithServicesTool', () => {
    it('should find stations with market service in The Forge region', async () => {
      const result = await findStationsWithServicesTool.execute({
        requiredServices: ['market'],
        searchArea: {
          regions: ['The Forge']
        },
        limit: 10
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.stations.length).toBeGreaterThan(0);
      expect(parsed.stations.length).toBeLessThanOrEqual(10);
      
      // All stations should have market service
      for (const station of parsed.stations) {
        const hasMarket = station.services.some(s => 
          s.service_key === 'market' || s.service_name.toLowerCase().includes('market')
        );
        expect(hasMarket).toBe(true);
      }
      
      // Should include Jita 4-4
      const hasJita44 = parsed.stations.some(s => 
        s.name.includes('Jita') && s.name.includes('Moon 4')
      );
      expect(hasJita44).toBe(true);
    }, timeout);

    it('should find stations with reprocessing in specific systems', async () => {
      const result = await findStationsWithServicesTool.execute({
        requiredServices: ['reprocessing'],
        searchArea: {
          systems: ['Jita', 'Amarr']
        },
        limit: 5
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      
      if (parsed.stations.length > 0) {
        // All stations should have reprocessing service
        for (const station of parsed.stations) {
          const hasReprocessing = station.services.some(s => 
            s.service_key.includes('reprocessing') || 
            s.service_name.toLowerCase().includes('reprocessing')
          );
          expect(hasReprocessing).toBe(true);
        }
      }
    }, timeout);

    it('should apply security filter correctly', async () => {
      const result = await findStationsWithServicesTool.execute({
        requiredServices: ['market'],
        searchArea: {
          systems: ['Jita', 'Rens'] // Both high-sec systems
        },
        securityFilter: {
          minSecurity: 0.5 // High-sec only
        },
        limit: 10
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      
      // All stations should be in high-sec
      for (const station of parsed.stations) {
        expect(station.security_status).toBeGreaterThanOrEqual(0.5);
      }
    }, timeout);

    it('should find stations with multiple required services', async () => {
      const result = await findStationsWithServicesTool.execute({
        requiredServices: ['market', 'repair'],
        searchArea: {
          systems: ['Jita']
        },
        limit: 5
      });

      const parsed = JSON.parse(result);
      
      if (parsed.success && parsed.stations.length > 0) {
        // All stations should have both market and repair services
        for (const station of parsed.stations) {
          const hasMarket = station.services.some(s => 
            s.service_key === 'market' || s.service_name.toLowerCase().includes('market')
          );
          const hasRepair = station.services.some(s => 
            s.service_key.includes('repair') || s.service_name.toLowerCase().includes('repair')
          );
          expect(hasMarket).toBe(true);
          expect(hasRepair).toBe(true);
        }
      }
    }, timeout);
  });

  describe('Error handling', () => {
    it('should handle non-existent station names gracefully', async () => {
      const result = await getStationServicesTool.execute({
        stations: ['Non-Existent Station Name']
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.errors).toBeDefined();
      expect(parsed.errors.some(e => e.includes('not found'))).toBe(true);
    }, timeout);

    it('should handle non-existent system names gracefully', async () => {
      const result = await getSystemStationsTool.execute({
        systems: ['Non-Existent System']
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.errors).toBeDefined();
      expect(parsed.errors.some(e => e.includes('not found'))).toBe(true);
    }, timeout);

    it('should handle invalid station IDs gracefully', async () => {
      const result = await getStationServicesTool.execute({
        stations: [99999999] // Invalid station ID
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.errors).toBeDefined();
    }, timeout);
  });
});