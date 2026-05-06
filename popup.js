const serverNames = {
    "us": "🇺🇸 United States", "gb": "🇬🇧 United Kingdom", "ca": "🇨🇦 Canada",
    "es": "🇪🇸 Spain", "de": "🇩🇪 Germany", "fr": "🇫🇷 France", "sg": "🇸🇬 Singapore",
    "jp": "🇯🇵 Japan", "au": "🇦🇺 Australia", "nl": "🇳🇱 Netherlands",
    "ch": "🇨🇭 Switzerland", "se": "🇸🇪 Sweden"
};

let currentServer = "us"; 
let isAppConnected = false; 

document.addEventListener('DOMContentLoaded', () => {
    const connectButton = document.getElementById('connectButton');
    const statusPulse = document.getElementById('statusPulse');
    const statusText = document.getElementById('statusText');
    const killSwitchToggle = document.getElementById('killSwitchToggle');
    
    // Dropdown Elements
    const selectedServer = document.getElementById('selectedServer');
    const dropdownList = document.getElementById('dropdownList');
    const selectedText = document.getElementById('selectedText');

    function updateUI(connected, serverValue = null) {
        isAppConnected = connected;
        if (serverValue && serverNames[serverValue]) {
            currentServer = serverValue;
            selectedText.innerText = serverNames[serverValue];
        }
        if (connected) {
            connectButton.innerText = "Disconnect";
            connectButton.classList.add('connected');
            statusPulse.className = 'status-pulse connected';
            statusText.innerText = "Protected";
        } else {
            connectButton.innerText = "Tap to Connect";
            connectButton.classList.remove('connected');
            statusPulse.className = 'status-pulse disconnected';
            statusText.innerText = "Disconnected";
        }
    }

    // memory of restore
    chrome.storage.local.get(['isConnected', 'activeServer', 'killSwitch'], function(result) {
        updateUI(result.isConnected, result.activeServer || "us");
        killSwitchToggle.checked = result.killSwitch || false;
    });

    // Custom Dropdown Open/Close
    selectedServer.addEventListener('click', () => {
        dropdownList.classList.toggle('show');
    });

    // Select Server from List
    document.querySelectorAll('.dropdown-list li').forEach(item => {
        item.addEventListener('click', (e) => {
            const newServer = e.target.getAttribute('data-value');
            currentServer = newServer;
            selectedText.innerText = e.target.innerText;
            dropdownList.classList.remove('show');

            if (isAppConnected) {
                statusText.innerText = "Switching... 🔄";
                statusPulse.className = 'status-pulse'; 
                chrome.runtime.sendMessage({ command: "connect", server: currentServer }, (response) => {
                    if (response && response.status === "connected") {
                        setTimeout(() => updateUI(true, currentServer), 600); 
                    }
                });
            } else {
                chrome.storage.local.set({ activeServer: currentServer });
            }
        });
    });

    // Connect/Disconnect
    connectButton.addEventListener('click', () => {
        if (isAppConnected) {
            connectButton.innerText = "Disconnecting...";
            chrome.runtime.sendMessage({ command: "disconnect" }, (response) => {
                if (response && response.status === "disconnected") updateUI(false, currentServer);
            });
        } else {
            connectButton.innerText = "Connecting...";
            chrome.runtime.sendMessage({ command: "connect", server: currentServer }, (response) => {
                if (response && response.status === "connected") updateUI(true, currentServer);
            });
        }
    });

    // Kill Switch Toggle Trigger
    killSwitchToggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        chrome.storage.local.set({ killSwitch: isEnabled });
        chrome.runtime.sendMessage({ command: "toggleKillSwitch", state: isEnabled });
    });
});