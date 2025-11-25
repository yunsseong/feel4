PRD: Bibliy (비블리)1. 프로젝트 개요 (Overview)서비스명: Bibliy (비블리)슬로건: Type the Word, Feel the Flow. (말씀이 스며드는 시간)목적: 복잡한 기능은 모두 덜어내고, 오직 '말씀'과 '손끝'에만 집중하는 미니멀 성경 타이핑 서비스.차별점:Modern: 낡은 교회 홈페이지 느낌을 탈피한 트렌디한 SaaS 스타일 디자인.Flow: 끊김 없는 한글 타이핑 경험 제공 (typing.works 벤치마킹).Smart: 로그인 한 번으로 어디서든 내 진도(Context)를 기억.2. 기술 스택 (Tech Stack)안정성과 개발 속도, 그리고 비용 효율성을 모두 고려한 구성입니다.구분기술 (Technology)선정 이유FrontendNext.js 14+ (App Router)서버 컴포넌트 활용, SEO, 초기 로딩 속도 최적화UI Kitshadcn/ui + Tailwind CSS빠르고 일관된 디자인 시스템 구축, 커스터마이징 용이Deploy (FE)Cloudflare Pages글로벌 엣지 배포, 무료 티어의 넉넉한 트래픽 처리BackendNest.js엔터프라이즈급 구조, TypeScript 기반의 안정적인 APIDatabasePostgreSQL성경 텍스트(구조적 데이터)와 유저 데이터 관계 관리InfraDocker ComposeDB, Backend 개발 환경 컨테이너화CI/CDGitHub Actions코드 푸시 시 자동 테스트 및 배포 자동화AuthGoogle OAuthNextAuth.js 또는 Passport 이용, 진입 장벽 최소화3. 핵심 기능 (Core Features)3.1 사용자 경험 (UX Flow)Landing (No Login):접속하자마자 바로 창세기 1장 1절 타이핑 시작 (체험 모드).화면 중앙 상단에 심플한 로고 Bibliy.Login/Onboarding:"기록을 저장하시겠습니까?" 팝업 -> Google 로그인.로그인 후 이전 체험 데이터 병합(Merge).Typing Interface:Focus Mode: 헤더, 푸터 등 불필요한 UI 자동 숨김.Live Feedback: 오타 발생 시 글자가 빨개지거나 흔들리는 애니메이션.Sound (Optional): 타자기 소리 또는 ASMR (설정에서 On/Off).3.2 데이터 동기화 (Sync)이어하기 (Resume): 유저가 요한복음 3장 16절을 치다가 종료했다면, 다음 접속 시 정확히 해당 위치에서 커서가 깜빡임.히스토리: 일자별 타이핑 분량, 평균 속도, 정확도 그래프 제공.3.3 랭킹 시스템 (Leaderboard)명예의 전당:Speed Racer: 이번 주 가장 빠른 손 (CPM 기준).Faithful Walker: 가장 오랫동안 꾸준히 친 유저 (연속 출석 + 절 수).개인 랭킹: "나는 상위 5% 타자입니다"와 같은 동기부여 배지 제공.4. UI/UX & 디자인 시스템4.1 브랜드 아이덴티티 (Brand Identity)Name: Bibliy (끝의 'y'를 살려 경쾌한 느낌)Logo: 산세리프(San-serif) 서체의 볼드한 텍스트 로고.Color Theme:Light: #FFFFFF (배경), #171717 (텍스트), #3B82F6 (포인트 - 신뢰감의 블루).Dark: #0A0A0A (배경), #EDEDED (텍스트), #60A5FA (포인트).Font:UI: Inter or Pretendard (가독성).Bible Text: Iropke Batang (이롭게 바탕체 - 명조의 감성).4.2 주요 컴포넌트 (shadcn/ui 활용)Card: 랭킹 및 통계 표시에 사용.Progress: 현재 장(Chapter)의 진행률 표시 바 (화면 최상단 얇게 배치).Toast: "저장되었습니다", "레벨 업!" 등 알림 메시지.Dialog (Modal): 성경 목차 선택, 설정 화면.5. 데이터 모델링 (Database Schema)5.1 UsersSQLCREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(50),
  provider VARCHAR(20) DEFAULT 'google',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
5.2 TypingProgress (핵심)어디까지 쳤는지 기억하는 테이블입니다.SQLCREATE TABLE typing_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  bible_book VARCHAR(50) NOT NULL, -- 예: Genesis
  chapter INT NOT NULL,            -- 예: 1
  verse INT NOT NULL,              -- 예: 1
  cursor_pos INT DEFAULT 0,        -- 해당 절 내에서의 글자 위치 (선택 사항)
  last_updated TIMESTAMP DEFAULT NOW()
);
5.3 TypingStats (랭킹용)SQLCREATE TABLE typing_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  cpm INT,                 -- 분당 타수
  accuracy DECIMAL(5,2),   -- 정확도
  verse_count INT,         -- 완료한 절의 수
  session_date DATE DEFAULT CURRENT_DATE
);
6. API 설계 (Nest.js Controllers)AuthControllerPOST /auth/login: 구글 토큰 검증 및 유저 세션 생성 (JWT 발급).TypingControllerGET /typing/content: 현재 유저가 쳐야 할 성경 구절 로드.Logic: TypingProgress 테이블을 조회하여 다음 절을 반환.POST /typing/submit: 한 절(Verse) 타이핑 완료 시 호출.Logic: 정답 비교 -> 점수 계산 -> TypingProgress 업데이트 -> TypingStats 누적.RankControllerGET /rank/weekly: 주간 랭킹 데이터 캐싱 후 반환 (Redis 사용 고려 가능, 초기엔 DB 조회).7. 개발 로드맵 (Milestones)Phase 1: MVP (최소 기능 제품) - 2주프로젝트 셋팅 (Next.js + Nest.js + Docker).성경 데이터(개역개정 등) DB 구축.기본 타이핑 엔진 구현 (한글 입력 처리).Google 로그인 및 진행 상황 저장.Phase 2: Design & Polish - 1주Bibliy 브랜딩 적용 (로고, 컬러).shadcn/ui 기반의 반응형 디자인 적용.타이핑 효과 (애니메이션, 사운드) 추가.Phase 3: Ranking & Deploy - 1주랭킹 시스템 구현.Cloudflare Pages 및 운영 서버 배포.정식 런칭.