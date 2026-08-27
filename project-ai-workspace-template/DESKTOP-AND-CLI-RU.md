# Один `aiw` для терминала, Codex Desktop и Claude Desktop

## Что меняется

Команда `./bin/aiw` остаётся аварийным локальным вариантом. В повседневной работе команда использует глобальное имя `aiw`, находясь в репозитории проекта или AI-репозитории. Репозиторий проекта при этом не содержит AI-файлов.

## 1. Однократная установка на компьютере

Откройте Terminal на macOS или PowerShell на Windows в приватном AI-репозитории:

```text
npm install -g .
aiw register .
aiw projects
aiw doctor --tool codex --mode native
aiw install-hooks
```

Регистрация хранится локально в `~/.aiw/projects.json` (на Windows — в `.aiw` домашнего каталога пользователя). Этот файл не попадает ни в один Git-репозиторий.

Для каждого следующего проекта выполните только `aiw register <путь-к-AI-repo>`. Из каталога project repo команда сама выбирает связанную конфигурацию. Вне зарегистрированных каталогов всегда укажите `--project <project-id>`: молчаливого fallback на default project нет. Повторная регистрация существующего ID требует явного `--force`.

## 2. Работа из командной строки

Если для задачи нужны материалы Jira, Confluence или локальные вложения, сначала положите разрешённые файлы в соседнюю папку `.ai-context/PROJECT-123/`. Никакая отдельная import-команда не нужна.

```text
cd <project-repo>
aiw task PROJECT-123 --tool codex --role analyst --workflow feature
aiw check lint --task PROJECT-123
aiw check testTargeted --target path/to/test --task PROJECT-123
aiw verify
aiw finish PROJECT-123
```

Короткая команда `aiw task` соответствует прежней длинной `./bin/aiw start --task ...`. Она автоматически проверяет и подключает `.ai-context/PROJECT-123`, если папка существует. Для Claude Code замените `--tool codex` на `--tool claude`.

## 3. Codex Desktop

Установите проектный пользовательский skill:

```text
cd <project-repo>
aiw desktop-install codex
```

Затем:

1. Откройте project repo как workspace в Codex Desktop.
2. Начните задачу фразой: `Используй $aiw-<project-id> для PROJECT-123, роль developer, workflow feature`.
3. Codex загрузит правила и внешний task context командой `aiw context`, выполнит работу в project repo и перед завершением вызовет `aiw verify`.
4. Человек проверяет diff и сам выполняет commit/push.

Skill устанавливается в пользовательский каталог `.agents/skills`, а не в project repo.

## 4. Claude Desktop

Сначала получите локальную MCP-конфигурацию:

```text
cd <project-repo>
aiw desktop-config claude
```

Добавьте выведенный объект `mcpServers` в конфигурацию Claude Desktop или оформите его как корпоративное Desktop Extension. Не заменяйте существующие серверы: объедините объекты по имени.

После перезапуска Claude Desktop:

1. Проверьте, что connector `aiw-<project-id>` виден в `+` → `Connectors`.
2. Откройте папку проекта в Claude Code for Desktop либо разрешите только эту workspace-папку согласно корпоративной политике.
3. Попросите: `Вызови aiw_context для PROJECT-123, role developer, workflow feature; прочитай необходимые файлы inventory через aiw_task_artifact; затем выполни задачу. Проверки запускай через aiw_check. Перед завершением вызови aiw_verify.`
4. Не разрешайте commit, push, merge или deploy.

MCP предоставляет пять ограниченных инструментов: получить правила и inventory, read-only прочитать один уже validated task artifact, выполнить только разрешённую configuration-driven проверку, показать статус и проверить diff. `aiw_task_artifact` не принимает произвольный filesystem path — только относительный путь из inventory выбранной задачи. `aiw_check` не принимает произвольную shell-команду: имя, executable и argv берутся из validated `projectCommands`. Установка зависимостей через MCP запрещена и выполняется человеком в терминале после подтверждения. MCP не предоставляет общий shell или доступ к другим каталогам.

## 5. Ежедневный короткий flow команды

```text
Получить задачу
  → при необходимости положить разрешённые файлы в .ai-context/TASK-ID/
  → открыть project repo
  → aiw task ... ИЛИ вызвать проектный skill/connector
  → уточнить specification/plan
  → получить human approval на контрольной точке
  → реализовать и вызвать aiw check / aiw_check
  → aiw verify
  → human review
  → человек делает commit/push/PR
  → aiw finish TASK-ID
  → после сохранения официальных результатов: aiw context-clean TASK-ID --approved
```

## 6. Обновление

После получения новой версии приватного AI-репозитория:

```text
git pull
npm install -g .
aiw register .
aiw desktop-install codex
```

Для Claude Desktop путь указывает на файлы этого репозитория, поэтому повторная регистрация MCP не нужна, если каталог не перемещался.

Для offboarding или переноса workspace выполните:

```text
aiw uninstall-hooks --project <project-id>
aiw desktop-uninstall codex --project <project-id>
aiw unregister <project-id>
```

## 7. Улучшение skills после плохого результата

Не исправляйте skill прямо во время проектной feature/bug сессии. Сначала завершите или безопасно остановите задачу, затем создайте `evals/failures/AIW-<number>.md`, отметьте четыре privacy checkbox и получите от человека `Status: accepted`. Только после этого запускайте отдельную сессию в приватном AI-repo:

```text
aiw improve AIW-001 --tool codex
```

Допустим и Claude CLI: `--tool claude`. Improvement session работает только в native mode, проверяет, что status и HEAD репозитория проекта не изменились, и требует matching case плюс `evals/results/AIW-001.json` с before/after, adjacent regression и pending human review.

Цикл:

```text
плохое решение
  → обезличенный failure record
  → определение причины и правильного слоя
  → synthetic/anonymized golden case
  → узкая правка
  → before/after и соседние evals
  → human review
  → merge AI-repo
  → npm install -g . / обновление Desktop skill
```

Это дообучение операционного слоя через Git-версии skills и evals, а не изменение весов модели. Нельзя сохранять project code, tickets, prompts, transcripts, secrets или production/personal data.
