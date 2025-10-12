-- client/main.lua
local zones = {}
local entityZones = {}

-- Function to create a regular zone
local function createZone(zoneData)
    if not zones[zoneData.identifier] then
        local zone = lib.zones.sphere({
            name = zoneData.identifier,
            coords = vector3(zoneData.coords.x, zoneData.coords.y, zoneData.coords.z),
            radius = zoneData.maxRange,
            onEnter = function(self)
                TriggerEvent('sound_handler:custom:enter2', self)
            end,
            onExit = function(self)
                TriggerEvent('sound_handler:custom:leave2', self)
            end,
            debug = false,
        })
        zones[zoneData.identifier] = zone
    end
end

-- Function to create an entity zone
local function createEntityZone(zoneData)
    if not entityZones[zoneData.identifier] then
        local entity = NetworkDoesEntityExistWithNetworkId(zoneData.entity) and NetworkGetEntityFromNetworkId(zoneData.entity) or nil

        entityZones[zoneData.identifier] = {
            entity = entity,
            isNear = false,
            onEnter = function(self)
                TriggerEvent('sound_handler:custom:enter', self)
            end,
            onExit = function(self)
                TriggerEvent('sound_handler:custom:leave', self)
            end,
        }
    end
end

-- Function to remove a regular zone
local function removeZone(identifier)
    if zones[identifier] then
        zones[identifier]:remove()
        zones[identifier] = nil
    end
end

-- Function to remove an entity zone
local function removeEntityZone(identifier)
    if entityZones[identifier] then
        entityZones[identifier] = nil
    end
end

CreateThread(function()
    while true do
        local playerCoords = GetEntityCoords(PlayerPedId())

        for identifier, data in pairs(entityZones) do
            if data.entity and DoesEntityExist(data.entity) then
                local entityCoords = GetEntityCoords(data.entity)
                local distance = #(playerCoords - entityCoords)

                if distance < 5 then
                    if not data.isNear then
                        data.isNear = true
                        data.onEnter({ name = identifier })
                    end
                else
                    if data.isNear then
                        data.isNear = false
                        data.onExit({ name = identifier })
                    end
                end
            else
                data.onExit({ name = identifier })
                entityZones[identifier] = nil
            end
        end

        Wait(100) -- Reduce CPU usage
    end
end)

-- Example: Creating a regular zone
RegisterNetEvent('sound_handler:client:createZones', function(data)
    createZone(data)
end)

-- Example: Creating an entity zone
RegisterNetEvent('sound_handler:client:createEntityZones', function(data)
    createEntityZone(data)
end)

RegisterNetEvent('removecreatedZone:soundhandler', function(identifier)
    removeZone(identifier)
    TriggerServerEvent('sound_handler:server:removeZone', identifier)
end)

RegisterNetEvent('sound_handler:client:removeEntityZone', function(identifier)
    removeEntityZone(identifier)
    TriggerServerEvent('sound_handler:server:removeEntityZone', identifier)
end)