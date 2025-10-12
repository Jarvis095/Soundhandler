import "./sv_main";
import "./api";
import { entitySound, zonalSound } from "./api";
import { triggerClientCallback } from "@overextended/ox_lib/server";

onNet("QBCore:Server:PlayerLoaded", async (data: any) => {
    const source = data.PlayerData.source;
    Object.values(zonalSound).forEach((sound: any) => {
        triggerClientCallback('summit_soundhandler:client:syncZonalSound', source, JSON.stringify(sound));
    });

    Object.values(entitySound).forEach((sound: any) => {
        triggerClientCallback('summit_soundhandler:client:syncZonalSoundEntity', source, JSON.stringify(sound));
    });
});

RegisterCommand('manualSync', async (source: any, args: any, raw: any) => {
    Object.values(zonalSound).forEach((sound: any) => {
        triggerClientCallback('summit_soundhandler:client:syncZonalSound', source, JSON.stringify(sound));
    });

    Object.values(entitySound).forEach((sound: any) => {
        triggerClientCallback('summit_soundhandler:client:syncZonalSoundEntity', source, JSON.stringify(sound));
    });
}, true);

RegisterCommand('checkSounds', async (source: any, args: any, raw: any) => {
    console.log("Zonal Sounds:", zonalSound);
    console.log("Entity Sounds:", entitySound);
}, true);