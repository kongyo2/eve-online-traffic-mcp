/**
 * Integration Tests for Name to ID Tools
 * These tests use the actual ESI API and may take several seconds to run.
 */

import { describe, it, expect } from "vitest";
import { 
  solarSystemNameToIdTool,
  stationNameToIdTool,
  regionNameToIdTool,
  universalNameToIdTool
} from "./name-to-id-tools.js";

describe("Name to ID Tools (Integration)", () => {
  describe("solarSystemNameToIdTool", () => {
    it("should convert solar system names to IDs", async () => {
      const result = await solarSystemNameToIdTool.execute({
        systemNames: ["Jita", "Amarr", "Dodixie"]
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.message).toContain("Found 3 solar system(s)");
      expect(parsed.results).toHaveLength(3);

      const jitaResult = parsed.results.find((r: any) => r.name === "Jita");
      const amarrResult = parsed.results.find((r: any) => r.name === "Amarr");
      const dodixieResult = parsed.results.find((r: any) => r.name === "Dodixie");

      expect(jitaResult).toBeDefined();
      expect(jitaResult.id).toBe(30000142);
      expect(jitaResult.type).toBe("solar_system");

      expect(amarrResult).toBeDefined();
      expect(amarrResult.id).toBe(30002187);
      expect(amarrResult.type).toBe("solar_system");

      expect(dodixieResult).toBeDefined();
      expect(dodixieResult.id).toBe(30002659);
      expect(dodixieResult.type).toBe("solar_system");
    }, 30000);

    it("should handle non-existent system names", async () => {
      const result = await solarSystemNameToIdTool.execute({
        systemNames: ["NonExistentSystem123"]
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.message).toContain("No solar systems found");
      expect(parsed.results).toHaveLength(0);
    }, 30000);

    it("should handle mixed valid and invalid names", async () => {
      const result = await solarSystemNameToIdTool.execute({
        systemNames: ["Jita", "NonExistentSystem123", "Amarr"]
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.results).toHaveLength(2); // Only valid systems

      const jitaResult = parsed.results.find((r: any) => r.name === "Jita");
      const amarrResult = parsed.results.find((r: any) => r.name === "Amarr");

      expect(jitaResult).toBeDefined();
      expect(amarrResult).toBeDefined();
    }, 30000);
  });

  describe("stationNameToIdTool", () => {
    it("should convert station names to IDs", async () => {
      const result = await stationNameToIdTool.execute({
        stationNames: [
          "Jita IV - Moon 4 - Caldari Navy Assembly Plant"
        ]
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.message).toContain("Found 1 station(s)");
      expect(parsed.results).toHaveLength(1);

      const jitaStation = parsed.results.find((r: any) => r.name.includes("Jita"));

      expect(jitaStation).toBeDefined();
      expect(jitaStation.id).toBe(60003760);
      expect(jitaStation.type).toBe("station");
    }, 30000);

    it("should handle non-existent station names", async () => {
      const result = await stationNameToIdTool.execute({
        stationNames: ["NonExistentStation123"]
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.message).toContain("No stations found");
      expect(parsed.results).toHaveLength(0);
    }, 30000);
  });

  describe("regionNameToIdTool", () => {
    it("should convert region names to IDs", async () => {
      const result = await regionNameToIdTool.execute({
        regionNames: ["The Forge", "Domain", "Sinq Laison"]
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.message).toContain("Found 3 region(s)");
      expect(parsed.results).toHaveLength(3);

      const forgeResult = parsed.results.find((r: any) => r.name === "The Forge");
      const domainResult = parsed.results.find((r: any) => r.name === "Domain");
      const sinqResult = parsed.results.find((r: any) => r.name === "Sinq Laison");

      expect(forgeResult).toBeDefined();
      expect(forgeResult.id).toBe(10000002);
      expect(forgeResult.type).toBe("region");

      expect(domainResult).toBeDefined();
      expect(domainResult.id).toBe(10000043);
      expect(domainResult.type).toBe("region");

      expect(sinqResult).toBeDefined();
      expect(sinqResult.id).toBe(10000032);
      expect(sinqResult.type).toBe("region");
    }, 30000);

    it("should handle non-existent region names", async () => {
      const result = await regionNameToIdTool.execute({
        regionNames: ["NonExistentRegion123"]
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.message).toContain("No regions found");
      expect(parsed.results).toHaveLength(0);
    }, 30000);
  });

  describe("universalNameToIdTool", () => {
    it("should convert mixed entity types", async () => {
      const result = await universalNameToIdTool.execute({
        names: [
          "Jita", // solar system
          "The Forge", // region
          "Jita IV - Moon 4 - Caldari Navy Assembly Plant", // station
          "Caldari State", // faction
          "Tritanium" // inventory type
        ]
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.message).toContain("Found");
      expect(parsed.results.length).toBeGreaterThan(0);

      // Check that different types are returned
      const types = parsed.results.map((r: any) => r.type);
      expect(types).toContain("solar_system");
      expect(types).toContain("region");
      expect(types).toContain("station");
    }, 30000);

    it("should handle solar systems in universal tool", async () => {
      const result = await universalNameToIdTool.execute({
        names: ["Jita", "Amarr"]
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.results.length).toBeGreaterThan(0);

      const jitaResult = parsed.results.find((r: any) => r.name === "Jita");
      const amarrResult = parsed.results.find((r: any) => r.name === "Amarr");

      expect(jitaResult).toBeDefined();
      expect(jitaResult.type).toBe("solar_system");

      expect(amarrResult).toBeDefined();
      expect(amarrResult.type).toBe("solar_system");
    }, 30000);

    it("should handle stations in universal tool", async () => {
      const result = await universalNameToIdTool.execute({
        names: ["Jita IV - Moon 4 - Caldari Navy Assembly Plant"]
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.results.length).toBeGreaterThan(0);

      const stationResult = parsed.results.find((r: any) => r.name.includes("Jita"));
      expect(stationResult).toBeDefined();
      expect(stationResult.type).toBe("station");
    }, 30000);

    it("should handle regions in universal tool", async () => {
      const result = await universalNameToIdTool.execute({
        names: ["The Forge", "Domain"]
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.results.length).toBeGreaterThan(0);

      const forgeResult = parsed.results.find((r: any) => r.name === "The Forge");
      const domainResult = parsed.results.find((r: any) => r.name === "Domain");

      expect(forgeResult).toBeDefined();
      expect(forgeResult.type).toBe("region");

      expect(domainResult).toBeDefined();
      expect(domainResult.type).toBe("region");
    }, 30000);

    it("should handle non-existent entities", async () => {
      const result = await universalNameToIdTool.execute({
        names: ["NonExistentEntity123", "AnotherNonExistent456"]
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.message).toContain("No entities found");
      expect(parsed.results).toHaveLength(0);
    }, 30000);

    it("should handle mixed valid and invalid entities", async () => {
      const result = await universalNameToIdTool.execute({
        names: ["Jita", "NonExistentEntity123", "Amarr"]
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(true);
      expect(parsed.results.length).toBeGreaterThan(0);

      const jitaResult = parsed.results.find((r: any) => r.name === "Jita");
      const amarrResult = parsed.results.find((r: any) => r.name === "Amarr");

      expect(jitaResult).toBeDefined();
      expect(amarrResult).toBeDefined();
    }, 30000);
  });

  describe("Error handling", () => {
    it("should handle empty arrays", async () => {
      const result = await solarSystemNameToIdTool.execute({
        systemNames: []
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.message).toContain("No solar systems found");
    }, 30000);

    it("should handle large arrays", async () => {
      const manyNames = Array(501).fill("Jita");
      const result = await solarSystemNameToIdTool.execute({
        systemNames: manyNames
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.success).toBe(false);
      expect(parsed.message).toContain("error");
    }, 30000);
  });
}); 