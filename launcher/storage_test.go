package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestStore(t *testing.T) {
	dir := t.TempDir()
	s := &store{dataFile: filepath.Join(dir, "data", "emgraphic-data.json"), backupDir: chooseBackupDir(dir, dir)}

	if got, err := s.load(); err != nil || got != "" {
		t.Fatalf("boş başlanğıc: %q %v", got, err)
	}
	if err := s.save("xarab"); err == nil {
		t.Fatal("düzgün olmayan məlumat yazılmamalıdır")
	}
	if err := s.save(`{"sales":[1]}`); err != nil {
		t.Fatal(err)
	}
	if got, _ := s.load(); got != `{"sales":[1]}` {
		t.Fatalf("oxunan: %q", got)
	}
	if _, err := os.Stat(s.dataFile + ".yazilir"); !os.IsNotExist(err) {
		t.Fatal("müvəqqəti fayl qalmamalıdır")
	}
	if s.backupDir != filepath.Join(dir, "ehtiyat") {
		t.Fatalf("ehtiyat qovluğu: %s", s.backupDir)
	}

	base := time.Date(2026, 11, 1, 9, 0, 0, 0, time.Local)
	for i := 0; i < keepBackups+5; i++ {
		if _, err := s.backup(`{"n":1}`, "avto", base.Add(time.Duration(i)*time.Hour)); err != nil {
			t.Fatal(err)
		}
	}
	l, _ := s.list()
	if len(l) != keepBackups {
		t.Fatalf("saxlanan nüsxə: %d", len(l))
	}
	if !strings.Contains(l[0].Name, "2026-11-02_19-00-00-avto") {
		t.Fatalf("ən yenisi birinci olmalıdır: %s", l[0].Name)
	}
	if got, err := s.read(l[0].Name); err != nil || got != `{"n":1}` {
		t.Fatalf("oxuma: %q %v", got, err)
	}
	for _, bad := range []string{"../data/emgraphic-data.json", `..\x.json`, "C:x.json", "a.txt"} {
		if _, err := s.read(bad); err == nil {
			t.Fatalf("qadağan olunmuş ad oxundu: %s", bad)
		}
	}
}
