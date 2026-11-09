package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestLatestVersion(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`<title>KASSA</title><script>const APP_VERSION="0.40.1";</script>`))
	}))
	defer srv.Close()
	old := latestURL
	latestURL = srv.URL + "/app/index.html"
	defer func() { latestURL = old }()
	v, err := latestVersion()
	if err != nil || v != "0.40.1" {
		t.Fatal(v, err)
	}
}

func TestUpdateCommand(t *testing.T) {
	c := updateCommand(`C:\Users\O'Neil\KASSA\yenile.ps1`)
	if !strings.Contains(c, `& 'C:\Users\O''Neil\KASSA\yenile.ps1'`) || !strings.Contains(c, "Read-Host") {
		t.Fatal(c)
	}
}
