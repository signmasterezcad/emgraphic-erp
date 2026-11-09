package main

// Məlumat faylı və ehtiyat nüsxələr. Bu fayl Windows-dan asılı deyil, ona görə Linux-da da test olunur.

import (
	"errors"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// Neçə ehtiyat nüsxə saxlanılsın (köhnələri silinir).
const keepBackups = 30

// Ehtiyat fayllarının adı: yenilər "kassa-", köhnələr "emgraphic-" ilə başlayır (ikisi də tanınır).
const backupPrefix = "kassa-"

var backupPrefixes = []string{"kassa-", "emgraphic-"}

type store struct {
	dataFile  string // %APPDATA%\KASSA\data\kassa-data.json
	backupDir string // proqram qovluğu\ehtiyat (yazmaq olmasa: Sənədlər\KASSA ehtiyat)
}

type backupInfo struct {
	Name string `json:"name"`
	Size int64  `json:"size"`
	Time int64  `json:"time"` // millisaniyə
}

// writeAtomic faylı əvvəl müvəqqəti adla yazır, sonra əvəz edir:
// yazı yarıda kəsilsə (işıq sönsə), köhnə fayl xarab olmur.
func writeAtomic(path string, data []byte) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	tmp := path + ".yazilir"
	f, err := os.Create(tmp)
	if err != nil {
		return err
	}
	if _, err := f.Write(data); err != nil {
		f.Close()
		return err
	}
	if err := f.Sync(); err != nil {
		f.Close()
		return err
	}
	if err := f.Close(); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

func (s *store) load() (string, error) {
	b, err := os.ReadFile(s.dataFile)
	if errors.Is(err, os.ErrNotExist) {
		return "", nil
	}
	return string(b), err
}

func (s *store) save(json string) error {
	if len(json) < 2 || json[0] != '{' {
		return errors.New("məlumat düzgün deyil, yazılmadı")
	}
	return writeAtomic(s.dataFile, []byte(json))
}

// usableDir qovluğun yaradıla və yazıla bildiyini yoxlayır.
func usableDir(dir string) bool {
	if os.MkdirAll(dir, 0o755) != nil {
		return false
	}
	probe := filepath.Join(dir, ".yoxlama")
	if os.WriteFile(probe, []byte("ok"), 0o644) != nil {
		return false
	}
	os.Remove(probe)
	return true
}

func chooseBackupDir(programDir, home string) string {
	primary := filepath.Join(programDir, "ehtiyat")
	if usableDir(primary) {
		return primary
	}
	return filepath.Join(home, "Documents", "KASSA ehtiyat")
}

func (s *store) backup(json, kind string, now time.Time) (string, error) {
	if len(json) < 2 || json[0] != '{' {
		return "", errors.New("məlumat düzgün deyil")
	}
	if kind != "avto" {
		kind = "el"
	}
	name := backupPrefix + now.Format("2006-01-02_15-04-05") + "-" + kind + ".json"
	path := filepath.Join(s.backupDir, name)
	if err := writeAtomic(path, []byte(json)); err != nil {
		return "", err
	}
	s.prune()
	return path, nil
}

func (s *store) list() ([]backupInfo, error) {
	entries, err := os.ReadDir(s.backupDir)
	if errors.Is(err, os.ErrNotExist) {
		return []backupInfo{}, nil
	}
	if err != nil {
		return nil, err
	}
	out := []backupInfo{}
	for _, e := range entries {
		n := e.Name()
		if e.IsDir() || !hasBackupPrefix(n) || !strings.HasSuffix(n, ".json") {
			continue
		}
		if fi, err := e.Info(); err == nil {
			out = append(out, backupInfo{Name: n, Size: fi.Size(), Time: fi.ModTime().UnixMilli()})
		}
	}
	// ən yenisi birinci (adda tarix var; prefiksi çıxarıb müqayisə edirik)
	sort.Slice(out, func(i, j int) bool { return stripPrefix(out[i].Name) > stripPrefix(out[j].Name) })
	return out, nil
}

func (s *store) prune() {
	l, err := s.list()
	if err != nil {
		return
	}
	for i := keepBackups; i < len(l); i++ {
		os.Remove(filepath.Join(s.backupDir, l[i].Name))
	}
}

// read yalnız ehtiyat qovluğundakı faylı oxuyur (başqa yola çıxmaq olmaz).
func (s *store) read(name string) (string, error) {
	if name != filepath.Base(name) || strings.ContainsAny(name, `/\:`) || !strings.HasSuffix(name, ".json") {
		return "", errors.New("fayl adı düzgün deyil")
	}
	b, err := os.ReadFile(filepath.Join(s.backupDir, name))
	return string(b), err
}

func hasBackupPrefix(n string) bool {
	for _, p := range backupPrefixes {
		if strings.HasPrefix(n, p) {
			return true
		}
	}
	return false
}

func stripPrefix(n string) string {
	for _, p := range backupPrefixes {
		if strings.HasPrefix(n, p) {
			return n[len(p):]
		}
	}
	return n
}

// migrateOld köhnə məlumat faylını (EMGRAPHIC ERP) yeni yerə (KASSA) bir dəfə köçürür.
// Yeni fayl artıq varsa, heç nə etmir. Köhnə fayl silinmir, ehtiyat kimi qalır.
func migrateOld(newFile, oldFile string) (bool, error) {
	if _, err := os.Stat(newFile); err == nil {
		return false, nil
	}
	b, err := os.ReadFile(oldFile)
	if errors.Is(err, os.ErrNotExist) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	if err := writeAtomic(newFile, b); err != nil {
		return false, err
	}
	return true, nil
}
