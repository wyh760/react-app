# React & Spring Boot Web Project

이 프로젝트는 Spring Boot 백엔드 API와 연동되는 React 프론트엔드 웹 애플리케이션입니다.

## 주요 기능 및 업데이트 내역

1. **회원가입 및 로그인 기능**:
   - Spring Boot 백엔드 API(`/api/members`)와 연동된 로그인 및 회원가입 모달
   - **비밀번호 6자리 제한**: 로그인 및 회원가입 비밀번호 입력란에 `maxLength={6}` 적용 (2026-10-14 수정)
2. **게시글(Topic) 관리 및 네비게이션**:
   - Spring Boot API(`/api/topics`)를 통한 게시글 조회, 생성, 수정, 삭제(CRUD)
   - 네비게이션 항목별 이미지 및 설명 출력 기능
3. **Vue.js 변환 샘플 (`App.vue`)**:
   - React `App.js`를 Vue 3 Composition API(`<script setup>`) 방식으로 변환한 참조용 파일 제공
4. **프로덕션 빌드 (`npm run build`)**:
   - 실제 운영 서버 배포(FTP 등)를 위한 최적화된 정적 파일(`build` 폴더) 생성 지원

---

## 주요 명령어

### `npm start`
개발 모드로 앱을 실행합니다.<br>
브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하실 수 있습니다.

### `npm run build`
운영(배포) 환경에 최적화된 빌드 파일을 `build` 폴더에 생성합니다. (FTP 등을 통해 서버에 업로드 용도)
