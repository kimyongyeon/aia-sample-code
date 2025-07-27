package com.example.webviewtest;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = findViewById(R.id.webview);
        setupWebView();
    }
    
    private void setupWebView() {
        // WebView 설정
        WebSettings webSettings = webView.getSettings();
        
        // JavaScript 활성화
        webSettings.setJavaScriptEnabled(true);
        
        // DOM 스토리지 활성화
        webSettings.setDomStorageEnabled(true);
        
        // 데이터베이스 활성화
        webSettings.setDatabaseEnabled(true);
        
        // 앱 캐시 활성화
        webSettings.setAppCacheEnabled(true);
        
        // 파일 접근 허용
        webSettings.setAllowFileAccess(true);
        
        // 줌 컨트롤 활성화
        webSettings.setBuiltInZoomControls(true);
        webSettings.setDisplayZoomControls(false);
        
        // 뷰포트 메타 태그 활성화
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        
        // WebViewClient 설정
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
            
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // 페이지 로딩 완료 후 JavaScript 실행
                injectTestScript();
            }
        });
        
        // 로컬 서버 URL 로드 (Android 에레이터용)
        String testUrl = "http://10.0.2.2:8000/test-webview.html";
        
        // 실제 디바이스용 URL (컴퓨터 IP 주소 사용)
        // String testUrl = "http://192.168.1.100:8000/test-webview.html";
        
        webView.loadUrl(testUrl);
    }
    
    private void injectTestScript() {
        // WebView에서 실행할 테스트 스크립트
        String testScript = "
            console.log('WebView 테스트 시작');
            
            // 브라우저 정보 출력
            console.log('User Agent:', navigator.userAgent);
            console.log('Platform:', navigator.platform);
            console.log('Language:', navigator.language);
            
            // 기능 테스트
            var tests = {
                'ES6 모듈': typeof import !== 'undefined',
                'Map': typeof Map !== 'undefined',
                'Set': typeof Set !== 'undefined',
                'Array.from': typeof Array.from !== 'undefined',
                'fetch': typeof fetch !== 'undefined',
                'Promise': typeof Promise !== 'undefined',
                'localStorage': typeof localStorage !== 'undefined',
                'sessionStorage': typeof sessionStorage !== 'undefined'
            };
            
            console.log('기능 테스트 결과:', tests);
            
            // 결과를 페이지에 표시
            var resultDiv = document.createElement('div');
            resultDiv.innerHTML = '<h3>WebView 테스트 결과</h3>';
            resultDiv.innerHTML += '<p>User Agent: ' + navigator.userAgent + '</p>';
            resultDiv.innerHTML += '<p>Platform: ' + navigator.platform + '</p>';
            
            var testResults = '';
            for (var test in tests) {
                testResults += '<p>' + test + ': ' + (tests[test] ? '✅' : '❌') + '</p>';
            }
            resultDiv.innerHTML += testResults;
            
            document.body.appendChild(resultDiv);
        ";
        
        webView.evaluateJavascript(testScript, null);
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
} 