import { describe, it, expect } from "vitest";
import { ESIClient } from "./esi-client.js";
import { SDEClient } from "./sde-client.js";

describe("System Info Tools", () => {
  const esiClient = new ESIClient();
  const sdeClient = new SDEClient();

  it("should fetch solar system info from ESI", async () => {
    // Test with Jita (system ID: 30000142)
    const systemInfo = await esiClient.getSolarSystemInfo(30000142);
    
    expect(systemInfo).toBeDefined();
    expect(systemInfo.system_id).toBe(30000142);
    expect(systemInfo.name).toBe("Jita");
    expect(systemInfo.security_status).toBeGreaterThan(0.4);
    expect(systemInfo.stargates).toBeDefined();
    expect(systemInfo.stations).toBeDefined();
  });

  it("should fetch solar system info from SDE", async () => {
    // Test with Jita (system ID: 30000142)
    const systemInfo = await sdeClient.getSolarSystemInfo(30000142);
    
    expect(systemInfo).toBeDefined();
    expect(systemInfo.solarSystemID).toBe(30000142);
    // SDE doesn't provide solarSystemName directly, only solarSystemNameID
    expect(systemInfo.solarSystemNameID).toBeDefined();
    expect(systemInfo.security).toBeGreaterThan(0.4);
  });

  it("should fetch stargate info from ESI", async () => {
    // First get a system with stargates
    const systemInfo = await esiClient.getSolarSystemInfo(30000142);
    expect(systemInfo.stargates).toBeDefined();
    expect(systemInfo.stargates!.length).toBeGreaterThan(0);

    // Test stargate info
    const stargateInfo = await esiClient.getStargateInfo(systemInfo.stargates![0]);
    
    expect(stargateInfo).toBeDefined();
    expect(stargateInfo.stargate_id).toBe(systemInfo.stargates![0]);
    expect(stargateInfo.system_id).toBe(30000142);
    expect(stargateInfo.destination).toBeDefined();
    expect(stargateInfo.destination.system_id).toBeGreaterThan(0);
  });

  it("should get all solar system IDs from ESI", async () => {
    const systemIds = await esiClient.getAllSolarSystemIds();
    
    expect(systemIds).toBeDefined();
    expect(Array.isArray(systemIds)).toBe(true);
    expect(systemIds.length).toBeGreaterThan(5000); // EVE has thousands of systems
    expect(systemIds).toContain(30000142); // Should contain Jita
  });

  it("should get all solar system IDs from SDE", async () => {
    const systemIds = await sdeClient.getAllSolarSystemIds();
    
    expect(systemIds).toBeDefined();
    expect(Array.isArray(systemIds)).toBe(true);
    expect(systemIds.length).toBeGreaterThan(5000); // EVE has thousands of systems
    expect(systemIds).toContain(30000142); // Should contain Jita
  });

  it("should convert IDs to names", async () => {
    const ids = [30000142, 30002187]; // Jita, Amarr
    const nameResults = await esiClient.idsToNames(ids);
    
    expect(nameResults).toBeDefined();
    expect(Array.isArray(nameResults)).toBe(true);
    expect(nameResults.length).toBe(2);
    
    const jitaResult = nameResults.find(r => r.id === 30000142);
    const amarrResult = nameResults.find(r => r.id === 30002187);
    
    expect(jitaResult).toBeDefined();
    expect(jitaResult?.name).toBe("Jita");
    expect(jitaResult?.category).toBe("solar_system");
    
    expect(amarrResult).toBeDefined();
    expect(amarrResult?.name).toBe("Amarr");
    expect(amarrResult?.category).toBe("solar_system");
  });
});