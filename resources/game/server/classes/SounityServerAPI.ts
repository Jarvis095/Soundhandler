import { entitySound, zonalSound } from '@server/api';
import { Config } from '@server/sv_main';
import axios from 'axios';
import { parseBuffer } from 'music-metadata';

export class SounityServerAPI {
    protected static idCounter: number = 1;
    protected identifierPrefix: string = 'server';
    protected sounds: Record<string, any> = {};
    protected timers: Record<string, NodeJS.Timeout> = {};

    constructor() {
        exports('StartSound', this.StartSound.bind(this));
        exports('StopSound', this.StopSound.bind(this));
        exports('StartAttachSound', this.StartAttachSound.bind(this));
        exports('ChangeVolume', this.ChangeVolume.bind(this));
        exports('ChangeRefDistance', this.ChangeRefDistance.bind(this));
        exports('ChangeLoop', this.ChangeLoop.bind(this));
    }

    protected getSoundInstance(identifier: string) {
        if (!this.sounds[identifier]) {
            throw new Error(`Unknown identifier '${identifier}'`);
        }
        return this.sounds[identifier];
    }

    public async StartSound(source: string, options_json: string = "{}", timer?: number, volume?: number): Promise<string> {
        const options = JSON.parse(options_json);
        const identifier = `sounds_${this.identifierPrefix}_${SounityServerAPI.idCounter++}`;

        const optionsS = {
            identifier: identifier,
            source: source,
            options: options,
            startTime: timer ? timer : GetGameTimer(),
            resDistance: Config.refDistance,
            volume: volume ?? Config.volume,
            loop: options.loop ?? Config.loop
        };

        GlobalState.set('summit_soundhandler', JSON.stringify(optionsS), true);
        zonalSound[identifier] = optionsS;

        await this.scheduleSoundEnd(identifier, optionsS.source, options.loop ?? Config.loop);

        return identifier;
    }

    public async StartAttachSound(source: string, entity: string, maxRange: number, timer?: number, loop?: boolean, volume?: number): Promise<string> {
        const identifier = `sounds_${this.identifierPrefix}_${SounityServerAPI.idCounter++}`;

        const optionsSa = {
            identifier: identifier,
            source: source,
            entity: entity,
            options: {
                attachTo: entity,
            },
            maxRange: maxRange,
            startTime: timer ? timer : GetGameTimer(),
            resDistance: Config.refDistance,
            volume: volume ?? Config.volume,
            loop: loop ?? Config.loop
        };

        GlobalState.set('summit_soundhandler_entity', JSON.stringify(optionsSa), true);
        entitySound[identifier] = optionsSa;

        await this.scheduleSoundEnd(identifier, optionsSa.source, loop ?? Config.loop);

        return identifier;
    }

    public ChangeVolume(identifier: string, volume: number): void {
        emitNet('summit_soundhandler:changeVolume', -1, identifier, volume);
    }

    public ChangeRefDistance(identifier: string, refDistance: number): void {
        emitNet('summit_soundhandler:changeRefDistance', -1, identifier, refDistance);
    }

    public async ChangeLoop(identifier: string, loop: boolean): Promise<void> {
        const soundInstance = zonalSound[identifier] || entitySound[identifier];
        if (!soundInstance) return;

        soundInstance.loop = loop;
        emitNet('summit_soundhandler:changeLoop', -1, identifier, loop);

        if (loop && this.timers[identifier]) {
            clearTimeout(this.timers[identifier]);
            delete this.timers[identifier];
        } else if (!loop && !this.timers[identifier]) {
            await this.scheduleSoundEnd(identifier, soundInstance.source, loop);
        }
    }

    public StopSound(identifier: string): void {
        const timer = this.timers[identifier];
        if (timer) {
            clearTimeout(timer);
            delete this.timers[identifier];
        }
        emitNet('summit_soundhandler:stopSound', -1, identifier);
        
        // Clean up sound instances
        delete zonalSound[identifier];
        delete entitySound[identifier];
    }

    protected async scheduleSoundEnd(identifier: string, source: string, loop: boolean): Promise<void> {
        if (loop) return;

        // Clear any existing timer for this identifier
        if (this.timers[identifier]) {
            clearTimeout(this.timers[identifier]);
        }

        const duration = await this.getSoundLength(source);
        this.timers[identifier] = setTimeout(() => {
            emitNet('summit_soundhandler:soundEnded', -1, identifier);
            delete this.timers[identifier];
            // Clean up sound instances
            delete zonalSound[identifier];
            delete entitySound[identifier];
        }, duration * 1000);
    }

    public async getSoundLength(url: string): Promise<number> {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const metadata = await parseBuffer(response.data, { mimeType: 'audio/mpeg' });
            return metadata.format.duration || 0;
        } catch (error) {
            console.error(`Error fetching sound length for ${url}:`, error);
            return 0;
        }
    }
}
