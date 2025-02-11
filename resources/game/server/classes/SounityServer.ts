import { SounityServerAPI } from './SounityServerAPI';

export class SounityServer {
    private sounityServerAPI: SounityServerAPI;
    private debug: number = -1;
    public tick = 0;

    constructor() {
        this.sounityServerAPI = new SounityServerAPI();
        this.tick = setTick(() => this.OnTick());
    }

    private async OnTick(): Promise<void> {
        this.sounityServerAPI.Tick();
        TriggerClientEvent("Sounity:ServerTime", -1, GetGameTimer());
    }
}