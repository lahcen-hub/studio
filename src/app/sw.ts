/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import {defaultCache} from '@serwist/next/worker';
import {Serwist} from 'serwist';

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    ignoreURLParametersMatching: [/.*/],
  },
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
