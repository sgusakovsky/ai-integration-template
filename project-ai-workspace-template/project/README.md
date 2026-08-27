# Справочник конфигурации проекта

Файлы в этой папке — строгий исполняемый контракт AI Workspace. `aiw self-test`, `aiw doctor`, `aiw context`, `aiw start`, `aiw check` и `aiw verify` отклоняют отсутствующие, неизвестные или некорректные ключи. Ключ нельзя добавлять «на будущее»: сначала должен появиться consumer, тест и описание здесь.

Конфигурация разделена на четыре файла:

- `profile.json` — идентичность проекта, связь с project repository, data policy, AI tools, команды и human gates;
- `permissions.json` — режимы запуска и защищённые действия/пути;
- `forbidden-artifacts.json` — блокирующая проверка project diff;
- `skill-improvement-policy.json` — обязательные условия улучшения agents/skills/workflows.

## Общие правила формата

- Используется обычный JSON: комментарии, trailing commas и переменные окружения запрещены.
- Все имена ключей чувствительны к регистру.
- Пути задаются с `/`, даже если рабочая машина использует Windows.
- Команды хранятся как executable плюс массив аргументов. Shell-строки, `&&`, pipes, redirection и command substitution намеренно не поддерживаются.
- Секреты, tokens, credentials и production data нельзя помещать ни в один JSON.
- `profile.schemaVersion` и `permissions.policyVersion` сейчас равны `2`; версии двух остальных схем равны `1`. Другое значение блокирует работу.

### Миграция с Starter Kit 1.x

1. В `profile.json` удалите `ai.cloudAgent` и `ai.networkForGeneratedCommands`.
2. Преобразуйте семь строк `projectCommands` в records формата v2; magic strings `UNRESOLVED`, `MANUAL_ONLY:*`, `FORBIDDEN:*` больше не принимаются.
3. Установите `profile.schemaVersion: 2`.
4. В `permissions.json` удалите `aiWorkspaceMount`, `runtimeMountForAgent`, `hostHomeMounted`, `dockerSocketMounted`; эти значения теперь hardcoded invariants.
5. Установите `permissions.policyVersion: 2`.
6. Добавьте `schemaVersion: 1` в `forbidden-artifacts.json`.
7. Выполните `npm test` и `aiw self-test`; не исправляйте ошибку добавлением неизвестного compatibility-ключа.

## `profile.json`

### Корневые ключи

| JSON-путь | Тип и допустимые значения | Фактическое влияние |
|---|---|---|
| `schemaVersion` | Integer, только `2` | Выбирает текущую схему структурированных project commands. Неизвестная версия блокирует команды, загружающие конфигурацию. |
| `project` | Object с точными ключами `id`, `displayName` | Идентифицирует конкретный проект. |
| `targetRepository` | Object с четырьмя обязательными ключами | Определяет checkout, runtime, Git remote и base ref. |
| `dataPolicy` | Object с четырьмя обязательными ключами | Управляет доступом агента к source/test data и формирует session instructions. |
| `ai` | Object с точными ключами `defaultTool`, `codex`, `claude`, `mcpAllowlist` | Управляет выбором CLI, модели и MCP boundary. |
| `projectCommands` | Object с семью обязательными command records | Определяет, что агент может выполнить через `aiw check`. |
| `humanGates` | Непустой массив `snake_case` ID | Полностью добавляется в session instructions; агент обязан остановиться перед указанными решениями. |

### `project`

| JSON-путь | Тип и допустимые значения | Фактическое влияние |
|---|---|---|
| `project.id` | Непустая строка `[A-Za-z0-9._-]+`; не `REPLACE_*` | Registry key для `aiw register`, session/evidence metadata и Desktop integration. Placeholder блокирует `doctor/start/verify`. |
| `project.displayName` | Непустая строка | Показывается в сгенерированном контексте. Не включайте закрытое название без разрешения. |

### `targetRepository`

| JSON-путь | Тип и допустимые значения | Фактическое влияние |
|---|---|---|
| `targetRepository.localRelativePath` | Непустой относительный путь, обычно `../project-repository` | Разрешается относительно корня AI-repo. Этот каталог становится working directory агента и команд. Вложенность двух репозиториев блокируется. |
| `targetRepository.runtimeRelativePath` | Непустой относительный путь, обычно `../.ai-runtime` | Здесь создаются временные instructions, metadata и evidence. Runtime не должен находиться в project repo. |
| `targetRepository.allowedRemotes` | Непустой массив точных SSH/HTTPS Git URL без wildcard | `origin` нормализуется и обязан совпасть хотя бы с одним URL. Несовпадение блокирует запуск и проверку. Для SSH и HTTPS одного repo можно указать две записи. |
| `targetRepository.defaultBranch` | Непустая строка существующего локального branch/ref, например `main`, `master`, `develop` | Проверяется через Git; используется для merge-base, branch diff и commit-message scan. Launcher не переключает ветку. |

### `dataPolicy`

| JSON-путь | Тип и допустимые значения | Фактическое влияние |
|---|---|---|
| `dataPolicy.lane` | `"green"`, `"amber"` или `"red"` | Передаётся агенту. `red` блокирует `aiw start` в project checkout. Значение устанавливается только по договорному решению. |
| `dataPolicy.allowSourceCode` | Boolean | Передаётся агенту. `false` блокирует `aiw start` в project checkout независимо от lane. |
| `dataPolicy.allowTestData` | `"none"`, `"synthetic_only"` или `"approved_nonproduction"` | Передаётся агенту как граница выбора test data. Не предоставляет доступ к данным автоматически. |
| `dataPolicy.deny` | Непустой массив `snake_case` категорий | Полностью добавляется в instructions как запрет. База: `secrets`, `production_data`, `personal_data`, `project_credentials`. |

`green`/`amber` определяют утверждённый режим организации, но сами по себе не являются DLP. `red` реализован fail-closed. Сетевую передачу дополнительно ограничивают CLI sandbox, adapter settings и корпоративный proxy/firewall.

### `ai`

| JSON-путь | Тип и допустимые значения | Фактическое влияние |
|---|---|---|
| `ai.defaultTool` | `"codex"` или `"claude"` | Используется `aiw start/task/improve`, если `--tool` не указан. |
| `ai.codex` | Object только с `model` | Контейнер Codex-настройки. |
| `ai.codex.model` | String; пустая строка или утверждённый model ID/alias | Непустое значение передаётся Codex через `--model`; пустое оставляет корпоративный/пользовательский default. |
| `ai.claude` | Object только с `model` | Контейнер Claude-настройки. |
| `ai.claude.model` | String; пустая строка или утверждённый model ID/alias | Непустое значение передаётся Claude через `--model`; пустое оставляет default. |
| `ai.mcpAllowlist` | Сейчас только пустой массив `[]` | Пустой MCP set принудительно передаётся Claude; Codex запускается со strict config и отключёнными apps. Непустой список блокируется, пока не реализованы tool-specific definitions и security validation. |

Удалённые ключи `ai.cloudAgent` и `ai.networkForGeneratedCommands` не поддерживаются. Cloud execution отсутствует, а единственный источник сетевой политики — `permissions.native.networkForGeneratedCommands`.

### `projectCommands`

Обязательные записи: `install`, `format`, `lint`, `typecheck`, `testTargeted`, `testFull`, `build`. Каждая имеет одинаковую форму:

```json
{
  "mode": "agent",
  "command": "npm",
  "args": ["run", "test", "--", "{target}"],
  "instructions": "Run the smallest relevant test selection.",
  "evidenceRequired": true
}
```

| Вложенный ключ | Тип и допустимые значения | Фактическое влияние |
|---|---|---|
| `mode` | `"agent"`, `"manual"`, `"forbidden"`, `"unresolved"` | `agent` разрешает `aiw check`; `manual` не выполняет команду и возвращает код `3`; `forbidden`/`unresolved` блокируются с кодом `2`. `doctor --require-commands` блокирует `unresolved` и отсутствие executable у `agent`. |
| `command` | String | Для `agent` обязателен executable (`npm`, `dotnet`, `make`) без shell syntax. Для `manual` может содержать предложенный executable. Для `forbidden`/`unresolved` обязан быть пустым. |
| `args` | Массив строк | Передаётся executable без shell parsing. Разрешён placeholder `{target}`, который требует `--target`. Для `forbidden`/`unresolved` массив обязан быть пустым. |
| `instructions` | Непустая строка | Всегда передаётся агенту; для manual/forbidden объясняет процедуру или причину запрета. |
| `evidenceRequired` | Boolean | Для `agent: true` команда требует `--task` и сохраняет sanitized result/exit code в `.ai-runtime/evidence/<task>/`. Для manual evidence записывается человеком через `aiw evidence`. |

Назначение семи записей:

| JSON-путь | Назначение и особенности |
|---|---|
| `projectCommands.install` | Подготовка toolchain/dependencies. Если разрешён агенту и `install_dependency` требует подтверждения, запускается только с `--approved`. |
| `projectCommands.format` | Formatter или format-check. В `instructions` явно укажите, изменяет ли операция файлы. |
| `projectCommands.lint` | Статический quality/style check. Ненулевой exit code означает failure. |
| `projectCommands.typecheck` | Проверка типов без подмены запрещённой сборки. Если независимой операции нет, используйте `forbidden`. |
| `projectCommands.testTargeted` | Минимальный релевантный тест; `{target}` в `args` заменяется значением `--target`. |
| `projectCommands.testFull` | Полный test suite; может быть `manual`, если требует контролируемой среды/устройства. |
| `projectCommands.build` | Сборка артефакта; может быть `manual` или `forbidden`, если агенту запрещено запускать build tooling. |

Пример автоматической команды:

```json
"lint": {
  "mode": "agent",
  "command": "npm",
  "args": ["run", "lint"],
  "instructions": "Run after changing TypeScript or JavaScript files.",
  "evidenceRequired": true
}
```

Пример ручной сборки:

```json
"build": {
  "mode": "manual",
  "command": "",
  "args": [],
  "instructions": "A developer builds in the approved local IDE and records the result; the agent must not invoke a build tool.",
  "evidenceRequired": true
}
```

Пример неприменимой/запрещённой операции:

```json
"typecheck": {
  "mode": "forbidden",
  "command": "",
  "args": [],
  "instructions": "No independent type-check operation exists; do not substitute a build.",
  "evidenceRequired": false
}
```

Использование:

```bash
aiw check lint --task PROJECT-123
aiw check testTargeted --target path/to/test --task PROJECT-123
aiw check install --approved --task PROJECT-123
aiw evidence build --task PROJECT-123 --status passed --note "Approved IDE build passed"
```

`--approved` для `install` обязателен, если `install_dependency` есть в `permissions.native.requireHumanConfirmation`. Evidence содержит только статус и краткую обезличенную заметку, не полный output.

### `humanGates`

Массив принимает непустые `snake_case` ID. Стандартные значения:

| ID | Решение человека |
|---|---|
| `architecture_change` | Архитектурная граница или ownership. |
| `new_dependency` | Добавление/замена зависимости. |
| `database_migration` | Schema/data migration. |
| `authentication_or_authorization` | AuthN/AuthZ и модель доступа. |
| `external_api_change` | Внешний контракт/API. |
| `destructive_command` | Потенциально необратимая команда. |
| `commit`, `push`, `merge`, `deployment` | Git delivery и выпуск. |

Новый ID допустим, если его смысл описан в project instructions/workflow. Gates влияют на injected contract, но не заменяют OS sandbox и branch protection.

## `permissions.json`

### Корень и native

| JSON-путь | Тип и допустимые значения | Фактическое влияние |
|---|---|---|
| `policyVersion` | Integer, только `2` | Версия исполняемой policy schema без настраиваемых Docker security invariants. |
| `native` | Object с шестью точными ключами | Управляет native adapter и delivery guard. |
| `native.filesystemMode` | `"read-only"` или `"workspace-write"` | Codex получает соответствующий `--sandbox`. Claude получает `plan` для read-only и `manual` для workspace-write. В Docker это верхняя граница: effective mode остаётся read-only, если read-only задан здесь или в `docker.projectMount`. |
| `native.networkForGeneratedCommands` | Сейчас только Boolean `false` | Codex получает `sandbox_workspace_write.network_access=false`; Claude adapter запрещает WebFetch/WebSearch. `true` блокируется fail-closed. Для Docker domain egress нужен внешний firewall/proxy. |
| `native.approvalMode` | Сейчас только `"on-request"` | Передаётся Codex. Claude использует собственные modes (`manual`/`plan`) и deny/ask rules adapter’а. |
| `native.protectedProjectPaths` | Непустой массив glob (`*`, `**`, `?`) относительно project root | Изменение совпавшего tracked/staged/untracked пути блокирует `scan`, `verify`, завершение session и pre-push. `allowPaths` не отменяет защиту. |
| `native.requireHumanConfirmation` | Массив `snake_case` action IDs | Передаётся агенту. `install_dependency` также механически требует `--approved` у локального `aiw check install`; MCP полностью запрещает install, потому что модель не может подтверждать собственное действие. Остальные ID задают approval contract. |
| `native.deny` | Непустой массив `snake_case` action IDs | Передаётся агенту как абсолютный запрет; launcher сам не выполняет commit/push/merge/deploy. Tool adapter добавляет deny rules, где CLI это поддерживает. |

### Docker

| JSON-путь | Тип и допустимые значения | Фактическое влияние |
|---|---|---|
| `docker` | Object только с `projectMount` | Единственная изменяемая Docker-настройка. |
| `docker.projectMount` | `"read-only"` или `"read-write"` | Управляет mount project checkout. При read-only developer/technical-writer session блокируется заранее; аналитические/review sessions работают без записи. |

AI workspace и runtime всегда монтируются read-only; host home и Docker socket никогда не монтируются. Эти security invariants удалены из JSON, потому что их нельзя ослаблять конфигурацией проекта.

## `forbidden-artifacts.json`

| JSON-путь | Тип и допустимые значения | Фактическое влияние |
|---|---|---|
| `schemaVersion` | Integer, только `1` | Версия строгой scanner schema. |
| `denyPaths` | Непустой массив glob относительно project root | Совпавший changed/staged/untracked path блокирует delivery hygiene. `*` не пересекает `/`, `**` пересекает. Для каталогов и файлов, запрещённых на любой глубине, сохраняйте корневую и `**/` формы. |
| `denyCommitPatterns` | Непустой массив валидных JavaScript RegExp strings | Ищет совпадения без учёта регистра в commit messages, добавленных diff lines и текстовом содержимом новых untracked файлов до 2 MiB. Некорректный regex блокирует конфигурацию. |
| `allowPaths` | Массив glob, безопасный default `[]` | Исключает путь только из `denyPaths`; не отменяет `protectedProjectPaths` и text-pattern scan. Каждое исключение требует review. |

Scanner не читает содержимое protected/forbidden untracked paths, блокирует новые untracked symbolic links, `.gitmodules` и tracked gitlinks, и пропускает binary/файлы больше 2 MiB при text-pattern scan. Target обязан совпадать с Git worktree root. Это delivery guard, а не замена secret scanning, SAST/SCA или human review.

## `skill-improvement-policy.json`

| JSON-путь | Тип и допустимые значения | Фактическое влияние |
|---|---|---|
| `schemaVersion` | Integer, только `1` | Версия строгой improvement schema. |
| `mode` | Только `"human-reviewed"` | Другое значение блокирует self-test/improvement. |
| `requireSanitizedFailureRecord` | Только `true` | До `aiw improve AIW-001` обязан существовать `evals/failures/AIW-001.md` со всеми четырьмя privacy checkbox и `Status: accepted`. |
| `requireBehavioralEval` | Только `true` | После improvement обязан существовать `evals/cases/AIW-001.md`. |
| `requireAdjacentRegression` | Только `true` | Evidence manifest обязан перечислять хотя бы один существующий файл из `evals/cases/`. |
| `minimumProjectArchetypesForUniversalSkillChange` | Integer `>= 2` | Для `universalSkillChange: true` manifest обязан перечислять не меньше разных archetypes. |
| `allowAutonomousSkillMutation` | Только `false` | Автономное изменение skills запрещено; попытка ослабить ключ блокирует validation. |
| `allowAutonomousMerge` | Только `false` | Launcher не может сам принять/слить improvement. |
| `learningData` | Object только с `allow`, `deny` | Обе категории передаются improvement agent и валидируются. |
| `learningData.allow` | Непустой массив `snake_case` категорий | Разрешённые типы обезличенного evidence. |
| `learningData.deny` | Непустой массив `snake_case` категорий | Запрещённые типы learning material; удаление ослабляет injected policy и требует security review. |

`aiw improve` после работы агента проверяет `evals/results/<case-id>.json`. Формат и пример находятся в `evals/results/README.md`. Manifest обязан показать failing `before`, passing `after`, adjacent regression и статус `pending-human-review`.

## Порядок настройки

1. Заполните identity, path, exact remotes и default branch.
2. Получите явное решение по data lane/source/test data.
3. Для каждой project command выберите `agent`, `manual`, `forbidden` или `unresolved`; не угадывайте executable.
4. Проверьте permissions и запрещённые artifacts. Не ослабляйте базовые ограничения ради прохождения `doctor`.
5. Выполните:

   ```bash
   npm test
   aiw self-test
   aiw doctor --tool codex --mode native --require-commands
   aiw context SETUP-CHECK --role analyst --workflow feature
   aiw verify
   ```

6. Для Claude повторите `doctor` с `--tool claude`. Для Docker сначала выполните `aiw docker-build` и `aiw docker-login`.

## Checklist ревью

- [ ] Все JSON проходят strict schema validation; неизвестных ключей нет.
- [ ] Нет `REPLACE_*`; remote совпадает; default ref существует локально.
- [ ] Data policy утверждена, а `red`/`allowSourceCode=false` ожидаемо блокируют session.
- [ ] Ни одна обязательная command entry не имеет `mode: "unresolved"` перед implementation/review.
- [ ] Manual/forbidden команды описывают честную процедуру; agent commands используют executable + args без shell syntax.
- [ ] Protected paths и deny rules не ослаблены без review.
- [ ] Docker invariants не вынесены в изменяемую конфигурацию.
- [ ] Skill improvement содержит sanitized record, behavioral eval, regression evidence и ожидает human review.
