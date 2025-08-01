/**
 * Integration Tests for ESI Client
 * These tests use the actual ESI API and may take several seconds to run.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ESIClient } from "./esi-client.js";

describe("ESIClient (Integration)", () => {
  let client: ESIClient;

  beforeEach(() => {
    client = new ESIClient();
  });

  describe("namesToIds", () => {
    it("should convert solar system names to IDs successfully", async () => {
      const result = await client.namesToIds(["Jita", "Amarr"]);

      expect(result).toBeDefined();
      expect(result.systems).toBeDefined();
      expect(Array.isArray(result.systems)).toBe(true);
      expect(result.systems.length).toBe(2);

      const jitaResult = result.systems.find((s: any) => s.name === "Jita");
      const amarrResult = result.systems.find((s: any) => s.name === "Amarr");

      expect(jitaResult).toBeDefined();
      expect(jitaResult?.id).toBe(30000142);
      expect(jitaResult?.category).toBe("solar_system");

      expect(amarrResult).toBeDefined();
      expect(amarrResult?.id).toBe(30002187);
      expect(amarrResult?.category).toBe("solar_system");
    }, 30000);

    it("should convert station names to IDs successfully", async () => {
      const result = await client.namesToIds(["Jita IV - Moon 4 - Caldari Navy Assembly Plant"]);

      expect(result).toBeDefined();
      expect(result.stations).toBeDefined();
      expect(Array.isArray(result.stations)).toBe(true);
      expect(result.stations.length).toBe(1);

      const stationResult = result.stations[0];
      expect(stationResult.name).toBe("Jita IV - Moon 4 - Caldari Navy Assembly Plant");
      expect(stationResult.id).toBe(60003760);
      expect(stationResult.category).toBe("station");
    }, 30000);

    it("should convert region names to IDs successfully", async () => {
      const result = await client.namesToIds(["The Forge", "Domain"]);

      expect(result).toBeDefined();
      expect(result.regions).toBeDefined();
      expect(Array.isArray(result.regions)).toBe(true);
      expect(result.regions.length).toBe(2);

      const forgeResult = result.regions.find((r: any) => r.name === "The Forge");
      const domainResult = result.regions.find((r: any) => r.name === "Domain");

      expect(forgeResult).toBeDefined();
      expect(forgeResult?.id).toBe(10000002);
      expect(forgeResult?.category).toBe("region");

      expect(domainResult).toBeDefined();
      expect(domainResult?.id).toBe(10000043);
      expect(domainResult?.category).toBe("region");
    }, 30000);

    it("should handle mixed entity types", async () => {
      const result = await client.namesToIds(["Jita", "The Forge", "Jita IV - Moon 4 - Caldari Navy Assembly Plant"]);

      expect(result).toBeDefined();
      expect(result.systems).toBeDefined();
      expect(result.regions).toBeDefined();
      expect(result.stations).toBeDefined();

      expect(result.systems.length).toBe(1);
      expect(result.regions.length).toBe(1);
      expect(result.stations.length).toBe(1);
    }, 30000);

    it("should handle non-existent names gracefully", async () => {
      const result = await client.namesToIds(["NonExistentSystem123", "NonExistentRegion456"]);

      expect(result).toBeDefined();
      // Should return empty arrays for non-existent entities
      expect(result.systems).toEqual([]);
      expect(result.regions).toEqual([]);
    }, 30000);

    it("should throw error for empty names array", async () => {
      await expect(client.namesToIds([])).rejects.toThrow("Names array cannot be empty");
    });

    it("should throw error for too many names", async () => {
      const manyNames = Array(501).fill("test");
      await expect(client.namesToIds(manyNames)).rejects.toThrow("Maximum 500 names allowed per request");
    });
  });

  describe("getSolarSystemIds", () => {
    it("should return solar system IDs for valid names", async () => {
      const result = await client.getSolarSystemIds(["Jita", "Amarr", "Dodixie"]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);

      const jitaResult = result.find((s: any) => s.name === "Jita");
      const amarrResult = result.find((s: any) => s.name === "Amarr");
      const dodixieResult = result.find((s: any) => s.name === "Dodixie");

      expect(jitaResult).toBeDefined();
      expect(jitaResult?.id).toBe(30000142);

      expect(amarrResult).toBeDefined();
      expect(amarrResult?.id).toBe(30002187);

      expect(dodixieResult).toBeDefined();
      expect(dodixieResult?.id).toBe(30002659);
    }, 30000);

    it("should return empty array when no systems found", async () => {
      const result = await client.getSolarSystemIds(["NonExistentSystem123"]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    }, 30000);
  });

  describe("getStationIds", () => {
    it("should return station IDs for valid names", async () => {
      const result = await client.getStationIds([
        "Jita IV - Moon 4 - Caldari Navy Assembly Plant",
        "Amarr VIII (Oris) - Emperor Family Academy"
      ]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);

      const jitaStation = result.find((s: any) => s.name.includes("Jita"));
      const amarrStation = result.find((s: any) => s.name.includes("Amarr"));

      expect(jitaStation).toBeDefined();
      expect(jitaStation?.id).toBe(60003760);

      expect(amarrStation).toBeDefined();
      expect(amarrStation?.id).toBe(60008494);
    }, 30000);
  });

  describe("getRegionIds", () => {
    it("should return region IDs for valid names", async () => {
      const result = await client.getRegionIds(["The Forge", "Domain", "Sinq Laison"]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);

      const forgeResult = result.find((r: any) => r.name === "The Forge");
      const domainResult = result.find((r: any) => r.name === "Domain");
      const sinqResult = result.find((r: any) => r.name === "Sinq Laison");

      expect(forgeResult).toBeDefined();
      expect(forgeResult?.id).toBe(10000002);

      expect(domainResult).toBeDefined();
      expect(domainResult?.id).toBe(10000043);

      expect(sinqResult).toBeDefined();
      expect(sinqResult?.id).toBe(10000032);
    }, 30000);
  });

  describe("getSolarSystemInfo", () => {
    it("should return solar system information", async () => {
      const result = await client.getSolarSystemInfo(30000142); // Jita

      expect(result).toBeDefined();
      expect(result.system_id).toBe(30000142);
      expect(result.name).toBe("Jita");
      expect(result.security_status).toBeGreaterThan(0.4);
      expect(result.stargates).toBeDefined();
      expect(result.stations).toBeDefined();
    }, 30000);

    it("should handle invalid system ID gracefully", async () => {
      await expect(client.getSolarSystemInfo(99999999)).rejects.toThrow();
    }, 30000);
  });

  describe("getStargateInfo", () => {
    it("should return stargate information", async () => {
      // First get a system with stargates
      const systemInfo = await client.getSolarSystemInfo(30000142); // Jita
      expect(systemInfo.stargates).toBeDefined();
      expect(systemInfo.stargates!.length).toBeGreaterThan(0);

      const stargateInfo = await client.getStargateInfo(systemInfo.stargates![0]);

      expect(stargateInfo).toBeDefined();
      expect(stargateInfo.stargate_id).toBe(systemInfo.stargates![0]);
      expect(stargateInfo.system_id).toBe(30000142);
      expect(stargateInfo.destination).toBeDefined();
      expect(stargateInfo.destination.system_id).toBeGreaterThan(0);
    }, 30000);
  });

  describe("getSystemKills", () => {
    it("should return system kills data", async () => {
      const result = await client.getSystemKills();

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        const firstKill = result[0];
        expect(firstKill.system_id).toBeDefined();
        expect(typeof firstKill.npc_kills).toBe('number');
        expect(typeof firstKill.pod_kills).toBe('number');
        expect(typeof firstKill.ship_kills).toBe('number');
      }
    }, 30000);
  });

  describe("getSystemJumps", () => {
    it("should return system jumps data", async () => {
      const result = await client.getSystemJumps();

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        const firstJump = result[0];
        expect(firstJump.system_id).toBeDefined();
        expect(typeof firstJump.ship_jumps).toBe('number');
      }
    }, 30000);
  });

  describe("getSystemKillmails", () => {
    it("should return killmails for a system", async () => {
      const result = await client.getSystemKillmails(30002187, 10); // Amarr, limit 10

      expect(Array.isArray(result)).toBe(true);
      // Killmails may be empty, so we just check the structure if any exist
      if (result.length > 0) {
        const firstKm = result[0];
        expect(firstKm.killmail_id).toBeDefined();
        expect(firstKm.kill_time).toBeDefined();
        expect(firstKm.victim).toBeDefined();
      }
    }, 30000);
  });
});