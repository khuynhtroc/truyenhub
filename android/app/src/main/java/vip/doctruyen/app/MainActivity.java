package vip.doctruyen.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        setTheme(R.style.AppTheme_NoActionBar);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();
        if (bridge != null && bridge.getWebView() != null) {
            String url = bridge.getWebView().getUrl();
            if (url == null || url.contains("localhost")) {
                bridge.getWebView().loadUrl("https://www.doctruyen.vip");
            }
        }
    }
}
