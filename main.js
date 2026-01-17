const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

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

ipcMain.handle('update-exif-rust', async (event, filePath, datetime) => {
  return new Promise((resolve, reject) => {
    const rustBinaryPath = path.join(__dirname, 'rust', 'target', 'release', 'exif-updater.exe');

    const rustProcess = spawn(rustBinaryPath, [filePath, datetime]);

    let stdout = '';
    let stderr = '';

    rustProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    rustProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    rustProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, message: stdout });
      } else {
        reject({ success: false, error: stderr || 'Unknown error' });
      }
    });

    rustProcess.on('error', (err) => {
      reject({ success: false, error: `Failed to start Rust process: ${err.message}` });
    });
  });
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
