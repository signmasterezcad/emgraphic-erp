package main

// Telefon üçün yerli şəbəkə (Wi-Fi) serveri və kompüterlə telefonun ortaq məlumatı.
// Bu fayl Windows-dan asılı deyil, ona görə Linux-da da test olunur.
//
// Məlumat bir yerdədir: kompüterdəki kassa-data.json. Kompüter (WebView2) də, telefon (brauzer) da
// onu eyni qayda ilə oxuyub yazır: hər yazının "versiyası" var. Yazanda köhnə versiyanı göstərmək lazımdır;
// arada başqası yazıbsa, yazı qəbul olunmur, ən son məlumat geri qaytarılır və proqram (index.html)
// iki tərəfin dəyişikliyini birləşdirib yenidən yazır. Beləcə heç bir satış itmir.

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
)

const phonePort = 8765

// syncStore: məlumat faylı + yaddaşdakı versiya (kompüter və telefon ortaq istifadə edir).
type syncStore struct {
	st     *store
	mu     sync.Mutex
	ver    int64
	data   string
	loaded bool
}

func newSyncStore(st *store) *syncStore { return &syncStore{st: st} }

func (s *syncStore) ensure() error {
	if s.loaded {
		return nil
	}
	d, err := s.st.load()
	if err != nil {
		return err
	}
	s.data, s.ver, s.loaded = d, time.Now().UnixMilli(), true // yenidən açılanda da yeni versiya
	return nil
}

func (s *syncStore) get() (int64, string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if err := s.ensure(); err != nil {
		return 0, "", err
	}
	return s.ver, s.data, nil
}

func (s *syncStore) version() (int64, error) {
	v, _, err := s.get()
	return v, err
}

// put yalnız base indiki versiyaya bərabərdirsə yazır. Deyilsə ok=false və ən son məlumat qaytarılır.
func (s *syncStore) put(base int64, data string) (ok bool, ver int64, cur string, err error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if err = s.ensure(); err != nil {
		return
	}
	if base != s.ver {
		return false, s.ver, s.data, nil
	}
	if err = s.st.save(data); err != nil {
		return
	}
	s.data = data
	s.ver++
	return true, s.ver, "", nil
}

// ---------- Telefon serveri ----------

type phoneServer struct {
	mu      sync.Mutex
	ss      *syncStore
	appDir  string // proqram qovluğu\app (index.html, şriftlər)
	keyFile string // telefon kodu
	srv     *http.Server
	seenMu  sync.Mutex
	seen    map[string]time.Time
	lastErr string
}

func newPhoneServer(ss *syncStore, appDir, dataRoot string) *phoneServer {
	return &phoneServer{ss: ss, appDir: appDir, keyFile: filepath.Join(dataRoot, "telefon-kodu"), seen: map[string]time.Time{}}
}

func randomCode() string {
	n, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return fmt.Sprint(100000 + time.Now().UnixNano()%900000)
	}
	return fmt.Sprint(100000 + n.Int64())
}

// code telefon kodunu oxuyur (yoxdursa yaradır).
func (p *phoneServer) code() string {
	if b, err := os.ReadFile(p.keyFile); err == nil {
		if c := strings.TrimSpace(string(b)); len(c) >= 4 {
			return c
		}
	}
	return p.newCode()
}

func (p *phoneServer) newCode() string {
	c := randomCode()
	os.MkdirAll(filepath.Dir(p.keyFile), 0o755)
	os.WriteFile(p.keyFile, []byte(c), 0o600)
	return c
}

func (p *phoneServer) running() bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.srv != nil
}

// start serveri bütün şəbəkə ünvanlarında (Wi-Fi) açır.
func (p *phoneServer) start(addr string) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.srv != nil {
		return nil
	}
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		p.lastErr = err.Error()
		return fmt.Errorf("telefon üçün %s portu açılmadı: %v", addr, err)
	}
	p.lastErr = ""
	srv := &http.Server{Handler: p.handler(), ReadHeaderTimeout: 10 * time.Second}
	p.srv = srv
	go srv.Serve(ln)
	return nil
}

func (p *phoneServer) stop() {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.srv != nil {
		p.srv.Close()
		p.srv = nil
	}
}

// localIPs kompüterin Wi-Fi / şəbəkə ünvanları (telefonda yazılacaq).
func localIPs() []string {
	out := []string{}
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return out
	}
	for _, a := range addrs {
		ipn, ok := a.(*net.IPNet)
		if !ok {
			continue
		}
		ip := ipn.IP.To4()
		if ip == nil || ip.IsLoopback() || !ip.IsPrivate() {
			continue
		}
		out = append(out, ip.String())
	}
	sort.Strings(out)
	return out
}

type seenInfo struct {
	IP  string `json:"ip"`
	Ago int64  `json:"ago"` // saniyə
}

func (p *phoneServer) info() map[string]any {
	p.seenMu.Lock()
	seen := []seenInfo{}
	for ip, t := range p.seen {
		seen = append(seen, seenInfo{ip, int64(time.Since(t).Seconds())})
	}
	p.seenMu.Unlock()
	sort.Slice(seen, func(i, j int) bool { return seen[i].Ago < seen[j].Ago })
	return map[string]any{"on": p.running(), "port": phonePort, "ips": localIPs(), "code": p.code(), "seen": seen, "error": p.lastErr}
}

func (p *phoneServer) authed(r *http.Request) bool {
	k := r.Header.Get("X-Kassa-Key")
	c := p.code()
	if subtle.ConstantTimeCompare([]byte(k), []byte(c)) != 1 {
		return false
	}
	host, _, _ := net.SplitHostPort(r.RemoteAddr)
	p.seenMu.Lock()
	p.seen[host] = time.Now()
	p.seenMu.Unlock()
	return true
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	json.NewEncoder(w).Encode(v)
}

func httpErr(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(code)
	w.Write([]byte(msg))
}

func (p *phoneServer) handler() http.Handler {
	mux := http.NewServeMux()
	api := func(path string, fn func(w http.ResponseWriter, r *http.Request) error) {
		mux.HandleFunc(path, func(w http.ResponseWriter, r *http.Request) {
			if !p.authed(r) {
				httpErr(w, http.StatusUnauthorized, "telefon kodu səhvdir")
				return
			}
			r.Body = http.MaxBytesReader(w, r.Body, 64<<20)
			if err := fn(w, r); err != nil {
				httpErr(w, http.StatusInternalServerError, err.Error())
			}
		})
	}
	api("/api/ver", func(w http.ResponseWriter, r *http.Request) error {
		v, err := p.ss.version()
		if err != nil {
			return err
		}
		writeJSON(w, map[string]any{"ver": v})
		return nil
	})
	api("/api/state", func(w http.ResponseWriter, r *http.Request) error {
		v, d, err := p.ss.get()
		if err != nil {
			return err
		}
		writeJSON(w, map[string]any{"ver": v, "data": d})
		return nil
	})
	api("/api/save", func(w http.ResponseWriter, r *http.Request) error {
		var in struct {
			Base int64  `json:"base"`
			Data string `json:"data"`
		}
		if r.Method != http.MethodPost {
			return errors.New("POST lazımdır")
		}
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			return err
		}
		ok, v, cur, err := p.ss.put(in.Base, in.Data)
		if err != nil {
			return err
		}
		res := map[string]any{"ok": ok, "ver": v}
		if !ok {
			res["data"] = cur
		}
		writeJSON(w, res)
		return nil
	})
	api("/api/backup", func(w http.ResponseWriter, r *http.Request) error {
		if r.Method == http.MethodPost {
			var in struct{ Data, Kind string }
			if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
				return err
			}
			path, err := p.ss.st.backup(in.Data, in.Kind, time.Now())
			if err != nil {
				return err
			}
			writeJSON(w, map[string]any{"path": path})
			return nil
		}
		d, err := p.ss.st.read(r.URL.Query().Get("name"))
		if err != nil {
			return err
		}
		writeJSON(w, map[string]any{"data": d})
		return nil
	})
	api("/api/backups", func(w http.ResponseWriter, r *http.Request) error {
		l, err := p.ss.st.list()
		if err != nil {
			return err
		}
		writeJSON(w, l)
		return nil
	})
	api("/api/kinds", func(w http.ResponseWriter, r *http.Request) error { writeJSON(w, backupKinds()); return nil })
	api("/api/paths", func(w http.ResponseWriter, r *http.Request) error {
		writeJSON(w, map[string]string{"data": p.ss.st.dataFile, "backup": p.ss.st.backupDir})
		return nil
	})
	// Proqramın faylları (index.html, şriftlər, loqo) — kodsuz da açılır, məlumat isə kodla.
	files := http.FileServer(http.Dir(p.appDir))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" || r.URL.Path == "/index.html" {
			b, err := os.ReadFile(filepath.Join(p.appDir, "index.html"))
			if err != nil {
				httpErr(w, http.StatusNotFound, "index.html tapılmadı")
				return
			}
			// Telefonda proqram bilsin ki, məlumatı kompüterdən almalıdır.
			html := strings.Replace(string(b), "<head>", `<head>`+"\n"+`<meta name="kassa-remote" content="1">`, 1)
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Cache-Control", "no-store")
			w.Write([]byte(html))
			return
		}
		w.Header().Set("Cache-Control", "no-cache")
		files.ServeHTTP(w, r)
	})
	return mux
}
