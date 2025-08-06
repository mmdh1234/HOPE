# 🤝 HOPE 협업 가이드

모든 팀원이 같은 방식으로 개발하고 협업하기 위해 아래 규칙을 지켜주세요.

---

## 1. 브랜치

- `main`: 배포용 코드
- `develop`: 개발용 통합 브랜치 -> default
- `feature/{기능명}`: 기능 개발 브랜치

```bash
git checkout -b feature/login-page
```

---

## 2. 커밋 메시지 규칙 (Conventional Commits)

| 타입         | 설명        |
| ---------- |-----------|
| `feat`     | 새로운 기능    |
| `fix`      | 버그 수정     |
| `docs`     | 문서 수정     |
| `refactor` | 코드 리팩토링   |
| `chore`    | 기타 변경     |

**commit message 예시**:

```bash
git commit -m "feat: 로그인 페이지 UI 구현"
```

---

## 3. PR 작성 규칙

- PR은 `develop` 브랜치 기준으로 생성
- PR 템플릿에 맞게 상세한 설명 작성

---

## 4. 폴더 역할

| 디렉토리          | 설명                    |
| ------------- |-----------------------|
| `hope_fe/`    | 사용자 인터페이스             |
| `hope_be/`    | API 서버 및 DB 연동        |
| `hope_model/` | computer vision 모델 구현 |

---

## 5. 환경 설정

각 디렉토리에 개발자 개발이 수정한 `README.md`가 존재합니다. 참고해 설정해주세요.

## 6. 협업 위크플로우 정리

1️⃣ 이슈 생성
1.	GitHub → Issues → New Issue 클릭
2.	알맞은 템플릿 선택 ( Feature, Refactor, Docs 등)
3.	템플릿에 맞게 작성

---

2️⃣ 브랜치 생성
- 브랜치는 항상 develop 브랜치에서 따옴
- 브랜치 명명 규칙: 타입/이슈번호-간단설명(커밋 메시지 규칙을 참고)
- 작업 시작하기 전에 무조건 develop에서 pull 받고 시작하는 게 좋음

```bash
git checkout develop
git pull origin develop
git checkout -b feat/23-login-form
```

3️⃣ 작업 & 커밋 & push
-	코드 구현 또는 수정
-	의미 있는 단위로 커밋
-	커밋 메시지 : " 타입: 내용(#이슈번호) "
```bash
git add .
git commit -m "feat: 로그인 폼 레이아웃 추가 (#23)"
git push origin feat/23-login-form
```

4️⃣ PR 생성
-	GitHub에서 Pull Request 생성
-	대상 브랜치: develop
-	PR 템플릿에 따라 아래 항목 작성(선택사항):
-	변경 내용 요약
-	스크린샷 or 동작 확인 방법
-	관련 이슈 번호

🔁 **전체 요약 순서**
1️⃣ Issue 생성  
2️⃣ develop 브랜치에서 feature 브랜치 생성  
3️⃣ 개발 → 커밋  
4️⃣ PR 생성 (→ develop)  
5️⃣ 리뷰 → 머지  
6️⃣ 이슈 완료 및 상태 이동