package main

// 🔄 Proqramın içindən yeniləmə: GitHub-dakı son versiyanı yoxlayır (erpLatest),
// "Yenilə" basılanda yenile.ps1-i ayrıca pəncərədə işə salır (erpUpdate, main.go — yalnız Windows).

import (
	"errors"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

var latestURL = "https://raw.githubusercontent.com/signmasterezcad/kassa/main/app/index.html"

var verRe = regexp.MustCompile(`APP_VERSION="([0-9][0-9.]*)"`)

var latestClient = &http.Client{Timeout: 20 * time.Second}

// latestVersion GitHub-dakı index.html-dən APP_VERSION-u oxuyur (məs. "0.40.0").
func latestVersion() (string, error) {
	resp, err := latestClient.Get(latestURL + "?t=" + strconv.FormatInt(time.Now().Unix(), 10))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return "", errors.New("GitHub cavabı: " + resp.Status)
	}
	b, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return "", err
	}
	m := verRe.FindSubmatch(b)
	if m == nil || !strings.Contains(string(b), "KASSA") {
		return "", errors.New("versiya tapılmadı")
	}
	return string(m[1]), nil
}

// updateCommand yenile.ps1-i işə salan PowerShell əmri: səhv olsa pəncərə açıq qalır (oxumaq üçün),
// alınsa 3 saniyədən sonra özü bağlanır. yenile.ps1 KASSA-nı özü bağlayıb yenidən açır.
func updateCommand(script string) string {
	q := strings.ReplaceAll(script, "'", "''")
	return "$host.UI.RawUI.WindowTitle = 'KASSA yenilənir'; $ok = $true; try { & '" + q + "'; if ($LASTEXITCODE) { $ok = $false } } catch { Write-Host $_ -ForegroundColor Red; $ok = $false }; " +
		"if ($ok) { Start-Sleep -Seconds 3 } else { Read-Host 'Pəncərəni bağlamaq üçün Enter basın' }"
}
