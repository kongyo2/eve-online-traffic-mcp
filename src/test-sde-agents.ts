/**
 * Test script to explore SDE agent data
 */

import { SDEClient } from './sde-client.js';

const sdeClient = new SDEClient();

async function testAgentData() {
  try {
    console.log('Testing SDE agent data...');
    
    // Get all agent IDs
    console.log('Getting all agent IDs...');
    const agentIds = await sdeClient.getAllAgentIds();
    console.log(`Found ${agentIds.length} agents in SDE`);
    
    // Sample first 10 agents
    const sampleAgents = agentIds.slice(0, 10);
    console.log('Sample agent IDs:', sampleAgents);
    
    // Get detailed info for sample agents
    for (const agentId of sampleAgents) {
      try {
        const agentInfo = await sdeClient.getAgentInfo(agentId);
        console.log(`Agent ${agentId}:`, {
          characterID: agentInfo.characterID,
          agentTypeID: agentInfo.agentTypeID,
          corporationID: agentInfo.corporationID,
          locationID: agentInfo.locationID,
          level: agentInfo.level,
          quality: agentInfo.quality,
          isLocator: agentInfo.isLocator
        });
        
        // Try to get agent type info
        if (agentInfo.agentTypeID) {
          try {
            const agentTypeInfo = await sdeClient.getAgentTypeInfo(agentInfo.agentTypeID);
            console.log(`  Agent type: ${agentTypeInfo.agentType}`);
          } catch (error) {
            console.log(`  Failed to get agent type: ${error}`);
          }
        }
        
        break; // Just test one agent for now
      } catch (error) {
        console.log(`Failed to get agent ${agentId}:`, error);
      }
    }
    
    // Test research agents
    console.log('\nTesting research agents...');
    const researchAgentIds = await sdeClient.getAllResearchAgentIds();
    console.log(`Found ${researchAgentIds.length} research agents`);
    
    if (researchAgentIds.length > 0) {
      const sampleResearchAgent = researchAgentIds[0];
      try {
        const researchAgentInfo = await sdeClient.getResearchAgentInfo(sampleResearchAgent);
        console.log(`Research agent ${sampleResearchAgent}:`, researchAgentInfo);
      } catch (error) {
        console.log(`Failed to get research agent ${sampleResearchAgent}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Error testing agent data:', error);
  }
}

testAgentData();