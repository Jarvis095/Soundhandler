function Vector3(x: number, y: number, z: number) {
    return [x, y, z];
}

export class SounityClientAPI {
    private serverTime: number = GetGameTimer();
    private underwater: boolean = false;
    protected static idCounter: number = 1;
    protected identifierPrefix: string;
    protected sounds: {
        [key: string]: {
            Start2: (identifier: string, ss: number, refDistance: number, volume: number, loop: boolean) => void,
            Move: (posX: number, posY: number, posZ: number) => void,
            Rotate: (rotX: number, rotY: number, rotZ: number) => void,
            Attach: (netId: number) => void,
            Detach: () => void,
            Stop: (identifier: string) => void,
            Dispose: (identifier: string) => void,
            isAttached: () => boolean,
            GetAttachTo: () => number,
            getPosition: () => any,
            AddFilter: (filterName: string) => void,
            RemoveFilter: (filterName: string) => void,
        }
    } = {};


    private identifier: string = "";
    private options: { [key: string]: any } = {};

    constructor() {
        this.identifierPrefix = "client";
    }

    public setServerTime(serverTime: number): void {
        this.serverTime = serverTime;
    }

    public Tick(): void {
        const Position = GetGameplayCamCoords();
        const Rotation = GetFinalRenderedCamRot(0);

        SendNuiMessage(JSON.stringify({
            type: "update",
            posX: Position[0],
            posY: Position[1],
            posZ: Position[2],
            rotX: Rotation[0],
            rotY: Rotation[1],
            rotZ: Rotation[2],
            musicVolume: 0,
            sfxVolume: 10,
        }));

        Object.values(this.sounds).forEach(sound => {
            if (!sound.isAttached()) return;

            const netId = sound.GetAttachTo();
            if (!NetworkDoesEntityExistWithNetworkId(netId)) {
                sound.Detach();
                return;
            }

            const entId = NetworkGetEntityFromNetworkId(netId);
            const position = GetEntityCoords(entId, false);
            const rotation = GetEntityRotation(entId, 2);

            sound.Move(position[0], position[1], position[2]);
            sound.Rotate(rotation[0], rotation[1], rotation[2]);
        });
    }

    public CreateFilter(filterName: string, filterType: string, options_json: string): void {
        SendNuiMessage(JSON.stringify({
            type: "createFilter",
            filterName,
            filterType,
            options: JSON.parse(options_json)
        }));
    }

    public AddListenerFilter(filterName: string): void {
        SendNuiMessage(JSON.stringify({
            type: "addListenerFilter",
            filterName,
        }));
    }

    public RemoveListenerFilter(filterName: string): void {
        SendNuiMessage(JSON.stringify({
            type: "removeListenerFilter",
            filterName,
        }));
    }

    protected getSoundInstance(identifier: string): {
        Start2: (identifier: string, ss: number, refDistance: number, volume: number, loop: boolean) => void,
        Move: (posX: number, posY: number, posZ: number) => void,
        Rotate: (rotX: number, rotY: number, rotZ: number) => void,
        Attach: (netId: number) => void,
        Detach: () => void,
        Stop: (identifier: string) => void,
        Dispose: (identifier: string) => void,
        isAttached: () => boolean,
        GetAttachTo: () => number,
        getPosition: () => any,
        AddFilter: (filterName: string) => void,
        RemoveFilter: (filterName: string) => void,
    } {
        if (!this.sounds[identifier]) {
            throw new Error(`Unknown identifier '${identifier}'`);
        }

        return this.sounds[identifier];
    }

    public CreateSound(source: string, options_json: string = "{}", identifierX?: string): string {
        const options = JSON.parse(options_json);
        let identifier: string = "";
        const soundInstance = {
            Start2: (identifier: string, ss: number, refDistance: number, volume: number, loop: boolean) => this.Start2(identifier, ss, refDistance, volume, loop),
            Move: (posX: number, posY: number, posZ: number) => this.Move(posX, posY, posZ),
            Rotate: (rotX: number, rotY: number, rotZ: number) => this.Rotate(rotX, rotY, rotZ),
            Attach: (netId: number) => this.Attach(netId),
            Detach: () => this.Detach(),
            Stop: (identifier: string) => this.Stop(identifier),
            Dispose: (identifier: string) => this.Dispose(identifier),
            isAttached: () => this.isAttached(),
            GetAttachTo: () => this.GetAttachTo(),
            getPosition: () => this.getPosition(),
            AddFilter: (filterName: string) => this.AddFilter(filterName),
            RemoveFilter: (filterName: string) => this.RemoveFilter(filterName),
        };

        if (!identifierX) {
            identifier = `${this.identifierPrefix}${SounityClientAPI.idCounter++}`
        } else {
            identifier = identifierX;
        };

        this.identifier = identifier;
        this.options = options;

        const initialPosition = this.getPosition();
        let waterHeight = 0;
        GetWaterHeightNoWaves(initialPosition.x, initialPosition.y, initialPosition.z, waterHeight);

        SendNuiMessage(JSON.stringify({
            type: "createSound",
            identifier,
            source,
            options,
        }));

        if (initialPosition.z < waterHeight) {
            this.AddFilter("underwater");
            this.underwater = true;
        }

        this.sounds[identifier] = soundInstance;

        return identifier;
    }

    public StartSound(identifier: string, ss: number, refDistance: number, volume: number, loop: boolean): void {
        const startTime = Math.max(0, this.serverTime - ss);
        this.getSoundInstance(identifier).Start2(identifier, startTime, refDistance, volume, loop);
    }

    public MoveSound(identifier: string, posX: number, posY: number, posZ: number): void {
        this.getSoundInstance(identifier).Move(posX, posY, posZ);
    }

    public RotateSound(identifier: string, rotX: number, rotY: number, rotZ: number): void {
        this.getSoundInstance(identifier).Rotate(rotX, rotY, rotZ);
    }

    public StopSound(identifier: string): void {
        if (this.sounds[identifier]) {
            this.getSoundInstance(identifier).Stop(identifier);
        }
    }

    public DisposeSound(identifier: string): void {
        if (this.sounds[identifier]) {
            this.getSoundInstance(identifier).Dispose(identifier);
        }
    }

    public AttachSound(identifier: string, entityId: number): void {
        this.getSoundInstance(identifier).Attach(entityId);
    }

    public DetachSound(identifier: string): void {
        this.getSoundInstance(identifier).Detach();
    }

    public AddSoundFilter(identifier: string, filterName: string): void {
        this.getSoundInstance(identifier).AddFilter(filterName);
    }

    public RemoveSoundFilter(identifier: string, filterName: string): void {
        this.getSoundInstance(identifier).RemoveFilter(filterName);
    }

    public Start2(identifier: string, ss: number, refDistance: number, volume: number, loop: boolean): void {
        SendNuiMessage(JSON.stringify({
            type: "startSound",
            identifier: identifier,
            startTime: ss,
            refDistance,
            volume,
            loop
        }));
    }

    public Move2(pos: number[]): void {
        this.Move(pos[0], pos[1], pos[2]);
    }

    public Move(posX: number, posY: number, posZ: number): void {
        this.options["posX"] = posX;
        this.options["posY"] = posY;
        this.options["posZ"] = posZ;

        let waterHeight = 0;
        GetWaterHeightNoWaves(posX, posY, posZ, waterHeight);

        SendNuiMessage(JSON.stringify({
            type: "moveSound",
            identifier: this.identifier,
            posX,
            posY,
            posZ,
        }));

        if (posZ < waterHeight && !this.underwater) {
            this.AddFilter("underwater");
            this.underwater = true;
        } else if (posZ >= waterHeight && this.underwater) {
            this.RemoveFilter("underwater");
            this.underwater = false;
        }
    }

    public Rotate(rotX: number, rotY: number, rotZ: number): void {
        this.options["rotX"] = rotX;
        this.options["rotY"] = rotY;
        this.options["rotZ"] = rotZ;

        SendNuiMessage(JSON.stringify({
            type: "rotateSound",
            identifier: this.identifier,
            rotX,
            rotY,
            rotZ
        }));
    }

    public Attach(netId: number): void {
        this.options["attachTo"] = netId;
    }

    public Detach(): void {
        delete this.options["attachTo"];
    }

    public Stop(identifier: string): void {
        SendNuiMessage(JSON.stringify({
            type: "stopSound",
            identifier: identifier,
        }));
    }

    public Dispose(identifier: string): void {
        SendNuiMessage(JSON.stringify({
            type: "disposeSound",
            identifier: identifier,
        }));
        delete this.sounds[identifier];
    }

    public DeleteOnComplete(identifier: string): void {
        if (this.sounds[identifier]) {
            delete this.sounds[identifier];
        }
    }

    public isAttached(): boolean {
        return this.options.hasOwnProperty("attachTo");
    }

    public GetAttachTo(): number {
        return this.isAttached() ? this.options["attachTo"] : 0;
    }

    public getPosition(): any {
        const attachedNetId = this.GetAttachTo();

        if (attachedNetId !== 0) {
            return GetEntityCoords(NetworkGetEntityFromNetworkId(attachedNetId), false);
        }

        const posX = this.options["posX"] || 0;
        const posY = this.options["posY"] || 0;
        const posZ = this.options["posZ"] || 0;

        return Vector3(posX, posY, posZ);
    }

    public AddFilter(filterName: string): void {
        SendNuiMessage(JSON.stringify({
            type: "addSoundFilter",
            identifier: this.identifier,
            filterName
        }));
    }

    public RemoveFilter(filterName: string): void {
        SendNuiMessage(JSON.stringify({
            type: "removeSoundFilter",
            identifier: this.identifier,
            filterName
        }));
    }
}