import { onServerCallback } from "@overextended/ox_lib/client";
import { sounityClient } from "./cl_main";

AddStateBagChangeHandler("summit_soundhandler", "global", (stateBag: any, stateBagKey: any, stateBagValue: any) => {
    sounityClient.onCreateSound('summit_soundhandler', stateBagValue);
});
AddStateBagChangeHandler("summit_soundhandler_entity", "global", (stateBag: any, stateBagKey: any, stateBagValue: any) => {
    sounityClient.onCreateSound('summit_soundhandler_entity', stateBagValue);
});

onServerCallback('summit_soundhandler:client:syncZonalSound', async (data: any) => {
    sounityClient.onCreateSound('summit_soundhandler', data);
});

onServerCallback('summit_soundhandler:client:syncZonalSoundEntity', async (data: any) => {
    sounityClient.onCreateSound('summit_soundhandler_entity', data);
});