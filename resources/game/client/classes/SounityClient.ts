import { SounityClientAPI } from './SounityClientAPI';
const EVENT_PREFIX = "Sounity";
const EVENTS = [
    { name: "ServerTime", handler: "onServerTime" },
    { name: "CreateSound", handler: "onCreateSound" },
    { name: "StartSound", handler: "onPlaySound" },
    { name: "StopSound", handler: "onStopSound" },
    { name: "CreateSoundFilter", handler: "onCreateSoundFilter" },
    { name: "MoveSound", handler: "onMoveSound" },
    { name: "RotateSound", handler: "onRotateSound" },
    { name: "AttachSound", handler: "onAttachSound" },
    { name: "DetachSound", handler: "onDetachSound" },
    { name: "DisposeSound", handler: "onDisposeSound" },
    { name: "AddFilter", handler: "onAddFilter" },
    { name: "AddFilters", handler: "onAddFilters" },
    { name: "RemoveFilter", handler: "onRemoveFilter" },
    { name: "AddListenerFilter", handler: "onAddListenerFilter" },
    { name: "RemoveListenerFilter", handler: "onRemoveListenerFilter" },
    { name: "DeleteOnComplete", handler: "onDeleteOnComplete" },
    { name: "ChangeVolume", handler: "onChangeVolume" },
    { name: "ChangeMaxDistance", handler: "onChangeMaxDistance" },
    { name: "ChangeRefDistance", handler: "onChangeRefDistance" },
    { name: "ChangeLoop", handler: "onChangeLoop" },
];

export class SounityClient {
    protected sounityClientAPI: SounityClientAPI;
    private tickInterval: number | null = null;
    private activeSounds: Set<string> = new Set();

    constructor() {
        EVENTS.forEach(event => {
            onNet(`${EVENT_PREFIX}:${event.name}`, (...args: any[]) => (this as any)[event.handler](...args));
        });

        this.sounityClientAPI = new SounityClientAPI();
    }

    private startTick(): void {
        if (this.tickInterval === null) {
            this.tickInterval = setTick(() => this.BrowserUpdaterTick());
        }
    }

    private stopTick(): void {
        if (this.tickInterval !== null) {
            clearTick(this.tickInterval);
            this.tickInterval = null;
        }
    }

    private onCreateSound(identifier: string, source: string, json_options: string): void {
        this.sounityClientAPI.CreateSound(source, json_options, identifier);
    }

    private onPlaySound(identifier: string, startTime: number, refDistance: number, volume: number, loop: boolean): void {
        this.activeSounds.add(identifier);
        this.startTick();
        this.sounityClientAPI.StartSound(identifier, startTime, refDistance, volume, loop);
    }

    private onStopSound(identifier: string): void {
        this.activeSounds.delete(identifier);
        if (this.activeSounds.size === 0) {
            this.stopTick();
        }
        this.sounityClientAPI.StopSound(identifier);
    }

    private onChangeVolume(identifier: string, volume: number): void {
        SendNuiMessage(JSON.stringify({ type: "setSoundVolume", identifier, volume }));
    }

    private onChangeRefDistance(identifier: string, refDistance: number): void {
        SendNuiMessage(JSON.stringify({ type: "setSoundRefDistance", identifier, refDistance }));
    }

    private onChangeLoop(identifier: string, loop: boolean): void {
        SendNuiMessage(JSON.stringify({ type: "setLoop", identifier, loop }));
    }

    private onCreateSoundFilter(identifier: string, filterName: string, json_options: string): void {
        this.sounityClientAPI.CreateFilter(identifier, filterName, json_options);
    }

    private onMoveSound(identifier: string, posX: number, posY: number, posZ: number): void {
        this.sounityClientAPI.MoveSound(identifier, posX, posY, posZ);
    }

    private onRotateSound(identifier: string, rotX: number, rotY: number, rotZ: number): void {
        this.sounityClientAPI.RotateSound(identifier, rotX, rotY, rotZ);
    }

    private onAttachSound(identifier: string, netId: number): void {
        this.sounityClientAPI.AttachSound(identifier, netId);
    }

    private onDetachSound(identifier: string): void {
        this.sounityClientAPI.DetachSound(identifier);
    }

    private onDeleteOnComplete(identifier: string): void {
        this.sounityClientAPI.DeleteOnComplete(identifier);
    }

    private onDisposeSound(identifier: string): void {
        this.activeSounds.delete(identifier);
        if (this.activeSounds.size === 0) {
            this.stopTick();
        }
        this.sounityClientAPI.DisposeSound(identifier);
    }

    private onServerTime(serverTime: number): void {
        this.sounityClientAPI.setServerTime(serverTime);
    }

    private onAddFilter(identifier: string, filterName: string): void {
        this.sounityClientAPI.AddSoundFilter(identifier, filterName);
    }

    private onAddFilters(identifier: string, filterNames_json: string): void {
        const filterNames: string[] = JSON.parse(filterNames_json);
        filterNames.forEach(filterName => this.onAddFilter(identifier, filterName));
    }

    private onRemoveFilter(identifier: string, filterName: string): void {
        this.sounityClientAPI.RemoveSoundFilter(identifier, filterName);
    }

    private onAddListenerFilter(filterName: string): void {
        this.sounityClientAPI.AddListenerFilter(filterName);
    }

    private onRemoveListenerFilter(filterName: string): void {
        this.sounityClientAPI.RemoveListenerFilter(filterName);
    }

    private async BrowserUpdaterTick(): Promise<void> {
        this.sounityClientAPI.Tick();
    }
}