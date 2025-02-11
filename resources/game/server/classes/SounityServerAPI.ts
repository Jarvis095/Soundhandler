
import { Config } from '@server/sv_main';
import { SounitySound } from './SounitySound';
import { distanceBetween } from '@shared/utils';

export class SounityServerAPI {
    private MAX_RANGE = new Map<string, number>();
    protected static idCounter: number = 1;
    protected identifierPrefix: string = 'server';
    protected sounds: Record<string, any> = {};

    constructor() {
        exports('AddListenerFilter', this.AddListenerFilter.bind(this));
        exports('RemoveListenerFilter', this.RemoveListenerFilter.bind(this));
        exports('CreateSound', this.CreateSound.bind(this));
        exports('StartSound', this.StartSound.bind(this));
        exports('MoveSound', this.MoveSound.bind(this));
        exports('RotateSound', this.RotateSound.bind(this));
        exports('StopSound', this.StopSound.bind(this));
        exports('DisposeSound', this.DisposeSound.bind(this));
        exports('AttachSound', this.AttachSound.bind(this));
        exports('DetachSound', this.DetachSound.bind(this));
        exports('AddSoundFilter', this.AddSoundFilter.bind(this));
        exports('RemoveSoundFilter', this.RemoveSoundFilter.bind(this));
        exports('ChangeVolume', this.ChangeVolume.bind(this));
        exports('ChangeRefDistance', this.ChangeRefDistance.bind(this));
        exports('ChangeLoop', this.ChangeLoop.bind(this));
    }

    public AddListenerFilter(playerId: number, filterName: string): void {
        TriggerClientEvent("Sounity:AddListenerFilter", playerId, filterName);
    }

    public RemoveListenerFilter(playerId: number, filterName: string): void {
        TriggerClientEvent("Sounity:RemoveListenerFilter", playerId, filterName);
    }

    public Tick(): void {
        for (const sound of Object.values(this.sounds)) {
            for (const player of getPlayers()) {
                const ped = GetPlayerPed(player);

                if (ped === 0) continue;

                const distance = distanceBetween(GetEntityCoords(ped), sound.getPosition());
                if (distance <= (this.MAX_RANGE.get(sound.identifier) || 10) && !sound.playersInRange.includes(player)) {
                    sound.PlayerInRange(player);
                } else if (distance > (this.MAX_RANGE.get(sound.identifier) || 10) && sound.playersInRange.includes(player)) {
                    sound.PlayerOutOfRange(player);
                }
            }
        }
    }

    protected getSoundInstance(identifier: string) {
        if (!this.sounds[identifier]) {
            throw new Error(`Unknown identifier '${identifier}'`);
        }

        return this.sounds[identifier];
    }

    public CreateSound(source: string, options_json: string = "{}"): string {
        const options = JSON.parse(options_json);
        const identifier = `${this.identifierPrefix}${SounityServerAPI.idCounter++}`;
        const sound = new SounitySound(identifier, source, options);
        this.MAX_RANGE.set(identifier, options.maxRange || 10);
        this.sounds[identifier] = sound;

        return identifier;
    }

    public StartSound(identifier: string): void {
        this.getSoundInstance(identifier).Start();
    }

    public ChangeVolume(identifier: string, volume: number): void {
        this.getSoundInstance(identifier).ChangeVolume(volume);
    }

    public ChangeRefDistance(identifier: string, refDistance: number): void {
        this.getSoundInstance(identifier).ChangeRefDistance(refDistance);
    }

    public ChangeLoop(identifier: string, loop: boolean): void {
        this.getSoundInstance(identifier).ChangeLoop(loop);
    }

    public MoveSound(identifier: string, posX: number, posY: number, posZ: number): void {
        this.getSoundInstance(identifier).Move(posX, posY, posZ);
    }

    public RotateSound(identifier: string, rotX: number, rotY: number, rotZ: number): void {
        this.getSoundInstance(identifier).Rotate(rotX, rotY, rotZ);
    }

    public StopSound(identifier: string): void {
        this.getSoundInstance(identifier).Stop();
    }

    public DisposeSound(identifier: string): void {
        if (this.sounds[identifier]) {
            this.getSoundInstance(identifier).Dispose();
            delete this.sounds[identifier];
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
}