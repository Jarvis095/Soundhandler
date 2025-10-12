import { triggerServerCallback } from "@overextended/ox_lib/client";
import { sounityClient } from "./cl_main"

on('sound_handler:custom:enter', async (data: any, ZoneData: any) => {
    sounityClient.startTick(data.name);
    const startTime = await triggerServerCallback('Sounity:GetServerTime', 0);
    sounityClient.onPlaySound(data.name, Number(startTime))
})

on('sound_handler:custom:leave', (data: any, ZoneData: any) => {
    sounityClient.stopTick(data.name);
    sounityClient.onDisposeSound(data.name);
})

on('sound_handler:custom:enter2', async (data: any) => {
    sounityClient.startTick(data.name);
    const startTime = await triggerServerCallback('Sounity:GetServerTime', 0);
    sounityClient.onPlaySound(data.name, Number(startTime))
})

on('sound_handler:custom:leave2', (data: any) => {
    sounityClient.stopTick(data.name);
    sounityClient.onDisposeSound(data.name);
})