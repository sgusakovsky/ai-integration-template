# Incident response для AI Workspace

Используйте этот порядок при подтверждённой или вероятной утечке project code, credentials, prompts/transcripts либо при выполнении неразрешённого внешнего действия.

## 1. Остановить

- завершить активные AI/CLI/Desktop-сессии;
- запретить новые запуски с затронутой `project-ai-context/<task-id>` и не распространять её содержимое дальше;
- не выполнять commit, push, cleanup или переписывание history до сохранения evidence;
- временно снять доступ пользователя или service account, если риск продолжается.

## 2. Сохранить минимальное evidence

- зафиксировать время, project ID, tool/version, task ID и затронутые системы;
- сохранить хеши и пути подозрительных артефактов без копирования секретов или project source в AI-repo;
- зафиксировать Git status/refs и provider audit event IDs в одобренном incident-хранилище.

## 3. Ограничить воздействие

- отозвать и ротировать потенциально раскрытые credentials;
- отключить затронутый MCP/plugin/adapter или AI provider access;
- заблокировать release/push через branch protection и CI;
- выполнить `aiw uninstall-hooks`, `aiw desktop-uninstall codex` и `aiw unregister`, если локальная интеграция скомпрометирована.

## 4. Оценить и уведомить

- определить данные, получателей, срок хранения и договорные/регуляторные обязанности;
- подключить Security, Legal/Privacy, project owner и владельца AI-платформы;
- уведомлять клиента или регулятора только по утверждённой incident-процедуре.

## 5. Исправить и восстановить

- удалить артефакты из рабочей ветки и, при необходимости, очистить Git history согласованной процедурой;
- после сохранения минимального разрешённого evidence удалить затронутый внешний task context командой `aiw context-clean <task-id> --approved`;
- исправить правильный слой AIW: config, scanner, adapter, role, workflow или skill;
- добавить синтетический regression test/eval;
- повторно проверить исходный каталог Starter Kit; если для передачи нужен ZIP, собрать его через `npm run package`.

## 6. Rollback AIW

1. Найти последний одобренный Git tag или commit AI workspace.
2. Создать отдельную rollback-ветку; не применять destructive reset к пользовательской работе.
3. Вернуть проблемное изменение через обычный revert/review процесс.
4. Выполнить `npm test`, `npm run self-test`, `npm run self-scan` и `npm run package`.
5. Переустановить global CLI, hook и Desktop skill.
6. Зафиксировать причину, затронутые версии и критерий повторного включения.
