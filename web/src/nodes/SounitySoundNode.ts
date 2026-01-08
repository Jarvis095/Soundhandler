import { principalAxesToOrientation } from '../helper/CalcOrientation';
import * as DefaultOptions from '../helper/DefaultOptions';
import ISourceNodeOptions from './ISourceNodeOptions';
import SounityBaseNode from './SounityBaseNode';
import SountiyController from '../SounityController';
import SoundLoader from '../helper/SoundLoader';

export enum ESounitySourceNodeState {
  SETUP,
  READY,
  PLAYING,
  FINISHED,
  ERROR,
}

export default class SounitySourceNode extends SounityBaseNode {
  private state: ESounitySourceNodeState = ESounitySourceNodeState.SETUP;
  private options: ISourceNodeOptions;
  private identifier: string;
  private url: string;
  private outputType: 'sfx' | 'music';
  private duration?: number;
  private volume: number;
  private loop: boolean;

  private posX: number = 0;
  private posY: number = 0;
  private posZ: number = 0;

  private rotX: number = 0;
  private rotY: number = 0;
  private rotZ: number = 0;

  private audioBuffer: AudioBuffer | null = null;
  private audioBufferSourceNode: AudioBufferSourceNode | null = null;
  private volumeGainNode: GainNode | null = null;
  private pannerNode: PannerNode | null = null;

  public constructor(
    identifier: string,
    url: string,
    options: ISourceNodeOptions,
    sounityController: SountiyController
  ) {
    super(sounityController);

    this.identifier = identifier;
    this.url = url;
    this.options = options;
    this.loop = DefaultOptions.Get('loop', options.loop, false) as boolean;
    this.outputType = DefaultOptions.Get('outputType', options.outputType, 'sfx') as 'sfx' | 'music';
    this.volume = DefaultOptions.Get('volume', options.volume, 1) as number;

    this.move(
      DefaultOptions.Get('posX', options.posX, 0) as number,
      DefaultOptions.Get('posY', options.posY, 0) as number,
      DefaultOptions.Get('posZ', options.posZ, 0) as number
    );

    this.rotate(
      DefaultOptions.Get('rotX', options.rotX, 0) as number,
      DefaultOptions.Get('rotY', options.rotY, 0) as number,
      DefaultOptions.Get('rotZ', options.rotZ, 0) as number
    );

    this.setup();
  }

  private async setup() {
    try {
      this.audioBuffer = await this.audioCtx.decodeAudioData(await SoundLoader.getInstance().loadUrl(this.url));

      this.audioBufferSourceNode = this.audioCtx.createBufferSource();
      this.audioBufferSourceNode.loop = this.loop;
      this.audioBufferSourceNode.buffer = this.audioBuffer;
      this.duration = this.audioBuffer.duration;

      this.audioBufferSourceNode.onended = () => {
        if (this.loop) return;
        this.setState(ESounitySourceNodeState.FINISHED);
      };
      this.volumeGainNode = this.audioCtx.createGain();
      this.volumeGainNode.gain.value = this.getVolume();

      this.pannerNode = this.audioCtx.createPanner();
      this.pannerNode.panningModel = DefaultOptions.Get('panningModel', this.options.panningModel, 'HRTF') as PanningModelType;
      this.pannerNode.distanceModel = DefaultOptions.Get('distanceModel', this.options.distanceModel, 'inverse') as DistanceModelType;
      this.pannerNode.maxDistance = DefaultOptions.Get('maxDistance', this.options.maxDistance, 500) as number;
      this.pannerNode.refDistance = DefaultOptions.Get('refDistance', this.options.refDistance, 3) as number;
      this.pannerNode.rolloffFactor = DefaultOptions.Get('rolloffFactor', this.options.rolloffFactor, 1) as number;
      this.pannerNode.coneInnerAngle = DefaultOptions.Get('coneInnerAngle', this.options.coneInnerAngle, 360) as number;
      this.pannerNode.coneOuterAngle = DefaultOptions.Get('coneOuterAngle', this.options.coneOuterAngle, 0) as number;
      this.pannerNode.coneOuterGain = DefaultOptions.Get('coneOuterGain', this.options.coneOuterGain, 0) as number;

      this.pannerNode.positionX.value = this.posX;
      this.pannerNode.positionY.value = this.posY;
      this.pannerNode.positionZ.value = this.posZ;

      this.pannerNode.orientationX.value = this.rotX;
      this.pannerNode.orientationY.value = this.rotY;
      this.pannerNode.orientationZ.value = this.rotZ;

      this.audioBufferSourceNode.connect(this.volumeGainNode);
      this.volumeGainNode.connect(this.pannerNode);
      this.setOutputNode(this.pannerNode);

      this.setState(ESounitySourceNodeState.READY);
    } catch (err) {
      console.error(err);
      this.setState(ESounitySourceNodeState.ERROR);
    }
  }

  private setState(state: ESounitySourceNodeState) {
    this.state = state;
    if (state === ESounitySourceNodeState.READY) this.emit('ready');
    this.emit('statechange');
  }

  public getState(): ESounitySourceNodeState {
    return this.state;
  }

  start(startTime?: number, refDistance?: number, volume?: number, loop?: boolean) {
    if (this.state === ESounitySourceNodeState.ERROR) return;

    if (this.state === ESounitySourceNodeState.SETUP) {
      return this.once('ready', () => this.start(startTime, refDistance, volume, loop));
    }

    let offset = 0;

    if (startTime !== undefined && this.duration !== Infinity) {
      const startTimeInSec = startTime / 1000;

      if (this.duration !== undefined && startTimeInSec >= this.duration && this.loop) {
        offset = startTimeInSec % this.duration;
      } else if (this.duration !== undefined && startTimeInSec < this.duration) {
        offset = startTimeInSec;
      } else {
        return; // Don't start! The audio is already finished.
      }
    }

    this.audioBufferSourceNode?.start(0, offset);
    this.setVolume(volume ?? this.volume);
    this.setLoop(loop ?? this.loop);
    this.setRefDistance(refDistance ?? this.pannerNode!.refDistance);
  }

  public move(x: number, y: number, z: number): void {
    this.posX = x;
    this.posY = z;
    this.posZ = y;
  }

  public rotate(x: number, y: number, z: number): void {
    const { forward } = principalAxesToOrientation(z * -1, x, y);
    this.rotX = forward.x;
    this.rotY = forward.y;
    this.rotZ = forward.z;
  }

  stop() {
    if (this.state === ESounitySourceNodeState.ERROR) return;

    if (this.state === ESounitySourceNodeState.SETUP) {
      return this.once('ready', () => this.stop());
    }
    this.audioBufferSourceNode?.stop(0);
  }

  dispose() {
    // Stop the sound if playing
    if (this.audioBufferSourceNode) {
      try {
        this.audioBufferSourceNode.stop(0);
      } catch (e) {
        // Already stopped, ignore
      }
      // Remove onended listener by setting to null
      this.audioBufferSourceNode.onended = null;
    }

    // Disconnect all nodes
    this.disconnect();

    // Disconnect and null out audio nodes to break references
    if (this.volumeGainNode) {
      this.volumeGainNode.disconnect();
      this.volumeGainNode = null;
    }
    if (this.pannerNode) {
      this.pannerNode.disconnect();
      this.pannerNode = null;
    }

    // Clear references
    this.audioBufferSourceNode = null;
    this.audioBuffer = null;

    // Remove all event listeners
    this.removeAllListeners();
  }

  private getVolume() {
    if (this.outputType === 'music') {
      return this.volume * this.sounityController.getMusicVolume();
    } else if (this.outputType === 'sfx') {
      return this.volume * this.sounityController.getSfxVolume();
    }
    return this.volume;
  }

  /**
 * Adjusts the volume of the sound.
 * @param volume - The new volume level (0 to 1).
 */
  public setVolume(volume: number) {
    if (volume < 0 || volume > 1) {
      throw new Error('Volume must be between 0 and 1.');
    }

    this.volume = volume;
    this.volumeGainNode!.gain.value = this.getVolume();
  }

  /**
   * Adjusts the maxDistance of the sound.
   * @param maxDistance - The new maxDistance value.
   */
  public setMaxDistance(maxDistance: number) {
    if (maxDistance < 0) {
      throw new Error('maxDistance must be a positive number.');
    }
    
    this.pannerNode!.maxDistance = maxDistance;
  }

  /**
   * Adjusts the refDistance of the sound.
   * @param refDistance - The new refDistance value.
  */
  public setRefDistance(refDistance: number) {
    if (refDistance < 0) {
      throw new Error('refDistance must be a positive number.');
    }
    this.pannerNode!.refDistance = refDistance;
  }

  public setLoop(loop: boolean) {
    this.loop = loop;
    this.audioBufferSourceNode!.loop = loop;
  }

  public tick(endTime: number) {
    this.pannerNode?.positionX.linearRampToValueAtTime(this.posX, endTime);
    this.pannerNode?.positionY.linearRampToValueAtTime(this.posY, endTime);
    this.pannerNode?.positionZ.linearRampToValueAtTime(this.posZ, endTime);

    this.pannerNode?.orientationX.linearRampToValueAtTime(this.rotX, endTime);
    this.pannerNode?.orientationY.linearRampToValueAtTime(this.rotY, endTime);
    this.pannerNode?.orientationZ.linearRampToValueAtTime(this.rotZ, endTime);

    this.volumeGainNode?.gain.linearRampToValueAtTime(this.getVolume(), endTime);
  }
}