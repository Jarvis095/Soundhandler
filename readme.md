
# FiveM 3D Sounds

This Script is for now capable of using only .mp3 File Extensions. This Only Works From Server Side Using Exports.


Server Exports:
```
local soundIdX = 0

RegisterCommand('test1', function(source, args, raw)
    local coords = GetEntityCoords(GetPlayerPed(source))
    local soundId = exports['soundhandler']:CreateSound(
        "https://cdn.jsdelivr.net/gh/Jarvis095/APIFILES@main/testMusic.mp3",
        json.encode({
            posX = coords.x,
            posY = coords.y,
            posZ = coords.z,
            maxRange = 5.0,
        }));

    soundIdX = soundId;
end)

RegisterCommand('test2', function(source)
    exports['soundhandler']:StartSound(soundIdX);
end)
RegisterCommand('test3', function(source)
    exports['soundhandler']:DisposeSound(soundIdX);
end)

RegisterCommand('test4', function(source, args)
    exports['soundhandler']:StopSound(soundIdX);
end)

RegisterCommand('test5', function(source, args)
    exports['soundhandler']:ChangeRefDistance(soundIdX, tonumber(args[1]));
end)

RegisterCommand('test6', function(source, args)
    local boolean = args[1] == 'true' and true or false

    exports['soundhandler']:ChangeLoop(soundIdX, boolean);
end)

exports['soundhandler']:AddListenerFilter(playerId: number, filterName: string);
exports['soundhandler']:RemoveListenerFilter(playerId: number, filterName: string);
exports['soundhandler']:MoveSound(identifier: string, posX: number, posY: number, posZ: number);
exports['soundhandler']:RotateSound(identifier: string, rotX: number, rotY: number, rotZ: number);
exports['soundhandler']:AttachSound(identifier: string, entityId: number);
exports['soundhandler']:DetachSound(identifier: string);
exports['soundhandler']:AddSoundFilter(identifier: string, filterName: string);
exports['soundhandler']:RemoveSoundFilter(identifier: string, filterName: string);
exports['soundhandler']:ChangeVolume(identifier: string, volume: number);
```

# Credits:
**Originally Converted From : https://github.com/araynimax/sounity**