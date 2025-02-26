import { EventEmitter } from 'events';
import SountiyController from '../SounityController';

export default abstract class SounityBaseNode {
  private outputNode: AudioNode | null = null;
  private destination: AudioNode | null = null;
  private eventEmitter = new EventEmitter();
  private loadingFilters: Record<string, Promise<void>> = {};
  private activeFilters: Record<string, AudioNode> = {};
  private outputFilterNode: AudioNode | null = null;
  private filterChain: string[] = [];
  protected sounityController: SountiyController;
  protected audioCtx: AudioContext;

  protected constructor(sounityController: SountiyController) {
    this.sounityController = sounityController;
    this.audioCtx = sounityController.getAudioCtx();
  }

  public on(type: string, listener: (...args: any[]) => void) {
    this.eventEmitter.on(type, listener);
  }

  public emit(type: string, ...args: any[]) {
    return this.eventEmitter.emit(type, ...args);
  }

  public once(type: string, listener: (...args: any[]) => void) {
    this.eventEmitter.once(type, listener);
  }

  protected setOutputNode(node: AudioNode) {
    if (this.destination) {
      this.outputNode?.disconnect(this.destination);
      node.connect(this.destination);
    }
    this.outputNode = node;
  }

  connect(node: AudioNode) {
    if (!node) throw new Error('Destination node is required');
    
    if (this.destination) {
      if (this.hasActiveFilters()) {
        this.outputFilterNode?.disconnect(this.destination);
      } else {
        this.outputNode?.disconnect(this.destination);
      }
    }

    if (this.hasActiveFilters()) {
      this.outputFilterNode?.connect(node);
    } else {
      this.outputNode?.connect(node);
    }

    this.destination = node;
  }

  disconnect() {
    if (this.hasActiveFilters()) {
      this.outputFilterNode?.disconnect();
    } else {
      this.outputNode?.disconnect();
    }
    this.destination = null;
  }

  async addFilter(filterName: string) {
    if (filterName in this.activeFilters) {
      throw new Error(`There is already an active filter with given identifier '${filterName}'`);
    }

    await (this.loadingFilters[filterName] = this.addFilterAsync(filterName));
    delete this.loadingFilters[filterName];
  }

  private async addFilterAsync(filterName: string) {
    const options = this.sounityController.getFilterOptions(filterName);

    let filterNode: AudioNode;
    if (options.type === 'biquad') {
      const filterOptions: BiquadFilterOptions = options.options;
      filterNode = new BiquadFilterNode(this.audioCtx, filterOptions);
    } else if (options.type === 'convolver') {
      const filterOptions: { url: string; disableNormalization: boolean } = options.options;
      const response = await fetch(filterOptions.url);
      const arraybuffer = await response.arrayBuffer();
      const buffer = await this.audioCtx.decodeAudioData(arraybuffer);
      filterNode = new ConvolverNode(this.audioCtx, {
        buffer,
        disableNormalization: filterOptions.disableNormalization,
      });
    } else {
      throw new Error(`Invalid filter type '${options.type}'`);
    }

    this.activeFilters[filterName] = filterNode;
    this.connectFilter(filterName);
  }

  private connectFilter(filterName: string) {
    const newLastNode = this.activeFilters[filterName];
    if (this.filterChain.length) {
      const currentLastFilterNode = this.activeFilters[this.filterChain[this.filterChain.length - 1]];
      if (this.destination) {
        currentLastFilterNode.disconnect(this.destination);
        currentLastFilterNode.connect(newLastNode);
        newLastNode.connect(this.destination);
        this.outputFilterNode = newLastNode;
      } else {
        currentLastFilterNode.connect(newLastNode);
        this.outputFilterNode = newLastNode;
      }
    } else {
      this.destination && this.outputNode?.disconnect(this.destination);
      this.outputNode?.connect(newLastNode);
      this.outputFilterNode = newLastNode;
      this.destination && newLastNode.connect(this.destination);
    }

    this.filterChain.push(filterName);
  }

  private hasActiveFilters(): boolean {
    return this.filterChain.length > 0;
  }

  async removeFilter(filterName: string) {
    //@ts-ignore
    if (this.loadingFilters[filterName]) {
      await this.loadingFilters[filterName];
    }

    const nodeToBeRemoved = this.activeFilters[filterName];
    if (!nodeToBeRemoved) {
      throw new Error(`Invalid filter name '${filterName}'.`);
    }

    const order = this.filterChain.indexOf(filterName);
    const isLast = order === this.filterChain.length - 1;
    const isFirst = order === 0;

    if (!isFirst && !isLast) {
      const previousNode = this.activeFilters[this.filterChain[order - 1]];
      const nextNode = this.activeFilters[this.filterChain[order + 1]];
      previousNode.disconnect(nodeToBeRemoved);
      nodeToBeRemoved.disconnect(nextNode);
      previousNode.connect(nextNode);
    } else if (isFirst && !isLast) {
      const nextNode = this.activeFilters[this.filterChain[order + 1]];
      this.outputNode?.disconnect(nodeToBeRemoved);
      this.outputNode?.connect(nextNode);
      nodeToBeRemoved.disconnect(nextNode);
    } else if (!isFirst && isLast) {
      const previousNode = this.activeFilters[this.filterChain[order - 1]];
      previousNode.disconnect(nodeToBeRemoved);
      this.destination && nodeToBeRemoved.disconnect(this.destination);
      this.destination && previousNode.connect(this.destination);
    } else if (isFirst && isLast) {
      if (this.destination) {
        nodeToBeRemoved.disconnect(this.destination);
      }
      this.outputNode?.disconnect(nodeToBeRemoved);
      this.destination && this.outputNode?.connect(this.destination);
    }

    this.filterChain.splice(order, 1);
    delete this.activeFilters[filterName];
  }

  abstract tick(endTime: number): void;
}