# Практическая модель интеграции AI в IT-проекты

## 1. Принципы модели

1. **AI помогает, человек отвечает.** У каждой поставляемой единицы работы есть человеческий owner. AI не утверждает собственный результат и не является автором решения в организационном смысле.
2. **Один стандарт качества.** Для AI- и non-AI-кода действуют одинаковые архитектурные, security, test и review gates. Для AI-кода нужны дополнительные проверки, но не отдельная «облегчённая» дорожка.
3. **Репозиторий проекта AI-neutral.** В него попадает только то, что полезно для эксплуатации и сопровождения продукта независимо от инструмента создания.
4. **Минимально необходимый контекст.** Модели передаётся только тот код и данные, которые нужны для конкретной задачи и разрешены политикой.
5. **Малые изменения.** AI резко снижает стоимость генерации кода, но не стоимость его понимания и проверки. Поэтому размер PR и объём одновременно меняемого контекста нужно ограничивать.
6. **Спецификация раньше реализации.** Необратимые архитектурные решения, security assumptions, acceptance criteria и ограничения фиксируются до генерации кода.
7. **Проверка опирается на независимый oracle.** Тесты, написанные тем же агентом после реализации, не считаются достаточным доказательством корректности. Источник истины — требования, примеры, инварианты и человеческое решение.
8. **Least privilege для агента.** По умолчанию агент читает и изменяет только рабочую копию; push, merge, deployment, изменение production, secrets, IAM, billing и destructive operations требуют отдельных разрешений.
9. **Измеряется принятый результат, а не активность AI.** Количество промптов, токенов и строк кода — показатели потребления, но не бизнес-ценности.
10. **Инструмент заменяем.** Процесс, спецификации, критерии качества и governance не должны зависеть от одного поставщика модели.

## 2. Целевая архитектура: четыре контура

### 2.1. Контур проектной поставки

Содержит репозиторий проекта, issue tracker, CI/CD и документы, являющиеся частью продукта. Допустимы только устойчивые инженерные артефакты:

- исходный код и конфигурация продукта;
- тесты и test data без чувствительной информации;
- пользовательская и эксплуатационная документация;
- согласованные спецификации, API-контракты, ADR и threat models;
- release notes, миграции и runbooks.

Критерий допуска прост: **нужен ли этот файл следующей команде, если завтра AI-инструменты полностью отключат?** Если нет, файл, скорее всего, не относится к поставке.

### 2.2. Приватный контур AI-enablement

Отдельный внутренний репозиторий или управляемое хранилище компании:

- playbooks по ролям и типам задач;
- шаблоны спецификаций, планов и review;
- approved tool/model matrix;
- policy-as-code и правила разрешений;
- обезличенные golden tasks и eval-наборы;
- учебные материалы и lessons learned;
- шаблоны метрик, аудита и incident response.

Он **не должен становиться теневой копией репозитория проекта**. Код, документы и логи проекта нельзя постоянно дублировать туда без договорного основания. Проектный контекст либо остаётся в одобренном инструменте с заданной retention policy, либо существует локально и временно.

### 2.3. Управляемый execution-контур

Рабочие копии, dev containers, worktrees или изолированные виртуальные среды, где запускается AI-ассистент. Обязательные свойства:

- корпоративная identity, SSO/MFA и управляемые лицензии;
- централизованная политика моделей и функций;
- ограниченные filesystem, network и command permissions;
- отсутствие production credentials;
- краткий срок жизни сессий и рабочих каталогов;
- журнал административных событий и исключений;
- запрет personal/free AI accounts для кода проекта.

Конфигурация агента загружается **из-за пределов репозитория проекта**: через управляемый профиль IDE, launcher, dev-container image, MDM, внутренний CLI или внешний workspace. Символические ссылки и один лишь `.gitignore` — слабая защита: агент или человек может всё равно прочитать или случайно добавить файл.

### 2.4. Governance-контур

Содержит владельцев решений и доказательства соблюдения правил:

- AI usage policy;
- реестр проектов и разрешённых AI-lanes;
- vendor assessment, DPA, retention и residency decisions;
- risk acceptance и исключения;
- результаты внутренних аудитов;
- incident register;
- агрегированные метрики пилотов и масштабирования.

Эта схема согласуется с логикой NIST AI RMF: управление риском строится как постоянный цикл Govern, Map, Measure, Manage, а не как разовая проверка инструмента. См. [NIST AI RMF и профиль для Generative AI](https://www.nist.gov/itl/ai-risk-management-framework).

### 2.5. Исполняемый контракт двух репозиториев

Для каждого проекта создаётся собственный приватный `project-ai-workspace`, расположенный рядом с project repository. Между ними нет submodule, subtree, symlink или Git remote: связь выполняет локальный launcher по относительному пути и exact remote allowlist.

Конфигурация должна быть исполняемой, а не описательной:

1. каждый JSON проходит strict schema validation; неизвестный ключ блокирует запуск;
2. data policy либо добавляется в session contract, либо fail-closed блокирует доступ к source;
3. filesystem/approval/Docker mount значения преобразуются в реальные tool arguments;
4. protected paths участвуют в обязательном delivery scan;
5. каждая project command имеет режим `agent`, `manual`, `forbidden` или `unresolved`;
6. launcher исполняет только `agent` через executable + argv без shell parsing;
7. manual evidence хранится только как обезличенный статус, а не как лог/транскрипт;
8. неизменяемые security invariants (AI/runtime read-only mounts, отсутствие host home и Docker socket) не выставляются как project options.

Подробная установка и ежедневная работа описаны в `ai-project-two-repository-runbook-ru.md`; точные JSON-ключи — в `project-ai-workspace-template/project/README.md`.

## 3. Классификация артефактов

| Класс | Примеры | Где хранить | В Git проекта |
|---|---|---|---|
| A. Поставляемые | код, тесты, API spec, ADR, runbook | системы проекта | да |
| B. Внутренние AI-operational | промпты, memory, transcripts, model configs, scratch plans | приватный/временный контур | нет |
| C. Audit/governance | approvals, vendor evidence, исключения, агрегированные usage logs | защищённая GRC/внутренняя система | нет |
| D. Чувствительные | secrets, PII, production data, security findings, ключи | профильная защищённая система | только если это штатный защищённый формат проекта; в модель — по отдельному разрешению |

Спецификации и планы классифицируются по смыслу, а не происхождению. Согласованная feature specification полезна проекту и может относиться к классу A. Черновой chain-of-thought, transcript или служебный agent task list — класс B.

## 4. Три режима допуска AI к проекту

### Green lane

Для публичного или синтетического контекста, boilerplate, общих вопросов, обучения, генерации тестовых данных без информации проекта. Разрешены корпоративно одобренные SaaS-модели.

### Amber lane

Для конфиденциального кода проекта. Нужны:

- договорное разрешение;
- enterprise/API account;
- запрет обучения на business data;
- согласованные retention, data residency и subprocessors;
- SSO, RBAC, audit и возможность отключать функции;
- минимизация передаваемого контекста;
- запрет secrets и production data.

Например, OpenAI заявляет, что данные Business/Enterprise/API по умолчанию не используются для обучения, а для подходящих API-организаций доступно управление retention вплоть до zero data retention; это всё равно необходимо проверить для конкретного продукта, endpoint и договора: [OpenAI business data privacy](https://openai.com/business-data/). GitHub предоставляет enterprise policies и audit controls, но поддержка ограничений различается между IDE chat, agent mode, CLI и cloud agent: [GitHub Copilot policies](https://docs.github.com/en/copilot/concepts/policies) и [ограничения content exclusion](https://docs.github.com/en/enterprise-cloud%40latest/copilot/concepts/context/content-exclusion).

### Red lane

Для запрещённого договором контента, secrets, production dumps, платёжных/медицинских данных, особо чувствительных security findings и экспортно-ограниченных материалов. Варианты:

- AI не используется;
- используется одобренная локальная/on-prem модель в изолированном контуре;
- задача предварительно санитизируется и декомпозируется до Green/Amber контекста;
- оформляется формальное risk acceptance.

Content exclusion не является абсолютным security boundary. Документация GitHub прямо указывает, что ряд agent/CLI режимов не поддерживает исключения, а IDE может косвенно передавать семантическую информацию. Поэтому основной контроль — архитектурная изоляция и разрешения, а exclusion — дополнительный слой.

## 5. Проверка проекта перед внедрением

Интегратор проводит 60–90-минутный intake и короткий технический discovery.

### 5.1. Договор и данные

- Разрешено ли использование generative AI и нужны ли уведомление/согласие заказчика?
- Кому принадлежат inputs, outputs и производные материалы?
- Какие confidentiality, residency, retention и deletion requirements действуют?
- Есть ли PII, PHI, PCI, коммерческие тайны, source export controls?
- Можно ли передавать код subprocessors и в каких странах?
- Требуется ли предоставить SBOM, provenance, audit evidence или перечень инструментов?

### 5.2. Техническая готовность

- Репозиторий собирается воспроизводимо?
- Есть ли быстрый test/lint/typecheck loop?
- Формализованы ли coding standards и architecture boundaries?
- Есть ли branch protection, mandatory review, secret scanning, SAST/SCA?
- Средний размер и lead time PR, change failure rate, escaped defects?
- Какие части системы критичны или плохо покрыты тестами?

### 5.3. Командная готовность

- У кого сильное знание домена и кто утверждает спецификации?
- Есть ли reviewers с достаточным временем?
- Какие задачи создают повторяющуюся нагрузку?
- Какой уровень AI-literacy и security training?
- Не используется ли уже shadow AI через личные аккаунты?

Результат intake — одностраничный **Project AI Readiness Card**: lane, разрешённые use cases, запретные данные, approved tools, human gates, baseline metrics, владельцы и дата пересмотра.

## 6. Рекомендуемый Feature Flow

### Шаг 1. Triage и выбор глубины процесса

Не каждая задача требует полного SDD.

| Уровень | Когда | Минимум артефактов |
|---|---|---|
| Fast | локальная, обратимая, низкорисковая правка | issue, acceptance criteria, тест/проверка |
| Standard | обычная feature или заметный refactor | spec → plan → tasks → implementation |
| High-risk | auth, payments, PII, cryptography, migrations, public API, infrastructure | spec + ADR + threat model + rollout/rollback + независимый security review |

### Шаг 2. Specification

Спецификация описывает намерение, а не диктует моделью случайную реализацию:

- проблема и ожидаемый пользовательский/бизнес-результат;
- scope и explicit out-of-scope;
- actors и ключевые сценарии;
- acceptance criteria в проверяемой форме;
- инварианты, edge cases и failure behavior;
- security, privacy, performance, accessibility и operability requirements;
- зависимости, ограничения и открытые вопросы;
- примеры входов/выходов;
- success metrics и rollout constraints.

GitHub Spec Kit формализует схему `Specify → Plan → Tasks → Implement` и поддерживает human review gates; её стоит использовать как референс процесса, а не обязательно устанавливать в репозиторий проекта: [GitHub Spec Kit](https://github.github.com/spec-kit/) и [workflow с review gates](https://github.com/github/spec-kit/blob/main/workflows/README.md).

### Шаг 3. Clarification gate

Product owner/analyst, tech lead и при необходимости QA/security устраняют двусмысленности. Агент обязан перечислить assumptions; он не имеет права молча выбирать бизнес-поведение, security boundary или стратегию миграции.

### Шаг 4. Technical plan

План включает:

- затрагиваемые компоненты и контракты;
- существующие паттерны, которые нужно переиспользовать;
- data flow и trust boundaries;
- migrations, compatibility, observability и rollback;
- test strategy;
- риски и альтернативы;
- список малых вертикальных slices.

Значимые долгоживущие решения оформляются обычным ADR в формате проекта. Не нужно писать «AI предложил»; документирует и принимает решение инженер.

### Шаг 5. Task decomposition

Каждая задача должна:

- давать законченную проверяемую часть поведения;
- иметь 1–3 acceptance criteria;
- по возможности затрагивать не более 3–5 файлов;
- иметь конкретную verification-команду или manual check;
- явно указывать зависимости;
- оставлять main branch в рабочем состоянии.

### Шаг 6. Реализация

- Разработчик даёт агенту одну задачу и минимальный релевантный контекст.
- Агент сначала читает существующие паттерны и тесты.
- Изменение выполняется в отдельной ветке/worktree/изолированной среде.
- Нельзя принимать крупный «one-shot» diff без промежуточной проверки.
- Новая dependency требует обоснования, license/security проверки и human approval.
- Агент не получает production credentials и не выполняет deployment.

### Шаг 7. Verification ladder

Проверки выполняются от дешёвых к дорогим:

1. format/lint/typecheck;
2. targeted unit tests;
3. regression/integration/contract tests;
4. build/package verification;
5. SAST, SCA, secret scan и license/public-code match;
6. performance, accessibility, migration или security tests по риску;
7. ручная проверка acceptance criteria;
8. сравнение spec ↔ diff ↔ tests ↔ documentation.

NIST SSDF рекомендует встраивать security practices в существующий SDLC, включая требования, проверку ПО и защиту артефактов: [NIST SP 800-218](https://csrc.nist.gov/pubs/sp/800/218/final). Для AI-кода это не новый параллельный SDLC, а усиленный профиль существующего.

### Шаг 8. Независимый review

Минимум один человек, который не делегирует решение агенту целиком, проверяет:

- соответствует ли изменение реальной задаче;
- нет ли invented API, config, dependencies или assumptions;
- не расширен ли scope;
- корректны ли auth/authz, validation, error handling и logging;
- тесты проверяют наблюдаемое поведение, а не повторяют реализацию;
- нет ли ненужной сложности, dead code и copy-paste;
- обновлены ли документация, migrations, observability и rollback;
- нет ли совпадений с публичным кодом и лицензионного риска.

Второй AI может быть «адверсариальным reviewer», но не заменяет human approval. Документация GitHub отдельно предупреждает о неверном, небезопасном и совпадающем с публичным коде даже в agent/CLI режимах: [responsible use for Copilot agents](https://docs.github.com/en/copilot/responsible-use/agents) и [public code references](https://docs.github.com/en/copilot/how-tos/get-code-suggestions/find-matching-code).

### Шаг 9. PR и поставка

PR должен быть написан как обычный инженерный документ:

- зачем изменение нужно;
- что фактически изменено;
- как проверено;
- риски, rollout и rollback;
- связь с issue/spec/ADR.

Запрещены недостоверные утверждения вроде «fully tested», если проверки не выполнены. Перед push и перед handoff проекта выполняется **AI Artifact Leak Check**.

### Шаг 10. Обратная связь и очистка

- фиксируются принятый результат, rework, дефекты и фактическое время;
- полезное обобщённое знание переносится во внутренний playbook без секретов проекта;
- временные prompts, transcripts, clones и context packs удаляются согласно retention policy;
- спецификация и документация обновляются, если фактическое решение изменилось.

## 7. Специализированные потоки

### Bug-fix flow

Reproduce → failing regression test → root-cause hypothesis → минимальный patch → тест становится зелёным → соседние regressions → review. Запрещено «лечить» симптом отключением validation, ослаблением теста или широким catch без объяснения причины.

### Testing flow

Risk map → test oracle из требований → positive/negative/boundary cases → test implementation → проверка, что тест действительно ловит дефект → flakiness/mutation check по риску → review. Для критичного кода полезно разделять роли: один агент/человек формирует тестовую модель до того, как другой видит реализацию.

### Documentation flow

Определить аудиторию → собрать только проверяемые источники → draft → выполнить примеры/команды → проверить версии, ссылки и API → language/style review → approval владельцем. AI не должен придумывать capabilities, SLA, compliance statements или параметры API.

### Legacy onboarding flow

Не просить модель «объяснить весь репозиторий». Сначала построить карту модулей, entry points, dependency graph, critical flows и тестовые команды; затем проверять каждый вывод по коду. Результатом может быть полезный проекту architecture overview, но транскрипт исследования остаётся внутренним.

### Refactoring flow

Зафиксировать observable behavior → characterization tests → ограничить область → один refactoring step → regressions/performance → diff review. Нельзя одновременно менять архитектуру, поведение и стиль без явной необходимости.

## 8. Definition of Ready и Definition of Done

### Definition of Ready для AI-assisted задачи

- понятны цель, scope и owner;
- есть acceptance criteria и test oracle;
- определён риск-уровень и разрешённый AI-lane;
- известны запрещённые данные;
- доступны релевантные build/test команды;
- сняты критичные business/security ambiguities;
- задача достаточно мала для одного reviewable slice.

### Definition of Done

- acceptance criteria подтверждены;
- все обязательные quality/security gates зелёные;
- человек прочитал и понял diff;
- нет несанкционированных dependencies и публичного кода с несовместимой лицензией;
- тесты демонстрируют требуемое поведение и регрессию;
- документация/ADR/observability/rollback обновлены по необходимости;
- project repository прошёл artifact leak scan;
- временный AI-контекст обработан согласно retention policy;
- PR не содержит недостоверной AI-сгенерированной формулировки.

## 9. AI Artifact Leak Check

Контроль должен работать на трёх уровнях.

### На workstation

- managed ignore templates;
- staged-diff scan до commit;
- предупреждение о новых скрытых каталогах и неизвестных файлах;
- запрет secrets и известных transcript formats;
- отдельный внешний workspace для agent configuration.

### В CI

- deny/allow list имён файлов и каталогов;
- поиск model/vendor signatures, AI trailers и типичных transcript markers;
- проверка archive/package contents, а не только Git tree;
- secret, PII и license scanning;
- fail с понятным remediation и механизмом одобренного исключения.

### Перед handoff

- проверка всей ветки и release artifact;
- поиск случайно добавленных бинарных logs/databases/session caches;
- проверка Git history на уже удалённые чувствительные файлы;
- подпись ответственного за поставку.

Сканер не должен слепо запрещать слова `AI`, `GPT` или `model`: они могут быть легитимной частью продукта проекта. Контроль ищет конкретные служебные артефакты и поддерживает project-specific allowlist. `.gitignore` — только удобство, не контроль безопасности.

## 10. Security и supply-chain controls

Минимальный baseline:

- corporate accounts, SSO/MFA, least privilege и регулярный access review;
- запрет personal tokens и секретов в prompts;
- sandbox/container для agentic execution;
- default-deny для network egress и MCP/plugins, allowlist approved endpoints;
- human confirmation для destructive commands и любых внешних side effects;
- branch protection, required review и signed/traceable CI;
- secret scanning, SAST, SCA, SBOM и dependency pinning;
- public-code/license match detection;
- prompt-injection awareness при чтении issues, docs, web pages и repository content;
- incident procedure: stop → revoke → preserve evidence → assess exposure → notify по договору → rotate → remediate → learn.

OWASP выделяет prompt injection и sensitive information disclosure среди ключевых рисков LLM-приложений; эти риски применимы и к coding agents, читающим недоверенный repository/web content: [OWASP Top 10 for LLM Applications 2025](https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf). Для предотвращения случайного попадания secrets в version control полезен baseline OpenSSF: [OpenSSF OSPS Baseline](https://baseline.openssf.org/versions/2026-02-19).

## 11. Выбор AI-инструмента: обязательная анкета

Оценивать нужно каждую поверхность отдельно: IDE completion, chat, local agent, cloud agent, code review, CLI, API и MCP могут иметь разные гарантии.

| Область | Проверяемые вопросы |
|---|---|
| Данные | Используются ли inputs/outputs для training? Каковы retention, deletion, backups, residency? |
| Договор | DPA, subprocessors, IP indemnity, confidentiality, breach notification, export restrictions? |
| Identity | SSO, SCIM, RBAC, service accounts, offboarding? |
| Контроль | Можно ли запретить модели, cloud agents, plugins/MCP, network и public-code matches? |
| Audit | Какие события логируются, сколько хранятся, есть ли API/export/SIEM? |
| Isolation | Где выполняется код, какие secrets/network доступны, есть ли ephemeral sandbox? |
| Quality | Поддержка актуального стека, context limits, references, тестируемость и reproducibility? |
| Resilience | Rate limits, outage behavior, vendor lock-in, fallback и exit plan? |
| Cost | Seat/token/compute, budget caps, cost attribution, idle licenses? |

Vendor statement нельзя переносить с одного тарифа или продукта на другой. Настройки также могут дрейфовать; GitHub рекомендует централизованно управлять enterprise policies и отслеживать их изменения через audit log: [GitHub governance basics](https://docs.github.com/en/copilot/concepts/policies).

## 12. Метрики и дизайн пилота

Исследования не дают основания обещать универсальное ускорение. DORA называет AI усилителем организационной системы и рекомендует улучшать базовые delivery capabilities: [DORA State of AI-assisted Software Development 2025](https://dora.dev/research/2025/dora-report/). В RCT METR опытные разработчики на знакомых open-source репозиториях с инструментами начала 2025 года потратили на задачи на 19% больше времени, хотя считали, что ускорились; авторы подчёркивают узость выборки и изменчивость инструментов: [METR study](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/). Следовательно, компании нужен собственный контролируемый пилот.

### Outcome metrics

- cycle/lead time от Ready до Accepted;
- throughput только принятых и завершённых slices;
- review time, количество итераций и rework rate;
- escaped defects, severity, rollback и change failure rate;
- PR size и доля незапланированного scope growth;
- security findings и время remediation;
- документационная актуальность и test flakiness;
- developer cognitive load, satisfaction и время на ожидание.

### AI-specific guardrails

- доля задач, где AI использован в разрешённом lane;
- successful assisted task rate по типу use case;
- human correction/rejection rate;
- AI cost на принятое изменение, а не на пользователя;
- нарушения data policy;
- утечки AI-артефактов в project branch/release;
- попытки опасных команд и bypass human gate;
- лицензионные/public-code совпадения.

### Как проводить пилот

1. Собрать baseline минимум за 3–4 недели.
2. Выбрать 1–2 команды и 2–4 конкретных use case, а не «AI для всего».
3. Сегментировать результаты по типу задачи, seniority, знакомству с репозиторием и риску.
4. По возможности применять matched comparison или stepped-wedge rollout.
5. Измерять полный путь до принятого PR, включая review и исправления.
6. Не использовать индивидуальные метрики для performance management.
7. Через 6–8 недель принять решение: stop, adjust, expand.

Успех пилота — улучшение хотя бы одного outcome без ухудшения quality/security guardrails. Высокая adoption сама по себе успехом не является.

## 13. 90-дневный план внедрения

### Фаза 0. Спонсор и границы, дни 1–5

**Результат:** charter внедрения.

- назначить executive sponsor, AI integration lead, security/legal owners;
- зафиксировать цели, исключения и запрещённые сценарии;
- выбрать будущие pilot teams;
- согласовать, что project contract всегда выше внутреннего playbook.

**Критерий:** есть владельцы, scope, бюджет и stop conditions.

### Фаза 1. Discovery и baseline, недели 1–2

**Результат:** readiness assessment и измеримый baseline.

- инвентаризация проектов, инструментов и shadow AI;
- классификация данных/договоров;
- карта текущего SDLC и bottlenecks;
- baseline delivery/quality metrics;
- выбор 2–4 low/medium-risk use cases.

**Критерий:** каждый pilot project имеет Project AI Readiness Card.

### Фаза 2. Governance и платформа, недели 3–4

**Результат:** безопасный внешний AI-контур.

- AI usage policy и проектные lanes;
- vendor/tool assessment и enterprise configuration;
- приватный enablement repository;
- внешние instruction profiles и role playbooks;
- permission model, retention и incident runbook;
- strict configuration schema, command modes и проверяемое соответствие JSON фактическим adapter/launcher controls;
- leak scanner и CI guard;
- шаблоны spec/plan/tasks/review/DoR/DoD.

**Критерий:** security/legal approve pilot configuration; тестовая «утечка» блокируется.

### Фаза 3. Обучение и rehearsal, неделя 5

**Результат:** команда умеет выполнять flow безопасно.

- 2-часовой AI literacy/security workshop;
- практикум: specification → small diff → verification → review;
- упражнения на hallucination, prompt injection, secrets и destructive commands;
- проверка знания политики коротким scenario-based assessment.

**Критерий:** участники проходят упражнение и знают escalation path. Для организаций, работающих в зоне применимости EU AI Act, обучение также поддерживает обязанность по AI literacy из [Article 4](https://eur-lex.europa.eu/eli/reg/2024/1689/oj?locale=en).

### Фаза 4. Контролируемый пилот, недели 6–10

**Результат:** не менее 20–30 сопоставимых задач с полным измерением.

- weekly office hours интегратора;
- проверка первых PR усиленным reviewer;
- еженедельный анализ defects, rework и policy events;
- корректировка templates и use-case boundaries;
- запрет расширения на новые sensitive areas без review.

**Критерий:** нет критичных инцидентов; данные достаточны для сравнения с baseline.

### Фаза 5. Решение и масштабирование, недели 11–13

**Результат:** pilot report и rollout decision.

- сравнить outcome и guardrail metrics;
- выделить use cases с положительным/нейтральным/отрицательным результатом;
- обновить policy, training, tool matrix и playbooks;
- сформировать onboarding kit для следующей команды;
- утвердить cadence квартального review.

**Критерий:** решение `stop / adjust / scale` принято по заранее согласованным порогам.

## 14. Модель зрелости

| Уровень | Состояние | Следующий шаг |
|---|---|---|
| 0. Shadow | личные аккаунты, нет правил и измерений | остановить неуправляемую передачу данных, провести inventory |
| 1. Controlled | approved tools, базовая policy, пилот | стандартизировать lanes и flow |
| 2. Repeatable | templates, strict executable configuration, gates, training, leak checks | автоматизировать policy и метрики |
| 3. Measured | outcome dashboard, evals, portfolio governance | оптимизировать use cases и стоимость |
| 4. Adaptive | tool-agnostic platform, continuous eval, быстрые безопасные эксперименты | постоянное улучшение и пересмотр рисков |

Не следует переходить на следующий уровень только из-за роста количества лицензий.

## 15. Роли и ответственность

| Роль | Ответственность |
|---|---|
| Executive sponsor | цели, бюджет, risk appetite, снятие оргблокеров |
| AI integration lead | operating model, project intake, playbooks, pilot и coaching |
| Legal/Privacy | contract, DPA, IP, disclosure, residency и deletion |
| Security | threat model, tool assessment, permissions, monitoring, incident response |
| Engineering manager | workflow adoption, capacity reviewers, outcome metrics |
| Tech lead/Architect | архитектурные границы, ADR, high-risk approvals |
| Developer/QA/Writer | правильный контекст, проверка output, соблюдение DoD |
| Human reviewer | независимое подтверждение корректности и понятности |
| Platform/DevEx | managed configuration, sandbox, CI gates, telemetry |

AI никогда не занимает accountable-роль в RACI.

## 16. Пакет материалов AI-интегратора

Минимальный reusable kit:

1. AI Usage Policy.
2. Project Contract & Disclosure Checklist.
3. Project AI Readiness Card.
4. Data Classification & AI Lane Matrix.
5. Approved Tools/Models Matrix.
6. Feature/Bug/Test/Docs Flow cards.
7. Spec, plan, task, ADR и threat-model templates.
8. DoR/DoD и AI Code Review Checklist.
9. Agent Permission Policy.
10. AI Artifact Leak Scanner и allowlist procedure.
11. Incident Response Runbook.
12. Golden Task/Eval Suite без секретов проекта.
13. Pilot Dashboard и experiment protocol.
14. Training deck, exercises и assessment.
15. Quarterly Governance Review template.
16. Strict JSON Configuration Reference и automated schema/behavior tests.

## 17. Что не делать

- Не устанавливать полный AI-framework в репозиторий проекта «по умолчанию».
- Не копировать репозиторий проекта во внутреннюю knowledge base без договора.
- Не считать `.gitignore` достаточной изоляцией.
- Не разрешать personal AI accounts для конфиденциального кода.
- Не отправлять модели secrets, production logs/dumps и реальные персональные данные.
- Не давать агенту autonomous merge/deploy/production/IAM права.
- Не генерировать всю feature одним большим prompt и PR.
- Не позволять агенту самостоятельно выбирать business/security assumptions.
- Не считать AI-generated tests независимой проверкой AI-generated code.
- Не измерять успех строками кода, количеством промптов или adoption rate.
- Не скрывать использование AI, если договор или закон требует раскрытия.
- Не обещать заказчику ускорение до измеренного пилота.

## 18. Контрольные вопросы для адаптации под компанию

Для превращения этой общей модели в конкретный operating handbook нужны ответы:

1. В каких юрисдикциях зарегистрированы компания и основные заказчики?
2. Какие типовые договоры уже содержат ограничения на subprocessors, source code и AI?
3. Какие Git/issue/CI/IDE платформы используются чаще всего?
4. Есть ли регулируемые домены: fintech, healthcare, automotive, public sector?
5. Требование «не видеть AI-артефакты» означает чистоту репозитория или также отсутствие раскрытия владельцу проекта факта AI-assisted разработки?
6. Кто будет владельцем AI governance: CTO, Security, Delivery или отдельный AI CoE?
7. Какие 2–4 use case наиболее болезненны сейчас: feature delivery, legacy onboarding, tests, documentation, code review, support?
8. Есть ли возможность использовать enterprise SaaS, или нужен self-hosted/on-prem контур?
9. Какие delivery и quality metrics уже собираются?
10. Какой масштаб пилота: количество команд, технологий и длительность?

## 19. Итоговая рекомендация

Начинать следует не с выбора «лучшей модели» и не с массовой установки расширений. Первый практический продукт интегратора — **контролируемая AI-assisted delivery system**:

1. договорно разрешённый lane;
2. внешний по отношению к Git проекта AI-контур;
3. spec-anchored feature flow с малыми вертикальными slices;
4. human gates и обычный secure SDLC;
5. автоматический контроль утечек артефактов;
6. пилот с outcome/quality metrics;
7. масштабирование только доказавших пользу use cases.

Это сохраняет главное преимущество AI — быстрое исследование, декомпозицию, генерацию вариантов и автоматизацию рутинной работы — не превращая кодовую базу проекта в зависимый от конкретной модели или поставщика набор служебных файлов.

## Основные источники

- [NIST AI Risk Management Framework и Generative AI Profile](https://www.nist.gov/itl/ai-risk-management-framework)
- [NIST Secure Software Development Framework SP 800-218](https://csrc.nist.gov/pubs/sp/800/218/final)
- [OWASP Top 10 for LLM Applications 2025](https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf)
- [DORA State of AI-assisted Software Development 2025](https://dora.dev/research/2025/dora-report/)
- [METR: Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)
- [GitHub Spec Kit](https://github.github.com/spec-kit/)
- [GitHub Copilot enterprise policies](https://docs.github.com/en/copilot/concepts/policies)
- [GitHub Copilot content exclusion and limitations](https://docs.github.com/en/enterprise-cloud%40latest/copilot/concepts/context/content-exclusion)
- [GitHub responsible use for coding agents](https://docs.github.com/en/copilot/responsible-use/agents)
- [OpenAI business data privacy](https://openai.com/business-data/)
- [OpenSSF OSPS Baseline](https://baseline.openssf.org/versions/2026-02-19)
- [EU AI Act, Article 4](https://eur-lex.europa.eu/eli/reg/2024/1689/oj?locale=en)
