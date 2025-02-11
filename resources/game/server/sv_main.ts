import { SounityServer } from "./classes/SounityServer";

export const Config = JSON.parse(LoadResourceFile(GetCurrentResourceName(), "config.json"));

setImmediate(() => {
    new SounityServer();
});