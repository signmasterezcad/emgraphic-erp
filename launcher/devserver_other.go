//go:build !windows

package main

// Yalnız sınaq üçün (Linux): telefon serverini pəncərəsiz işə salır.
//   go run . -app ../app -data /tmp/kassa-sinaq -addr 127.0.0.1:8765 -code 123456

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	app := flag.String("app", "../app", "proqram qovluğu (index.html)")
	data := flag.String("data", os.TempDir(), "məlumat qovluğu")
	addr := flag.String("addr", "127.0.0.1:8765", "ünvan")
	code := flag.String("code", "", "telefon kodu")
	flag.Parse()
	st := &store{dataFile: filepath.Join(*data, "data", "kassa-data.json"), backupDir: filepath.Join(*data, "ehtiyat")}
	ps := newPhoneServer(newSyncStore(st), *app, *data)
	if *code != "" {
		os.MkdirAll(*data, 0o755)
		os.WriteFile(ps.keyFile, []byte(*code), 0o600)
	}
	if err := ps.start(*addr); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	fmt.Println("hazır", *addr, ps.code())
	select {}
}
