const { app, BrowserWindow, Menu } = require('electron');
const fs = require('fs'), path = require('path');

// Proqram ikinci dəfə açılsa, yenisini açma, açıq olanı qabağa gətir
if (!app.requestSingleInstanceLock()) { app.quit(); }

// Köhnə adla (FotoCapSatis) saxlanan məlumatı yeni ada köçür
try {
  const oldDir = path.join(app.getPath('appData'), 'FotoCapSatis');
  const newDir = app.getPath('userData');
  if (fs.existsSync(oldDir) && !fs.existsSync(path.join(newDir, 'Local Storage'))) {
    fs.cpSync(path.join(oldDir, 'Local Storage'), path.join(newDir, 'Local Storage'), { recursive: true });
  }
} catch (e) {}

// Lazımsız xidmətləri söndür: açılışı sürətləndirir
app.commandLine.appendSwitch('disable-features', 'SpareRendererForSitePerProcess,MediaRouter,Translate');
Menu.setApplicationMenu(null);

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1366, height: 820, title: 'EMGRAPHIC ERP', autoHideMenuBar: true,
    backgroundColor: '#0f141b', show: false,
    webPreferences: { contextIsolation: true, spellcheck: false, backgroundThrottling: false }
  });
  win.maximize();
  // Pəncərəni ekran çəkiləndə göstər (ağ/boş pəncərə görünməsin)
  win.once('ready-to-show', () => win.show());
  setTimeout(() => { if (win && !win.isVisible()) win.show(); }, 3000);
  win.loadFile('index.html');
}
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
