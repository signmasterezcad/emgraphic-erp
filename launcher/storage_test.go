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
	if !strings.HasPrefix(l[0].Name, "kassa-") || !strings.Contains(l[0].Name, "2026-11-02_19-00-00-avto") {
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

func TestOldBackupsAndMigration(t *testing.T) {
	dir := t.TempDir()
	s := &store{dataFile: filepath.Join(dir, "KASSA", "data", "kassa-data.json"), backupDir: filepath.Join(dir, "ehtiyat")}
	os.MkdirAll(s.backupDir, 0o755)
	os.WriteFile(filepath.Join(s.backupDir, "emgraphic-2026-11-05_10-00-00-avto.json"), []byte(`{"old":1}`), 0o644)
	s.backup(`{"new":1}`, "el", time.Date(2026, 11, 9, 9, 0, 0, 0, time.Local))
	l, _ := s.list()
	if len(l) != 2 || !strings.HasPrefix(l[0].Name, "kassa-") || !strings.HasPrefix(l[1].Name, "emgraphic-") {
		t.Fatalf("köhnə və yeni nüsxələr, yenisi birinci: %+v", l)
	}
	if got, err := s.read(l[1].Name); err != nil || got != `{"old":1}` {
		t.Fatalf("köhnə nüsxə oxunmalıdır: %q %v", got, err)
	}

	old := filepath.Join(dir, "EMGRAPHIC ERP", "data", "emgraphic-data.json")
	if moved, _ := migrateOld(s.dataFile, old); moved {
		t.Fatal("köhnə fayl yoxdursa, köçürmə olmamalıdır")
	}
	os.MkdirAll(filepath.Dir(old), 0o755)
	os.WriteFile(old, []byte(`{"sales":[1,2,3]}`), 0o644)
	if moved, err := migrateOld(s.dataFile, old); !moved || err != nil {
		t.Fatalf("köçürmə alınmadı: %v", err)
	}
	if got, _ := s.load(); got != `{"sales":[1,2,3]}` {
		t.Fatalf("köçürülən məlumat: %q", got)
	}
	if _, err := os.Stat(old); err != nil {
		t.Fatal("köhnə fayl ehtiyat kimi qalmalıdır")
	}
	s.save(`{"sales":[1,2,3,4]}`)
	if moved, _ := migrateOld(s.dataFile, old); moved {
		t.Fatal("yeni fayl varsa, köhnə onun üstünə yazılmamalıdır")
	}
	if got, _ := s.load(); got != `{"sales":[1,2,3,4]}` {
		t.Fatalf("yeni məlumat qorunmalıdır: %q", got)
	}
}
