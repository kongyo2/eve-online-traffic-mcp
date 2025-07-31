import { expect, it, describe } from "vitest";
import { getSystemCombatStatsTool } from "./combat-stats-tools.js";

describe("Combat Stats Tools (Integration)", () => {
  describe("getSystemCombatStats", () => {
    it("should return raw combat statistics for Amarr system", async () => {
      const result = await getSystemCombatStatsTool.execute({ system_id: 30002187 });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.system_id).toBe(30002187);
      expect(parsed.system_name).toBe("Amarr");
      expect(parsed.esi_statistics).toBeDefined();
      expect(parsed.esi_statistics.one_hour).toBeDefined();
      expect(parsed.esi_statistics.twelve_hour).toBeDefined();
      expect(parsed.recent_killmails).toBeDefined();
      expect(Array.isArray(parsed.recent_killmails)).toBe(true);
      
      // Check that numeric values are present
      expect(typeof parsed.esi_statistics.one_hour.pod_kills).toBe('number');
      expect(typeof parsed.esi_statistics.one_hour.ship_kills).toBe('number');
      expect(typeof parsed.esi_statistics.twelve_hour.ship_jumps).toBe('number');
    }, 30000); // 30 second timeout for API calls

    it("should handle invalid system ID gracefully", async () => {
      const result = await getSystemCombatStatsTool.execute({ system_id: 99999999 });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toBeDefined();
      expect(parsed.system_id).toBe(99999999);
    }, 30000);
  });



  describe("ESI Client Integration", () => {
    it("should successfully fetch system kills data", async () => {
      const { ESIClient } = await import("./esi-client.js");
      const client = new ESIClient();
      
      const kills = await client.getSystemKills();
      
      expect(Array.isArray(kills)).toBe(true);
      if (kills.length > 0) {
        const firstKill = kills[0];
        expect(firstKill.system_id).toBeDefined();
        expect(typeof firstKill.npc_kills).toBe('number');
        expect(typeof firstKill.pod_kills).toBe('number');
        expect(typeof firstKill.ship_kills).toBe('number');
      }
    }, 30000);

    it("should successfully fetch system jumps data", async () => {
      const { ESIClient } = await import("./esi-client.js");
      const client = new ESIClient();
      
      const jumps = await client.getSystemJumps();
      
      expect(Array.isArray(jumps)).toBe(true);
      if (jumps.length > 0) {
        const firstJump = jumps[0];
        expect(firstJump.system_id).toBeDefined();
        expect(typeof firstJump.ship_jumps).toBe('number');
      }
    }, 30000);

    it("should successfully fetch killmails for a system", async () => {
      const { ESIClient } = await import("./esi-client.js");
      const client = new ESIClient();
      
      const killmails = await client.getSystemKillmails(30002187, 10); // Amarr, limit 10
      
      expect(Array.isArray(killmails)).toBe(true);
      // Killmails may be empty, so we just check the structure if any exist
      if (killmails.length > 0) {
        const firstKm = killmails[0];
        expect(firstKm.killmail_id).toBeDefined();
        expect(firstKm.kill_time).toBeDefined();
        expect(firstKm.victim).toBeDefined();
      }
    }, 30000);
  });
});