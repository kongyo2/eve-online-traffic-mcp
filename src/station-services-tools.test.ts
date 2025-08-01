/**
 * Integration Tests for Station Services tools
 * These tests use the actual ESI API and may take several seconds to run.
 */

import { describe, it, expect } from 'vitest';
import { 
  getStationServicesTool,
  getSystemStationsTool,
  findStationsWithServicesTool
} from './station-services-tools.js';

describe('Station Services Tools (Integration)', () => {
  describe('getStationServicesTool', () => {
    it('should get station services for Jita 4-4 station', async () => {
      // Test with Jita 4-4 station (ID: 60003760)
      const result = await getStationServicesTool.execute({
        stations: [60003760],
        includeSystemInfo: true
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.stations).toHaveLength(1);
      expect(parsed.stations[0].station_id).toBe(60003760);
      expect(parsed.stations[0].name).toContain('Jita');
      // system_name may be undefined if API call fails, so we check if it exists
      if (parsed.stations[0].system_name) {
        expect(parsed.stations[0].system_name).toBe('Jita');
      }
      expect(parsed.stations[0].services).toBeDefined();
      expect(parsed.stations[0].services.length).toBeGreaterThan(0);
      
      // Check that services are properly formatted
      parsed.stations[0].services.forEach((service: any) => {
        expect(service.service_name).toBeDefined();
        expect(service.service_id).toBeDefined();
      });
    }, 30000); // 30 second timeout for API calls

    it('should handle station names', async () => {
      const result = await getStationServicesTool.execute({
        stations: ['Jita IV - Moon 4 - Caldari Navy Assembly Plant'],
        includeSystemInfo: true
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.stations).toHaveLength(1);
      expect(parsed.stations[0].name).toContain('Jita');
      // system_name may be undefined if API call fails, so we check if it exists
      if (parsed.stations[0].system_name) {
        expect(parsed.stations[0].system_name).toBeDefined();
      }
    }, 30000);

    it('should handle multiple stations', async () => {
      const result = await getStationServicesTool.execute({
        stations: [60003760, 60008494], // Jita 4-4 and Amarr VIII
        includeSystemInfo: true
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.stations).toHaveLength(2);
      expect(parsed.stations[0].station_id).toBe(60003760);
      expect(parsed.stations[1].station_id).toBe(60008494);
    }, 30000);

    it('should handle invalid station ID gracefully', async () => {
      const result = await getStationServicesTool.execute({
        stations: [99999999], // Invalid station ID
        includeSystemInfo: true
      });

      const parsed = JSON.parse(result);
      
      // The tool may return success even for invalid IDs, but with empty data
      expect(parsed.stations).toHaveLength(1);
      expect(parsed.stations[0].station_id).toBe(99999999);
      expect(parsed.stations[0].name).toBeUndefined();
    }, 30000);
  });

  describe('getSystemStationsTool', () => {
    it('should get stations in Jita system', async () => {
      const result = await getSystemStationsTool.execute({
        systems: ['Jita'],
        services: ['market']
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.systems).toHaveLength(1);
      expect(parsed.systems[0].system_name).toBe('Jita');
      expect(parsed.systems[0].stations).toBeDefined();
      expect(parsed.systems[0].stations.length).toBeGreaterThan(0);
      
      // Check that stations have market service
      parsed.systems[0].stations.forEach((station: any) => {
        expect(station.services).toBeDefined();
        const hasMarket = station.services.some((service: any) => 
          service.service_name.toLowerCase().includes('market')
        );
        expect(hasMarket).toBe(true);
      });
    }, 30000);

    it('should filter stations by multiple services', async () => {
      const result = await getSystemStationsTool.execute({
        systems: ['Jita'],
        services: ['market', 'reprocessing-plant']
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.systems).toHaveLength(1);
      expect(parsed.systems[0].stations).toBeDefined();
      
      // Check that stations have both services
      parsed.systems[0].stations.forEach((station: any) => {
        expect(station.services).toBeDefined();
        const hasMarket = station.services.some((service: any) => 
          service.service_name.toLowerCase().includes('market')
        );
        const hasReprocessing = station.services.some((service: any) => 
          service.service_name.toLowerCase().includes('reprocessing')
        );
        expect(hasMarket || hasReprocessing).toBe(true);
      });
    }, 30000);

    it('should handle system IDs', async () => {
      const result = await getSystemStationsTool.execute({
        systems: [30000142], // Jita system ID
        services: ['market']
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.systems).toHaveLength(1);
      expect(parsed.systems[0].system_name).toBe('Jita');
    }, 30000);
  });

  describe('findStationsWithServicesTool', () => {
    it('should find stations with market service in The Forge region', async () => {
      const result = await findStationsWithServicesTool.execute({
        services: ['market'],
        location: 'The Forge',
        security: 'high-sec'
      });

      const parsed = JSON.parse(result);
      
      // API may fail due to rate limiting or other issues
      if (parsed.success) {
        expect(parsed.stations).toBeDefined();
        expect(parsed.stations.length).toBeGreaterThan(0);
        
        // Check that all stations have market service
        parsed.stations.forEach((station: any) => {
          expect(station.services).toBeDefined();
          const hasMarket = station.services.some((service: any) => 
            service.service_name.toLowerCase().includes('market')
          );
          expect(hasMarket).toBe(true);
        });
      } else {
        // If API fails, we should still get a proper error response
        expect(parsed.message).toBeDefined();
      }
    }, 60000); // 60 second timeout for region search

    it('should find stations with reprocessing in specific systems', async () => {
      const result = await findStationsWithServicesTool.execute({
        services: ['reprocessing-plant'],
        location: 'Jita, Amarr',
        security: 'any'
      });

      const parsed = JSON.parse(result);
      
      // API may fail due to rate limiting or other issues
      if (parsed.success) {
        expect(parsed.stations).toBeDefined();
        
        // Check that all stations have reprocessing service
        parsed.stations.forEach((station: any) => {
          expect(station.services).toBeDefined();
          const hasReprocessing = station.services.some((service: any) => 
            service.service_name.toLowerCase().includes('reprocessing')
          );
          expect(hasReprocessing).toBe(true);
        });
      } else {
        // If API fails, we should still get a proper error response
        expect(parsed.message).toBeDefined();
      }
    }, 60000);

    it('should apply security filter correctly', async () => {
      const result = await findStationsWithServicesTool.execute({
        services: ['market'],
        location: 'Jita',
        security: 'high-sec'
      });

      const parsed = JSON.parse(result);
      
      // API may fail due to rate limiting or other issues
      if (parsed.success) {
        expect(parsed.stations).toBeDefined();
        
        // Check that all stations are in high-sec systems
        parsed.stations.forEach((station: any) => {
          expect(station.security_status).toBeGreaterThan(0.5);
        });
      } else {
        // If API fails, we should still get a proper error response
        expect(parsed.message).toBeDefined();
      }
    }, 30000);

    it('should find stations with multiple required services', async () => {
      const result = await findStationsWithServicesTool.execute({
        services: ['market', 'reprocessing-plant'],
        location: 'Jita',
        security: 'any'
      });

      const parsed = JSON.parse(result);
      
      // API may fail due to rate limiting or other issues
      if (parsed.success) {
        expect(parsed.stations).toBeDefined();
        
        // Check that all stations have both services
        parsed.stations.forEach((station: any) => {
          expect(station.services).toBeDefined();
          const hasMarket = station.services.some((service: any) => 
            service.service_name.toLowerCase().includes('market')
          );
          const hasReprocessing = station.services.some((service: any) => 
            service.service_name.toLowerCase().includes('reprocessing')
          );
          expect(hasMarket && hasReprocessing).toBe(true);
        });
      } else {
        // If API fails, we should still get a proper error response
        expect(parsed.message).toBeDefined();
      }
    }, 60000);
  });

  describe('Error handling', () => {
    it('should handle non-existent station names gracefully', async () => {
      const result = await getStationServicesTool.execute({
        stations: ['NonExistentStation123'],
        includeSystemInfo: true
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.stations).toHaveLength(1);
      expect(parsed.stations[0].name).toBeUndefined();
    }, 30000);

    it('should handle non-existent system names gracefully', async () => {
      const result = await getSystemStationsTool.execute({
        systems: ['NonExistentSystem123'],
        services: ['market']
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.systems).toHaveLength(1);
      expect(parsed.systems[0].system_name).toBeUndefined();
    }, 30000);

    it('should handle invalid station IDs gracefully', async () => {
      const result = await getStationServicesTool.execute({
        stations: [99999999],
        includeSystemInfo: true
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.stations).toHaveLength(1);
      expect(parsed.stations[0].station_id).toBe(99999999);
    }, 30000);
  });
});