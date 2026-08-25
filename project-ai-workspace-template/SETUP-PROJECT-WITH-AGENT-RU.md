# Инструкция агенту: настроить AI-workspace для конкретного клиентского проекта

Эту инструкцию передают Codex, Claude Code или другому coding agent после того, как человек:

1. создал приватный AI-репозиторий из Starter Kit;
2. клонировал AI-репозиторий и клиентский репозиторий соседними каталогами;
3. открыл AI-репозиторий как рабочую папку агента;
4. попросил выполнить эту инструкцию.

Пример запроса агенту:

```text
Прочитай SETUP-PROJECT-WITH-AGENT-RU.md полностью и настрой этот AI-workspace
для соседнего клиентского репозитория. Клиентский репозиторий не изменяй.
Сначала выполни read-only preflight и задай только те вопросы, ответы на которые
нельзя безопасно определить из репозиториев.
```

## 1. Твоя задача

Настрой текущий приватный AI-репозиторий так, чтобы он мог безопасно управлять AI-сессиями в одном конкретном клиентском checkout через `aiw`.

Ожидаемый результат:

- оба Git-репозитория остаются независимыми;
- AI-файлы находятся только в AI-репозитории и пользовательской конфигурации компьютера;
- `project/profile.json` содержит правильный путь, remote, ветку, команды и data policy;
- роли, workflows и проектные ограничения соответствуют клиентской кодовой базе;
- `aiw self-test`, `aiw doctor` и `aiw verify` проходят;
- по явному разрешению человека установлены глобальная команда, локальный hook и Desktop-интеграции;
- сформирован итоговый отчёт без клиентского исходного кода, secrets и transcript.

## 2. Неприкосновенные ограничения

Всегда соблюдай следующие правила:

1. Не создавай и не изменяй tracked-файлы клиентского репозитория в рамках настройки.
2. Не добавляй в client repo `AGENTS.md`, `CLAUDE.md`, `.codex`, `.claude`, `.ai`, prompts, transcripts, skills или settings AI-инструмента.
3. Не создавай submodule, subtree, symlink, nested repository или Git remote между репозиториями.
4. Не копируй клиентский исходный код, конфигурацию окружения, ticket content или логи в AI-repo.
5. Не читай `.env`, credentials, private keys, production dumps и другие вероятные secrets.
6. Не выполняй commit, push, merge, deploy и не меняй branch protection.
7. Не устанавливай зависимости и не изменяй пользовательские/Desktop-настройки без явного согласия человека.
8. Не перезаписывай существующий Git hook или Desktop config. При конфликте остановись и покажи безопасный способ объединения.
9. Не угадывай договорный data lane, разрешённые модели или право передавать client source AI-провайдеру.
10. При обнаружении незакоммиченных пользовательских изменений не удаляй, не перемещай и не форматируй их.

Настройка выполняется преимущественно в AI-репозитории. Разрешённые локальные изменения вне него после подтверждения человека:

- `~/.aiw/projects.json` — регистрация пары репозиториев;
- `~/.agents/skills/aiw-<project-id>/` — пользовательский Codex skill;
- `.git/hooks/pre-push` клиентского checkout — только управляемый AIW hook;
- Claude Desktop MCP/Extension configuration — только после показа diff или готового фрагмента.

## 3. Режим работы

Выполняй настройку по фазам. После каждой фазы проверь критерии. Не переходи к мутациям до завершения read-only preflight.

### Фаза A. Read-only preflight

1. Найди корень текущего AI-репозитория:

   - должен существовать `project/profile.json`;
   - должны существовать `bin/aiw.mjs`, `agents/`, `skills/` и `workflows/`;
   - `git rev-parse --show-toplevel` должен указывать на AI-repo.

2. Прочитай текущие:

   - `README.md`;
   - `START-HERE-RU.md`;
   - `DESKTOP-AND-CLI-RU.md`;
   - `project/profile.json`;
   - `project/permissions.json`;
   - `project/forbidden-artifacts.json`;
   - `project/skill-improvement-policy.json`;
   - `docs/base-instructions.md`.

3. Определи предполагаемый клиентский checkout:

   - сначала используй `targetRepository.localRelativePath`;
   - если это placeholder или путь не существует, проверь только соседние каталоги;
   - кандидат обязан быть отдельным Git worktree;
   - AI-repo и client repo не могут быть вложены друг в друга.

4. Для каждого кандидата получи только безопасные Git-метаданные:

   - абсолютный корень;
   - `git remote get-url origin`;
   - текущую и default branch;
   - `git status --short`;
   - наличие `.gitmodules`.

5. Не выбирай автоматически, если найдено более одного правдоподобного client repo. Попроси человека указать точный путь.

6. Проверь AI-repo:

   - remote относится к приватному репозиторию аутсорсера;
   - в нём нет client source, `.env`, keys, dumps или session runtime;
   - template не вложен в client repo;
   - `project.id` и remote placeholders ещё не считаются ошибкой на этой фазе.

Выведи краткий preflight-отчёт:

```text
AI repository: <absolute path>
AI origin: <normalized URL>
Client candidate: <absolute path>
Client origin: <normalized URL>
Client default branch: <branch>
Client worktree state: clean | has user changes
Detected stack: <stack or unknown>
Blocking questions: <list>
```

### Фаза B. Собрать обязательные решения

Сначала попробуй определить технические факты read-only анализом. Задавай человеку только вопросы, которые нельзя безопасно вывести.

Обязательные входы:

| Поле | Как получить |
|---|---|
| `project.id` | спросить или предложить безопасный slug |
| `project.displayName` | спросить; не включать секретные названия без разрешения |
| client path | определить и подтвердить |
| allowed remotes | получить из `git remote get-url origin`; дополнительные URL спросить |
| default branch | получить через Git remote metadata; подтвердить при неоднозначности |
| data lane | только явный ответ человека: `green`, `amber` или `red` |
| default tool | спросить: `codex` или `claude` |
| models | только утверждённые человеком; пустая строка означает enterprise default |
| native/Docker | спросить, если это влияет на утверждённую изоляцию |
| project commands | вывести из README, manifests и CI, затем показать человеку |

Нельзя выводить data lane из того, что код уже доступен локально. Доступ к repo не означает разрешение отправлять его модели.

### Фаза C. Исследовать клиентский проект без изменений

Определи команды проекта в следующем порядке:

1. официальная contributing/development документация клиента;
2. CI pipelines;
3. task runner (`Makefile`, `Taskfile`, scripts);
4. package manifests и lockfiles;
5. фактический stack convention.

Проверяй типичные источники, не открывая secrets:

- JavaScript/TypeScript: `package.json`, lockfile, CI;
- .NET: `*.sln`, `*.csproj`, CI;
- Java/Kotlin: `pom.xml`, `build.gradle*`, wrapper, CI;
- Python: `pyproject.toml`, lockfile, tox/nox config, CI;
- Go: `go.mod`, `Makefile`, CI;
- Rust: `Cargo.toml`, CI;
- mobile: Gradle/Xcode project metadata и CI.

Для каждого действия определи одну реальную команду:

- `install`;
- `format` или format check;
- `lint`;
- `typecheck`, если применимо;
- `testTargeted`;
- `testFull`;
- `build`.

Правила:

- не запускай install на этой фазе;
- не изобретай отсутствующие scripts;
- не используй разрушительные или production-команды;
- если действие не применимо, зафиксируй безопасное объяснение;
- если команда не подтверждена, оставь `UNRESOLVED` и включи её в blockers.

Также собери только обобщённый project context для AI-repo:

- языки и framework;
- основные компоненты и каталоги;
- принятые naming/testing conventions;
- location клиентских specs/ADR;
- зоны повышенного риска;
- команды проверки.

Не копируй фрагменты клиентского кода в AI-repo.

### Фаза D. Настроить AI-репозиторий

Изменяй только файлы AI-repo.

1. Заполни `project/profile.json`:

   - замени `REPLACE_PROJECT_ID` и `REPLACE_PROJECT_NAME`;
   - запиши client path относительно AI-repo и используй `/` как separator;
   - добавь точные SSH/HTTPS remotes без wildcard;
   - укажи реальную default branch;
   - установи согласованный data lane;
   - установи `ai.defaultTool`;
   - модели оставь пустыми либо укажи только явно утверждённые;
   - заполни `projectCommands` подтверждёнными командами.

2. Проверь `project/permissions.json`:

   - client repo разрешён для чтения и рабочей записи;
   - `.git`, CI settings, IDE settings и production paths защищены;
   - commit/push/merge/deploy остаются human gates;
   - network по умолчанию запрещён;
   - не расширяй права только ради прохождения проверки.

3. Проверь `project/forbidden-artifacts.json`:

   - сохрани базовые запреты AIW;
   - добавь tool-specific artifacts, если они реально используются;
   - не запрещай обычные продуктовые слова вроде `AI`;
   - добавляй `allowPaths` только при документированном клиентском исключении.

4. Проверь `project/skill-improvement-policy.json`: human review обязателен, autonomous skill mutation/merge выключены, а client artifacts запрещены как learning data. Ослабление этих правил требует отдельного Security/AIW-owner решения.

5. Адаптируй `project/glossary.md`, `docs/base-instructions.md`, роли, skills и workflows только если обнаружены устойчивые проектные особенности. Записывай правила своими словами и без client source. Не превращай выбранный framework или единичный пример в универсальное требование skill.

6. Не создавай клиентские документы в AI-repo. Если клиент уже использует ADR/specs, в AI-workspace укажи только их location и правила использования.

7. Покажи человеку diff AI-repo. Отдельно перечисли:

   - подтверждённые факты;
   - сделанные предположения;
   - `UNRESOLVED`;
   - запрошенные расширения permissions.

### Фаза E. Локальная регистрация и защита

Перед изменением пользовательского окружения спроси единое подтверждение на следующие действия:

- установить/обновить глобальную команду `aiw` через локальный package;
- зарегистрировать проект в `~/.aiw/projects.json`;
- установить управляемый pre-push hook;
- установить пользовательский Codex skill;
- подготовить Claude Desktop MCP config.

После подтверждения выполни по порядку:

```text
npm install -g .
aiw register .
aiw projects
aiw self-test
aiw doctor --tool <approved-tool> --mode <native|docker> --require-commands
aiw install-hooks
```

Если global install запрещён или недоступен:

- macOS: используй `./bin/aiw`;
- Windows PowerShell: используй `.\bin\aiw.ps1`;
- отметь в отчёте, что Desktop integrations, вызывающие глобальный `aiw`, ещё не готовы.

Если существующий client pre-push hook не содержит маркер `AIW_MANAGED_HOOK`, не перезаписывай его. Остановись и предложи владельцу вручную объединить hooks.

### Фаза F. Подключить Desktop-интерфейсы

#### Codex Desktop

После подтверждения:

```text
aiw desktop-install codex --project <project-id>
```

Проверь:

- skill создан в `~/.agents/skills/aiw-<project-id>/`;
- skill ссылается на `aiw context` и `aiw verify`;
- ни один skill-файл не появился в client repo;
- при уже существующем skill сначала покажи diff, затем обновляй.

#### Claude Desktop

Сгенерируй конфигурацию:

```text
aiw desktop-config claude --project <project-id>
```

По умолчанию только покажи JSON человеку. Не перезаписывай весь `claude_desktop_config.json`. Если человек разрешил установку:

1. создай backup существующего config;
2. добавь только сервер `aiw-<project-id>` в `mcpServers`;
3. сохрани все существующие servers/settings;
4. проверь валидность JSON;
5. попроси перезапустить Claude Desktop;
6. попроси проверить connector через `+` → `Connectors`.

Для тиражирования на команду предложи упаковать тот же локальный MCP как приватный `.mcpb` Desktop Extension, но не публикуй и не загружай extension без отдельного разрешения.

### Фаза G. Верифицировать интеграцию

1. Запусти проверки launcher:

```text
aiw self-test
aiw doctor --tool <approved-tool> --mode <native|docker> --require-commands
aiw context SETUP-CHECK --role analyst --workflow feature
aiw verify
```

2. Проверь scanner контролируемым тестом:

   - убедись, что `AGENTS.md` в корне client repo не существует;
   - создай временный `AGENTS.md` с нейтральной строкой;
   - `aiw verify` обязан вернуть `BLOCK`;
   - удали только созданный тобой тестовый файл;
   - повторный `aiw verify` обязан вернуть `PASS`.

Если `AGENTS.md` существовал до теста, не изменяй его и не удаляй. Зафиксируй blocker и попроси решение человека.

3. Проверь разделение:

- client repo не содержит tracked AIW-файлов;
- `git submodule status` не показывает AI-repo;
- client origin не изменился;
- AI origin не изменился;
- runtime находится вне обоих Git roots;
- AI-repo не содержит client source/secrets;
- `git status --short` обоих репозиториев объясним.

4. Если Docker выбран как обязательный режим, дополнительно выполни только после разрешения:

```text
aiw docker-build
aiw docker-login --tool <approved-tool>
aiw doctor --tool <approved-tool> --mode docker --require-commands
```

Login интерактивен. Не проси человека передавать credentials в чат.

## 4. Критерии завершения

Не объявляй настройку завершённой, пока не выполнены все применимые пункты:

- [ ] подтверждены AI-repo и ровно один client repo;
- [ ] репозитории являются соседними и независимыми;
- [ ] client remote точно allowlisted;
- [ ] data lane задан человеком;
- [ ] tool/model policy задана человеком;
- [ ] project commands подтверждены или явно помечены blockers;
- [ ] AI-repo diff не содержит client source/secrets;
- [ ] `aiw self-test` прошёл;
- [ ] `aiw doctor` прошёл для выбранного режима;
- [ ] `aiw verify` прошёл после отрицательного теста scanner;
- [ ] hook установлен либо документирован конфликт;
- [ ] Codex skill установлен либо отмечен как не требующийся;
- [ ] Claude MCP config подготовлен либо отмечен как не требующийся;
- [ ] tracked-состояние client repo не изменилось из-за настройки;
- [ ] все unresolved decisions перечислены.
- [ ] команда ознакомлена с `aiw improve` и приватным eval-feedback loop;

Если `doctor` не может пройти из-за отсутствия tool, Docker, contract decision или подтверждённой команды, статус — `BLOCKED`, а не `DONE`.

## 5. Формат финального отчёта агента

Верни человеку отчёт строго по структуре:

```markdown
# AIW setup report

## Result
READY | READY WITH LIMITATIONS | BLOCKED

## Repository pair
- AI repository: <path and origin>
- Client repository: <path and origin>
- Project ID: <id>
- Default branch: <branch>

## Applied configuration
- Data lane: <lane>
- Default tool: <tool>
- Execution mode: <mode>
- Project commands: <resolved/unresolved list>
- Files changed in AI-repo: <list>
- Files changed in client repo: none

## Local integrations
- Global aiw: installed | skipped | failed
- Registry: registered | skipped | failed
- Pre-push hook: installed | conflict | skipped
- Codex skill: installed | skipped
- Claude MCP: configured | snippet prepared | skipped

## Verification
- self-test: PASS/FAIL
- doctor: PASS/FAIL
- artifact negative test: PASS/FAIL
- final verify: PASS/FAIL
- repository separation: PASS/FAIL

## Human actions remaining
1. ...

## Assumptions and blockers
- ...
```

Не включай в отчёт исходный код, prompt transcript, secrets, персональные данные или полный confidential ticket.

## 6. Настроить дальнейшее улучшение skills

Перед завершением настройки:

1. прочитай `skills/continuous-improvement/SKILL.md` и `evals/README.md`;
2. проверь, что `evals/templates/failure-record.md` и `golden-case.md` существуют;
3. не создавай вымышленные failure records только для заполнения каталогов;
4. объясни владельцу AIW команду `aiw improve AIW-001`;
5. зафиксируй, кто разрешает обезличивание реальных инцидентов и кто review/merge изменения skills;
6. добавь project-specific baseline evals только после human review и без client artifacts.
