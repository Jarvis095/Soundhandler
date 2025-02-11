import { Config } from "./cl_main";

const NUI_CALLBACK_TYPES = {
    READY: "sounity:ready",
    GET_DEFAULTS: "sounity:get-defaults",
    SOUND_ENDED: "soundEnded",
};

RegisterNuiCallbackType(NUI_CALLBACK_TYPES.READY);
on(`__cfx_nui:${NUI_CALLBACK_TYPES.READY}`, () => {
    emit('Sounity:Ready');
    emit('Sounity:CreateSoundFilter', "underwater", "biquad", JSON.stringify({
        Q: 1,
        frequency: 100,
        type: "lowpass"
    }));
});

RegisterNuiCallbackType(NUI_CALLBACK_TYPES.GET_DEFAULTS);
on(`__cfx_nui:${NUI_CALLBACK_TYPES.GET_DEFAULTS}`, (data: any, cb: Function) => {
    cb(JSON.stringify({
        volume: Config.volume,
        outputType: Config.outputType,
        loop: Config.loop,
        posX: Config.posX,
        posY: Config.posY,
        posZ: Config.posZ,
        rotX: Config.rotX,
        rotY: Config.rotY,
        rotZ: Config.rotZ,
        panningModel: Config.panningModel,
        distanceModel: Config.distanceModel,
        maxDistance: Config.maxDistance,
        refDistance: Config.refDistance,
        rolloffFactor: Config.rolloffFactor,
        coneInnerAngle: Config.coneInnerAngle,
        coneOuterAngle: Config.coneOuterAngle,
        coneOuterGain: Config.coneOuterGain,
    }));
});

RegisterNuiCallbackType(NUI_CALLBACK_TYPES.SOUND_ENDED);
on(`__cfx_nui:${NUI_CALLBACK_TYPES.SOUND_ENDED}`, (data: any) => {
    emit('Sounity:DisposeSound', data.identifier);
    emit('Sounity:DeleteOnComplete', data.identifier);
});