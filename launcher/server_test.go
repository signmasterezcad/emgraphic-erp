package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestSyncStoreCAS(t *testing.T) {
	dir := t.TempDir()
	ss := newSyncStore(&store{dataFile: filepath.Join(dir, "d", "kassa-data.json"), backupDir: filepath.Join(dir, "e")})
	v0, d, err := ss.get()
	if err != nil || d != "" || v0 == 0 {
		t.Fatalf("başlanğıc: %v %q %v", v0, d, err)
	}
	ok, v1, _, err := ss.put(v0, `{"a":1}`)
	if !ok || err != nil || v1 != v0+1 {
		t.Fatalf("ilk yazı: %v %v %v", ok, v1, err)
	}
	// köhnə versiya ilə yazı qəbul olunmur, ən son məlumat qaytarılır
	ok, v, cur, _ := ss.put(v0, `{"a":2}`)
	if ok || v != v1 || cur != `{"a":1}` {
		t.Fatalf("toqquşma: %v %v %q", ok, v, cur)
	}
	if b, _ := os.ReadFile(ss.st.dataFile); string(b) != `{"a":1}` {
		t.Fatalf("faylda: %s", b)
	}
}

func TestPhoneHandler(t *testing.T) {
	dir := t.TempDir()
	app := filepath.Join(dir, "app")
	os.MkdirAll(app, 0o755)
	os.WriteFile(filepath.Join(app, "index.html"), []byte("<html><head><title>K</title></head></html>"), 0o644)
	st := &store{dataFile: filepath.Join(dir, "d", "kassa-data.json"), backupDir: filepath.Join(dir, "e")}
	ps := newPhoneServer(newSyncStore(st), app, dir)
	code := ps.code()
	if len(code) != 6 || ps.code() != code {
		t.Fatalf("kod: %q", code)
	}
	h := ps.handler()
	do := func(method, path, key, body string) *httptest.ResponseRecorder {
		r := httptest.NewRequest(method, path, strings.NewReader(body))
		if key != "" {
			r.Header.Set("X-Kassa-Key", key)
		}
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		return w
	}
	if w := do("GET", "/", "", ""); w.Code != 200 || !strings.Contains(w.Body.String(), `name="kassa-remote"`) {
		t.Fatalf("index: %d %s", w.Code, w.Body)
	}
	if w := do("GET", "/api/state", "", ""); w.Code != 401 {
		t.Fatalf("kodsuz giriş olmamalıdır: %d", w.Code)
	}
	if w := do("GET", "/api/state", "000000", ""); w.Code != 401 {
		t.Fatalf("səhv kod: %d", w.Code)
	}
	var st1 struct {
		Ver  int64
		Data string
	}
	json.Unmarshal(do("GET", "/api/state", code, "").Body.Bytes(), &st1)
	body, _ := json.Marshal(map[string]any{"base": st1.Ver, "data": `{"x":1}`})
	var res map[string]any
	json.Unmarshal(do("POST", "/api/save", code, string(body)).Body.Bytes(), &res)
	if res["ok"] != true {
		t.Fatalf("yazı: %v", res)
	}
	json.Unmarshal(do("POST", "/api/save", code, string(body)).Body.Bytes(), &res)
	if res["ok"] != false || res["data"] != `{"x":1}` {
		t.Fatalf("toqquşma: %v", res)
	}
	if w := do("POST", "/api/backup", code, `{"data":"{\"x\":1}","kind":"emel"}`); w.Code != 200 {
		t.Fatalf("ehtiyat: %d %s", w.Code, w.Body)
	}
	if l, _ := st.list(); len(l) != 1 || kindOf(l[0].Name) != "emel" {
		t.Fatalf("ehtiyat siyahısı: %v", l)
	}
	if len(ps.info()["seen"].([]seenInfo)) != 1 {
		t.Fatal("qoşulan cihaz görünməlidir")
	}
	old := code
	if ps.newCode() == old && ps.newCode() == old {
		t.Fatal("yeni kod dəyişməlidir")
	}
	if w := do("GET", "/api/ver", old, ""); w.Code != 401 {
		t.Fatal("köhnə kod artıq işləməməlidir")
	}
	if err := ps.start("127.0.0.1:0"); err != nil || !ps.running() {
		t.Fatalf("start: %v", err)
	}
	ps.stop()
	if ps.running() {
		t.Fatal("stop")
	}
	_ = http.StatusOK
}
