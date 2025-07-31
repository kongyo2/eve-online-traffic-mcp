import { describe, it, expect, vi, beforeEach } from "vitest";
import { ESIClient } from "./esi-client.js";
// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);
describe("ESIClient", () => {
    let client;
    beforeEach(() => {
        client = new ESIClient();
        mockFetch.mockClear();
    });
    describe("namesToIds", () => {
        it("should convert names to IDs successfully", async () => {
            const mockResponse = {
                systems: [
                    { id: 30000142, name: "Jita" },
                    { id: 30002187, name: "Amarr" }
                ]
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });
            const result = await client.namesToIds(["Jita", "Amarr"]);
            expect(mockFetch).toHaveBeenCalledWith("https://esi.evetech.net/latest/universe/ids/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "EVE-Traffic-MCP/1.0.0",
                },
                body: JSON.stringify(["Jita", "Amarr"]),
            });
            expect(result).toEqual(mockResponse);
        });
        it("should throw error for empty names array", async () => {
            await expect(client.namesToIds([])).rejects.toThrow("Names array cannot be empty");
        });
        it("should throw error for too many names", async () => {
            const manyNames = Array(501).fill("test");
            await expect(client.namesToIds(manyNames)).rejects.toThrow("Maximum 500 names allowed per request");
        });
        it("should throw error on API failure", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: "Internal Server Error",
            });
            await expect(client.namesToIds(["Jita"])).rejects.toThrow("ESI API error: 500 Internal Server Error");
        });
    });
    describe("getSolarSystemIds", () => {
        it("should return solar system IDs", async () => {
            const mockResponse = {
                systems: [
                    { id: 30000142, name: "Jita" }
                ]
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });
            const result = await client.getSolarSystemIds(["Jita"]);
            expect(result).toEqual([{ id: 30000142, name: "Jita" }]);
        });
        it("should return empty array when no systems found", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({}),
            });
            const result = await client.getSolarSystemIds(["NonExistent"]);
            expect(result).toEqual([]);
        });
    });
});
