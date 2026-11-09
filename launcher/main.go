//go:build windows

// KASSA başladıcısı.
// Windows-un daxili WebView2 (Edge) mühərriki ilə app\index.html faylını açır.
// Electron-dan fərqli olaraq öz brauzerini daşımır, ona görə kiçik və sürətlidir.
package main

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"
	"unsafe"

	webview2 "github.com/jchv/go-webview2"
)

const title = "KASSA"

// Köhnə adlar: yalnız köçürmə üçün (v0.17.0-dan əvvəlki quraşdırmalar).
const (
	oldDirName  = "EMGRAPHIC ERP"
	oldDataFile = "emgraphic-data.json"
)

var (
	user32           = syscall.NewLazyDLL("user32.dll")
	kernel32         = syscall.NewLazyDLL("kernel32.dll")
	procMessageBox   = user32.NewProc("MessageBoxW")
	procFindWindow   = user32.NewProc("FindWindowW")
	procShowWindow   = user32.NewProc("ShowWindow")
	procSetForegrnd  = user32.NewProc("SetForegroundWindow")
	procLoadImage    = user32.NewProc("LoadImageW")
	procSendMessage  = user32.NewProc("SendMessageW")
	procCreateMutex  = kernel32.NewProc("CreateMutexW")
	procGetLastError = kernel32.NewProc("GetLastError")
)

const (
	swMaximize         = 3
	swRestore          = 9
	errorAlreadyExists = 183
	mbIconError        = 0x10
	imageIcon          = 1
	lrLoadFromFile     = 0x10
	wmSetIcon          = 0x80
)

// setWindowIcon pəncərəyə və tapşırıq zolağına app\kassa.ico loqosunu qoyur.
func setWindowIcon(hwnd uintptr, ico string) {
	for _, v := range []struct{ kind, size uintptr }{{0, 16}, {1, 32}} { // ICON_SMALL, ICON_BIG
		if h, _, _ := procLoadImage.Call(0, uintptr(unsafe.Pointer(u16(ico))), imageIcon, v.size, v.size, lrLoadFromFile); h != 0 {
			procSendMessage.Call(hwnd, wmSetIcon, v.kind, h)
		}
	}
}

func u16(s string) *uint16 { p, _ := syscall.UTF16PtrFromString(s); return p }

func message(text string) {
	procMessageBox.Call(0, uintptr(unsafe.Pointer(u16(text))), uintptr(unsafe.Pointer(u16(title))), mbIconError)
}

// Proqram artıq açıqdırsa, ikinci nüsxəni açma, açıq olanı qabağa gətir.
func alreadyRunning() bool {
	procCreateMutex.Call(0, 0, uintptr(unsafe.Pointer(u16("KASSA_TEK_NUSXE"))))
	if e, _, _ := procGetLastError.Call(); e != errorAlreadyExists {
		return false
	}
	if h, _, _ := procFindWindow.Call(0, uintptr(unsafe.Pointer(u16(title)))); h != 0 {
		procShowWindow.Call(h, swRestore)
		procSetForegrnd.Call(h)
	}
	return true
}

func main() {
	exe, _ := os.Executable()
	// Köhnə adlı fayl (EMGRAPHIC ERP.exe) yalnız keçiddir: yanında KASSA.exe varsa, onu açır.
	if !strings.EqualFold(filepath.Base(exe), "KASSA.exe") {
		if k := filepath.Join(filepath.Dir(exe), "KASSA.exe"); fileExists(k) {
			exec.Command(k).Start()
			return
		}
	}
	if alreadyRunning() {
		return
	}
	index := filepath.Join(filepath.Dir(exe), "app", "index.html")
	if _, err := os.Stat(index); err != nil {
		message("Proqram faylı tapılmadı:\n" + index + "\n\nZIP-i tam çıxarın və proqramı öz qovluğundan açın.")
		return
	}

	// Məlumat (satışlar, anbar): %APPDATA%\KASSA
	cfg, _ := os.UserConfigDir()
	root := filepath.Join(cfg, "KASSA")
	data := filepath.Join(root, "WebView2")
	os.MkdirAll(data, 0o755)

	w := webview2.NewWithOptions(webview2.WebViewOptions{
		DataPath:  data,
		AutoFocus: true,
		WindowOptions: webview2.WindowOptions{
			Title: title, Width: 1366, Height: 820, Center: true,
		},
	})
	if w == nil {
		message("Microsoft Edge WebView2 tapılmadı.\n\nOnu Microsoft-un saytından pulsuz quraşdırın:\n" +
			"https://go.microsoft.com/fwlink/p/?LinkId=2124703\n\nSonra proqramı yenidən açın.")
		return
	}
	defer w.Destroy()
	procShowWindow.Call(uintptr(w.Window()), swMaximize)
	setWindowIcon(uintptr(w.Window()), filepath.Join(filepath.Dir(exe), "app", "kassa.ico"))

	// Məlumat faylı və ehtiyat qovluğu (proqram qovluğunda "ehtiyat")
	home, _ := os.UserHomeDir()
	programDir := filepath.Dir(exe)
	st := &store{
		dataFile:  filepath.Join(root, "data", "kassa-data.json"),
		backupDir: chooseBackupDir(programDir, home),
	}
	// Köhnə quraşdırmadan bir dəfə köçür (köhnə fayl ehtiyat kimi qalır)
	migrateOld(st.dataFile, filepath.Join(cfg, oldDirName, "data", oldDataFile))
	// Kompüter və telefon eyni məlumatı versiya ilə oxuyub yazır (server.go)
	ss := newSyncStore(st)
	ps := newPhoneServer(ss, filepath.Join(filepath.Dir(exe), "app"), root)
	phoneFlag := filepath.Join(root, "telefon-acik")
	if fileExists(phoneFlag) {
		ps.start(fmt.Sprintf(":%d", phonePort))
	}
	defer ps.stop()
	w.Bind("erpLoadV", func() (map[string]any, error) {
		v, d, err := ss.get()
		return map[string]any{"ver": v, "data": d}, err
	})
	w.Bind("erpSaveV", func(base int64, data string) (map[string]any, error) {
		ok, v, cur, err := ss.put(base, data)
		if err != nil {
			return nil, err
		}
		res := map[string]any{"ok": ok, "ver": v}
		if !ok {
			res["data"] = cur
		}
		return res, nil
	})
	w.Bind("erpVer", ss.version)
	w.Bind("erpPhoneInfo", func() map[string]any { return ps.info() })
	w.Bind("erpPhone", func(on bool) (map[string]any, error) {
		if on {
			if err := ps.start(fmt.Sprintf(":%d", phonePort)); err != nil {
				return nil, err
			}
			os.MkdirAll(root, 0o755)
			os.WriteFile(phoneFlag, []byte("1"), 0o644)
		} else {
			ps.stop()
			os.Remove(phoneFlag)
		}
		return ps.info(), nil
	})
	w.Bind("erpPhoneNewCode", func() map[string]any { ps.newCode(); return ps.info() })
	// ☁️ Bulud (cloud.go): vəziyyət faylları və Google-a sorğu
	dataDir := filepath.Dir(st.dataFile)
	w.Bind("erpKVGet", func(name string) (string, error) { return kvGet(dataDir, name) })
	w.Bind("erpKVSet", func(name, text string) error { return kvSet(dataDir, name, text) })
	w.Bind("erpFetch", doFetch)
	w.Bind("erpLoad", st.load)
	w.Bind("erpSave", st.save)
	w.Bind("erpBackup", func(json, kind string) (string, error) { return st.backup(json, kind, time.Now()) })
	w.Bind("erpBackupList", st.list)
	w.Bind("erpBackupKinds", backupKinds)
	w.Bind("erpBackupRead", st.read)
	w.Bind("erpPaths", func() map[string]string {
		return map[string]string{"data": st.dataFile, "backup": st.backupDir}
	})
	// 🔄 Yenilə (update.go)
	w.Bind("erpLatest", latestVersion)
	w.Bind("erpUpdate", func() error {
		script := filepath.Join(programDir, "yenile.ps1")
		if !fileExists(script) {
			return errors.New("yenile.ps1 tapılmadı: " + script)
		}
		c := exec.Command("powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", updateCommand(script))
		c.Dir = programDir
		c.SysProcAttr = &syscall.SysProcAttr{CreationFlags: 0x00000010} // CREATE_NEW_CONSOLE: görünən pəncərə
		return c.Start()
	})
	w.Bind("erpOpenFolder", func() error { return exec.Command("explorer.exe", st.backupDir).Start() })

	u := url.URL{Scheme: "file", Path: "/" + filepath.ToSlash(index)}
	go ensureShortcuts(exe, root, fileExists(filepath.Join(cfg, oldDirName, "qisayol-yaradildi")) || fileExists(filepath.Join(root, "qisayol-kassa")))
	w.Navigate(u.String())
	w.Run()
}

func fileExists(p string) bool { _, err := os.Stat(p); return err == nil }

// ensureShortcuts KASSA.exe üçün "KASSA" qısayolunu bir dəfə yaradır (və ya köhnəsini yeni fayla yönəldir):
//   - proqram qovluğunda: həmişə;
//   - iş masasında: əvvəllər heç yaradılmayıbsa, və ya orada KASSA qısayolu varsa (istifadəçi silibsə, yenidən yaradılmır).
func ensureShortcuts(exe, dataRoot string, desktopDoneBefore bool) {
	marker := filepath.Join(dataRoot, "qisayol-kassa-ikon") // v0.21: qısayollara loqo
	if fileExists(marker) {
		return
	}
	ps := `$s = New-Object -ComObject WScript.Shell
$desk = [Environment]::GetFolderPath('Desktop')
foreach ($d in @($env:KASSA_DIR, $desk)) {
  if (-not $d) { continue }
  $p = Join-Path $d 'KASSA.lnk'
  if ($d -eq $desk -and $env:KASSA_DESK_BEFORE -eq '1' -and -not (Test-Path $p)) { continue }
  $l = $s.CreateShortcut($p)
  $l.TargetPath = $env:KASSA_EXE
  $l.WorkingDirectory = $env:KASSA_DIR
  $l.Description = 'KASSA'
  $ico = Join-Path $env:KASSA_DIR 'app\kassa.ico'
  if (Test-Path $ico) { $l.IconLocation = "$ico,0" }
  $l.Save()
}`
	before := "0"
	if desktopDoneBefore {
		before = "1"
	}
	cmd := exec.Command("powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", ps)
	cmd.Env = append(os.Environ(), "KASSA_EXE="+exe, "KASSA_DIR="+filepath.Dir(exe), "KASSA_DESK_BEFORE="+before)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000} // pəncərəsiz
	if cmd.Run() == nil {
		os.MkdirAll(dataRoot, 0o755)
		os.WriteFile(marker, []byte("ok"), 0o644)
	}
}
