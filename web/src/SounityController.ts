import { principalAxesToOrientation } from './helper/CalcOrientation';
import Clock from './helper/Clock';
import ISourceNodeOptions from './nodes/ISourceNodeOptions';
import SounityOutputNode from './nodes/SounityOutputNode';
import SounitySoundNode, { ESounitySourceNodeState } from './nodes/SounitySoundNode';

export type FilterType = 'biquad' | 'convolver';

export default class SountiyController {
  private soundNodes: Record<string, SounitySoundNode> = {};
  private availableFilters: Record<string, { type: FilterType; options: any }> = {};
  private audioCtx: AudioContext;
  private clock: Clock = new Clock();

  private posX: number = 0;
  private posY: number = 0;
  private posZ: number = 0;

  private forwardX: number = 1;
  private forwardY: number = 0;
  private forwardZ: number = 0;
  private upX: number = 0;
  private upY: number = 1;
  private upZ: number = 0;

  private masterVolume: number = 1;
  private sfxVolume: number = 1;
  private musicVolume: number = 1;

  private tickId: number;

  private outputNode: SounityOutputNode;

  constructor() {
    this.audioCtx = new AudioContext();
    this.outputNode = new SounityOutputNode(this);
    this.outputNode.connect(this.audioCtx.destination);

    this.tickId = setInterval(() => {
      this.tick();
    }, 16); // ~60 FPS
  }

  public moveListener(x: number, y: number, z: number) {
    this.posX = x;
    this.posY = z;
    this.posZ = y;
  }

  public rotateListener(x: number | undefined, y: number | undefined, z: number | undefined) {
    const { forward, up } = principalAxesToOrientation(z, x, y);
    this.forwardX = forward.x;
    this.forwardY = forward.y * -1;
    this.forwardZ = forward.z;
    this.upX = up.x;
    this.upY = up.y;
    this.upZ = up.z;
  }

  public setVolume(sfxVolume: number, musicVolume: number) {
    this.sfxVolume = sfxVolume;
    this.musicVolume = musicVolume;
  }

  public getAudioCtx() {
    return this.audioCtx;
  }

  private getSoundNode(identifier: string): SounitySoundNode {
    if (identifier in this.soundNodes) return this.soundNodes[identifier];
    throw new Error(`Sound with identifier '${identifier}' does not exist.`);
  }

  public createSound(identifier: string, url: string, options: ISourceNodeOptions): void {
    if (identifier in this.soundNodes) {
      throw new Error(`Sound with identifier '${identifier}' already exists.`);
    }

    const soundNode = new SounitySoundNode(identifier, url, options, this);
    soundNode.connect(this.outputNode.getInputNode());
    this.soundNodes[identifier] = soundNode;
  }

  public startSound(identifier: string, startTime?: number, refDistanceX?: number, volume?: number, loop?: boolean): void {
    this.getSoundNode(identifier).start(startTime, refDistanceX, volume, loop);
  }

  public stopSound(identifier: string): void {
    this.getSoundNode(identifier).stop();
  }

  public moveSound(identifier: string, x: number, y: number, z: number): void {
    this.getSoundNode(identifier).move(x, y, z);
  }

  public rotateSound(identifier: string, x: number, y: number, z: number): void {
    this.getSoundNode(identifier).rotate(x, y, z);
  }

  public disposeSound(identifier: string): void {
    this.getSoundNode(identifier).dispose();
    delete this.soundNodes[identifier];
  }

  private tick() {
    const endTime = this.audioCtx.currentTime + this.clock.getDelta();

    this.audioCtx.listener.positionX.linearRampToValueAtTime(this.posX, endTime);
    this.audioCtx.listener.positionY.linearRampToValueAtTime(this.posY, endTime);
    this.audioCtx.listener.positionZ.linearRampToValueAtTime(this.posZ, endTime);

    this.audioCtx.listener.forwardX.linearRampToValueAtTime(this.forwardX, endTime);
    this.audioCtx.listener.forwardY.linearRampToValueAtTime(this.forwardY, endTime);
    this.audioCtx.listener.forwardZ.linearRampToValueAtTime(this.forwardZ, endTime);

    this.audioCtx.listener.upX.linearRampToValueAtTime(this.upX, endTime);
    this.audioCtx.listener.upY.linearRampToValueAtTime(this.upY, endTime);
    this.audioCtx.listener.upZ.linearRampToValueAtTime(this.upZ, endTime);

    for (const soundNode of Object.values(this.soundNodes)) {
      if (soundNode.getState() !== ESounitySourceNodeState.SETUP) {
        soundNode.tick(endTime);
      }
    }

    this.outputNode.tick(endTime);
  }

  public setSoundVolume(identifier: string, volume: number) {
    const soundNode = this.getSoundNode(identifier);
    soundNode.setVolume(volume);
  }

  public setSoundMaxDistance(identifier: string, maxDistance: number) {
    const soundNode = this.getSoundNode(identifier);
    soundNode.setMaxDistance(maxDistance);
  }

  public setLoop(identifier: string, loop: boolean) {
    const soundNode = this.getSoundNode(identifier);
    soundNode.setLoop(loop);
  }

  public setSoundRefDistance(identifier: string, refDistance: number) {
    const soundNode = this.getSoundNode(identifier);
    soundNode.setRefDistance(refDistance);
  }
  public createFilter(identifier: string, type: FilterType, options: any) {
    if (identifier in this.availableFilters) {
      throw new Error(`Filter with identifier '${identifier}' already exists.`);
    }
    this.availableFilters[identifier] = { type, options };
  }

  public getFilterOptions(identifier: string) {
    if (identifier in this.availableFilters) return this.availableFilters[identifier];
    throw new Error(`Filter with identifier '${identifier}' does not exist.`);
  }

  public addSoundFilter(identifier: string, filterName: string) {
    this.getSoundNode(identifier).addFilter(filterName);
  }

  public removeSoundFilter(identifier: string, filterName: string) {
    this.getSoundNode(identifier).removeFilter(filterName);
  }

  public addListenerFilter(filterName: string) {
    this.outputNode.addFilter(filterName);
  }

  public removeListenerFilter(filterName: string) {
    this.outputNode.removeFilter(filterName);
  }

  public getMusicVolume() {
    return this.musicVolume / 10;
  }

  public getSfxVolume() {
    return this.sfxVolume / 10;
  }

  public dispose() {
    // Clear the tick interval
    if (this.tickId) {
      clearInterval(this.tickId);
    }

    // Dispose all sound nodes
    for (const soundNode of Object.values(this.soundNodes)) {
      soundNode.dispose();
    }
    this.soundNodes = {};

    // Dispose output node
    this.outputNode.dispose();

    // Close audio context
    if (this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
  }
}