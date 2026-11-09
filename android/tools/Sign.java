import com.android.apksig.ApkSigner;
import com.android.apksig.ApkVerifier;
import java.io.File;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.List;

// APK-nı imzalayır (v2; Android 7+ — apksig 2.3.0-ın v1 imzası Java 21 ilə işləmir) və yoxlayır: java Sign <giriş.apk> <çıxış.apk> <keystore.p12> <parol>
public class Sign {
    public static void main(String[] a) throws Exception {
        char[] pw = a[3].toCharArray();
        KeyStore ks = KeyStore.getInstance("PKCS12");
        try (FileInputStream in = new FileInputStream(a[2])) { ks.load(in, pw); }
        String alias = ks.aliases().nextElement();
        PrivateKey key = (PrivateKey) ks.getKey(alias, pw);
        X509Certificate cert = (X509Certificate) ks.getCertificate(alias);
        ApkSigner.SignerConfig sc = new ApkSigner.SignerConfig.Builder("kassa", key, List.of(cert)).build();
        new ApkSigner.Builder(List.of(sc)).setInputApk(new File(a[0])).setOutputApk(new File(a[1]))
            .setMinSdkVersion(24).setV1SigningEnabled(false).setV2SigningEnabled(true).build().sign();
        ApkVerifier.Result r = new ApkVerifier.Builder(new File(a[1])).build().verify();
        System.out.println("imza düzdür: " + r.isVerified() + " v1=" + r.isVerifiedUsingV1Scheme() + " v2=" + r.isVerifiedUsingV2Scheme());
        if (!r.isVerified()) { r.getErrors().forEach(System.out::println); System.exit(1); }
    }
}
