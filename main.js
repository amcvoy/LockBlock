const electron = require('electron');
const { app, BrowserWindow, Menu, Notification, powerSaveBlocker, Tray } = electron;
const log = require('electron-log');
const path = require('path');
const os = require('os');
const Store = require('./store.js');
const Updater = require('./updater.js');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win = null;
let tray = null;

let blockerId = 0;
let sleepState = false;

const hostname = os.hostname();
const release = os.release();

const notificationEnabled = {
    title: 'LockBlock',
    body: 'Screen lock is enabled!',
    icon: path.join(__dirname, '/assets/lock-128.png')
};

const notificationDisabled = {
    title: 'LockBlock',
    body: 'Screen lock is disabled!',
    icon: path.join(__dirname, '/assets/lock-128.png')
};

// initialize the store
const store = new Store({
    configName: 'lockblock-preferences',
    defaults: {
        showNotifications: true
    }
});

function createWindow() {

    log.info('Function: createWindow');

    // Create the browser window.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // and load the index.html of the app.
    win.loadFile('index.html');

    // Open the DevTools.
    win.webContents.openDevTools();

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });
}

function lockBlock(enable) {

    log.info('Function: lockBlock - Parameters:', enable);

    if (enable) {
        if (!powerSaveBlocker.isStarted(blockerId)) {
            blockerId = powerSaveBlocker.start('prevent-display-sleep');
            log.debug('Enabled', powerSaveBlocker.isStarted(blockerId));
            showNotification(enable);
        }
    } else {
        if (powerSaveBlocker.isStarted(blockerId)) {
            powerSaveBlocker.stop(blockerId);
            log.debug('Enabled', powerSaveBlocker.isStarted(blockerId));
            showNotification(enable);
        }
    }
}

function lockBlockEnabled() {
    return powerSaveBlocker.isStarted(blockerId);
}

function showNotification(enabled) {

    log.info('Function: showNotification - Parameters:', enabled);

    if (store.get('showNotifications')) {
        let notification = null;

        if (enabled) {
            notification = new Notification(notificationEnabled);
        } else {
            notification = new Notification(notificationDisabled);
        }

        notification.show();
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {

    lockBlock(true);
    //createWindow();

    // Set up the System Tray Icon and Menu
    // tray = new Tray('./assets/lock-16.ico');
    const icon = path.join(__dirname, '/assets/lock-16.ico');
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Enabled',
            type: 'radio',
            checked: lockBlockEnabled(),
            click: function () {
                lockBlock(true)
            }
        },
        {
            label: 'Disabled',
            type: 'radio',
            checked: !lockBlockEnabled(),
            click: function () {
                lockBlock(false);
            }
        },
        { type: 'separator' },
        {
            label: 'Show Notifications',
            type: 'checkbox',
            checked: store.get('showNotifications'),
            click: function () {
                if (store.get('showNotifications')) {
                    store.set('showNotifications', false);
                } else {
                    store.set('showNotifications', true);
                }
            }
        },
        { type: 'separator' },
        {
            id: 'checkforupdates',
            label: 'Check for Updates',
            click: function () {
                let menuItem = contextMenu.getMenuItemById('checkforupdates');
                Updater.checkForUpdates(menuItem);
            }
        },
        { type: 'separator' },
        { role: 'quit' }
    ]);
    tray.setToolTip('LockBlock');
    tray.setContextMenu(contextMenu);

    // Register a handler for the system suspend event
    electron.powerMonitor.on('suspend', () => {
        console.log('The system is going to sleep');
        sleepState = lockBlockEnabled();
        lockBlock(false);
    });

    // Register a handler for the system resume event
    electron.powerMonitor.on('resume', () => {
        console.log('The system is waking up');
        lockBlock(sleepState);
    });
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    lockBlock(false);

    if (process.platform !== 'darwin') {
        app.quit();
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
})

app.on('quit', () => {
    lockBlock(false);
    if (tray) {
        tray.destroy();
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.