importScripts('integrity-guard.js', 'extension-config.js', 'credit-safe-send.js', 'background.js');

if (typeof self.__qlIntegrityReady !== 'undefined' && self.__qlIntegrityReady) {
  self.__qlIntegrityReady.catch(function () {});
}
