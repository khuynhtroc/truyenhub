package vip.doctruyen.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        setTheme(R.style.AppTheme_NoActionBar);
        super.onCreate(savedInstanceState);

        android.view.Window window = getWindow();
        window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(android.graphics.Color.parseColor("#09090b"));
        window.setNavigationBarColor(android.graphics.Color.parseColor("#09090b"));

        // Clear layout no limits and fullscreen flags
        window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN);

        android.view.View decorView = window.getDecorView();
        decorView.setSystemUiVisibility(
            decorView.getSystemUiVisibility() &
            ~android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN &
            ~android.view.View.SYSTEM_UI_FLAG_FULLSCREEN
        );

        if (bridge != null && bridge.getWebView() != null) {
            androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(bridge.getWebView(), (v, insets) -> {
                int topInset = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.statusBars()).top;
                int bottomInset = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.navigationBars()).bottom;
                v.setPadding(0, topInset, 0, bottomInset);
                return insets;
            });
        }
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
