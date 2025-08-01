import { describe, it, expect } from "vitest";
import { calculateRouteTool, findSystemsInRangeTool } from "./route-tools.js";

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

// Test for findSystemsInRangeTool
describe("findSystemsInRangeTool (integration)", () => {
  it("should find systems within 2 jumps of Jita", async () => {
    // Arrange
    const args = {
      origin: "Jita",
      maxJumps: 2,
    };

    // Act
    const result = await findSystemsInRangeTool.execute(args);
    const parsedResult = JSON.parse(result);

    // Assert
    expect(parsedResult.success).toBe(true);
    expect(parsedResult.message).toContain("systems within 2 jumps of Jita");
    expect(parsedResult.systems).toBeInstanceOf(Array);
    expect(parsedResult.summary.origin).toBe("Jita");
    expect(parsedResult.summary.max_jumps).toBe(2);
    expect(parsedResult.summary.systems_found).toBe(parsedResult.systems.length);
    expect(parsedResult.summary.systems_processed).toBeGreaterThan(0);
    
    // Check that all systems are within the specified range
    parsedResult.systems.forEach((system: any) => {
      expect(system.jumps).toBeGreaterThanOrEqual(1);
      expect(system.jumps).toBeLessThanOrEqual(2);
      expect(system.id).toBeDefined();
      expect(system.name).toBeDefined();
    });
    
    // Verify that we're now processing systems using graph traversal
    console.log(`Systems processed: ${parsedResult.summary.systems_processed}, Systems found: ${parsedResult.summary.systems_found}`);
  }, 60000); // 60 second timeout for this test

  it("should find systems within 1 jump of Amarr", async () => {
    // Arrange
    const args = {
      origin: "Amarr",
      maxJumps: 1,
    };

    // Act
    const result = await findSystemsInRangeTool.execute(args);
    const parsedResult = JSON.parse(result);

    // Assert
    expect(parsedResult.success).toBe(true);
    expect(parsedResult.systems).toBeInstanceOf(Array);
    expect(parsedResult.summary.max_jumps).toBe(1);
    
    // All systems should be exactly 1 jump away
    parsedResult.systems.forEach((system: any) => {
      expect(system.jumps).toBe(1);
    });
    
    console.log(`Systems processed: ${parsedResult.summary.systems_processed}, Systems found: ${parsedResult.summary.systems_found}`);
  }, 60000);

  it("should return an error for invalid origin system", async () => {
    // Arrange
    const args = {
      origin: "InvalidSystemName789",
      maxJumps: 2,
    };

    // Act
    const result = await findSystemsInRangeTool.execute(args);
    const parsedResult = JSON.parse(result);

    // Assert
    expect(parsedResult.success).toBe(false);
    expect(parsedResult.message).toBe("Origin system 'InvalidSystemName789' not found");
    expect(parsedResult.systems).toEqual([]);
  });

  it("should return an error for invalid maxJumps", async () => {
    // Arrange
    const args = {
      origin: "Jita",
      maxJumps: 15, // Over the limit of 10
    };

    // Act
    const result = await findSystemsInRangeTool.execute(args);
    const parsedResult = JSON.parse(result);

    // Assert
    expect(parsedResult.success).toBe(false);
    expect(parsedResult.message).toBe("Maximum jumps must be between 1 and 10");
    expect(parsedResult.systems).toEqual([]);
  });
});