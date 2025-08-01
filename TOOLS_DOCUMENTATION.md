# EVE Online Traffic MCP - Tools Documentation


## Table of Contents

1. [Name to ID Conversion Tools](#name-to-id-conversion-tools)
2. [System Information Tools](#system-information-tools)
3. [Region Information Tools](#region-information-tools)
4. [Route Calculation Tools](#route-calculation-tools)
5. [Combat Statistics Tools](#combat-statistics-tools)
6. [Station Services Tools](#station-services-tools)
7. [Landmark Tools](#landmark-tools)

---

## Name to ID Conversion Tools

### 1. solar_system_name_to_id

**Description:** Convert EVE Online solar system names to their corresponding IDs using ESI API

**Parameters:**
- `systemNames` (array of strings, required): Array of solar system names to convert to IDs (max 500). Use English proper nouns only (e.g., 'Jita', 'Amarr', 'Dodixie')

**Annotations:**
- Open World Hint: true (interacts with external ESI API)
- Read Only Hint: true (doesn't modify anything)

### 2. station_name_to_id

**Description:** Convert EVE Online station names to their corresponding IDs using ESI API

**Parameters:**
- `stationNames` (array of strings, required): Array of station names to convert to IDs (max 500). Use English proper nouns only (e.g., 'Jita IV - Moon 4 - Caldari Navy Assembly Plant')

**Annotations:**
- Open World Hint: true (interacts with external ESI API)
- Read Only Hint: true (doesn't modify anything)

### 3. region_name_to_id

**Description:** Convert EVE Online region names to their corresponding IDs using ESI API

**Parameters:**
- `regionNames` (array of strings, required): Array of region names to convert to IDs (max 500). Use English proper nouns only (e.g., 'The Forge', 'Domain', 'Sinq Laison')

**Annotations:**
- Open World Hint: true (interacts with external ESI API)
- Read Only Hint: true (doesn't modify anything)

### 4. universal_name_to_id

**Description:** Convert EVE Online entity names (systems, stations, regions, etc.) to their corresponding IDs using ESI API

**Parameters:**
- `names` (array of strings, required): Array of entity names to convert to IDs (max 500). Use English proper nouns only (e.g., 'Jita', 'Caldari State', 'Tritanium')

**Annotations:**
- Open World Hint: true (interacts with external ESI API)
- Read Only Hint: true (doesn't modify anything)

---

## System Information Tools

### 5. solar_system_info

**Description:** Get comprehensive solar system information from both ESI and SDE APIs, including security status, connections, and celestial objects

**Parameters:**
- `systemIds` (array of numbers, required): Array of solar system IDs to get information for (max 100). Use numeric IDs only, not names. Use solar_system_name_to_id tool to convert names to IDs first.

**Annotations:**
- Open World Hint: true (interacts with external APIs)
- Read Only Hint: true (doesn't modify anything)

### 6. stargate_info

**Description:** Get comprehensive stargate information from both ESI and SDE APIs, including connections and positions

**Parameters:**
- `stargateIds` (array of numbers, required): Array of stargate IDs to get information for (max 50). Use numeric IDs only, not names.

**Annotations:**
- Open World Hint: true (interacts with external APIs)
- Read Only Hint: true (doesn't modify anything)

### 7. system_connection_map

**Description:** Get a map of system connections by analyzing stargate data for given solar systems

**Parameters:**
- `systemIds` (array of numbers, required): Array of solar system IDs to generate connection map for (max 50). Use numeric IDs only, not names. Use solar_system_name_to_id tool to convert names to IDs first.

**Annotations:**
- Open World Hint: true (interacts with external APIs)
- Read Only Hint: true (doesn't modify anything)

---

## Region Information Tools

### 8. region_info

**Description:** Get comprehensive region information from both ESI and SDE APIs, including constellations, systems, and boundaries

**Parameters:**
- `regionIds` (array of numbers, required): Array of region IDs to get information for (max 50). Use numeric IDs only, not names. Use region_name_to_id tool to convert names to IDs first.

**Annotations:**
- Open World Hint: true (interacts with external APIs)
- Read Only Hint: true (doesn't modify anything)

### 9. constellation_info

**Description:** Get comprehensive constellation information from both ESI and SDE APIs, including systems and boundaries

**Parameters:**
- `constellationIds` (array of numbers, required): Array of constellation IDs to get information for (max 50). Use numeric IDs only, not names. Use universal_name_to_id tool to convert names to IDs first.

**Annotations:**
- Open World Hint: true (interacts with external APIs)
- Read Only Hint: true (doesn't modify anything)

### 10. region_systems_list

**Description:** Get a comprehensive list of all solar systems in specified regions with their security status and constellation information

**Parameters:**
- `regionIds` (array of numbers, required): Array of region IDs to get system lists for (max 10). Use numeric IDs only, not names. Use region_name_to_id tool to convert names to IDs first.

**Annotations:**
- Open World Hint: true (interacts with external APIs)
- Read Only Hint: true (doesn't modify anything)

---

## Route Calculation Tools

### 11. calculate_route

**Description:** Calculate the shortest route between two EVE Online solar systems using ESI API. Supports system names or IDs.

**Parameters:**
- `origin` (string or number, required): Origin solar system name (English proper noun like 'Jita') or ID
- `destination` (string or number, required): Destination solar system name (English proper noun like 'Amarr') or ID
- `flag` (enum, optional): Route preference: shortest (default), secure (high-sec only), or insecure (low/null-sec allowed)
- `avoidSystems` (array of strings or numbers, optional): Optional array of solar system names (English proper nouns) or IDs to avoid in the route

**Annotations:**
- Open World Hint: true (interacts with external ESI API)
- Read Only Hint: true (doesn't modify anything)

### 12. calculate_multiple_routes

**Description:** Calculate routes from one origin system to multiple destination systems. Useful for finding the best destination or comparing routes.

**Parameters:**
- `origin` (string or number, required): Origin solar system name (English proper noun like 'Jita') or ID
- `destinations` (array of strings or numbers, required): Array of destination solar system names (English proper nouns) or IDs (max 20)
- `flag` (enum, optional): Route preference: shortest (default), secure (high-sec only), or insecure (low/null-sec allowed)
- `avoidSystems` (array of strings or numbers, optional): Optional array of solar system names (English proper nouns) or IDs to avoid in all routes

**Annotations:**
- Open World Hint: true (interacts with external ESI API)
- Read Only Hint: true (doesn't modify anything)

### 13. find_systems_in_range

**Description:** Find all solar systems within a specified jump range from an origin system using efficient graph traversal. Builds a stargate connection graph for accurate results.

**Parameters:**
- `origin` (string or number, required): Origin solar system name (English proper noun like 'Jita') or ID
- `maxJumps` (number, required): Maximum number of jumps to search (1-10)
- `flag` (enum, optional): Route preference: shortest (default), secure (high-sec only), or insecure (low/null-sec allowed)
- `avoidSystems` (array of strings or numbers, optional): Optional array of solar system names (English proper nouns) or IDs to avoid in routes

**Annotations:**
- Open World Hint: true (interacts with external ESI API)
- Read Only Hint: true (doesn't modify anything)

---

## Combat Statistics Tools

### 14. get_system_combat_stats

**Description:** Get raw combat statistics for a solar system by system ID including ESI pod/ship kills (1-hour and 12-hour) and recent killmails from EVE-KILL. Returns unprocessed data without analysis. Requires numeric system ID (use solar_system_name_to_id tool to convert system names to IDs).

**Parameters:**
- `system_id` (number, required): The solar system ID to get combat statistics for. Use numeric ID only, not name. Use solar_system_name_to_id tool to convert names to IDs first.

**Annotations:**
- Open World Hint: true (interacts with external APIs)
- Read Only Hint: true (doesn't modify anything)

---

## Station Services Tools

### 15. get_station_services

**Description:** Get comprehensive station information including available services, docking capabilities, and reprocessing facilities. Supports both station IDs and names.

**Parameters:**
- `stations` (array of strings or numbers, required): Array of station names (English proper nouns like 'Jita IV - Moon 4 - Caldari Navy Assembly Plant') or IDs to get service information for (max 50)
- `includeSystemInfo` (boolean, optional): Whether to include system security status and region information (default: true)
- `includeAgents` (boolean, optional): Whether to include agent information (may be slower) (default: false)

**Annotations:**
- Open World Hint: true (interacts with external ESI API)
- Read Only Hint: true (doesn't modify anything)

### 16. get_system_stations

**Description:** Get all stations in specified solar systems with their available services and facilities information.

**Parameters:**
- `systems` (array of strings or numbers, required): Array of solar system names (English proper nouns like 'Jita', 'Amarr') or IDs to get station information for (max 20)
- `serviceFilter` (array of strings, optional): Optional array of service names or keywords to filter stations by (e.g., ['market', 'reprocessing', 'cloning'])

**Annotations:**
- Open World Hint: true (interacts with external ESI API)
- Read Only Hint: true (doesn't modify anything)

### 17. find_stations_with_services

**Description:** Find stations that offer specific services within specified systems or regions. Useful for finding trading hubs, reprocessing facilities, or other specialized services.

**Parameters:**
- `requiredServices` (array of strings, required): Array of required service names or keywords
- `searchArea` (object, required): Object containing either:
  - `systems` (array of strings or numbers, optional): Systems to search in
  - `regions` (array of strings or numbers, optional): Regions to search in
- `securityFilter` (object, optional): Security filtering options:
  - `minSecurity` (number, optional): Minimum security status
  - `maxSecurity` (number, optional): Maximum security status
- `limit` (number, optional): Maximum number of stations to return (default: 50, max: 100)

**Annotations:**
- Open World Hint: true (interacts with external ESI API)
- Read Only Hint: true (doesn't modify anything)

### 18. get_station_agents

**Description:** Get information about agents located at specific stations, including their types, levels, and specializations

**Parameters:**
- `stations` (array of strings or numbers, required): Array of station names (English proper nouns like 'Jita IV - Moon 4 - Caldari Navy Assembly Plant') or IDs to get agent information for (max 20)
- `includeResearchAgents` (boolean, optional): Whether to identify research agents (may be slower) (default: false)

**Annotations:**
- Open World Hint: true (interacts with external APIs)
- Read Only Hint: true (doesn't modify anything)

---

## Landmark Tools

### 19. find_nearest_landmarks

**Description:** Find the nearest EVE Online landmarks to a specified solar system. Returns landmarks sorted by distance with detailed information including descriptions and positions.

**Parameters:**
- `system` (string or number, required): Solar system name (English proper noun like 'Jita') or ID to search from
- `limit` (number, optional): Maximum number of landmarks to return (1-50, default: 10)
- `maxJumps` (number, optional): Maximum jump distance to search (optional, filters out distant landmarks)

**Annotations:**
- Open World Hint: true (interacts with external APIs)
- Read Only Hint: true (doesn't modify anything)

---

