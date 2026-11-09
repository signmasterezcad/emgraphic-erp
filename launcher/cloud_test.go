package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestKV(t *testing.T) {
	dir := t.TempDir()
	if v, err := kvGet(dir, "base"); err != nil || v != "" {
		t.Fatalf("boş: %q %v", v, err)
	}
	if err := kvSet(dir, "base", `{"a":1}`); err != nil {
		t.Fatal(err)
	}
	if v, _ := kvGet(dir, "base"); v != `{"a":1}` {
		t.Fatalf("oxu: %q", v)
	}
	for _, bad := range []string{"../x", "A", "a/b", ""} {
		if err := kvSet(dir, bad, "x"); err == nil {
			t.Fatalf("qadağan ad keçdi: %q", bad)
		}
	}
	kvSet(dir, "base", "")
	if v, _ := kvGet(dir, "base"); v != "" {
		t.Fatal("silinməli idi")
	}
}

func TestFetch(t *testing.T) {
	for u, want := range map[string]bool{
		"https://firestore.googleapis.com/v1/x": true, "https://identitytoolkit.googleapis.com/v1/a": true,
		"https://securetoken.googleapis.com/v1/token": true, "http://127.0.0.1:9/x": true,
		"https://evil.com/x": false, "https://googleapis.com.evil.com/x": false, "http://firestore.googleapis.com/x": false, "file:///etc/passwd": false,
	} {
		if fetchAllowed(u) != want {
			t.Fatalf("%s: %v olmalıdır", u, want)
		}
	}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(201)
		w.Write([]byte(r.Method + " " + r.Header.Get("Authorization")))
	}))
	defer srv.Close()
	res, err := doFetch("POST", srv.URL+"/x", `{"Authorization":"Bearer T"}`, "{}")
	if err != nil || res.Status != 201 || res.Body != "POST Bearer T" {
		t.Fatalf("%v %+v", err, res)
	}
	if _, err := doFetch("GET", "https://example.com/", "", ""); err == nil {
		t.Fatal("icazəsiz ünvan")
	}
}
