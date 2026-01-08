import SountiyController from './SounityController';

const sounityController = new SountiyController();

// For debugging
(window as any).sounityController = sounityController;

const handlers: {
  [key: string]: (data: any) => void;
} = {
  update(data: any) {
    sounityController.moveListener(data.posX, data.posY, data.posZ);
    sounityController.rotateListener(data.rotX, data.rotY, data.rotZ);
    sounityController.setVolume(data.sfxVolume, data.musicVolume);
  },

  moveSound(data: any) {
    sounityController.moveSound(data.identifier, data.posX, data.posY, data.posZ);
  },

  rotateSound(data: any) {
    sounityController.rotateSound(data.identifier, data.rotX, data.rotY, data.rotZ);
  },

  createSound(data: any) {
    sounityController.createSound(data.identifier, data.source, data.options);
  },

  startSound(data: any) {
    sounityController.startSound(data.identifier, data.startTime, data.refDistance, data.volume, data.loop);
  },

  stopSound(data: any) {
    sounityController.stopSound(data.identifier);
  },

  disposeSound(data: any) {
    sounityController.disposeSound(data.identifier);
  },

  addSoundFilter(data: any) {
    sounityController.addSoundFilter(data.identifier, data.filterName);
  },

  removeSoundFilter(data: any) {
    sounityController.removeSoundFilter(data.identifier, data.filterName);
  },

  addListenerFilter(data: any) {
    sounityController.addListenerFilter(data.filterName);
  },

  removeListenerFilter(data: any) {
    sounityController.removeListenerFilter(data.filterName);
  },

  createFilter(data: any) {
    sounityController.createFilter(data.filterName, data.filterType, data.options);
  },

  setSoundVolume(data: any) {
    sounityController.setSoundVolume(data.identifier, data.volume);
  },

  setSoundMaxDistance(data: any) {
    sounityController.setSoundMaxDistance(data.identifier, data.maxDistance);
  },

  setSoundRefDistance(data: any) {
    sounityController.setSoundRefDistance(data.identifier, data.refDistance);
  },

  setLoop(data: any) {
    sounityController.setLoop(data.identifier, data.loop);
  },
};

const messageHandler = (event: MessageEvent) => {
  if (event.data.type in handlers) {
    try {
      handlers[event.data.type](event.data);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }
};

window.addEventListener('message', messageHandler);

// Cleanup function (can be called when NUI is being destroyed)
(window as any).cleanupSounity = () => {
  window.removeEventListener('message', messageHandler);
  sounityController.dispose();
};

fetch(`https://summit_soundhandler/sounity:ready`).catch((error) => {
  console.error('Failed to notify server:', error);
});