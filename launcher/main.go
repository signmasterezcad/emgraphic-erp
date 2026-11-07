//go:build windows

// EMGRAPHIC ERP başladıcısı.
// Windows-un daxili WebView2 (Edge) mühərriki ilə app\index.html faylını açır.
// Electron-dan fərqli olaraq öz brauzerini daşımır, ona görə kiçik və sürətlidir.
package main

import (
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"time"
	"unsafe"

	webview2 "github.com/jchv/go-webview2"
)

const title = "EMGRAPHIC ERP"

var (
	user32           = syscall.NewLazyDLL("user32.dll")
	kernel32         = syscall.NewLazyDLL("kernel32.dll")
	procMessageBox   = user32.NewProc("MessageBoxW")
	procFindWindow   = user32.NewProc("FindWindowW")
	procShowWindow   = user32.NewProc("ShowWindow")
	procSetForegrnd  = user32.NewProc("SetForegroundWindow")
	procCreateMutex  = kernel32.NewProc("CreateMutexW")
	procGetLastError = kernel32.NewProc("GetLastError")
)

const (
	swMaximize         = 3
	swRestore          = 9
	errorAlreadyExists = 183
	mbIconError        = 0x10
)

func u16(s string) *uint16 { p, _ := syscall.UTF16PtrFromString(s); return p }

func message(text string) {
	procMessageBox.Call(0, uintptr(unsafe.Pointer(u16(text))), uintptr(unsafe.Pointer(u16(title))), mbIconError)
}

// Proqram artıq açıqdırsa, ikinci nüsxəni açma, açıq olanı qabağa gətir.
func alreadyRunning() bool {
	procCreateMutex.Call(0, 0, uintptr(unsafe.Pointer(u16("EMGRAPHIC_ERP_TEK_NUSXE"))))
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
	if alreadyRunning() {
		return
	}
	exe, _ := os.Executable()
	index := filepath.Join(filepath.Dir(exe), "app", "index.html")
	if _, err := os.Stat(index); err != nil {
		message("Proqram faylı tapılmadı:\n" + index + "\n\nZIP-i tam çıxarın və proqramı EMGRAPHIC-ERP qovluğundan açın.")
		return
	}

	// Məlumat (satışlar, anbar) burada saxlanır: %APPDATA%\EMGRAPHIC ERP\WebView2
	cfg, _ := os.UserConfigDir()
	data := filepath.Join(cfg, "EMGRAPHIC ERP", "WebView2")
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

	// Məlumat faylı və ehtiyat qovluğu (proqram qovluğunda "ehtiyat")
	home, _ := os.UserHomeDir()
	programDir := filepath.Dir(exe)
	st := &store{
		dataFile:  filepath.Join(cfg, "EMGRAPHIC ERP", "data", "emgraphic-data.json"),
		backupDir: chooseBackupDir(programDir, home),
	}
	w.Bind("erpLoad", st.load)
	w.Bind("erpSave", st.save)
	w.Bind("erpBackup", func(json, kind string) (string, error) { return st.backup(json, kind, time.Now()) })
	w.Bind("erpBackupList", st.list)
	w.Bind("erpBackupRead", st.read)
	w.Bind("erpPaths", func() map[string]string {
		return map[string]string{"data": st.dataFile, "backup": st.backupDir}
	})
	w.Bind("erpOpenFolder", func() error { return exec.Command("explorer.exe", st.backupDir).Start() })

	u := url.URL{Scheme: "file", Path: "/" + filepath.ToSlash(index)}
	w.Navigate(u.String())
	w.Run()
}
