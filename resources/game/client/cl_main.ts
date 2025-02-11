import "./cl_nuicallbacks";
import { SounityClient } from "./classes/SounityClient";

export const Config = JSON.parse(LoadResourceFile(GetCurrentResourceName(), "config.json"));
setImmediate(() => {
    new SounityClient();
});