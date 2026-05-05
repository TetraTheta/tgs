# hbtheme 개발 문서

이 문서는 `hbtheme`의 유지보수와 추적을 위한 문서입니다.  
테마를 처음 적용하는 방법은 [README.md](README.md)를 참고하고, 이 문서는 아래 같은 상황에서 사용하면 됩니다.

- 어떤 upstream Hugo Module이 테마에 통합되었는지 확인할 때
- 어떤 모듈이 외부 의존성으로 남아 있는지 확인할 때
- `themes/hbtheme/hugo.toml`의 기본값 출처를 추적할 때
- 템플릿/설정 회귀를 디버깅할 때
- 사람이나 AI가 이 테마의 구조를 빠르게 파악해야 할 때

## 직접 통합된 모듈

아래 모듈은 원래 사이트의 direct import였고, 현재는 `hbtheme` 내부로 통합되어 있습니다.

- `github.com/hbstack/header/themes/pills`
- `github.com/hbstack/announcement-bar`
- `github.com/hbstack/bs-tooltip/modules/abbr`
- `github.com/hbstack/blockquote-alerts`
- `github.com/hbstack/syntax-highlighting/styles/xcode-dark`
- `github.com/hbstack/blog/modules/content-panel`
- `github.com/hbstack/blog/modules/social-share-buttons`
- `github.com/hbstack/blog/modules/toc-scrollspy`
- `github.com/hbstack/docs/modules/content-panel`
- `github.com/hbstack/docs/modules/social-share-buttons`
- `github.com/hbstack/docs/modules/toc-scrollspy`
- `github.com/hbstack/back-to-top`
- `github.com/hbstack/code-block-panel`
- `github.com/hbstack/docs`
- `github.com/hbstack/docs/modules/breadcrumb`
- `github.com/hbstack/docs/modules/heading-sign`
- `github.com/hbstack/docs/modules/doc-nav`
- `github.com/hbstack/blog`
- `github.com/hbstack/blog/modules/breadcrumb`
- `github.com/hbstack/blog/modules/heading-sign`
- `github.com/hbstack/blog/modules/post-nav`
- `github.com/hbstack/blog/modules/related-posts`
- `github.com/hbstack/bootstrap`
- `github.com/hugomods/images`
- `github.com/hugomods/shortcodes`
- `github.com/hbstack/footer`
- `github.com/hbstack/footer/modules/socials`
- `github.com/hbstack/header`
- `github.com/hbstack/header/modules/socials`
- `github.com/hbstack/header/modules/search`
- `github.com/hugomods/seo/modules/alternatives`
- `github.com/hugomods/seo/modules/base`
- `github.com/hugomods/seo/modules/favicons`
- `github.com/hugomods/seo/modules/open-graph`
- `github.com/hugomods/seo/modules/schema`
- `github.com/hugomods/seo/modules/twitter-cards`
- `github.com/hbstack/noscript`
- `github.com/hbstack/progress-bar`

## 함께 흡수된 핵심 전이 의존성

아래 모듈은 direct import는 아니었지만, 실제 테마 동작에 영향을 주는 코어 레이어라 함께 통합되었습니다.

- `github.com/hbstack/hb`
- `github.com/hbstack/base`
- `github.com/hbstack/breadcrumb`
- `github.com/hbstack/content-panel`
- `github.com/hbstack/heading-sign`
- `github.com/hbstack/pagination`
- `github.com/hbstack/search`
- `github.com/hbstack/slide`
- `github.com/hbstack/snackbar`
- `github.com/hbstack/social-share-buttons`
- `github.com/hbstack/socials`
- `github.com/hbstack/syntax-highlighting`
- `github.com/hbstack/toc-scrollspy`
- `github.com/hugomods/base`
- `github.com/hugomods/bootstrap`
- `github.com/hugomods/code-block-panel`
- `github.com/hugomods/hugopress`
- `github.com/hugomods/i18n-js`
- `github.com/hugomods/search`
- `github.com/hugomods/search-index`
- `github.com/hugomods/snackbar`

## 테마 밖에 남겨둔 외부 의존성

### Hugo Module

현재 `config/_default/module.yml`에서 유지하는 외부 Hugo Module은 아래 다섯 가지 아이콘 vendor입니다.

- `github.com/hugomods/icons/vendors/bootstrap`
- `github.com/hugomods/icons/vendors/font-awesome`
- `github.com/hugomods/icons/vendors/lucide`
- `github.com/hugomods/icons/vendors/mdi`
- `github.com/hugomods/icons/vendors/simple-icons`

### 사이트 수준에서 관리하는 기능

아래 기능은 통합 대상에서 제외했거나, 사이트 설정/외부 스크립트/CDN 방식으로 관리하는 것이 전제입니다.

- `github.com/hbstack/mermaid`
- `github.com/hugomods/katex`
- `github.com/hugomods/google-adsense`
- `github.com/hugomods/google-analytics`
- `github.com/hugomods/microsoft-clarity`

## 현재 구조에서 중요한 사실

- Disqus wrapper는 더 이상 외부 Hugo Module이 아닙니다.
  관련 hook partial은 `hbtheme` 내부에 포함되어 있습니다.
- Bootstrap SCSS와 JS는 테마 폴더에 vendoring하지 않았습니다.
  대신 루트 `node_modules`를 `module.mounts`로 노출해 사용합니다.
- `@hbstack/node-packages`는 제거되었고, 필요한 프런트엔드 패키지는 루트 `package.json`에 직접 선언되어 있습니다.
- Hugo 0.159 기준 deprecated API 치환은 이미 테마 내부에 반영되어 있습니다.

## `hugo.toml` 기본값 이관 범위

[`hugo.toml`](hugo.toml)에는 upstream 모듈의 기본 설정 중, 실제 런타임 동작에 의미가 있는 항목들을 옮겨 두었습니다.

대표적으로 아래 범주가 포함됩니다.

- `Search`, `SearchIndex` output format
- 검색 기본 파라미터
- `hugopress` 기본 hook/attribute 설정
- 이미지 렌더링 기본값
- shortcode 기본값
- Bootstrap helper 기본값
- SEO hook 등록과 favicon 기본값
- `hb` 기본 파라미터
- header/footer shell 연결
- announcement-bar, back-to-top, progress-bar, noscript
- breadcrumb, content-panel, heading-sign
- pagination, TOC scrollspy
- blog/docs 기본 동작
- related-posts, post-nav, social-share, breadcrumb, doc-nav hook 등록
- code-block-panel 기본값과 JS resource 등록
- Disqus hook 등록

반대로 아래처럼 “파일만 제공하고 별도 런타임 기본값은 거의 없는” 모듈은 `hugo.toml`에 별도 섹션을 만들지 않았습니다.

- `github.com/hbstack/header/themes/pills`
- `github.com/hbstack/blockquote-alerts`
- `github.com/hbstack/syntax-highlighting/styles/xcode-dark`
- `github.com/hbstack/bs-tooltip/modules/abbr`

## 문제를 추적하는 순서

문제가 생겼을 때는 아래 순서로 보면 빠릅니다.

1. 이 기능이 테마 내부인지, 외부 Hugo Module인지, 사이트 수준 기능인지 확인
2. [`hugo.toml`](hugo.toml)에 기본값이 있는지 확인
3. 루트 `config/_default/params.yml`, `config/_default/hugo.yml`에서 override가 있는지 확인
4. `config/_default/module.yml`의 mount/import가 올바른지 확인
5. 루트 `layouts/`, `assets/`, `i18n/`에서 사이트 고유 오버라이드가 있는지 확인
6. 그래도 이상하면 upstream 원본과 비교

## AI 또는 유지보수 담당자를 위한 메모

이 테마를 다룰 때는 [README.md](E:/REPO/hugo-blog/themes/hbtheme/README.md)만 읽고 끝내면 안 됩니다.  
아래 두 문서를 함께 봐야 현재 구조를 정확히 이해할 수 있습니다.

- [README.md](README.md)
- [DEVELOPMENT.md](DEVELOPMENT.md)

구분은 간단합니다.

- `README.md`: 적용 방법, 요구 사항, 설정 예시
- `DEVELOPMENT.md`: 통합 범위, 설정 이관 내역, 추적 기준
