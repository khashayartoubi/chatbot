var BDM_CONFIG = {
  projects: {
    parentURLOnBuild: `http://${window.location.hostname}:9001`,
    parentURLOnDevelopemnt: 'http://192.168.11.89:9001',
  },
  map: {
    url: [
      {
        name: 'street-view',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        iconName: 'street-view.png',
      },
      {
        name: 'satellite',
        url: 'http://192.168.11.13/map/map/google/{z}/{x}/{-y}.jpg',
        iconName: 'satellite.png',
      },
    ],
    maxZoom: 15,
    minZoom: 2,
    initialState: {
      zoom: 14,
      lng: 51.26392364501954,
      lat: 35.709269745083766,
    },
  },
  graph: {
    maxZoom: 8,
    minZoom: 1,
    nodesMustFixOnStart: true,
    forceCollide: 50,
    velocityDecay: 0.65,
    maxNodeCountOnGIS: 1000,
    maxNodeCountOnGISAdmin: 1000,
    maxFeatureOnGisPreview: 100_000,
  },
};
