# EVE Online Traffic MCP Server

[![smithery badge](https://smithery.ai/badge/@kongyo2/eve-online-traffic-mcp)](https://smithery.ai/server/@kongyo2/eve-online-traffic-mcp)

<a href="https://glama.ai/mcp/servers/@kongyo2/eve-online-traffic-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@kongyo2/eve-online-traffic-mcp/badge" alt="eve-online-traffic-mcp MCP server" />
</a>

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/kongyo2/eve-online-traffic-mcp)


> **⚠️ Beta Version Notice**  
> This project is currently in beta development. Features may be incomplete, unstable, or subject to significant changes. Use at your own discretion and expect potential breaking changes in future updates.

A comprehensive Model Context Protocol (MCP) server for EVE Online traffic, navigation, and system information using both the official ESI API and SDE data.

## Features


This MCP server provides comprehensive tools for EVE Online data access:

### Name ↔ ID Conversion
- **Solar System Name to ID**: Convert solar system names to IDs for route calculation
- **Station Name to ID**: Convert station names to IDs for destination planning  
- **Region Name to ID**: Convert region names to IDs for regional analysis
- **Universal Name to ID**: Convert any EVE Online entity names to IDs (systems, stations, regions, corporations, alliances, etc.)

### System Information & Analysis
- **Solar System Info**: Get comprehensive system information from both ESI and SDE APIs
- **Stargate Info**: Get stargate connections and detailed information
- **System Connection Map**: Generate connection maps showing stargate links between systems

### Data Sources
- **ESI API**: Real-time data from the official EVE Online API
- **SDE API**: Static data export for comprehensive universe information
- **Automatic Name Resolution**: All IDs are automatically resolved to names (e.g., "30000142 (Jita)")
- **Data Integration**: Combines ESI and SDE data for maximum information coverage

## API Dependencies

### 1. EVE Swagger Interface (ESI)

**URL**: https://esi.evetech.net/meta/openapi-3.0.json

ESIは、EVE Onlineの公式APIです。プレイヤーデータ、キャラクター情報、コーポレーション情報、マーケットデータなど、ゲーム内の様々な情報にアクセスできます。

### 2. Static Data Export (SDE) - Jita.Space

**URL**: https://sde.jita.space/latest/swagger.json  
**ベースURL**: https://sde.jita.space/latest

SDE（Static Data Export）は、EVE Onlineのゲーム内静的データを提供するサードパーティAPIです。jita.spaceによって提供されており、アイテム情報、星系データ、NPC情報などの静的データにアクセスできます。

### 3. EVE-KILL API

**URL**: https://eve-kill.com/_openapi.json  
**ベースURL**: https://eve-kill.com  

EVE-KILLは、EVE Onlineのキルメール追跡と分析を行うモダンなアプリケーションです。アライアンス、キャラクター、コーポレーション、バトル、キルメール、キャンペーンなどの包括的なデータにアクセスできるAPIを提供しています。

## Installation

### Installing via Smithery

To install eve-online-traffic-mcp for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@kongyo2/eve-online-traffic-mcp):

```bash
npx -y @smithery/cli install @kongyo2/eve-online-traffic-mcp --client claude
```

### Manual Installation
```bash
git clone https://github.com/kongyo2/eve-online-traffic-mcp.git
cd eve-online-traffic-mcp
npm install
```

## Recommended: MCP Sequential Thinking Tools

For enhanced analysis and complex EVE Online queries, we recommend using this server alongside [MCP Sequential Thinking Tools](https://github.com/spences10/mcp-sequentialthinking-tools). This combination allows for sophisticated multi-step analysis of EVE Online data, route planning, and strategic decision-making through structured thinking processes.

## Usage

### Development Mode

Start the server in development mode with interactive CLI:

```bash
npm run dev
```

### Production Mode

Start the server for production use:

```bash
npm run start
```

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

## Usage Notes

### Language Recommendations for LLM Instructions

When providing instructions to LLMs connected to this MCP server, **we recommend using English names for EVE Online entities** (solar systems, stations, regions, corporations, etc.) for optimal results. The server's name resolution system is primarily designed around English entity names, and using English ensures better accuracy and consistency in data retrieval.

**Examples:**
- ✅ Use: "Jita", "Amarr", "The Forge"
- ❌ Avoid: Localized names in other languages

## Available Tools

### Name to ID Conversion Tools

#### `solar_system_name_to_id`
Convert solar system names to their IDs.

**Parameters:**
- `systemNames`: Array of solar system names (max 500)

**Example:**
```json
{
  "systemNames": ["Jita", "Amarr", "Dodixie"]
}
```

#### `station_name_to_id`
Convert station names to their IDs.

**Parameters:**
- `stationNames`: Array of station names (max 500)

#### `region_name_to_id`
Convert region names to their IDs.

**Parameters:**
- `regionNames`: Array of region names (max 500)

#### `universal_name_to_id`
Convert any EVE Online entity names to their IDs.

**Parameters:**
- `names`: Array of entity names (max 500)

**Supported Entity Types:**
- Solar Systems, Stations, Regions, Constellations
- Corporations, Alliances, Characters, Factions
- Inventory Types, Agents

### System Information Tools

#### `solar_system_info`
Get comprehensive solar system information from both ESI and SDE APIs.

**Parameters:**
- `systemIds`: Array of solar system IDs (max 100)

**Returns:**
- System name, security status, security class
- Constellation and region information (with names)
- 3D coordinates, star information
- Stargates, stations, planets with names
- Data source information (ESI/SDE)

**Example:**
```json
{
  "systemIds": [30000142, 30002187]
}
```

#### `stargate_info`
Get detailed stargate information and connections.

**Parameters:**
- `stargateIds`: Array of stargate IDs (max 50)

**Returns:**
- Stargate name and position
- Source and destination system information
- Connection details with names

#### `system_connection_map`
Generate connection maps showing stargate links between systems.

**Parameters:**
- `systemIds`: Array of solar system IDs (max 50)

**Returns:**
- System security status and name
- All outbound connections with stargate pairs
- Destination system names

**Example:**
```json
{
  "systemIds": [30000142]
}
```

### Route Calculation Tools

#### `calculate_route`
Calculate the shortest route between two EVE Online solar systems.

**Parameters:**
- `origin`: Origin solar system name or ID
- `destination`: Destination solar system name or ID
- `flag`: (Optional) `shortest` (default), `secure`, or `insecure`
- `avoidSystems`: (Optional) Array of system names or IDs to avoid

**Example:**
```json
{
 "origin": "Jita",
 "destination": "Amarr",
 "flag": "secure"
}
```

#### `calculate_multiple_routes`
Calculate routes from one origin to multiple destinations.

**Parameters:**
- `origin`: Origin solar system name or ID
- `destinations`: Array of destination system names or IDs (max 20)
- `flag`: (Optional) `shortest` (default), `secure`, or `insecure`
- `avoidSystems`: (Optional) Array of system names or IDs to avoid

**Example:**
```json
{
 "origin": "Jita",
 "destinations": ["Amarr", "Dodixie", "Rens"],
}
```

#### `find_systems_in_range`
Find all solar systems within a specified jump range from an origin system.

**Parameters:**
- `origin`: Origin solar system name or ID
- `maxJumps`: Maximum number of jumps (1-10)
- `flag`: (Optional) `shortest` (default), `secure`, or `insecure`
- `avoidSystems`: (Optional) Array of system names or IDs to avoid

**Example:**
```json
{
 "origin": "Jita",
 "maxJumps": 5
}
```

## Available Prompts

### `eve-entity-lookup`
Generate a summary of EVE Online entities with their IDs.

### `eve-system-analysis`
Analyze solar system information and connections with detailed traffic data.

## Development

### Testing

Run the test suite:

```bash
npm run test
```

### Linting

Check code style and formatting:

```bash
npm run lint
```

### Formatting

Auto-format code:

```bash
npm run format
```

## Example Output

### Solar System Information
```json
{
  "success": true,
  "results": [{
    "system_id": 30000142,
    "name": "Jita",
    "constellation_id": 20000020,
    "constellation_name": "Kimotoro",
    "region_id": 10000002,
    "region_name": "The Forge",
    "security_status": 0.946,
    "security_class": "B",
    "stargates": [
      "50001248 (Stargate (Perimeter))",
      "50001249 (Stargate (Sobaseki))"
    ],
    "stations": [
      "60003760 (Jita IV - Moon 4 - Caldari Navy Assembly Plant)"
    ],
    "source": {
      "esi": true,
      "sde": true
    }
  }]
}
```

### System Connection Map
```json
{
  "success": true,
  "results": [{
    "system_id": 30000142,
    "system_name": "Jita",
    "security_status": 0.946,
    "connections": [{
      "destination_system_id": 30000144,
      "destination_system_name": "Perimeter",
      "stargate_id": 50001248,
      "stargate_name": "Stargate (Perimeter)",
      "destination_stargate_id": 50000056,
      "destination_stargate_name": "Stargate (Jita)"
    }]
  }]
}
```

## API Reference

This server uses multiple EVE Online APIs:

### ESI API Endpoints
- `POST /universe/ids/` - Convert names to IDs
- `POST /universe/names/` - Convert IDs to names
- `GET /universe/systems/` - Get all solar system IDs
- `GET /universe/systems/{system_id}/` - Get solar system information
- `GET /universe/stargates/{stargate_id}/` - Get stargate information

### SDE API Endpoints
- `GET /universe/solarSystems` - Get all solar system IDs
- `GET /universe/solarSystems/{solarSystemID}` - Get solar system information
- `GET /universe/stargates` - Get all stargate IDs
- `GET /universe/stargates/{stargateID}` - Get stargate information

## Features

- **No Authentication Required**: All endpoints use public APIs
- **Automatic Name Resolution**: IDs are automatically resolved to human-readable names
- **Data Integration**: Combines ESI real-time data with SDE static data
- **Error Resilience**: Continues operation even if one API source fails
- **Batch Processing**: Efficient handling of multiple requests
- **Comprehensive Testing**: Full test coverage for all functionality

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run `npm run lint` and `npm run test`
6. Submit a pull request

## Acknowledgments

- [EVE Online ESI API](https://esi.evetech.net/) - Official EVE Online API
- [EVE SDE API](https://sde.jita.space/) - Static Data Export by jita.space
- [FastMCP](https://github.com/punkpeye/fastmcp) - MCP server framework
- [FastMCP Boilerplate](https://github.com/punkpeye/fastmcp-boilerplate) - This project was created using the FastMCP Boilerplate template by Frank Fiegel (frank@glama.ai), licensed under MIT License
- [tuskermanshu/swagger-mcp-server](https://github.com/tuskermanshu/swagger-mcp-server) - Special thanks for the inspiration and foundation for the Swagger/OpenAPI integration in this project.

