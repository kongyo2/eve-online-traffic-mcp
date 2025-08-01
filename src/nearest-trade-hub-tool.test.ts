import { expect, it, describe } from "vitest";
import { findNearestTradeHubTool } from "./nearest-trade-hub-tool.js";

describe("findNearestTradeHubTool (Integration)", () => {
  const timeout = 30000; // 30秒

  it("should find the nearest trade hub from a system name", async () => {
    const result = await findNearestTradeHubTool.execute({
      origin: "Amarr",
    });
    const parsedResult = JSON.parse(result);

    expect(parsedResult.success).toBe(true);
    expect(parsedResult.nearestHub).toBeDefined();
    expect(parsedResult.nearestHub.hubInfo.name).toBe("Jita IV - Moon 4 - Caldari Navy Assembly Plant");
    expect(parsedResult.nearestHub.distance.jumps).toBe(11);
  }, timeout);

  it("should find the nearest trade hub from a system ID", async () => {
    const result = await findNearestTradeHubTool.execute({
      origin: 30002187, // Amarr
    });
    const parsedResult = JSON.parse(result);

    expect(parsedResult.success).toBe(true);
    expect(parsedResult.nearestHub).toBeDefined();
    expect(parsedResult.nearestHub.hubInfo.name).toBe("Jita IV - Moon 4 - Caldari Navy Assembly Plant");
    expect(parsedResult.nearestHub.distance.jumps).toBe(11);
  }, timeout);

  it("should filter results by maxJumps", async () => {
    const result = await findNearestTradeHubTool.execute({
      origin: "Amarr",
      maxJumps: 8,
    });
    const parsedResult = JSON.parse(result);

    expect(parsedResult.success).toBe(false);
    expect(parsedResult.message).toContain("No trade hubs found within 8 jumps");
  }, timeout);

  it("should return an error for a non-existent system", async () => {
    const result = await findNearestTradeHubTool.execute({
      origin: "NonExistentSystem",
    });
    const parsedResult = JSON.parse(result);

    expect(parsedResult.success).toBe(false);
    expect(parsedResult.message).toContain("Origin system 'NonExistentSystem' not found");
  }, timeout);

  it("should work correctly when origin is a trade hub itself", async () => {
    const result = await findNearestTradeHubTool.execute({
      origin: "Jita",
    });
    const parsedResult = JSON.parse(result);

    expect(parsedResult.success).toBe(true);
    expect(parsedResult.nearestHub).toBeDefined();
    // The nearest hub to Jita should be another primary hub, likely Hek or Rens
    expect(parsedResult.nearestHub.hubInfo.name).not.toBe("Jita IV - Moon 4 - Caldari Navy Assembly Plant");
    expect(parsedResult.nearestHub.distance.jumps).toBeGreaterThan(0);
  }, timeout);
});