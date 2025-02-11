export function Vector3(x: number, y: number, z: number) {
    return [x, y, z];
}

export class SounitySound {
    public identifier: string;
    private options: Record<string, any>;
    private isPlaying: boolean = false;
    private startTime: number = 0;
    private source: string = "";
    public playersInRange: any[] = [];
    private activeFilters: string[] = [];
    private resDistance: number = 3;
    private volume: number = 1;
    private loop: boolean = false;

    constructor(identifier: string, source: string, options: Record<string, any> = {}) {
        this.identifier = identifier;
        this.source = source;
        this.options = options;

        this.NotifyPlayers("CreateSound", identifier, source, this.getOptionJSON());
    }

    private NotifyPlayers(EventName: string, ...args: any[]): void {
        for (const player of this.playersInRange) {
            TriggerClientEvent(`Sounity:${EventName}`, player, this.identifier, ...args)
        }
    }

    public Attach(netId: number): void {
        this.options["attachTo"] = netId;
        this.NotifyPlayers("AttachSound", netId);
    }

    public ChangeVolume(volume: number): void {
        this.volume = volume;
        this.NotifyPlayers("ChangeVolume", volume);
    }

    public ChangeRefDistance(refDistance: number): void {
        this.resDistance = refDistance;
        this.NotifyPlayers("ChangeRefDistance", refDistance);
    }

    public ChangeLoop(loop: boolean): void {
        this.loop = loop;
        this.NotifyPlayers("ChangeLoop", loop);
    }

    public Detach(): void {
        delete this.options["attachTo"];
        this.NotifyPlayers("DetachSound");
    }

    public Start(): void {
        this.startTime = GetGameTimer();
        this.isPlaying = true;
        this.NotifyPlayers("StartSound", this.startTime, this.resDistance, this.volume, this.loop);
    }

    public Move(posX: number, posY: number, posZ: number): void {
        this.options["posX"] = posX;
        this.options["posY"] = posY;
        this.options["posZ"] = posZ;

        this.Detach();
        this.NotifyPlayers("MoveSound", posX, posY, posZ);
    }

    public Rotate(rotX: number, rotY: number, rotZ: number): void {
        this.options["rotX"] = rotX;
        this.options["rotY"] = rotY;
        this.options["rotZ"] = rotZ;

        this.Detach();
        this.NotifyPlayers("RotateSound", rotX, rotY, rotZ);
    }

    public Dispose(): void {
        this.NotifyPlayers("DisposeSound");
    }

    public Stop(): void {
        this.isPlaying = false;
        this.NotifyPlayers("StopSound");
    }

    private getOptionJSON(): string {
        return JSON.stringify(this.options);
    }

    public PlayerInRange(player: any): void {
        this.playersInRange.push(player);

        TriggerClientEvent("Sounity:CreateSound", player, this.identifier, this.source, this.getOptionJSON());

        if (this.activeFilters.length > 0) {
            TriggerClientEvent("Sounity:AddFilters", player, this.identifier, JSON.stringify(this.activeFilters));
        }

        if (this.isPlaying) {
            TriggerClientEvent("Sounity:StartSound", player, this.identifier, this.startTime, this.resDistance, this.volume, this.loop);
        }
    }

    public PlayerOutOfRange(player: any): void {
        this.playersInRange = this.playersInRange.filter(p => p !== player);
        TriggerClientEvent("Sounity:DisposeSound", player, this.identifier);
    }

    public isAttached(): boolean {
        return this.options.hasOwnProperty("attachTo");
    }

    public GetAttachTo(): number {
        if (!this.isAttached()) return 0;
        return this.options["attachTo"];
    }

    public getPosition() {
        const attachedNetId = this.GetAttachTo();

        if (attachedNetId !== 0) {
            return GetEntityCoords(NetworkGetEntityFromNetworkId(attachedNetId));
        }

        const posX = this.options["posX"] || 0;
        const posY = this.options["posY"] || 0;
        const posZ = this.options["posZ"] || 0;

        return Vector3(posX, posY, posZ);
    }

    public getIdentifer(): string {
        return this.identifier;
    }

    public AddFilter(filterName: string): void {
        if (this.activeFilters.includes(filterName)) {
            throw new Error(`A filter with the name '${filterName}' is already active in this sound instance!`);
        }

        this.activeFilters.push(filterName);
        this.NotifyPlayers("AddFilter", filterName);
    }

    public RemoveFilter(filterName: string): void {
        if (!this.activeFilters.includes(filterName)) {
            throw new Error(`A filter with the name '${filterName}' is not active in this sound instance!`);
        }

        this.activeFilters = this.activeFilters.filter(f => f !== filterName);
        this.NotifyPlayers("RemoveFilter", filterName);
    }
}