package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestExtract(t *testing.T) {
	if _, err := payload.Open("payload/KASSA.exe"); err != nil {
		t.Skip("payload boşdur (build-setup.sh doldurur)")
	}
	dir := t.TempDir()
	os.MkdirAll(filepath.Join(dir, "ehtiyat"), 0o755)
	os.WriteFile(filepath.Join(dir, "ehtiyat", "kassa-1.json"), []byte("{}"), 0o644)
	n, err := extract(dir)
	if err != nil || n == 0 {
		t.Fatalf("%d %v", n, err)
	}
	for _, f := range []string{"KASSA.exe", "app/index.html", "app/files.txt", "YENILE.bat", "yenile.ps1"} {
		if _, err := os.Stat(filepath.Join(dir, f)); err != nil {
			t.Fatalf("fayl yoxdur: %s", f)
		}
	}
	if _, err := os.Stat(filepath.Join(dir, "ehtiyat", "kassa-1.json")); err != nil {
		t.Fatal("ehtiyat nüsxəsinə toxunulmamalıdır")
	}
	if n2, err := extract(dir); err != nil || n2 != n {
		t.Fatalf("təkrar quraşdırma: %d %v", n2, err)
	}
}
