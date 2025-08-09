"use strict";

// DataShare 유틸리티 테스트 스크립트
// Node.js 환경에서 실행 가능

// DataShare 모듈 로드 (브라우저에서는 window.DataShare 사용)
let DataShare;
try {
  DataShare = require("./DataShare.js");
} catch (e) {
  // 브라우저 환경에서는 window.DataShare 사용
  if (typeof window !== "undefined" && window.DataShare) {
    DataShare = window.DataShare;
  } else {
    console.error("DataShare 유틸리티를 로드할 수 없습니다.");
    process.exit(1);
  }
}

console.log("🚀 DataShare 유틸리티 테스트 시작\n");

// 개발 모드 활성화
DataShare.setDevMode(true);

// 테스트 함수들
function runTests() {
  console.log("=== 1. 기본 SET/GET 테스트 ===");

  // 문자열 저장/조회
  DataShare.set("user.name", "홍길동");
  console.log("user.name:", DataShare.get("user.name"));

  // 객체 저장/조회
  DataShare.set("user.profile", { name: "홍길동", age: 25, city: "서울" });
  console.log("user.profile:", DataShare.get("user.profile"));

  // 배열 저장/조회
  DataShare.set("user.hobbies", ["독서", "영화감상", "코딩"]);
  console.log("user.hobbies:", DataShare.get("user.hobbies"));

  console.log("\n=== 2. WATCH 기능 테스트 ===");

  // 감시자 등록
  const unsubscribe = DataShare.watch(
    "user.profile",
    function (newValue, oldValue, key) {
      console.log(`🔔 [WATCH] ${key} 변경됨:`);
      console.log("  이전 값:", oldValue);
      console.log("  새로운 값:", newValue);
    }
  );

  // 데이터 변경하여 감시자 트리거
  DataShare.set("user.profile", { name: "홍길동", age: 26, city: "부산" });
  DataShare.set("user.profile", { name: "김철수", age: 30, city: "대구" });

  console.log("\n=== 3. 패턴 매칭 WATCH 테스트 ===");

  // 패턴 매칭 감시자 등록
  const unsubscribePattern = DataShare.watch(
    "user.*",
    function (newValue, oldValue, key) {
      console.log(`🔔 [PATTERN WATCH] user.* 패턴 매칭: ${key}`);
    }
  );

  DataShare.set("user.email", "test@example.com");
  DataShare.set("user.phone", "010-1234-5678");

  console.log("\n=== 4. TEMP 기능 테스트 ===");

  // 임시 데이터 저장 (3초 후 자동 삭제)
  DataShare.temp("temp.data", "임시 데이터입니다", 3000);
  console.log("temp.data (저장 직후):", DataShare.get("temp.data"));

  // 3초 후 확인
  setTimeout(() => {
    console.log("temp.data (3초 후):", DataShare.get("temp.data"));
  }, 3500);

  console.log("\n=== 5. 전체 데이터 조회 테스트 ===");
  console.log("모든 데이터:", DataShare.getAll());
  console.log("모든 키:", DataShare.getKeys());
  console.log("user.* 패턴 키들:", DataShare.getKeysByPattern("user.*"));

  console.log("\n=== 6. CLEAR 테스트 ===");

  // 특정 키 삭제
  DataShare.clear("user.email");
  console.log("user.email 삭제 후:", DataShare.get("user.email"));

  // 감시자 해제
  unsubscribe();
  unsubscribePattern();

  console.log("\n=== 7. 에러 처리 테스트 ===");

  try {
    DataShare.set("", "empty key test");
  } catch (error) {
    console.log("✅ 빈 키 에러 처리됨:", error.message);
  }

  try {
    DataShare.get(null);
  } catch (error) {
    console.log("✅ null 키 에러 처리됨:", error.message);
  }

  try {
    DataShare.watch("test", "not a function");
  } catch (error) {
    console.log("✅ 잘못된 콜백 에러 처리됨:", error.message);
  }

  console.log("\n=== 8. 최종 상태 확인 ===");
  console.log("최종 저장된 데이터:", DataShare.getAll());

  // 전체 데이터 삭제
  setTimeout(() => {
    console.log("\n=== 9. 전체 삭제 테스트 ===");
    DataShare.clear();
    console.log("전체 삭제 후 데이터:", DataShare.getAll());
    console.log("\n✅ 모든 테스트 완료!");
  }, 4000);
}

// 테스트 실행
runTests();
