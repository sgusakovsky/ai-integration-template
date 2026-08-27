# Начало работы: от двух пустых каталогов до первой AI-сессии

Если первоначальную проектную настройку должен выполнить coding agent, после клонирования обоих репозиториев откройте AI-repo и передайте агенту `SETUP-PROJECT-WITH-AGENT-RU.md`. Этот файл задаёт read-only preflight, допустимые изменения, обязательные вопросы, проверки и формат итогового отчёта.

После запуска проекта плохие решения агентов улучшаются отдельным процессом `aiw improve AIW-<number>`. Он использует `skills/continuous-improvement`, обезличенные failure records и behavioral evals; project code и transcripts не используются как learning material.

Эта инструкция рассчитана на человека, который раньше не подключал coding agents к отдельному репозиторию проекта.

## Результат

```text
<родительский каталог проекта>/
├── project-repository/               Git-репозиторий проекта
├── project-ai-workspace/  этот приватный AI-репозиторий
└── .ai-runtime/                  создаётся launcher автоматически
```

Git submodule, subtree и ссылки между Git histories не создаются.

## Шаг 1. Создайте приватный AI-репозиторий

### GitHub

1. Нажмите `+` → `New repository`.
2. Owner: корпоративная организация.
3. Name: `<project>-ai-workspace`.
4. Visibility: `Private`.
5. Включите README и создайте repository.
6. `Settings` → `Collaborators and teams`: дайте проектной команде `Write`, AI-интегратору `Maintain`.
7. `Settings` → `Rules` → `Rulesets`: для `main` запретите direct push/force push/delete, потребуйте PR и минимум один approval.

### GitLab

1. Нажмите `Create new` → `New project/repository` → `Create blank project`.
2. Namespace: корпоративная группа.
3. Project name: `<project>-ai-workspace`.
4. Visibility: `Private`; включите README.
5. `Manage` → `Members`: Developer для команды, Maintainer для AI-интегратора.
6. `Settings` → `Repository` → `Branch rules`: для `main` установите `Allowed to push and merge: No one`, merge — согласованной группе, force push выключен.

### Bitbucket Cloud

1. Нажмите `Create` → `Repository`.
2. Выберите корпоративный Workspace/Project.
3. Repository name: `<project>-ai-workspace`.
4. Оставьте `Private`, добавьте README.
5. `Repository settings` → `Repository permissions`: Write для команды, Admin для владельцев.
6. `Repository settings` → `Branch restrictions`: защитите `main`, запретите direct write и history rewrite, разрешите merge через PR.

## Шаг 2. Загрузите template в приватный AI-репозиторий

Скопируйте всё содержимое этого каталога в локальный checkout созданного AI-репозитория, затем:

```bash
git checkout -b setup/ai-workspace
git add .
git commit -m "Set up project AI workspace"
git push -u origin setup/ai-workspace
```

Создайте PR/MR, проверьте отсутствие кода проекта и secrets, затем merge.

## Шаг 3. Установите обязательные программы

На обоих типах ОС:

1. Git.
2. Node.js 20 или новее.
3. Codex CLI и/или Claude Code через утверждённый компанией канал.
4. Docker Desktop, только если требуется Docker mode.

Проверьте в Terminal/PowerShell:

```text
git --version
node --version
codex --version
claude --version
docker --version
```

Отсутствие Docker допустимо для native mode.

## Шаг 4. Клонируйте оба репозитория рядом

### macOS

```bash
mkdir -p ~/workspaces/<project>
cd ~/workspaces/<project>
git clone <PROJECT_CLONE_URL> project-repository
git clone <PRIVATE_AI_CLONE_URL> project-ai-workspace
chmod +x project-ai-workspace/bin/aiw
```

### Windows PowerShell

```powershell
New-Item -ItemType Directory -Force C:\workspaces\<project>
Set-Location C:\workspaces\<project>
git clone <PROJECT_CLONE_URL> project-repository
git clone <PRIVATE_AI_CLONE_URL> project-ai-workspace
```

`<PROJECT_CLONE_URL>` берётся из кнопки Clone/Code репозитория проекта на GitHub, GitLab или Bitbucket. `<PRIVATE_AI_CLONE_URL>` берётся из приватного AI-репозитория.

## Шаг 5. Заполните `project/profile.json`

Перед редактированием прочитайте `project/README.md`. В нём описаны все ключи каждого JSON-файла в папке `project/`, допустимые значения, фактическое использование launcher’ом и последствия изменения.

1. `project.id`: ID/codename без персональных данных.
2. `project.displayName`: внутреннее название.
3. `targetRepository.localRelativePath`: оставьте `../project-repository`, если использованы имена выше.
4. `targetRepository.allowedRemotes`: вставьте точный SSH и/или HTTPS remote проекта.
5. `defaultBranch`: обычно `main`, иногда `master` или `develop`.
6. `dataPolicy.lane`: `green`, `amber` или `red` после договорной проверки.
7. `ai.defaultTool`: `codex` или `claude`.
8. `ai.codex.model`/`ai.claude.model`: оставьте пустым для корпоративного default либо укажите утверждённую модель.
9. `projectCommands`: для каждой операции задайте объект с `mode: agent|manual|forbidden|unresolved`, `command`, `args`, `instructions`, `evidenceRequired`. `unresolved` допустим во время анализа, но блокирует `doctor --require-commands`.

Узнать remote проекта:

```bash
cd ../project-repository
git remote get-url origin
```

## Шаг 6. Проверьте конфигурацию

### Рекомендуемый короткий интерфейс

Один раз установите и зарегистрируйте команду (одинаково в Terminal и PowerShell):

```text
cd <путь-к-project-ai-workspace>
npm install -g .
aiw register .
aiw doctor --tool codex --mode native
aiw install-hooks
```

После этого из репозитория проекта используйте `aiw task PROJECT-123`, `aiw verify` и `aiw finish PROJECT-123`. Подключение к Codex Desktop и Claude Desktop подробно описано в `DESKTOP-AND-CLI-RU.md`.

Команды `./bin/aiw` и `.\bin\aiw.ps1` ниже остаются локальным резервным способом, если глобальная установка запрещена политикой компании.

### macOS

```bash
cd ../project-ai-workspace
./bin/aiw self-test
./bin/aiw doctor --tool codex --mode native
```

### Windows PowerShell

```powershell
Set-Location ..\project-ai-workspace
Set-ExecutionPolicy -Scope Process Bypass
.\bin\aiw.ps1 self-test
.\bin\aiw.ps1 doctor --tool codex --mode native
```

Для Claude замените `codex` на `claude`. Все строки должны завершиться `PASS`. При `FAIL` исправьте указанную причину.

## Шаг 7. Установите защитный pre-push hook

macOS:

```bash
./bin/aiw install-hooks
```

Windows:

```powershell
.\bin\aiw.ps1 install-hooks
```

Проверка:

1. В checkout проекта временно создайте `AGENTS.md`.
2. Запустите `aiw verify` — ожидается `BLOCK`.
3. Удалите тестовый файл.
4. Повторите `aiw verify` — ожидается `PASS`.

Не коммитьте тестовый файл.

## Шаг 8A. Запустите Codex без Docker

macOS:

```bash
./bin/aiw start --mode native --tool codex --role analyst --workflow feature --task PROJECT-123
```

Windows:

```powershell
.\bin\aiw.ps1 start --mode native --tool codex --role analyst --workflow feature --task PROJECT-123
```

Launcher:

1. проверит project remote;
2. просканирует текущий diff;
3. соберёт внешние инструкции;
4. запустит Codex в каталоге проекта;
5. применит `native.filesystemMode` и `native.approvalMode` из `permissions.json`;
6. проверит, что network для generated commands выключен, а также отключит apps и memories;
7. после выхода повторно проверит diff.

## Шаг 8B. Запустите Claude Code без Docker

macOS:

```bash
./bin/aiw start --mode native --tool claude --role analyst --workflow feature --task PROJECT-123
```

Windows:

```powershell
.\bin\aiw.ps1 start --mode native --tool claude --role analyst --workflow feature --task PROJECT-123
```

Launcher передаст внешний system prompt и settings. В них отключены attribution, auto-memory, web tools, project-local hooks, commit, push, merge и destructive Git commands.

## Шаг 8C. Подготовьте Docker mode

Docker Desktop должен быть запущен.

macOS:

```bash
./bin/aiw docker-build
./bin/aiw docker-login --tool codex
./bin/aiw docker-login --tool claude
```

Windows:

```powershell
.\bin\aiw.ps1 docker-build
.\bin\aiw.ps1 docker-login --tool codex
.\bin\aiw.ps1 docker-login --tool claude
```

Каждый login сохраняется в отдельном Docker volume. Домашний каталог компьютера не монтируется.

Запуск:

```bash
./bin/aiw start --mode docker --tool codex --role developer --workflow feature --task PROJECT-123
```

или:

```bash
./bin/aiw start --mode docker --tool claude --role developer --workflow feature --task PROJECT-123
```

На Windows используйте `.\bin\aiw.ps1`.

## Шаг 9. Меняйте роли по этапам

```text
analyst   → specification и вопросы → human approval
architect → plan и vertical tasks   → human approval
qa        → независимый test oracle
developer → один маленький slice
reviewer  → findings
human     → окончательный review, commit, push и PR/MR
```

Пример:

```bash
./bin/aiw start --tool codex --role architect --workflow feature --task PROJECT-123
./bin/aiw start --tool claude --role qa --workflow feature --task PROJECT-123
./bin/aiw start --tool codex --role developer --workflow feature --task PROJECT-123
./bin/aiw start --tool claude --role reviewer --workflow feature --task PROJECT-123
```

Использование разных инструментов для реализации и review снижает риск того, что один и тот же agent повторит собственную ошибку, но human review остаётся обязательным.

Проверки запускайте через настроенный контракт, а не копированием команд из чата:

```bash
aiw check lint --task PROJECT-123
aiw check testTargeted --target path/to/test --task PROJECT-123
```

При `mode: manual` launcher не запускает инструмент. Человек выполняет утверждённую процедуру и фиксирует обезличенный результат через `aiw evidence`.

## Шаг 10. Проверьте и завершите задачу

```bash
./bin/aiw verify --task PROJECT-123
./bin/aiw finish --task PROJECT-123
```

`verify --task` сначала проверяет delivery hygiene, затем полный набор обязательных evidence. `finish` доступен только после успешных evidence, создаёт обезличенный summary внутри AI-repo и удаляет session runtime вместе с evidence этой задачи. Исходный код и transcript туда не копируются.

## Шаг 11. Человек выполняет Git delivery

В репозитории проекта:

```bash
git status
git diff --check
git diff
git add <ЯВНЫЙ_СПИСОК_ФАЙЛОВ>
git diff --cached
git commit -m "PROJECT-123: human-written change description"
git push -u origin <feature-branch>
```

Не используйте `git add .` до ручного просмотра каждого нового файла.

Создайте PR/MR обычным процессом проекта. Не добавляйте AI attribution. Если договор требует раскрытия использования AI, сделайте это через согласованный governance-канал, а не скрывайте факт использования.

## Шаг 12. Критерий успешного результата

- remote проекта прошёл точную проверку;
- AI-repo и project-repo являются соседними независимыми Git repositories;
- в project diff нет agent/skill/prompt/config/transcript файлов;
- agent не выполнил commit, push, merge или deploy;
- specification и human gates пройдены;
- реальный lint/test/build выполнен после заполнения project commands;
- независимый AI review и human review завершены;
- session runtime и task evidence удалены после создания санитизированного summary;
- владелец проекта получил обычный поддерживаемый PR/MR.
