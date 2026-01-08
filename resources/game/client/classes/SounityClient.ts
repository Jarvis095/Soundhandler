import { SounityClientAPI } from './SounityClientAPI';

export class SounityClient {
    protected sounityClientAPI: SounityClientAPI;
    public activeSounds: Set<string> = new Set();
    public refDistance = new Map<string, number>();
    public volume = new Map<string, number>();
    public loop = new Map<string, boolean>();
    public ticks = new Map<string, number>();
    private jsonOptions = new Map<string, string>();

    constructor() {
        this.sounityClientAPI = new SounityClientAPI();
    }

    public onCreateSound(type: string, jsonOptions: string): void {
        const options = JSON.parse(jsonOptions);
        const { identifier, volume, loop } = options;
        this.refDistance.set(identifier, 3);
        this.volume.set(identifier, volume || 0.7);
        this.loop.set(identifier, loop || false);
        this.jsonOptions.set(identifier, jsonOptions);

        const eventData = {
            identifier,
            debug: true,
            maxRange: options.options?.maxRange || 10,
            ...(type === 'summit_soundhandler_entity' ? { entity: options.entity } : {
                coords: {
                    x: options.options.posX,
                    y: options.options.posY,
                    z: options.options.posZ,
                },
            }),
        };

        emit(`sound_handler:client:create${type === 'summit_soundhandler_entity' ? 'Entity' : ''}Zones`, eventData);
    }

    public onPlaySound(identifier: string, startTime: number): void {
        const jsonOptions = this.jsonOptions.get(identifier);
        if (jsonOptions) {
            const options: any = JSON.parse(jsonOptions);
            const startTimeX = Math.max(0, startTime - options.startTime);
            try {
                this.sounityClientAPI.CreateSound(identifier, jsonOptions);
                this.sounityClientAPI.StartSound(
                    identifier,
                    startTimeX,
                    this.refDistance.get(identifier) || 3,
                    this.volume.get(identifier) || 1,
                    this.loop.get(identifier) || false
                );
            } catch (error) {
                console.error(`Failed to play sound ${identifier}:`, error);
                // Clean up on error to prevent tick leak
                this.stopTick(identifier);
                this.onDeleteOnComplete(identifier);
            }
        }
    }

    public onStopSound(identifier: string): void {
        this.sounityClientAPI.StopSound(identifier);
    }

    public onChangeVolume(identifier: string, volume: number): void {
        this.volume.set(identifier, volume);
        SendNuiMessage(JSON.stringify({ type: "setSoundVolume", identifier, volume }));
    }

    public onChangeRefDistance(identifier: string, refDistance: number): void {
        this.refDistance.set(identifier, refDistance);
        SendNuiMessage(JSON.stringify({ type: "setSoundRefDistance", identifier, refDistance }));
    }

    public onChangeLoop(identifier: string, loop: boolean): void {
        this.loop.set(identifier, loop);
        SendNuiMessage(JSON.stringify({ type: "setLoop", identifier, loop }));
    }

    public onMoveSound(identifier: string, posX: number, posY: number, posZ: number): void {
        this.sounityClientAPI.MoveSound(identifier, posX, posY, posZ);
    }

    public onRotateSound(identifier: string, rotX: number, rotY: number, rotZ: number): void {
        this.sounityClientAPI.RotateSound(identifier, rotX, rotY, rotZ);
    }

    public onAttachSound(identifier: string, netId: number): void {
        this.sounityClientAPI.AttachSound(identifier, netId);
    }

    public onDetachSound(identifier: string): void {
        this.sounityClientAPI.DetachSound(identifier);
    }

    public onDeleteOnComplete(identifier: string): void {
        this.sounityClientAPI.DeleteOnComplete(identifier);
        this.stopTick(identifier);
        this.jsonOptions.delete(identifier);
        this.refDistance.delete(identifier);
        this.volume.delete(identifier);
        this.loop.delete(identifier);
    }

    public onDisposeSound(identifier: string): void {
        this.sounityClientAPI.DisposeSound(identifier);
    }

    public startTick(identifier: string): void {
        const tickInt = setTick(() => this.sounityClientAPI.Tick(identifier));
        this.ticks.set(identifier, tickInt);
    }

    public stopTick(identifier: string): void {
        const tickInt = this.ticks.get(identifier);
        if (tickInt) clearTick(tickInt);
        this.ticks.delete(identifier);
    }
}