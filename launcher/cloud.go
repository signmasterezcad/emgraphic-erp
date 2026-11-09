package main

// ☁️ Bulud (Firebase) üçün kompüter tərəfi. Windows-dan asılı deyil, Linux-da test olunur.
//   - kvGet/kvSet: bulud vəziyyəti (son ortaq məlumat, kursor, ayar) %APPDATA%\KASSA\data\bulud-*.json fayllarında
//   - doFetch: Google-a HTTP sorğusu exe-nin içindən (file:// səhifəsindən brauzer CORS-u ilə işləmir)

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

var kvName = regexp.MustCompile(`^[a-z0-9-]{1,40}$`)

func kvPath(dir, name string) (string, error) {
	if !kvName.MatchString(name) {
		return "", errors.New("ad düzgün deyil")
	}
	return filepath.Join(dir, "bulud-"+name+".json"), nil
}

func kvGet(dir, name string) (string, error) {
	p, err := kvPath(dir, name)
	if err != nil {
		return "", err
	}
	b, err := os.ReadFile(p)
	if errors.Is(err, os.ErrNotExist) {
		return "", nil
	}
	return string(b), err
}

func kvSet(dir, name, text string) error {
	p, err := kvPath(dir, name)
	if err != nil {
		return err
	}
	if text == "" {
		os.Remove(p)
		return nil
	}
	return writeAtomic(p, []byte(text))
}

type fetchRes struct {
	Status int    `json:"status"`
	Body   string `json:"body"`
}

// Yalnız Google xidmətlərinə (və sınaq üçün bu kompüterə) icazə var.
func fetchAllowed(raw string) bool {
	u, err := url.Parse(raw)
	if err != nil {
		return false
	}
	h := u.Hostname()
	if u.Scheme == "https" && (h == "googleapis.com" || strings.HasSuffix(h, ".googleapis.com")) {
		return true
	}
	return u.Scheme == "http" && (h == "127.0.0.1" || h == "localhost")
}

var fetchClient = &http.Client{Timeout: 45 * time.Second}

func doFetch(method, rawURL, headersJSON, body string) (fetchRes, error) {
	if !fetchAllowed(rawURL) {
		return fetchRes{}, errors.New("bu ünvana icazə yoxdur: " + rawURL)
	}
	req, err := http.NewRequest(method, rawURL, strings.NewReader(body))
	if err != nil {
		return fetchRes{}, err
	}
	if headersJSON != "" {
		h := map[string]string{}
		if err := json.Unmarshal([]byte(headersJSON), &h); err != nil {
			return fetchRes{}, err
		}
		for k, v := range h {
			req.Header.Set(k, v)
		}
	}
	resp, err := fetchClient.Do(req)
	if err != nil {
		return fetchRes{}, err
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(io.LimitReader(resp.Body, 64<<20))
	if err != nil {
		return fetchRes{}, err
	}
	return fetchRes{Status: resp.StatusCode, Body: string(b)}, nil
}
