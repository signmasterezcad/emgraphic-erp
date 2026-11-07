const { app, BrowserWindow, Menu } = require('electron');
const fs = require('fs'), path = require('path');
// Köhnə adla (FotoCapSatis) saxlanan məlumatı yeni ada köçür
try {
  const oldDir = path.join(app.getPath('appData'), 'FotoCapSatis');
  const newDir = app.getPath('userData');
  if (fs.existsSync(oldDir) && !fs.existsSync(path.join(newDir, 'Local Storage'))) {
    fs.cpSync(path.join(oldDir, 'Local Storage'), path.join(newDir, 'Local Storage'), { recursive: true });
  }
} catch (e) {}
function createWindow() {
  const win = new BrowserWindow({ width: 1366, height: 820, title: 'EMGRAPHIC ERP', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true } });
  Menu.setApplicationMenu(null);
  win.maximize();
  win.loadFile('index.html');
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
