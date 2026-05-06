const serverList = {
  us: { scheme: "socks5", host: "127.0.0.1", port: 9050 },
  gb: { scheme: "socks5", host: "127.0.0.1", port: 9051 },
  ca: { scheme: "socks5", host: "127.0.0.1", port: 9052 },
  de: { scheme: "socks5", host: "127.0.0.1", port: 9053 },
  fr: { scheme: "socks5", host: "127.0.0.1", port: 9054 },
  sg: { scheme: "socks5", host: "127.0.0.1", port: 9055 },
  jp: { scheme: "socks5", host: "127.0.0.1", port: 9056 },
  au: { scheme: "socks5", host: "127.0.0.1", port: 9057 },
  nl: { scheme: "socks5", host: "127.0.0.1", port: 9058 },
  ch: { scheme: "socks5", host: "127.0.0.1", port: 9059 },
  se: { scheme: "socks5", host: "127.0.0.1", port: 9060 },
  es: { scheme: "socks5", host: "127.0.0.1", port: 9062 }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.command === "connect") {
    const selectedConfig = serverList[request.server];
    
    if (!selectedConfig) return true;

    const proxyConfig = {
      mode: "fixed_servers",
      rules: {
        singleProxy: { scheme: selectedConfig.scheme, host: selectedConfig.host, port: selectedConfig.port },
        bypassList: ["localhost", "127.0.0.1"]
      }
    };

    chrome.proxy.settings.set({ value: proxyConfig, scope: "regular" }, function () {
      // WebRTC Leak Protection 
      chrome.privacy.network.webRTCIPHandlingPolicy.set({ value: "disable_non_proxied_udp" });
      
      // save connection state and active server in storage
      chrome.storage.local.set({ isConnected: true, activeServer: request.server }, function() {
          sendResponse({ status: "connected" });
      });
    });
    return true; // Asynchronous response
  } 
  
  else if (request.command === "disconnect") {
    chrome.storage.local.get(['killSwitch'], function(res) {
        if (res.killSwitch) {
            // Kill Switch on - immediately block all internet traffic
            const blackholeConfig = {
                mode: "fixed_servers",
                rules: { singleProxy: { scheme: "socks5", host: "127.0.0.1", port: 9999 } }
            };
            chrome.proxy.settings.set({ value: blackholeConfig, scope: "regular" }, function () {
                chrome.privacy.network.webRTCIPHandlingPolicy.set({ value: "default" });
                chrome.storage.local.set({ isConnected: false, activeServer: null }, function() {
                    sendResponse({ status: "disconnected" });
                });
            });
        } else {
            // Kill Switch off
            chrome.proxy.settings.clear({ scope: "regular" }, function () {
                chrome.privacy.network.webRTCIPHandlingPolicy.set({ value: "default" });
                chrome.storage.local.set({ isConnected: false, activeServer: null }, function() {
                    sendResponse({ status: "disconnected" });
                });
            });
        }
    });
    return true;
  }
  
  else if (request.command === "toggleKillSwitch") {
      chrome.storage.local.get(['isConnected'], function(res) {
          if (!res.isConnected) {
              if (request.state) {
                  // if Kill Switch is enabled while disconnected, block all traffic immediately
                  var config = {
                      mode: "fixed_servers",
                      rules: { singleProxy: { scheme: "socks5", host: "127.0.0.1", port: 9999 } }
                  };
                  chrome.proxy.settings.set({value: config, scope: 'regular'}, function() {});
              } else {
                  // turn off Kill Switch - restore normal proxy settings
                  chrome.proxy.settings.clear({scope: 'regular'});
              }
          }
      });
      sendResponse({status: "done"});
      return true;
  }
  
});