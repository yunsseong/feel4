# Feel4 (필사)

**필사의 감동을 느껴보세요.**

소설, 시, 수필, 성경을 타이핑하며 글의 깊이를 느끼는 미니멀 필사 서비스입니다.

## 주요 기능

- **다양한 콘텐츠**: 성경, 소설, 시, 수필 등 다양한 장르 지원
- **진행 상황 저장**: 로그인 후 어디서든 이어서 필사
- **실시간 피드백**: 오타 시 시각적 피드백 제공
- **한글 최적화**: 끊김 없는 한글 타이핑 경험
- **테마 커스터마이징**: 폰트, 크기, 색상 설정 가능
- **관리자 패널**: 콘텐츠 관리, 사용자 통계, 설정 관리
- **모바일 앱 지원**: Capacitor 기반 iOS/Android 앱

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Backend | NestJS 11, TypeORM |
| Database | PostgreSQL 16 |
| Auth | Google OAuth (Passport.js) |
| Mobile | Capacitor |
| Infra | Docker Compose |

## 시작하기

### 요구 사항

- Node.js 20+
- Docker & Docker Compose
- Google OAuth 클라이언트 ID/Secret

### 설치

```bash
# 저장소 클론
git clone https://github.com/yunsseong/feel4.git
cd feel4

# 환경 변수 설정
cp .env.example .env
# .env 파일에 필요한 값 입력

# Docker로 Backend + DB + Redis 실행
docker-compose up -d

# Frontend 실행
cd frontend
npm install
npm run dev
```

### 환경 변수

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=feel4
DATABASE_HOST=localhost
DATABASE_PORT=5632

# Auth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3201/auth/google/callback
JWT_SECRET=your-jwt-secret

# Frontend
FRONTEND_URL=http://localhost:3200
```

### 성경 데이터 시드

```bash
cd backend
npm run seed:bible
```

### 모바일 빌드

```bash
cd frontend

# iOS
npm run mobile:ios

# Android
npm run mobile:android
```

## 프로젝트 구조

```
feel4/
├── backend/                # NestJS 백엔드
│   ├── src/
│   │   ├── admin/         # 관리자 API
│   │   ├── auth/          # Google OAuth 인증
│   │   ├── typing/        # 타이핑 API
│   │   ├── users/         # 사용자 관리
│   │   └── scripts/       # 시드 스크립트
│   └── package.json
├── frontend/              # Next.js 프론트엔드
│   ├── app/               # App Router 페이지
│   │   ├── admin/         # 관리자 페이지
│   │   └── login/         # 로그인 페이지
│   ├── components/        # React 컴포넌트
│   │   ├── TypingArea     # 타이핑 영역
│   │   ├── ThemeProvider  # 테마 관리
│   │   └── ui/            # UI 컴포넌트
│   ├── ios/               # iOS 앱 (Capacitor)
│   ├── android/           # Android 앱 (Capacitor)
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/auth/google` | Google 로그인 |
| GET | `/typing/content` | 현재 타이핑할 콘텐츠 조회 |
| POST | `/typing/submit` | 타이핑 완료 제출 |
| GET | `/typing/content/list` | 콘텐츠 목록 조회 |
| POST | `/typing/content/set` | 콘텐츠 선택 |

## 라이선스

[MIT License](LICENSE)
