//go:build windows

package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"
	"unsafe"

	"golang.org/x/sys/windows/registry"
)

const appName = "KASSA"
const uninstKey = `Software\Microsoft\Windows\CurrentVersion\Uninstall\KASSA`

var (
	user32     = syscall.NewLazyDLL("user32.dll")
	messageBox = user32.NewProc("MessageBoxW")
)

const (
	mbOK       = 0x0
	mbYesNo    = 0x4
	mbIconErr  = 0x10
	mbIconQ    = 0x20
	mbIconInfo = 0x40
	idYes      = 6
)

func u16(s string) *uint16 { p, _ := syscall.UTF16PtrFromString(s); return p }
func box(text string, flags uintptr) int {
	r, _, _ := messageBox.Call(0, uintptr(unsafe.Pointer(u16(text))), uintptr(unsafe.Pointer(u16("KASSA — quraşdırma"))), flags)
	return int(r)
}

func hidden(name string, args ...string) *exec.Cmd {
	c := exec.Command(name, args...)
	c.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000}
	return c
}

func installDir() string {
	if d := os.Getenv("LOCALAPPDATA"); d != "" {
		return filepath.Join(d, "Programs", appName)
	}
	h, _ := os.UserHomeDir()
	return filepath.Join(h, "AppData", "Local", "Programs", appName)
}

// Qısayollar: iş masası və Start menyusu (PowerShell WScript.Shell ilə)
func shortcuts(dir string, remove bool) {
	ps := `$s = New-Object -ComObject WScript.Shell
$desk = [Environment]::GetFolderPath('Desktop')
$menu = Join-Path ([Environment]::GetFolderPath('Programs')) 'KASSA.lnk'
foreach ($p in @((Join-Path $desk 'KASSA.lnk'), $menu, (Join-Path $env:KASSA_DIR 'KASSA.lnk'))) {
  if ($env:KASSA_REMOVE -eq '1') { if (Test-Path $p) { Remove-Item $p -Force }; continue }
  $l = $s.CreateShortcut($p); $l.TargetPath = (Join-Path $env:KASSA_DIR 'KASSA.exe'); $l.WorkingDirectory = $env:KASSA_DIR
  $l.Description = 'KASSA'; $l.IconLocation = (Join-Path $env:KASSA_DIR 'app\kassa.ico') + ',0'; $l.Save()
}`
	rm := "0"
	if remove {
		rm = "1"
	}
	c := hidden("powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", ps)
	c.Env = append(os.Environ(), "KASSA_DIR="+dir, "KASSA_REMOVE="+rm)
	c.Run()
}

func register(dir string) {
	k, _, err := registry.CreateKey(registry.CURRENT_USER, uninstKey, registry.SET_VALUE)
	if err != nil {
		return
	}
	defer k.Close()
	k.SetStringValue("DisplayName", appName)
	k.SetStringValue("DisplayVersion", version)
	k.SetStringValue("Publisher", appName)
	k.SetStringValue("InstallLocation", dir)
	k.SetStringValue("DisplayIcon", filepath.Join(dir, "app", "kassa.ico"))
	k.SetStringValue("UninstallString", `"`+filepath.Join(dir, "uninstall.exe")+`" /uninstall`)
	k.SetDWordValue("NoModify", 1)
	k.SetDWordValue("NoRepair", 1)
	k.SetDWordValue("EstimatedSize", uint32(payloadSize()))
}

func running() bool {
	out, err := hidden("tasklist", "/FI", "IMAGENAME eq KASSA.exe", "/NH").Output()
	return err == nil && strings.Contains(strings.ToUpper(string(out)), "KASSA.EXE")
}

func install() {
	dir := installDir()
	_, statErr := os.Stat(filepath.Join(dir, "KASSA.exe"))
	what := "quraşdırılsın"
	if statErr == nil {
		what = "yenilənsin (satışlarınız və ayarlarınız qalır)"
	}
	if box(fmt.Sprintf("KASSA v%s %s?\n\nYer: %s\n\nKompüterin admin icazəsi lazım deyil.", version, what, dir), mbYesNo|mbIconQ) != idYes {
		return
	}
	for running() {
		if box("KASSA hazırda açıqdır. Onu bağlayın, sonra \"Bəli\" basın.\n(\"Xeyr\" — quraşdırmanı dayandır)", mbYesNo|mbIconQ) != idYes {
			return
		}
		time.Sleep(time.Second)
	}
	if _, err := extract(dir); err != nil {
		box("Quraşdırmaq alınmadı:\n"+err.Error(), mbOK|mbIconErr)
		return
	}
	// silmə proqramı: bu setup-ın özü (/uninstall ilə işləyir)
	if self, err := os.Executable(); err == nil {
		if b, err := os.ReadFile(self); err == nil {
			os.WriteFile(filepath.Join(dir, "uninstall.exe"), b, 0o755)
		}
	}
	shortcuts(dir, false)
	register(dir)
	if box("KASSA quraşdırıldı ✓\n\nİş masasında və Start menyusunda \"KASSA\" ikonu var.\nYeniləmə üçün proqram qovluğundakı YENILE.bat işləyir.\n\nİndi açılsın?", mbYesNo|mbIconInfo) == idYes {
		c := exec.Command(filepath.Join(dir, "KASSA.exe"))
		c.Dir = dir
		c.Start()
	}
}

func uninstall() {
	dir := installDir()
	if self, err := os.Executable(); err == nil {
		dir = filepath.Dir(self)
	}
	if box("KASSA kompüterdən silinsin?\n\nSatış və ayar məlumatınız (%APPDATA%\\KASSA) SİLİNMİR — yenidən quraşdıranda yerində olacaq.\nProqram qovluğundakı \"ehtiyat\" nüsxələri də saxlanılır.", mbYesNo|mbIconQ) != idYes {
		return
	}
	for running() {
		if box("KASSA hazırda açıqdır. Onu bağlayın, sonra \"Bəli\" basın.", mbYesNo|mbIconQ) != idYes {
			return
		}
		time.Sleep(time.Second)
	}
	shortcuts(dir, true)
	registry.DeleteKey(registry.CURRENT_USER, uninstKey)
	entries, _ := os.ReadDir(dir)
	for _, e := range entries {
		n := strings.ToLower(e.Name())
		if n == "ehtiyat" || n == "uninstall.exe" {
			continue
		}
		os.RemoveAll(filepath.Join(dir, e.Name()))
	}
	// özünü sil (işləyən fayl dərhal silinmir — bir neçə saniyə sonra)
	hidden("cmd.exe", "/c", "ping -n 3 127.0.0.1 >nul & del /f /q \""+filepath.Join(dir, "uninstall.exe")+"\"").Start()
	box("KASSA silindi.\nMəlumatınız saxlanılıb.", mbOK|mbIconInfo)
}

func main() {
	for _, a := range os.Args[1:] {
		if strings.EqualFold(a, "/uninstall") || strings.EqualFold(a, "-uninstall") {
			uninstall()
			return
		}
	}
	install()
}
