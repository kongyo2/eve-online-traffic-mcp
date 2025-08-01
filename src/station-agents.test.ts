/**
 * Simple test for station agent functionality
 */

import { describe, it, expect } from 'vitest';
import { getStationAgentsTool } from './station-services-tools.js';

// Skip these tests in CI or if SKIP_INTEGRATION_TESTS is set
const skipIntegration = process.env.SKIP_INTEGRATION_TESTS === 'true' || process.env.CI === 'true';

describe.skipIf(skipIntegration)('Station Agents - Integration Tests', () => {
  const timeout = 30000;

  it('should get agents for a known station', async () => {
    const result = await getStationAgentsTool.execute({
      stations: [60003760], // Jita IV - Moon 4 - Caldari Navy Assembly Plant
      includeResearchAgents: false
    });

    const parsed = JSON.parse(result);
    console.log('Station agents result:', JSON.stringify(parsed, null, 2));
    
    expect(parsed.success).toBe(true);
    expect(parsed.stations).toHaveLength(1);
    
    const station = parsed.stations[0];
    expect(station.station_id).toBe(60003760);
    expect(station.agents).toBeDefined();
    expect(Array.isArray(station.agents)).toBe(true);
    
    // Log agent information for inspection
    if (station.agents.length > 0) {
      console.log(`Found ${station.agents.length} agents at ${station.station_name}`);
      station.agents.forEach((agent: any) => {
        console.log(`- Agent ${agent.agent_id}: ${agent.agent_name} (${agent.agent_type})`);
      });
    } else {
      console.log('No agents found at this station');
    }
  }, timeout);

  it('should handle invalid station ID gracefully', async () => {
    const result = await getStationAgentsTool.execute({
      stations: [99999999], // Invalid station ID
      includeResearchAgents: false
    });

    const parsed = JSON.parse(result);
    console.log('Invalid station agents result:', JSON.stringify(parsed, null, 2));
    
    // Should either succeed with empty agents or fail gracefully
    expect(parsed).toBeDefined();
    expect(parsed.stations).toBeDefined();
  }, timeout);

  it('should handle empty stations array', async () => {
    const result = await getStationAgentsTool.execute({
      stations: [],
      includeResearchAgents: false
    });

    const parsed = JSON.parse(result);
    
    expect(parsed.success).toBe(false);
    expect(parsed.message).toContain('At least one station must be provided');
  }, timeout);

  it('should handle too many stations', async () => {
    const manyStations = Array.from({ length: 21 }, (_, i) => i + 60000000);
    
    const result = await getStationAgentsTool.execute({
      stations: manyStations,
      includeResearchAgents: false
    });

    const parsed = JSON.parse(result);
    
    expect(parsed.success).toBe(false);
    expect(parsed.message).toContain('Maximum 20 stations');
  }, timeout);
});