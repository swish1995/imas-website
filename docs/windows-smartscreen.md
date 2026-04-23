# Windows SmartScreen 경고 대응

> 대상: IMAS Windows 빌드(`IMAS.exe`)를 최종 사용자에게 배포할 때 발생하는 SmartScreen "Windows의 PC 보호" 경고 해결 방안

## 현상

사용자가 `IMAS-Windows.zip`을 다운로드 → 압축 해제 후 `IMAS.exe` 실행 시 다음 화면이 뜸.

> **Windows의 PC 보호**
> Microsoft Defender SmartScreen에서 인식할 수 없는 앱의 시작을 차단했습니다.

`추가 정보` → `실행` 버튼을 눌러야 진행되며, 일부 기업 환경에서는 그룹 정책으로 이 버튼이 아예 비활성화되어 있어 실행 자체가 불가능한 경우도 있음.

## 원인

두 가지 요인이 겹쳐서 발생:

1. **코드 서명 부재** — PyInstaller 기본 산출물인 `IMAS.exe`는 서명되지 않은 바이너리. "알 수 없는 게시자(Unknown Publisher)"로 표시됨
2. **Microsoft 평판(reputation) 없음** — 서명이 있더라도 초기엔 Microsoft 평판 데이터가 없어 경고가 뜸

SmartScreen은 CA 체인을 검증하므로 **자가서명(self-signed) 인증서는 효과 없음.**

---

## 해결 방안

### 옵션 1. EV Code Signing Certificate (권장, 근본 해결)

- **비용**: 연 30~80만원 (Sectigo, DigiCert, SSL.com 등)
- **효과**: 발급 즉시 SmartScreen 경고 없음. 첫 다운로드부터 정상 실행
- **제약**: 2023년 6월 CA/B Forum 규정 개정으로 **HSM(하드웨어 보안 모듈) 필수**. USB 토큰은 CI에서 쓰기 어려움

CI(GitHub Actions)에서 서명하려면 클라우드 HSM을 사용해야 함:

| 방식 | 설명 |
|------|------|
| Azure Key Vault + AzureSignTool | 가장 일반적. 인증서를 Azure KV에 저장하고 GitHub Secrets로 원격 서명 |
| DigiCert KeyLocker | DigiCert 자체 클라우드 HSM. 구매 시 함께 제공 |
| Sectigo Code Signing Cloud | Sectigo 자체 클라우드 HSM |
| USB 토큰 로컬 서명 | CI 연동 불가, 수동 빌드만 가능 |

#### GitHub Actions 통합 예시 (Azure Key Vault)

`.github/workflows/build.yml`의 `Build with PyInstaller` 단계 이후에 추가:

```yaml
- name: Sign IMAS.exe with AzureSignTool
  shell: pwsh
  run: |
    dotnet tool install --global AzureSignTool
    AzureSignTool sign `
      -kvu ${{ secrets.AZ_KV_URI }} `
      -kvi ${{ secrets.AZ_CLIENT_ID }} `
      -kvt ${{ secrets.AZ_TENANT_ID }} `
      -kvs ${{ secrets.AZ_CLIENT_SECRET }} `
      -kvc ${{ secrets.AZ_CERT_NAME }} `
      -tr http://timestamp.digicert.com `
      -td sha256 `
      -fd sha256 `
      -v `
      dist\IMAS\IMAS.exe
```

필요한 GitHub Secrets:
- `AZ_KV_URI`: Azure Key Vault URI (예: `https://imas-kv.vault.azure.net`)
- `AZ_CLIENT_ID`: 서비스 주체(SPN) 클라이언트 ID
- `AZ_TENANT_ID`: Azure 테넌트 ID
- `AZ_CLIENT_SECRET`: SPN 시크릿
- `AZ_CERT_NAME`: Key Vault에 등록된 인증서 이름

---

### 옵션 2. Standard Code Signing Certificate

- **비용**: 연 10~30만원
- **효과**: SmartScreen이 **다운로드 3,000~5,000건** 쌓여야 경고 사라짐. 초기 사용자는 여전히 경고 봄
- HSM 요구사항은 EV와 동일 → Azure Key Vault 연동 필수
- 소규모 사내 배포에는 평판 축적이 어려워 경고가 반영구적으로 유지될 수 있음

**현 상황(소규모 기업 고객 배포)에는 비효율적** — EV로 직행하거나 옵션 4로 일단 안내만 넣는 것이 실질적.

---

### 옵션 3. Microsoft Store (MSIX 배포)

- **비용**: 개발자 계정 1회 **$19**(개인) / **$99**(기업), 인증서 불필요
- **효과**: Store 배포본은 Microsoft가 서명 → SmartScreen/Defender 모두 통과
- **제약**:
  - PyQt6 앱을 MSIX로 패키징하는 추가 작업 필요 (`Windows Application Packaging Project` 또는 `msix` CLI)
  - 심사 프로세스, 업데이트 배포 주기가 생김
  - 현재 `.zip` 직접 다운로드 UX를 Store 링크로 바꿔야 함

B2C 확산 목적이라면 유효, B2B 기업 고객 대상으로는 오히려 부담.

---

### 옵션 4. 임시 우회 (인증서 구매 전까지)

#### 4-1. 다운로드 페이지에 안내 추가

`imas-website/src/components/DownloadSection.tsx` 또는 별도 섹션에 다음 내용을 노출:

> 다운로드 후 `IMAS.exe` 실행 시 **"Windows의 PC 보호"** 경고가 표시될 수 있습니다.
> `추가 정보` → `실행` 버튼을 순서대로 눌러주세요. (코드 서명 절차 진행 중)

스크린샷 1~2장을 함께 올리면 사용자 혼란이 크게 줄어듦.

#### 4-2. ZIP 해제 직후 차단(MoTW) 안내

Windows는 다운로드 파일에 Mark-of-the-Web(ADS) 속성을 붙임. 사용자가 다음을 시도하도록 안내:

1. 압축 해제된 폴더 전체 선택 → 우클릭 → `속성`
2. `차단 해제` 체크 → `확인`

또는 PowerShell:
```powershell
Get-ChildItem -Path . -Recurse | Unblock-File
```

#### 4-3. Microsoft에 오탐 신고 (Defender 대응용, SmartScreen과는 별개)

https://www.microsoft.com/en-us/wdsi/filesubmission

- Defender가 바이러스로 오탐하는 경우에만 효과
- SmartScreen 평판은 이 경로로 해결되지 않음

---

## 권장 로드맵

이 프로젝트(B2B 기업 고객 배포)의 맥락에서:

1. **즉시(오늘)**: 옵션 4-1 적용 → 다운로드 페이지에 경고 우회 안내 섹션 추가
2. **단기(1~2주)**: 옵션 1로 전환 준비
   - Sectigo/DigiCert에서 EV Code Signing 견적
   - Azure 구독 없다면 가입 + Key Vault 생성
   - 인증서 발급 후 Key Vault에 CSR 등록
3. **중기(발급 완료 후)**: 워크플로우에 AzureSignTool 단계 추가, 다음 빌드부터 서명된 바이너리 배포
4. **선택**: 옵션 3(Store 배포)는 B2C 확산을 시작할 때 재검토

---

## 체크리스트 (옵션 1 진행 시)

- [ ] 인증서 CA 선택 (Sectigo / DigiCert / SSL.com)
- [ ] 법인 인증 서류 준비 (사업자등록증, 법인등기부등본 등 — EV는 실사 필수)
- [ ] Azure 구독 생성 및 Key Vault 만들기
- [ ] 서비스 주체(SPN) 생성 + Key Vault에 서명 권한 부여
- [ ] 인증서 발급 및 Key Vault 가져오기
- [ ] GitHub Secrets 5개 등록 (`AZ_KV_URI`, `AZ_CLIENT_ID`, `AZ_TENANT_ID`, `AZ_CLIENT_SECRET`, `AZ_CERT_NAME`)
- [ ] `.github/workflows/build.yml`에 서명 단계 추가
- [ ] 테스트 태그 push → 서명된 `IMAS.exe` 빌드 확인
- [ ] Windows 11 PC에서 실제 다운로드 → SmartScreen 경고 미발생 검증

---

## 참고 링크

- [Microsoft: SmartScreen overview](https://learn.microsoft.com/en-us/windows/security/operating-system-security/virus-and-threat-protection/microsoft-defender-smartscreen/)
- [Microsoft: Code signing 가이드](https://learn.microsoft.com/en-us/windows/msix/package/signing-package-overview)
- [AzureSignTool](https://github.com/vcsjones/AzureSignTool)
- [CA/B Forum 코드 서명 베이스라인 요구사항](https://cabforum.org/code-signing-baseline-requirements/)
- [Microsoft 파일 제출(오탐 신고)](https://www.microsoft.com/en-us/wdsi/filesubmission)
