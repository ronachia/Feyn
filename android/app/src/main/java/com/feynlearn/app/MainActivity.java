package com.feynlearn.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int RC_RECORD_AUDIO = 1001;

    // Holds the WebView's pending mic request while we ask Android for the
    // runtime permission. getUserMedia({audio:true}) (used by Voice Mode /
    // Whisper transcription, see src/components/VoiceRecorder.jsx) needs BOTH
    // the RECORD_AUDIO manifest permission AND this explicit grant through
    // WebChromeClient.onPermissionRequest — declaring the permission in the
    // manifest alone does not make the WebView prompt for it.
    private PermissionRequest pendingWebPermissionRequest;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // NOTE: this replaces whatever WebChromeClient Capacitor's Bridge set
        // by default. It only affects onPermissionRequest; if a future
        // feature needs onShowFileChooser (e.g. <input type="file">) that
        // handling will need to be added here too — this app does not use
        // file inputs today.
        getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO)
                            == PackageManager.PERMISSION_GRANTED) {
                        request.grant(request.getResources());
                        return;
                    }

                    pendingWebPermissionRequest = request;
                    ActivityCompat.requestPermissions(
                        MainActivity.this,
                        new String[]{Manifest.permission.RECORD_AUDIO},
                        RC_RECORD_AUDIO
                    );
                });
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode != RC_RECORD_AUDIO || pendingWebPermissionRequest == null) {
            return;
        }

        boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
        if (granted) {
            pendingWebPermissionRequest.grant(pendingWebPermissionRequest.getResources());
        } else {
            pendingWebPermissionRequest.deny();
        }
        pendingWebPermissionRequest = null;
    }
}
