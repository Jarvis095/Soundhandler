export class SounityClientAPI {
    private sounds: Record<string, any> = {};
    private options = new Map<string, any>();
    private musicVolume = 10;
    private sfxVolume = 10;

    constructor(){
        
        exports('StreamerMode', (enabled: boolean) => {
            if (enabled) {
                this.musicVolume = 0;
                this.sfxVolume = 0;
            }else{
                this.musicVolume = 10;
                this.sfxVolume = 10;
            }
        });
    }

    public Tick(identifier: string): void {
        const [posX, posY, posZ] = GetGameplayCamCoords();
        const [rotX, rotY, rotZ] = GetFinalRenderedCamRot(0);

        SendNuiMessage(JSON.stringify({
            type: "update",
            posX, posY, posZ,
            rotX, rotY, rotZ,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
        }));

        if (this.isAttached(identifier)) {
            const netId = this.GetAttachTo(identifier);
            if (!NetworkDoesEntityExistWithNetworkId(netId)) {
                this.DetachSound(identifier);
                return;
            }

            const [entX, entY, entZ] = GetEntityCoords(NetworkGetEntityFromNetworkId(netId), false);
            const [entRotX, entRotY, entRotZ] = GetEntityRotation(NetworkGetEntityFromNetworkId(netId), 2);

            this.MoveSound(identifier, entX, entY, entZ);
            this.RotateSound(identifier, entRotX, entRotY, entRotZ);
        }
    }

    public CreateSound(identifier: string, jsonOptions: string): void {
        const options = JSON.parse(jsonOptions);
        this.options.set(identifier, options.options);

        SendNuiMessage(JSON.stringify({
            type: "createSound",
            identifier,
            source: options.source,
            options: options.options,
        }));
    }

    public StartSound(identifier: string, startTime: number, refDistance: number, volume: number, loop: boolean): void {
        SendNuiMessage(JSON.stringify({
            type: "startSound",
            identifier,
            startTime,
            refDistance,
            volume,
            loop,
        }));
    }

    public MoveSound(identifier: string, posX: number, posY: number, posZ: number): void {
        this.Move(posX, posY, posZ, identifier);
    }

    public RotateSound(identifier: string, rotX: number, rotY: number, rotZ: number): void {
        this.Rotate(rotX, rotY, rotZ, identifier);
    }

    public Move(posX: number, posY: number, posZ: number, identifier: string): void {
        this.options.set(identifier, {
            attachTo: this.options.get(identifier).attachTo || 0,
            posX,
            posY,
            posZ,
            rotX: this.options.get(identifier).rotX,
            rotY: this.options.get(identifier).rotY,
            rotZ: this.options.get(identifier).rotZ
        });

        let waterHeight = 0;
        GetWaterHeightNoWaves(posX, posY, posZ, waterHeight);

        SendNuiMessage(JSON.stringify({
            type: "moveSound",
            identifier: identifier,
            posX,
            posY,
            posZ,
        }));
    }

    public Rotate(rotX: number, rotY: number, rotZ: number, identifier: string): void {
        this.options.set(identifier, {
            attachTo: this.options.get(identifier).attachTo || 0,
            rotX,
            rotY,
            rotZ,
            posX: this.options.get(identifier).posX,
            posY: this.options.get(identifier).posY,
            posZ: this.options.get(identifier).posZ
        });

        SendNuiMessage(JSON.stringify({
            type: "rotateSound",
            identifier: identifier,
            rotX,
            rotY,
            rotZ
        }));
    }

    public StopSound(identifier: string): void {
        SendNuiMessage(JSON.stringify({ type: "stopSound", identifier }));
    }

    public DisposeSound(identifier: string): void {
        SendNuiMessage(JSON.stringify({ type: "disposeSound", identifier }));
    }

    public AttachSound(identifier: string, netId: number): void {
        this.options.set(identifier, { ...this.options.get(identifier), attachTo: netId });
    }

    public DetachSound(identifier: string): void {
        this.options.set(identifier, { ...this.options.get(identifier), attachTo: 0 });
    }

    public DeleteOnComplete(identifier: string): void {
        delete this.sounds[identifier];
        this.options.delete(identifier);
        emit('removecreatedZone:soundhandler', identifier);
        emit('sound_handler:client:removeEntityZone', identifier);
    }

    private isAttached(identifier: string): boolean {
        return !!this.options.get(identifier)?.attachTo;
    }

    private GetAttachTo(identifier: string): number {
        return this.options.get(identifier)?.attachTo || 0;
    }
}