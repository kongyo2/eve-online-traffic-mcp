import { describe, it, expect } from "vitest";
import { ESIClient } from "./esi-client.js";
import { SDEClient } from "./sde-client.js";

describe("Region Info Tools", () => {
  const esiClient = new ESIClient();
  const sdeClient = new SDEClient();

  it("should fetch region info from ESI", async () => {
    // Test with The Forge (region ID: 10000002)
    const regionInfo = await esiClient.getRegionInfo(10000002);
    
    expect(regionInfo).toBeDefined();
    expect(regionInfo.region_id).toBe(10000002);
    expect(regionInfo.name).toBe("The Forge");
    expect(regionInfo.constellations).toBeDefined();
    expect(regionInfo.constellations.length).toBeGreaterThan(0);
  });

  it("should fetch region info from SDE", async () => {
    // Test with The Forge (region ID: 10000002)
    const regionInfo = await sdeClient.getRegionInfo(10000002);
    
    expect(regionInfo).toBeDefined();
    expect(regionInfo.regionID).toBe(10000002);
    // SDE may not have constellations field, so we just check if the object exists
  });

  it("should fetch constellation info from ESI", async () => {
    // Test with Kimotoro constellation (constellation ID: 20000020)
    const constellationInfo = await esiClient.getConstellationInfo(20000020);
    
    expect(constellationInfo).toBeDefined();
    expect(constellationInfo.constellation_id).toBe(20000020);
    expect(constellationInfo.name).toBe("Kimotoro");
    expect(constellationInfo.region_id).toBe(10000002); // The Forge
    expect(constellationInfo.systems).toBeDefined();
    expect(constellationInfo.systems.length).toBeGreaterThan(0);
    expect(constellationInfo.systems).toContain(30000142); // Should contain Jita
  });

  it("should fetch constellation info from SDE", async () => {
    // Test with Kimotoro constellation (constellation ID: 20000020)
    const constellationInfo = await sdeClient.getConstellationInfo(20000020);
    
    expect(constellationInfo).toBeDefined();
    expect(constellationInfo.constellationID).toBe(20000020);
    expect(constellationInfo.regionID).toBe(10000002); // The Forge
    // SDE may not have solarSystems field, so we just check if the object exists
  });

  it("should get all region IDs from ESI", async () => {
    const regionIds = await esiClient.getAllRegionIds();
    
    expect(regionIds).toBeDefined();
    expect(Array.isArray(regionIds)).toBe(true);
    expect(regionIds.length).toBeGreaterThan(50); // EVE has many regions
    expect(regionIds).toContain(10000002); // Should contain The Forge
  });

  it("should get all region IDs from SDE", async () => {
    const regionIds = await sdeClient.getAllRegionIds();
    
    expect(regionIds).toBeDefined();
    expect(Array.isArray(regionIds)).toBe(true);
    expect(regionIds.length).toBeGreaterThan(50); // EVE has many regions
    expect(regionIds).toContain(10000002); // Should contain The Forge
  });

  it("should get all constellation IDs from SDE", async () => {
    const constellationIds = await sdeClient.getAllConstellationIds();
    
    expect(constellationIds).toBeDefined();
    expect(Array.isArray(constellationIds)).toBe(true);
    expect(constellationIds.length).toBeGreaterThan(500); // EVE has many constellations
    expect(constellationIds).toContain(20000020); // Should contain Kimotoro
  });

  it("should convert region IDs to names", async () => {
    const ids = [10000002, 10000043]; // The Forge, Domain
    const nameResults = await esiClient.idsToNames(ids);
    
    expect(nameResults).toBeDefined();
    expect(Array.isArray(nameResults)).toBe(true);
    expect(nameResults.length).toBe(2);
    
    const forgeResult = nameResults.find(r => r.id === 10000002);
    const domainResult = nameResults.find(r => r.id === 10000043);
    
    expect(forgeResult).toBeDefined();
    expect(forgeResult?.name).toBe("The Forge");
    expect(forgeResult?.category).toBe("region");
    
    expect(domainResult).toBeDefined();
    expect(domainResult?.name).toBe("Domain");
    expect(domainResult?.category).toBe("region");
  });

  it("should convert constellation IDs to names", async () => {
    const ids = [20000020, 20000001]; // Kimotoro, San Matar
    const nameResults = await esiClient.idsToNames(ids);
    
    expect(nameResults).toBeDefined();
    expect(Array.isArray(nameResults)).toBe(true);
    expect(nameResults.length).toBe(2);
    
    const kimotoroResult = nameResults.find(r => r.id === 20000020);
    const sanMatarResult = nameResults.find(r => r.id === 20000001);
    
    expect(kimotoroResult).toBeDefined();
    expect(kimotoroResult?.name).toBe("Kimotoro");
    expect(kimotoroResult?.category).toBe("constellation");
    
    expect(sanMatarResult).toBeDefined();
    expect(sanMatarResult?.name).toBe("San Matar");
    expect(sanMatarResult?.category).toBe("constellation");
  });
});