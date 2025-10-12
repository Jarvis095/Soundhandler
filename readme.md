# FiveM 3D Sound Handler

A powerful 3D spatial audio system for FiveM servers with web-based audio processing and TypeScript architecture.

## Overview

This resource provides immersive 3D spatial audio capabilities using Web Audio API for FiveM servers. It supports positional audio, entity attachment, real-time audio filters, and advanced sound management with both stationary zones and entity-attached sounds.

### Key Features

- **🎵 3D Spatial Audio**: Real-time positional audio with distance-based volume, panning, and occlusion
- **🎯 Entity Attachment**: Attach sounds to vehicles, players, or any game entity with automatic tracking
- **🌍 Ox_lib Zone Support**: Static sound zones with automatic proximity detection and enter/exit events
- **🎵 Multi-Point DJ System**: Synchronized playback across multiple speakers for club/venue setups
- **🔧 Real-time Controls**: Dynamic volume, distance, loop, and filter adjustments during playback
- **🎛️ Audio Filters**: Support for biquad filters and convolver-based audio effects
- **⚡ Performance Optimized**: Efficient zone management and audio processing with automatic cleanup
- **🌐 Web Audio API**: Leverages modern browser audio capabilities for high-quality sound
- **📡 Streamer Mode**: Built-in support for content creator friendly audio

## Architecture

### Components

1. **Server Side (TypeScript)**
   - `SounityServerAPI`: Main server exports and sound management
   - Sound scheduling and automatic cleanup
   - Global state synchronization
   - Audio metadata processing

2. **Client Side (TypeScript)**
   - `SounityClient`: Client-side sound management and zone handling
   - `SounityClientAPI`: NUI communication and entity tracking
   - Zone-based proximity detection using ox_lib

3. **Web Interface (TypeScript)**
   - `SounityController`: Audio context and node management
   - `SounitySoundNode`: Individual sound processing and 3D positioning
   - `SounityOutputNode`: Master audio output and filtering

## Installation

### Prerequisites

- **ox_lib** - Required for zone management
- **Node.js 16+** - For building TypeScript
- **PNPM** - Package manager (recommended)

### Setup Steps

1. **Download and Install**
   ```bash
   git clone <repository-url> soundhandler
   cd soundhandler
   ```

2. **Install Dependencies**
   ```bash
   # Install main dependencies
   cd resources
   pnpm install
   
   # Install web dependencies
   cd ../web
   pnpm install
   ```

3. **Build the Resource**
   ```bash
   # From resources directory
   pnpm run build
   
   # For development with hot reload
   pnpm run dev
   ```

4. **Configuration**
   - Edit `config.json` for default audio settings
   - Add to your `server.cfg`:
     ```
     ensure ox_lib
     ensure soundhandler
     ```

## Configuration

### Default Settings (`config.json`)

```json
{
    "stream_max_range": 30,        // Maximum streaming range
    "volume": 1,                   // Default volume (0-1)
    "outputType": "sfx",           // "sfx" or "music"
    "loop": false,                 // Default loop setting
    "posX": 0, "posY": 0, "posZ": 0,  // Default position
    "rotX": 0, "rotY": 0, "rotZ": 0,  // Default rotation
    "panningModel": "HRTF",        // Audio panning model
    "distanceModel": "inverse",     // Distance attenuation model
    "maxDistance": 500,            // Maximum audible distance
    "refDistance": 3,              // Reference distance for volume
    "rolloffFactor": 1,            // Distance rolloff factor
    "coneInnerAngle": 360,         // Audio cone inner angle
    "coneOuterAngle": 360,         // Audio cone outer angle
    "coneOuterGain": 0             // Volume outside cone
}
```

## API Reference

### Server Exports

#### `CreateSound(url, options)`
Creates a new positional sound at specified coordinates.

```ts
RegisterCommand('test1', function(source, args, raw)
    local coords = GetEntityCoords(GetPlayerPed(source))
    local time = GetGameTimer()
    local soundId = exports['summit_soundhandler']:StartSound(
        "https://cdn.jsdelivr.net/gh/Jarvis095/APIFILES@main/testMusic.mp3", json.encode({
            posX = 191.76,
            posY = -860.97,
            posZ = 31.43,
            maxRange = 5.0,
            loop = true,
        }), time, 0.1);

    soundIdX = soundId;

    print('Sound ID:', json.encode(soundId))
    print('Sound ID X:', json.encode(soundIdX))
end)

RegisterCommand('test2', function(source, args, raw)
    local ped = GetPlayerPed(source);
    local pedId = NetworkGetNetworkIdFromEntity(ped);
    local res = exports['summit_soundhandler']:StartAttachSound("https://cdn.jsdelivr.net/gh/Jarvis095/APIFILES@main/testMusic.mp3", pedId, 5.0, GetGameTimer(), true, 0.1);
    print('Sound ID:', json.encode(res))
end)
```

#### `StopSound(soundId)`
Stops playback of a sound (can be resumed).

```lua
exports['soundhandler']:StopSound(soundId)
```

#### `ChangeVolume(soundId, volume)`
Dynamically changes sound volume.

```lua
exports['soundhandler']:ChangeVolume(soundId, 0.5)  -- 50% volume
```

#### `ChangeRefDistance(soundId, distance)`
Adjusts the reference distance for volume falloff.

```lua
exports['soundhandler']:ChangeRefDistance(soundId, 5.0)
```

#### `ChangeLoop(soundId, loop)`
Toggles loop mode for a sound.

```lua
exports['soundhandler']:ChangeLoop(soundId, true)  -- Enable loop
```

### Client Exports

#### `StreamerMode(enabled)`
Enables/disables streamer-safe mode (mutes copyrighted content).

```lua
-- Client side
exports['soundhandler']:StreamerMode(true)  -- Enable streamer mode
```

## Technical Improvements

### Sound Cleanup System
The sound handler now features robust cleanup mechanisms to prevent memory leaks and resource buildup:

```typescript
// Automatic cleanup when sounds end naturally
protected async scheduleSoundEnd(identifier: string, source: string, loop: boolean): Promise<void> {
    if (loop) return;
    
    const duration = await this.getSoundLength(source);
    this.timers[identifier] = setTimeout(() => {
        emitNet('summit_soundhandler:soundEnded', -1, identifier);
        delete this.timers[identifier]; // Clean up timer reference
    }, duration * 1000);
}

// Manual cleanup when sounds are stopped
public StopSound(identifier: string): void {
    if (this.timers[identifier]) {
        clearTimeout(this.timers[identifier]);
        delete this.timers[identifier]; // Prevent memory leaks
    }
    emitNet('summit_soundhandler:stopSound', -1, identifier);
}
```

### GlobalState Synchronization
Using FiveM's GlobalState system for improved network performance:

```typescript
// Server-side: Set global state for sound synchronization
GlobalState.set('summit_soundhandler', JSON.stringify(optionsS), true);
GlobalState.set('summit_soundhandler_entity', JSON.stringify(optionsSa), true);

// Client-side: Automatically synced via GlobalState
// No more manual event triggering required
```

### Player Load Sync System
Ensures all players receive consistent audio state:

```typescript
// Auto-sync on player join (works with QBCore, ESX, etc.)
onNet("QBCore:Server:PlayerLoaded", async (data: any) => {
    const source = data.PlayerData.source;
    
    // Sync all active zonal sounds
    Object.values(zonalSound).forEach((sound: any) => {
        triggerClientCallback('summit_soundhandler:client:syncZonalSound', source, JSON.stringify(sound));
    });
    
    // Sync all active entity sounds
    Object.values(entitySound).forEach((sound: any) => {
        triggerClientCallback('summit_soundhandler:client:syncZonalSoundEntity', source, JSON.stringify(sound));
    });
});
```

## Enhanced Usage Examples

### Entity Attachment System

```lua
-- Attach sound to a vehicle (follows movement and rotation)
RegisterCommand('attachcar', function(source, args)
    local playerPed = GetPlayerPed(source)
    local vehicle = GetVehiclePedIsIn(playerPed, false)
    
    if vehicle ~= 0 then
        local netId = NetworkGetNetworkIdFromEntity(vehicle)
        local soundId = exports['soundhandler']:StartAttachSound(
            "https://cdn.example.com/engine-sound.mp3",
            netId,
            25.0,  -- maxRange
            GetGameTimer(),
            true,  -- loop
            0.6    -- volume
        )
        print('Attached sound to vehicle:', soundId)
    else
        print('Player must be in a vehicle')
    end
end)

-- Attach sound to player for proximity voice effects
RegisterCommand('attachvoice', function(source, args)
    local targetId = tonumber(args[1])
    if targetId then
        local targetPed = GetPlayerPed(targetId)
        local netId = NetworkGetNetworkIdFromEntity(targetPed)
        
        local soundId = exports['soundhandler']:StartAttachSound(
            "https://cdn.example.com/radio-static.mp3",
            netId,
            10.0,
            GetGameTimer(),
            true,
            0.3
        )
        print('Radio static attached to player:', targetId)
    end
end)
```

### Multi-Point DJ System

```lua
-- Create synchronized DJ system with multiple speakers
local djSystem = {
    speakers = {},
    currentTrack = nil,
    isPlaying = false
}

-- DJ speaker positions around a club
local speakerPositions = {
    {x = 120.0, y = -1280.0, z = 29.0},  -- Main stage left
    {x = 140.0, y = -1280.0, z = 29.0},  -- Main stage right
    {x = 130.0, y = -1300.0, z = 29.0},  -- Dance floor center
    {x = 110.0, y = -1290.0, z = 29.0},  -- Bar area
    {x = 150.0, y = -1290.0, z = 29.0}   -- VIP section
}

RegisterCommand('djplay', function(source, args)
    if djSystem.isPlaying then
        print('DJ system already playing. Use djstop first.')
        return
    end
    
    local trackUrl = args[1] or "https://cdn.example.com/club-track.mp3"
    local volume = tonumber(args[2]) or 0.8
    local syncTime = GetGameTimer()
    
    -- Create synchronized sounds at each speaker location
    for i, pos in ipairs(speakerPositions) do
        local soundId = exports['soundhandler']:StartSound(
            trackUrl,
            json.encode({
                posX = pos.x,
                posY = pos.y,
                posZ = pos.z,
                maxRange = 30.0,
                loop = true
            }),
            syncTime,  -- Same start time for perfect sync
            volume
        )
        
        djSystem.speakers[i] = soundId
        print(('Speaker %d created at %.1f, %.1f, %.1f'):format(i, pos.x, pos.y, pos.z))
    end
    
    djSystem.currentTrack = trackUrl
    djSystem.isPlaying = true
    print('DJ system started with', #djSystem.speakers, 'speakers')
end)

RegisterCommand('djvolume', function(source, args)
    if not djSystem.isPlaying then
        print('DJ system not playing')
        return
    end
    
    local newVolume = tonumber(args[1]) or 0.5
    
    -- Update volume on all speakers simultaneously
    for i, soundId in ipairs(djSystem.speakers) do
        exports['soundhandler']:ChangeVolume(soundId, newVolume)
    end
    
    print('DJ system volume set to:', newVolume)
end)

RegisterCommand('djstop', function(source, args)
    -- Stop all speakers
    for i, soundId in ipairs(djSystem.speakers) do
        exports['soundhandler']:StopSound(soundId)
    end
    
    djSystem.speakers = {}
    djSystem.isPlaying = false
    print('DJ system stopped')
end)
```

### Ox_lib Zone-Based Audio

```lua
-- Create persistent audio zones using ox_lib
local audioZones = {}

RegisterCommand('createzone', function(source, args)
    local playerPed = GetPlayerPed(source)
    local coords = GetEntityCoords(playerPed)
    local zoneName = args[1] or 'AudioZone_' .. math.random(1000, 9999)
    local audioUrl = args[2] or "https://cdn.example.com/ambient.mp3"
    local range = tonumber(args[3]) or 15.0
    
    -- Create the sound first
    local soundId = exports['soundhandler']:StartSound(
        audioUrl,
        json.encode({
            posX = coords.x,
            posY = coords.y,
            posZ = coords.z,
            maxRange = range,
            loop = true
        }),
        GetGameTimer(),
        0.5
    )
    
    audioZones[zoneName] = {
        soundId = soundId,
        coords = coords,
        range = range,
        players = {}
    }
    
    print(('Audio zone "%s" created at %.1f, %.1f, %.1f'):format(zoneName, coords.x, coords.y, coords.z))
end)

-- Dynamic volume based on proximity within zone
CreateThread(function()
    while true do
        for zoneName, zone in pairs(audioZones) do
            for playerId, _ in pairs(zone.players) do
                if GetPlayerPed(playerId) ~= 0 then
                    local playerCoords = GetEntityCoords(GetPlayerPed(playerId))
                    local distance = #(playerCoords - zone.coords)
                    
                    if distance <= zone.range then
                        -- Calculate volume based on distance (closer = louder)
                        local volume = 1.0 - (distance / zone.range)
                        volume = math.max(0.1, volume) -- Minimum volume
                        
                        -- This would need to be implemented as a per-player volume system
                        -- For now, it adjusts global volume
                        exports['soundhandler']:ChangeVolume(zone.soundId, volume)
                    else
                        -- Player left zone
                        zone.players[playerId] = nil
                    end
                else
                    -- Player disconnected
                    zone.players[playerId] = nil
                end
            end
        end
        Wait(1000) -- Check every second
    end
end)
```

### Building from Source

```bash
# Development mode with hot reload
cd resources
pnpm run dev

# Production build
pnpm run build

# Build web interface
cd ../web
pnpm run build
```

### Project Structure

```
soundhandler/
├── resources/
│   ├── game/
│   │   ├── client/          # Client TypeScript
│   │   ├── server/          # Server TypeScript
│   │   └── shared/          # Shared utilities
│   ├── scripts/             # Build scripts
│   └── types/               # Type definitions
├── web/
│   ├── src/
│   │   ├── nodes/           # Audio processing nodes
│   │   ├── helper/          # Utility classes
│   │   └── classes/         # Core audio classes
│   └── dist/                # Built web assets
├── build/                   # Compiled Lua/JS output
├── config.json              # Configuration
└── fxmanifest.lua          # Resource manifest

## Performance Considerations

- **Audio File Format**: Use MP3 for best compatibility and file size
- **Streaming**: Large audio files are streamed, not downloaded entirely
- **Zone Management**: Uses ox_lib zones for efficient proximity detection
- **Resource Cleanup**: Always dispose of unused sounds to free memory
- **Range Limits**: Keep maxRange reasonable (< 100 units) for performance

## Credits

- **Original Concept**: Based on [Sounity](https://github.com/araynimax/sounity) by araynimax
- **FiveM Integration**: Adapted and enhanced for FiveM server environments
- **Web Audio**: Utilizes modern Web Audio API for high-quality 3D audio processing

## License

This project is open source. See LICENSE file for details.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Test thoroughly
5. Submit a pull request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code style and naming conventions
- Add JSDoc comments for public APIs
- Include examples in documentation
- Test with multiple audio sources and scenarios

```
## Changelog
```
### Version 2.0.0 - Latest
**Major Features & Enhancements:**

#### 🎯 Entity Attachment System
- **Dynamic Sound Following**: Attach sounds to any game entity (vehicles, players, objects)
- **Automatic Tracking**: Sounds automatically follow entity movement and rotation
- **Network Synchronization**: Proper handling of networked entities across clients
- **Detachment Support**: Seamlessly detach sounds while maintaining position

#### 🌍 Ox_lib Zonal Support
- **Static Sound Zones**: Create persistent audio zones using ox_lib's zone system
- **Proximity Detection**: Automatic enter/exit detection with configurable ranges
- **Performance Optimized**: Efficient zone management without constant distance checks
- **Debug Visualization**: Optional zone boundary visualization for development

#### 🎵 Multi-Point DJ System
- **Synchronized Playback**: Multiple sound sources playing the same audio in perfect sync
- **DJ Setup Support**: Ideal for club environments with multiple speakers
- **Coordinated Controls**: Control all synchronized sounds as a single unit
- **Spatial Distribution**: Position multiple speakers around a venue for immersive audio

#### 🔧 Enhanced Audio Controls
- **Real-time Volume Control**: Dynamic volume adjustment during playback
- **Distance Reference Tuning**: Adjustable reference distance for volume falloff
- **Loop Toggle**: Runtime loop mode switching
- **Filter System**: Audio filters for atmospheric effects

#### 🚀 Performance & Stability
- **Fixed Sound Cleanup**: Proper resource disposal with automatic timer cleanup and memory management
- **GlobalState Synchronization**: Migrated from direct events to GlobalState for better network performance
- **Player Load Sync**: Automatic synchronization of all active sounds when players join the server
- **TypeScript Architecture**: Fully typed codebase for better maintainability
- **Memory Management**: Comprehensive cleanup system prevents memory leaks and resource buildup
- **Error Handling**: Robust error handling and recovery mechanisms
- **Streaming Optimization**: Efficient audio streaming for large files

#### 🔧 Technical Improvements
- **Fixed Sound Cleanup**: Resolved memory leaks and resource disposal issues
  - Automatic timer cleanup when sounds end or are stopped
  - Proper resource deallocation for disposed sounds
  - Prevention of orphaned audio processes
- **GlobalState Migration**: Improved network efficiency
  - Shifted from direct client events to GlobalState system
  - Reduced network overhead and improved synchronization
  - Better handling of client disconnections and reconnections
- **Player Load Synchronization**: Seamless player experience
  - Automatic sync of all active sounds when players join
  - No more missing audio for late-joining players
  - Consistent audio state across all connected clients

#### 🎮 Developer Experience
- **Rich API**: Comprehensive export system with detailed documentation
- **Type Safety**: Full TypeScript support with proper interfaces
- **Hot Reload**: Development mode with instant rebuilding
- **Debug Tools**: Built-in debugging and logging capabilities

### Version 1.0.0
- Initial release with basic 3D positional audio
- MP3 file support
- Basic server-side exports
- Simple coordinate-based positioning

---


For support and updates, visit the [GitHub repository](https://github.com/Jarvis095/Soundhandler).
