# Один `aiw` для терминала, Codex Desktop и Claude Desktop

## Что меняется

Команда `./bin/aiw` остаётся аварийным локальным вариантом. В повседневной работе команда использует глобальное имя `aiw`, находясь в клиентском или AI-репозитории. Клиентский репозиторий при этом не содержит AI-файлов.

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

Для каждого следующего проекта выполните только `aiw register <путь-к-AI-repo>`. Из каталога клиентского repo команда сама выбирает связанную конфигурацию. При неоднозначности укажите `--project <project-id>`.

## 2. Работа из командной строки

```text
cd <client-repo>
aiw task PROJECT-123 --tool codex --role developer --workflow feature
aiw verify
aiw finish PROJECT-123
```

Короткая команда `aiw task` соответствует прежней длинной `./bin/aiw start --task ...`. Для Claude Code замените `--tool codex` на `--tool claude`.

## 3. Codex Desktop

Установите проектный пользовательский skill:

```text
cd <client-repo>
aiw desktop-install codex
```

Затем:

1. Откройте клиентский repo как workspace в Codex Desktop.
2. Начните задачу фразой: `Используй $aiw-<project-id> для PROJECT-123, роль developer, workflow feature`.
3. Codex загрузит правила командой `aiw context`, выполнит работу в клиентском repo и перед завершением вызовет `aiw verify`.
4. Человек проверяет diff и сам выполняет commit/push.

Skill устанавливается в пользовательский каталог `.agents/skills`, а не в клиентский repo.

## 4. Claude Desktop

Сначала получите локальную MCP-конфигурацию:

```text
cd <client-repo>
aiw desktop-config claude
```

Добавьте выведенный объект `mcpServers` в конфигурацию Claude Desktop или оформите его как корпоративное Desktop Extension. Не заменяйте существующие серверы: объедините объекты по имени.

После перезапуска Claude Desktop:

1. Проверьте, что connector `aiw-<project-id>` виден в `+` → `Connectors`.
2. Откройте клиентскую папку в Claude Code for Desktop либо разрешите только эту workspace-папку согласно корпоративной политике.
3. Попросите: `Вызови aiw_context для PROJECT-123, role developer, workflow feature; затем выполни задачу. Перед завершением вызови aiw_verify.`
4. Не разрешайте commit, push, merge или deploy.

MCP предоставляет только три ограниченных инструмента: получить контекст, показать статус и проверить diff. Он не предоставляет произвольный shell или доступ к другим каталогам.

## 5. Ежедневный короткий flow команды

```text
Получить задачу
  → открыть client repo
  → aiw task ... ИЛИ вызвать проектный skill/connector
  → уточнить specification/plan
  → получить human approval на контрольной точке
  → реализовать и протестировать
  → aiw verify
  → human review
  → человек делает commit/push/PR
  → aiw finish TASK-ID
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

## 7. Улучшение skills после плохого результата

Не исправляйте skill прямо во время клиентской feature/bug сессии. Сначала завершите или безопасно остановите задачу, затем заведите обезличенный `AIW-<number>` и запустите отдельную сессию в приватном AI-repo:

```text
aiw improve AIW-001 --tool codex
```

Допустим и Claude CLI: `--tool claude`. Improvement session работает только в native mode и проверяет, что status и HEAD клиентского репозитория не изменились.

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

Это дообучение операционного слоя через Git-версии skills и evals, а не изменение весов модели. Нельзя сохранять client code, tickets, prompts, transcripts, secrets или production/personal data.
