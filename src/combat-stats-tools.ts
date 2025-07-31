import { z } from "zod";
import { ESIClient } from "./esi-client.js";

const esiClient = new ESIClient();

/**
 * Tool to get raw combat statistics for a solar system
 */
export const getSystemCombatStatsTool = {
  annotations: {
    openWorldHint: true, // This tool interacts with external APIs
    readOnlyHint: true, // This tool doesn't modify anything
    title: "Get System Combat Statistics",
  },
  description: "Get raw combat statistics for a solar system by system ID including ESI pod/ship kills (1-hour and 12-hour) and recent killmails from EVE-KILL. Returns unprocessed data without analysis. Requires numeric system ID (use solar_system_name_to_id tool to convert system names to IDs).",
  execute: async (args: { system_id: number }) => {
    try {
      // Get system name
      const systemInfo = await esiClient.getSolarSystemInfo(args.system_id);
      
      // Get ESI kills data (1-hour statistics)
      const esiKills = await esiClient.getSystemKillsById(args.system_id);
      
      // Get ESI jumps data (12-hour statistics) 
      const esiJumps = await esiClient.getSystemJumpsById(args.system_id);
      
      // Get recent killmails from EVE-KILL
      const killmails = await esiClient.getSystemKillmails(args.system_id, 100);
      
      // Filter only player kills (exclude NPC kills)
      const playerKillmails = killmails.filter(km => !km.is_npc);
      
      return JSON.stringify({
        success: true,
        system_id: args.system_id,
        system_name: systemInfo.name,
        esi_statistics: {
          one_hour: {
            description: "ESI statistics for the current hour",
            pod_kills: esiKills?.pod_kills || 0,
            ship_kills: esiKills?.ship_kills || 0,
            timestamp: new Date().toISOString()
          },
          twelve_hour: {
            description: "ESI statistics for the last 12 hours", 
            ship_jumps: esiJumps?.ship_jumps || 0,
            timestamp: new Date().toISOString()
          }
        },
        recent_killmails: playerKillmails.map(km => ({
          killmail_id: km.killmail_id,
          kill_time: km.kill_time,
          total_value: km.total_value,
          system_security: km.system_security,
          victim: {
            character_id: km.victim.character_id,
            character_name: km.victim.character_name,
            corporation_id: km.victim.corporation_id,
            corporation_name: km.victim.corporation_name,
            alliance_id: km.victim.alliance_id,
            alliance_name: km.victim.alliance_name,
            ship_id: km.victim.ship_id,
            ship_name: km.victim.ship_name
          },
          finalblow: {
            character_id: km.finalblow.character_id,
            character_name: km.finalblow.character_name,
            corporation_id: km.finalblow.corporation_id,
            corporation_name: km.finalblow.corporation_name,
            alliance_id: km.finalblow.alliance_id,
            alliance_name: km.finalblow.alliance_name
          },
          attacker_count: km.attackerCount,
          is_solo_kill: km.is_solo
        }))
      }, null, 2);
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        system_id: args.system_id
      }, null, 2);
    }
  },
  name: "get_system_combat_stats",
  parameters: z.object({
    system_id: z.number().int().positive().describe("The solar system ID to get combat statistics for")
  }),
} as const;