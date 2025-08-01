/**
 * Tests for landmark tools
 */

import { describe, it, expect } from "vitest";
import { findNearestLandmarksTool } from "./landmark-tools.js";
import { SDEClient } from "./sde-client.js";

describe("Landmark Tools", () => {
  it("should get landmark count from SDE", async () => {
    const sdeClient = new SDEClient();
    const landmarkIds = await sdeClient.getAllLandmarkIds();
    console.log(`Found ${landmarkIds.length} landmarks in SDE`);
    expect(landmarkIds.length).toBeGreaterThan(0);
  }, 10000);
  it("should find nearest landmarks by system name", async () => {
    const result = await findNearestLandmarksTool.execute({
      system: "Jita",
      limit: 5
    });

    const parsed = JSON.parse(result);
    console.log(`Found ${parsed.landmarks?.length || 0} landmarks near Jita`);
    if (parsed.landmarks && parsed.landmarks.length > 0) {
      console.log("Closest landmark:", parsed.landmarks[0].landmark.name, 
                  "- Jumps:", parsed.landmarks[0].distance.jumps,
                  "- AU:", parsed.landmarks[0].distance.euclidean_distance_au);
    }
    
    expect(parsed.success).toBe(true);
    expect(parsed.landmarks).toBeDefined();
    expect(Array.isArray(parsed.landmarks)).toBe(true);
    expect(parsed.origin).toBeDefined();
    expect(parsed.origin.system_name).toBe("Jita");
  }, 60000); // 60 second timeout for API calls

  it("should find nearest landmarks by system ID", async () => {
    const result = await findNearestLandmarksTool.execute({
      system: 30000142, // Jita system ID
      limit: 3
    });

    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.landmarks).toBeDefined();
    expect(parsed.landmarks.length).toBeLessThanOrEqual(3);
  }, 60000);

  it("should handle invalid system name", async () => {
    const result = await findNearestLandmarksTool.execute({
      system: "NonExistentSystem123"
    });

    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(false);
    expect(parsed.message).toContain("not found");
  });

  it("should respect maxJumps parameter", async () => {
    const result = await findNearestLandmarksTool.execute({
      system: "Jita",
      limit: 10,
      maxJumps: 5
    });

    const parsed = JSON.parse(result);
    if (parsed.success && parsed.landmarks.length > 0) {
      // All returned landmarks should be within maxJumps
      parsed.landmarks.forEach((landmark: any) => {
        if (landmark.distance.jumps !== null) {
          expect(landmark.distance.jumps).toBeLessThanOrEqual(5);
        }
      });
    }
  }, 60000);

  it("should include distance information", async () => {
    const result = await findNearestLandmarksTool.execute({
      system: "Jita",
      limit: 1
    });

    const parsed = JSON.parse(result);
    if (parsed.success && parsed.landmarks.length > 0) {
      const landmark = parsed.landmarks[0];
      expect(landmark.distance).toBeDefined();
      expect(landmark.distance).toHaveProperty('jumps');
      expect(landmark.distance).toHaveProperty('route_available');
      expect(landmark.distance).toHaveProperty('euclidean_distance_au');
    }
  }, 60000);
});