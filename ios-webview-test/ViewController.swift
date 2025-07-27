import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {
    var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
    }
    
    private func setupWebView() {
        // WKWebView 설정
        let configuration = WKWebViewConfiguration()
        
        // JavaScript 활성화
        configuration.preferences.javaScriptEnabled = true
        
        // DOM 스토리지 활성화
        configuration.websiteDataStore = WKWebsiteDataStore.default()
        
        // WKWebView 생성
        webView = WKWebView(frame: view.bounds, configuration: configuration)
        webView.navigationDelegate = self
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        
        view.addSubview(webView)
        
        // 로컬 서버 URL 로드
        let testUrl = URL(string: "http://localhost:8000/test-webview.html")!
        let request = URLRequest(url: testUrl)
        webView.load(request)
    }
    
    // MARK: - WKNavigationDelegate
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("페이지 로딩 완료")
        injectTestScript()
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("페이지 로딩 실패: \(error.localizedDescription)")
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("프로비저널 네비게이션 실패: \(error.localizedDescription)")
    }
    
    private func injectTestScript() {
        // WebView에서 실행할 테스트 스크립트
        let testScript = """
            console.log('iOS WebView 테스트 시작');
            
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
                'sessionStorage': typeof sessionStorage !== 'undefined',
                'WKWebView': true, // iOS WKWebView는 항상 true
                'Safari': navigator.userAgent.indexOf('Safari') !== -1
            };
            
            console.log('기능 테스트 결과:', tests);
            
            // 결과를 페이지에 표시
            var resultDiv = document.createElement('div');
            resultDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; background: white; border: 1px solid #ccc; padding: 10px; max-width: 300px; z-index: 1000;';
            resultDiv.innerHTML = '<h3>iOS WebView 테스트 결과</h3>';
            resultDiv.innerHTML += '<p><strong>User Agent:</strong><br>' + navigator.userAgent + '</p>';
            resultDiv.innerHTML += '<p><strong>Platform:</strong> ' + navigator.platform + '</p>';
            
            var testResults = '';
            for (var test in tests) {
                testResults += '<p>' + test + ': ' + (tests[test] ? '✅' : '❌') + '</p>';
            }
            resultDiv.innerHTML += testResults;
            
            document.body.appendChild(resultDiv);
            
            // 성능 테스트
            var startTime = performance.now();
            setTimeout(function() {
                var loadTime = performance.now() - startTime;
                console.log('페이지 로딩 시간:', loadTime + 'ms');
                resultDiv.innerHTML += '<p><strong>로딩 시간:</strong> ' + loadTime.toFixed(2) + 'ms</p>';
            }, 100);
        """
        
        webView.evaluateJavaScript(testScript) { (result, error) in
            if let error = error {
                print("JavaScript 실행 오류: \(error.localizedDescription)")
            } else {
                print("JavaScript 실행 완료")
            }
        }
    }
} 