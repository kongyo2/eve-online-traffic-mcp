/**
 * Tests for Station Services tools
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ESIClient } from './esi-client.js';
import { 
  getStationServicesTool,
  getSystemStationsTool,
  findStationsWithServicesTool
} from './station-services-tools.js';

// Mock ESI Client
vi.mock('./esi-client.js');

const mockESIClient = {
  getStationIds: vi.fn(),
  getSolarSystemIds: vi.fn(),
  getRegionIds: vi.fn(),
  getStationInfo: vi.fn(),
  getSolarSystemInfo: vi.fn(),
  getConstellationInfo: vi.fn(),
  getRegionInfo: vi.fn(),
  getSystemStations: vi.fn(),
  getAllSolarSystemIds: vi.fn(),
  idsToNames: vi.fn(),
} as any;

beforeEach(() => {
  vi.clearAllMocks();
  (ESIClient as any).mockImplementation(() => mockESIClient);
});

describe('Station Services Tools', () => {
  describe('getStationServicesTool', () => {
    it('should get station services by ID', async () => {
      const mockStationInfo = {
        station_id: 60003760,
        name: 'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
        system_id: 30000142,
        type_id: 1531,
        position: { x: 1, y: 2, z: 3 },
        max_dockable_ship_volume: 50000000,
        office_rental_cost: 10000,
        owner: 1000035,
        race_id: 1,
        reprocessing_efficiency: 0.5,
        reprocessing_stations_take: 0.05,
        services: ['market', 'reprocessing-plant', 'repair-facilities', 'cloning']
      };

      const mockSystemInfo = {
        system_id: 30000142,
        name: 'Jita',
        constellation_id: 20000020,
        security_status: 0.946,
        security_class: 'B'
      };

      const mockConstellationInfo = {
        constellation_id: 20000020,
        region_id: 10000002
      };

      const mockNames = [
        { id: 30000142, name: 'Jita' },
        { id: 1531, name: 'Caldari Navy Assembly Plant' },
        { id: 1000035, name: 'Caldari Navy' },
        { id: 1, name: 'Caldari' },
        { id: 10000002, name: 'The Forge' }
      ];

      mockESIClient.getStationInfo.mockResolvedValue(mockStationInfo);
      mockESIClient.getSolarSystemInfo.mockResolvedValue(mockSystemInfo);
      mockESIClient.getConstellationInfo.mockResolvedValue(mockConstellationInfo);
      mockESIClient.idsToNames.mockResolvedValue(mockNames);

      const result = await getStationServicesTool.execute({
        stations: [60003760],
        includeSystemInfo: true
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.stations).toHaveLength(1);
      expect(parsed.stations[0].name).toBe('Jita IV - Moon 4 - Caldari Navy Assembly Plant');
      expect(parsed.stations[0].services).toHaveLength(4);
      expect(parsed.stations[0].services[0].service_name).toBe('Market');
      expect(parsed.stations[0].security_status).toBe(0.946);
    });

    it('should handle station names', async () => {
      const mockStationIds = [{ id: 60003760, name: 'Jita IV - Moon 4 - Caldari Navy Assembly Plant' }];
      
      mockESIClient.getStationIds.mockResolvedValue(mockStationIds);
      mockESIClient.getStationInfo.mockResolvedValue({
        station_id: 60003760,
        name: 'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
        system_id: 30000142,
        type_id: 1531,
        position: { x: 1, y: 2, z: 3 },
        max_dockable_ship_volume: 50000000,
        office_rental_cost: 10000,
        owner: 1000035,
        reprocessing_efficiency: 0.5,
        reprocessing_stations_take: 0.05,
        services: ['market']
      });
      mockESIClient.idsToNames.mockResolvedValue([
        { id: 30000142, name: 'Jita' },
        { id: 1531, name: 'Caldari Navy Assembly Plant' },
        { id: 1000035, name: 'Caldari Navy' }
      ]);

      const result = await getStationServicesTool.execute({
        stations: ['Jita IV - Moon 4 - Caldari Navy Assembly Plant'],
        includeSystemInfo: false
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(mockESIClient.getStationIds).toHaveBeenCalledWith(['Jita IV - Moon 4 - Caldari Navy Assembly Plant']);
    });

    it('should handle empty stations array', async () => {
      const result = await getStationServicesTool.execute({
        stations: []
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.message).toBe('At least one station must be provided');
    });

    it('should handle too many stations', async () => {
      const manyStations = Array.from({ length: 51 }, (_, i) => i + 1);
      
      const result = await getStationServicesTool.execute({
        stations: manyStations
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.message).toBe('Maximum 50 stations allowed per request');
    });
  });

  describe('getSystemStationsTool', () => {
    it('should get stations in a system', async () => {
      const mockSystemIds = [{ id: 30000142, name: 'Jita' }];
      const mockSystemInfo = {
        system_id: 30000142,
        name: 'Jita',
        constellation_id: 20000020,
        security_status: 0.946,
        security_class: 'B'
      };
      const mockStations = [{
        station_id: 60003760,
        name: 'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
        system_id: 30000142,
        type_id: 1531,
        position: { x: 1, y: 2, z: 3 },
        max_dockable_ship_volume: 50000000,
        office_rental_cost: 10000,
        owner: 1000035,
        reprocessing_efficiency: 0.5,
        reprocessing_stations_take: 0.05,
        services: ['market', 'reprocessing-plant']
      }];

      mockESIClient.getSolarSystemIds.mockResolvedValue(mockSystemIds);
      mockESIClient.getSolarSystemInfo.mockResolvedValue(mockSystemInfo);
      mockESIClient.getSystemStations.mockResolvedValue(mockStations);
      mockESIClient.getConstellationInfo.mockResolvedValue({ region_id: 10000002 });
      mockESIClient.getRegionInfo.mockResolvedValue({ name: 'The Forge' });
      mockESIClient.idsToNames.mockResolvedValue([
        { id: 1531, name: 'Caldari Navy Assembly Plant' },
        { id: 1000035, name: 'Caldari Navy' }
      ]);

      const result = await getSystemStationsTool.execute({
        systems: ['Jita']
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.systems).toHaveLength(1);
      expect(parsed.systems[0].stations).toHaveLength(1);
      expect(parsed.systems[0].stations[0].name).toBe('Jita IV - Moon 4 - Caldari Navy Assembly Plant');
    });

    it('should filter stations by services', async () => {
      const mockSystemInfo = {
        system_id: 30000142,
        name: 'Jita',
        constellation_id: 20000020,
        security_status: 0.946,
        security_class: 'B'
      };
      const mockStations = [
        {
          station_id: 60003760,
          name: 'Station with Market',
          system_id: 30000142,
          type_id: 1531,
          position: { x: 1, y: 2, z: 3 },
          max_dockable_ship_volume: 50000000,
          office_rental_cost: 10000,
          owner: 1000035,
          reprocessing_efficiency: 0.5,
          reprocessing_stations_take: 0.05,
          services: ['market', 'repair-facilities']
        },
        {
          station_id: 60003761,
          name: 'Station without Market',
          system_id: 30000142,
          type_id: 1531,
          position: { x: 1, y: 2, z: 3 },
          max_dockable_ship_volume: 50000000,
          office_rental_cost: 10000,
          owner: 1000035,
          reprocessing_efficiency: 0.5,
          reprocessing_stations_take: 0.05,
          services: ['repair-facilities', 'cloning']
        }
      ];

      mockESIClient.getSolarSystemInfo.mockResolvedValue(mockSystemInfo);
      mockESIClient.getSystemStations.mockResolvedValue(mockStations);
      mockESIClient.getConstellationInfo.mockResolvedValue({ region_id: 10000002 });
      mockESIClient.getRegionInfo.mockResolvedValue({ name: 'The Forge' });
      mockESIClient.idsToNames.mockResolvedValue([
        { id: 1531, name: 'Test Station Type' },
        { id: 1000035, name: 'Test Owner' }
      ]);

      const result = await getSystemStationsTool.execute({
        systems: [30000142],
        serviceFilter: ['market']
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.systems[0].stations).toHaveLength(1);
      expect(parsed.systems[0].stations[0].name).toBe('Station with Market');
    });
  });

  describe('findStationsWithServicesTool', () => {
    it('should find stations with required services', async () => {
      const mockSystemInfo = {
        system_id: 30000142,
        name: 'Jita',
        constellation_id: 20000020,
        security_status: 0.946,
        security_class: 'B'
      };
      const mockStations = [{
        station_id: 60003760,
        name: 'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
        system_id: 30000142,
        type_id: 1531,
        position: { x: 1, y: 2, z: 3 },
        max_dockable_ship_volume: 50000000,
        office_rental_cost: 10000,
        owner: 1000035,
        reprocessing_efficiency: 0.5,
        reprocessing_stations_take: 0.05,
        services: ['market', 'reprocessing-plant']
      }];

      mockESIClient.getSolarSystemIds.mockResolvedValue([{ id: 30000142, name: 'Jita' }]);
      mockESIClient.getSolarSystemInfo.mockResolvedValue(mockSystemInfo);
      mockESIClient.getSystemStations.mockResolvedValue(mockStations);
      mockESIClient.getConstellationInfo.mockResolvedValue({ region_id: 10000002 });
      mockESIClient.getRegionInfo.mockResolvedValue({ name: 'The Forge' });
      mockESIClient.idsToNames.mockResolvedValue([
        { id: 1531, name: 'Caldari Navy Assembly Plant' },
        { id: 1000035, name: 'Caldari Navy' }
      ]);

      const result = await findStationsWithServicesTool.execute({
        requiredServices: ['market'],
        searchArea: {
          systems: ['Jita']
        }
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.stations).toHaveLength(1);
      expect(parsed.stations[0].name).toBe('Jita IV - Moon 4 - Caldari Navy Assembly Plant');
    });

    it('should apply security filter', async () => {
      const mockSystemInfo = {
        system_id: 30000142,
        name: 'Low Sec System',
        constellation_id: 20000020,
        security_status: 0.3,
        security_class: 'C'
      };

      mockESIClient.getSolarSystemIds.mockResolvedValue([{ id: 30000142, name: 'Low Sec System' }]);
      mockESIClient.getSolarSystemInfo.mockResolvedValue(mockSystemInfo);

      const result = await findStationsWithServicesTool.execute({
        requiredServices: ['market'],
        searchArea: {
          systems: ['Low Sec System']
        },
        securityFilter: {
          minSecurity: 0.5
        }
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.stations).toHaveLength(0);
    });

    it('should handle empty required services', async () => {
      const result = await findStationsWithServicesTool.execute({
        requiredServices: [],
        searchArea: {
          systems: ['Jita']
        }
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.message).toBe('At least one required service must be specified');
    });
  });
});