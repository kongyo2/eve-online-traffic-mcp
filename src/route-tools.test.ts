import { describe, it, expect } from "vitest";
import { calculateRouteTool } from "./route-tools.js";

// This test uses the actual ESI API and may take a few seconds to run.
// It is intended for integration testing.
describe("calculateRouteTool (integration)", () => {
  it("should calculate a route between Jita and Amarr", async () => {
    // Arrange
    const args = {
      origin: "Jita",
      destination: "Amarr",
    };

    // Act
    const result = await calculateRouteTool.execute(args);
    const parsedResult = JSON.parse(result);

    // Assert
    expect(parsedResult.success).toBe(true);
    expect(parsedResult.message).toContain("jumps from Jita to Amarr");
    expect(parsedResult.route.origin.name).toBe("Jita");
    expect(parsedResult.route.destination.name).toBe("Amarr");
    expect(parsedResult.route.jumps).toBeGreaterThan(0);
    expect(parsedResult.route.route_with_names.length).toBe(parsedResult.route.jumps + 1);
    expect(parsedResult.route.route_with_names[0].name).toBe("Jita");
    expect(parsedResult.route.route_with_names[parsedResult.route.route_with_names.length - 1].name).toBe("Amarr");
  }, 30000); // 30 second timeout for this test

  it("should return an error if origin system is invalid", async () => {
    // Arrange
    const args = {
      origin: "InvalidSystemName123",
      destination: "Amarr",
    };

    // Act
    const result = await calculateRouteTool.execute(args);
    const parsedResult = JSON.parse(result);

    // Assert
    expect(parsedResult.success).toBe(false);
    expect(parsedResult.message).toBe("Origin system 'InvalidSystemName123' not found");
  });

  it("should return an error if destination system is invalid", async () => {
    // Arrange
    const args = {
      origin: "Jita",
      destination: "InvalidSystemName456",
    };

    // Act
    const result = await calculateRouteTool.execute(args);
    const parsedResult = JSON.parse(result);

    // Assert
    expect(parsedResult.success).toBe(false);
    expect(parsedResult.message).toBe("Destination system 'InvalidSystemName456' not found");
  });
});