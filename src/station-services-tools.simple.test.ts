/**
 * Simple integration tests for Station Services tools using real EVE Online ESI API
 * These tests focus on basic functionality with known working data
 */

import { describe, it, expect } from 'vitest';
import { 
  getStationServicesTool,
  getSystemStationsTool,
  findStationsWithServicesTool
} from './station-services-tools.js';

// Skip these tests in CI or if SKIP_INTEGRATION_TESTS is set
const skipIntegration = process.env.SKIP_INTEGRATION_TESTS === 'true' || process.env.CI === 'true';

describe.skipIf(skipIntegration)('Station Services Tools - Simple Integration Tests', () => {
  // Increase timeout for real API calls
  const timeout = 30000;

  describe('Basic functionality tests', () => {
    it('should get station services for a known station ID', async () => {
      const result = await getStationServicesTool.execute({
        stations: [60003760], // Jita IV - Moon 4 - Caldari Navy Assembly Plant
        includeSystemInfo: false // Skip system info to avoid complex name resolution
      });

      const parsed = JSON.parse(result);
      console.log('Station services result:', JSON.stringify(parsed, null, 2));
      
      expect(parsed.success).toBe(true);
      expect(parsed.stations).toHaveLength(1);
      
      const station = parsed.stations[0];
      expect(station.station_id).toBe(60003760);
      expect(station.name).toBeDefined();
      expect(station.services).toBeDefined();
      expect(Array.isArray(station.services)).toBe(true);
      expect(station.docking_info).toBeDefined();
      expect(station.reprocessing_info).toBeDefined();
    }, timeout);

    it('should handle invalid station ID gracefully', async () => {
      const result = await getStationServicesTool.execute({
        stations: [99999999], // Invalid station ID
        includeSystemInfo: false
      });

      const parsed = JSON.parse(result);
      console.log('Invalid station result:', JSON.stringify(parsed, null, 2));
      
      expect(parsed.success).toBe(false);
      expect(parsed.errors).toBeDefined();
      expect(parsed.errors.length).toBeGreaterThan(0);
    }, timeout);

    it('should get stations in a system by ID', async () => {
      const result = await getSystemStationsTool.execute({
        systems: [30000142] // Jita system ID
      });

      const parsed = JSON.parse(result);
      console.log('System stations result:', JSON.stringify(parsed, null, 2));
      
      expect(parsed.success).toBe(true);
      expect(parsed.systems).toHaveLength(1);
      
      const system = parsed.systems[0];
      expect(system.system_id).toBe(30000142);
      expect(system.system_name).toBe('Jita');
      expect(system.stations).toBeDefined();
      expect(Array.isArray(system.stations)).toBe(true);
      
      if (system.stations.length > 0) {
        const station = system.stations[0];
        expect(station.station_id).toBeDefined();
        expect(station.name).toBeDefined();
        expect(station.services).toBeDefined();
      }
    }, timeout);

    it('should find stations with market service in specific systems', async () => {
      const result = await findStationsWithServicesTool.execute({
        requiredServices: ['market'],
        searchArea: {
          systems: [30000142] // Jita system ID
        },
        limit: 5
      });

      const parsed = JSON.parse(result);
      console.log('Find stations result:', JSON.stringify(parsed, null, 2));
      
      if (parsed.success) {
        expect(parsed.stations).toBeDefined();
        expect(Array.isArray(parsed.stations)).toBe(true);
        
        // If stations are found, they should have market service
        for (const station of parsed.stations) {
          const hasMarket = station.services.some(s => 
            s.service_key === 'market' || s.service_name.toLowerCase().includes('market')
          );
          expect(hasMarket).toBe(true);
        }
      } else {
        // It's okay if no stations are found, just check the structure
        expect(parsed.message).toBeDefined();
        expect(parsed.stations).toBeDefined();
      }
    }, timeout);

    it('should handle empty required services', async () => {
      const result = await findStationsWithServicesTool.execute({
        requiredServices: [],
        searchArea: {
          systems: [30000142]
        }
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.message).toContain('required service');
    }, timeout);

    it('should handle non-existent system', async () => {
      const result = await getSystemStationsTool.execute({
        systems: [99999999] // Invalid system ID
      });

      const parsed = JSON.parse(result);
      console.log('Invalid system result:', JSON.stringify(parsed, null, 2));
      
      expect(parsed.success).toBe(false);
      expect(parsed.errors).toBeDefined();
    }, timeout);
  });

  describe('Service filtering tests', () => {
    it('should filter stations by service correctly', async () => {
      const result = await getSystemStationsTool.execute({
        systems: [30000142], // Jita
        serviceFilter: ['market']
      });

      const parsed = JSON.parse(result);
      
      if (parsed.success && parsed.systems[0].stations.length > 0) {
        // All returned stations should have market service
        for (const station of parsed.systems[0].stations) {
          const hasMarket = station.services.some(s => 
            s.service_key === 'market' || s.service_name.toLowerCase().includes('market')
          );
          expect(hasMarket).toBe(true);
        }
      }
    }, timeout);
  });

  describe('Error handling tests', () => {
    it('should handle too many stations', async () => {
      const manyStations = Array.from({ length: 51 }, (_, i) => i + 60000000);
      
      const result = await getStationServicesTool.execute({
        stations: manyStations
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.message).toContain('Maximum 50 stations');
    }, timeout);

    it('should handle too many systems', async () => {
      const manySystems = Array.from({ length: 21 }, (_, i) => i + 30000000);
      
      const result = await getSystemStationsTool.execute({
        systems: manySystems
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.message).toContain('Maximum 20 systems');
    }, timeout);

    it('should handle limit validation', async () => {
      const result = await findStationsWithServicesTool.execute({
        requiredServices: ['market'],
        searchArea: {
          systems: [30000142]
        },
        limit: 150 // Over the limit
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.message).toContain('Maximum limit is 100');
    }, timeout);
  });
});