//go:build !windows

package main

// Yalnız sınaq üçün (Linux): go run ./setup <qovluq> — faylları çıxarır.
import (
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("istifadə: setup <qovluq>")
		os.Exit(2)
	}
	n, err := extract(os.Args[1])
	if err != nil {
		fmt.Println("xəta:", err)
		os.Exit(1)
	}
	fmt.Println("çıxarıldı:", n, "fayl, versiya", version, "ölçü KB", payloadSize())
}
