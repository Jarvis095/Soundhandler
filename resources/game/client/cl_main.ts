import "./cl_nuicallbacks";
import "./cl_statebaghandler";
import "./cl_zonehandler";
import { SounityClient } from "./classes/SounityClient";

export const Config = JSON.parse(LoadResourceFile(GetCurrentResourceName(), "config.json"));
export const sounityClient = new SounityClient();

onNet('summit_soundhandler:stopSound', (identifier: string) => {
    sounityClient.onDisposeSound(identifier);
    sounityClient.onDeleteOnComplete(identifier);
});

onNet('summit_soundhandler:changeLoop', (identifier: string, loop: boolean) => {
    sounityClient.onChangeLoop(identifier, loop);
});

onNet('summit_soundhandler:changeVolume', (identifier: string, volume: number) => {
    sounityClient.onChangeVolume(identifier, volume);
});

onNet('summit_soundhandler:changeRefDistance', (identifier: string, refDistance: number) => {
    sounityClient.onChangeRefDistance(identifier, refDistance);
});

onNet('summit_soundhandler:soundEnded', (identifier: string) => {
    sounityClient.onDisposeSound(identifier);
    sounityClient.onDeleteOnComplete(identifier);
});