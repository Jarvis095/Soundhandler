export let zonalSound: any = {};
export let entitySound: any = {};

onNet('sound_handler:server:removeZone', async (identifier: string) => {
    zonalSound[identifier] && delete zonalSound[identifier];
});

onNet('sound_handler:server:removeEntityZone', async (identifier: string) => {
    entitySound[identifier] && delete entitySound[identifier];
});