/**
 * updater.js
 *
 * Please use manual update only when it is really required, otherwise please use recommended non-intrusive auto update.
 *
 * Import steps:
 * 1. create `updater.js` for the code snippet
 * 2. require `updater.js` for menu implementation, and set `checkForUpdates` callback from `updater` for the click property of `Check Updates...` MenuItem.
 */
const { dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const path = require('path');

let updater;

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "debug";
autoUpdater.autoDownload = false;

autoUpdater.on('error', (error) => {
    autoUpdater.logger.info("error");
    dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString());
});

autoUpdater.on('update-available', () => {
    const icon = path.join(__dirname, '/assets/lock-128.png');
    dialog.showMessageBox({
        type: 'info',
        title: 'LockBlock',
        message: 'Update found. Do you want to update now?',
        icon: icon,
        buttons: ['Yes', 'No']
    }).then((buttonIndex, cb) => {
        autoUpdater.logger.info(buttonIndex);
        if (buttonIndex.response === 0) {
            autoUpdater.logger.info("Attempting download")
            autoUpdater.downloadUpdate()
        }
        else {
            updater.enabled = true;
            updater = null;
        }
    });
});

autoUpdater.on('update-not-available', () => {
    const icon = path.join(__dirname, '/assets/lock-128.png');
    dialog.showMessageBox({
        title: 'LockBlock',
        message: 'Your current version is up-to-date.',
        icon: icon
    });
    updater.enabled = true;
    updater = null;
});

autoUpdater.on('update-downloaded', () => {
    const icon = path.join(__dirname, '/assets/lock-128.png');
    dialog.showMessageBox({
        title: 'LockBlock',
        message: 'Update downloaded. The application will close while the update installs.',
        icon: icon
    }).then( () => {
        setImmediate(() => autoUpdater.quitAndInstall());
    })
});

// export this to MenuItem click callback
function checkForUpdates(menuItem) {
    updater = menuItem;
    updater.enabled = false;
    autoUpdater.checkForUpdates();
};
module.exports.checkForUpdates = checkForUpdates;