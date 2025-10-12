import { SounityServerAPI } from "./classes/SounityServerAPI";
import { onClientCallback } from "@overextended/ox_lib/server"

export const Config = JSON.parse(LoadResourceFile(GetCurrentResourceName(), "config.json"));
export const ipAddress = "192.168.1.7"

setImmediate(() => {
    new SounityServerAPI()
});

onClientCallback('Sounity:GetServerTime', (source: number) => {
    return GetGameTimer();
});