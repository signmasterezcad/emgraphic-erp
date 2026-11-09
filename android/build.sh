#!/usr/bin/env bash
# KASSA Android proqramını (APK) yığır. Google-un Android SDK-sı lazım deyil:
#   aapt2 və Android framework faylı — apktool-dan, kodun çevrilməsi — dx, imza — apksig (hamısı Maven Central).
# İstifadə: ./build.sh <versiyaKodu> <versiyaAdı> <keystore.p12> <parol>
set -euo pipefail
cd "$(dirname "$0")"
VC=${1:?versiya kodu}; VN=${2:?versiya adı}; KS=${3:?keystore}; PW=${4:?parol}
W=${KASSA_APK_WORK:-/tmp/kassa-apk}; mkdir -p "$W"
MVN=$(command -v mvn || echo /opt/maven/bin/mvn)
if [ ! -d "$W/deps" ]; then "$MVN" -q -f tools/pom.xml dependency:copy-dependencies -DoutputDirectory="$W/deps"; fi
CP=$(ls "$W"/deps/*.jar | tr '\n' ':')
if [ ! -x "$W/aapt2" ]; then (cd "$W" && unzip -o -q deps/apktool-lib-*.jar prebuilt/linux/aapt2 prebuilt/android-framework.jar && mv prebuilt/linux/aapt2 aapt2 && mv prebuilt/android-framework.jar framework.jar && chmod +x aapt2); fi
rm -rf "$W/out" && mkdir -p "$W/out/classes"
"$W/aapt2" compile --dir res -o "$W/out/res.zip"
"$W/aapt2" link -I "$W/framework.jar" --manifest AndroidManifest.xml --min-sdk-version 24 --target-sdk-version 34 \
  --version-code "$VC" --version-name "$VN" -o "$W/out/base.apk" "$W/out/res.zip"
javac -nowarn -encoding UTF-8 --release 8 -cp "$W/deps/android-4.1.1.4.jar" -d "$W/out/classes" $(find src -name '*.java')
java -cp "$CP" com.android.dx.command.Main --dex --min-sdk-version=24 --output="$W/out/classes.dex" "$W/out/classes"
python3 - "$W/out/base.apk" "$W/out/classes.dex" <<'PY'
import sys,zipfile
with zipfile.ZipFile(sys.argv[1],'a',zipfile.ZIP_DEFLATED) as z: z.write(sys.argv[2],'classes.dex')
PY
javac -nowarn -encoding UTF-8 -cp "$CP" -d "$W/out" tools/Sign.java
java --add-exports java.base/sun.security.x509=ALL-UNNAMED --add-exports java.base/sun.security.pkcs=ALL-UNNAMED --add-exports java.base/sun.security.util=ALL-UNNAMED -cp "$CP$W/out" Sign "$W/out/base.apk" "$W/out/KASSA.apk" "$KS" "$PW"
"$W/aapt2" dump badging "$W/out/KASSA.apk" | head -6
echo "hazır: $W/out/KASSA.apk"
