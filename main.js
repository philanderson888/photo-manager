const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  win.loadFile('index.html');
  win.webContents.openDevTools();
}

ipcMain.handle('get-current-directory', async () => {
  return process.cwd();
});

ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const files = await fs.readdir(dirPath);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];

    const imageFiles = [];

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const ext = path.extname(file).toLowerCase();

      if (imageExtensions.includes(ext)) {
        try {
          const stats = await fs.stat(fullPath);
          imageFiles.push({
            name: file,
            path: fullPath,
            birthtime: stats.birthtime,
            mtime: stats.mtime,
            size: stats.size
          });
        } catch (err) {
          console.error(`Error reading stats for ${file}:`, err);
        }
      }
    }

    return imageFiles;
  } catch (err) {
    console.error('Error reading directory:', err);
    throw err;
  }
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
