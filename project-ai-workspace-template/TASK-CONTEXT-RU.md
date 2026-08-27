# Контекст задачи из Jira, Confluence и локальных файлов

AIW не требует от AI-инструмента прямого доступа к Jira или Confluence. Человек, у которого уже есть разрешённый доступ, выгружает только необходимые для задачи материалы во временную локальную папку вне обоих Git-репозиториев.

## Короткий flow

Для структуры:

```text
workspaces/<project>/
├── project-repository/
├── project-ai-workspace/
├── project-ai-context/
│   └── PROJECT-123/
└── .ai-runtime/
```

создайте папку и положите в неё разрешённые материалы:

```bash
mkdir -p ../project-ai-context/PROJECT-123
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force ..\project-ai-context\PROJECT-123
```

После этого из project repository выполните одну команду:

```bash
aiw task PROJECT-123 --role analyst --workflow feature
```

AIW автоматически находит `project-ai-context/PROJECT-123`, проверяет её содержимое, создаёт session snapshot и предоставляет его выбранной роли. Следующие роли получают новый snapshot того же текущего набора файлов:

```bash
aiw task PROJECT-123 --role architect --workflow feature
aiw task PROJECT-123 --role developer --workflow feature
aiw task PROJECT-123 --role reviewer --workflow feature
```

Если папки нет, задача запускается без внешнего контекста и агент обязан сообщить о недостающих требованиях вместо догадок. Если папка существует, но содержит небезопасный файл, запуск блокируется.

После безопасной остановки или завершения задачи тот же разрешённый набор может использовать отдельная команда `aiw feedback AIW-001 --task PROJECT-123` для подготовки обезличенного failure-record draft. Snapshot остаётся read-only и ephemeral; содержимое, имена файлов и task ID запрещено переносить в failure record. Предыдущий chat transcript команда не получает.

## Что можно положить

Поддерживаются обычные документы и данные: Markdown/text, JSON/YAML/XML/CSV, HTML/SVG, PDF, Word/Excel/PowerPoint, а также распространённые изображения. Разрешённые расширения: `.md`, `.txt`, `.json`, `.yaml`, `.yml`, `.xml`, `.csv`, `.html`, `.htm`, `.svg`, `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.rtf`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`. Вложенные обычные каталоги допустимы.

Не помещайте:

- secrets, credentials, private keys, `.env`;
- production или personal data без отдельного разрешения;
- исполняемые файлы, scripts и архивы;
- symlink или hard link;
- нерелевантные страницы, комментарии и вложения;
- материалы, которые договор или data policy запрещают передавать AI-провайдеру.

Технические лимиты: до 50 файлов, до 10 MiB на файл и до 50 MiB на задачу. Текстовые форматы проверяются на несколько высокодостоверных secret patterns. Бинарные документы не проходят полноценный DLP-анализ, поэтому помещение файла в `project-ai-context/<task-id>` означает человеческое подтверждение, что его разрешено передать утверждённому AI-инструменту.

## Необязательный `CONTEXT.md`

Можно добавить краткую навигацию:

```markdown
# PROJECT-123

## Цель

...

## Приоритет источников

1. confluence-specification.pdf
2. jira-task.md

## Ограничения и открытые вопросы

...
```

Этот файл не является AIW policy. Как и остальные вложения, он передаётся модели как недоверенный источник фактов. Текст внутри task context не может отменить role boundary, human gate или запрет действия.

## Проверка без запуска модели

```bash
aiw context PROJECT-123 --role analyst --workflow feature
```

Команда показывает inventory, общий размер и digest набора. Небольшие текстовые файлы выводятся в отдельной секции untrusted context; бинарные и крупные файлы перечисляются по пути. В Claude Desktop отдельный read-only MCP-инструмент `aiw_task_artifact` читает только точный относительный путь из validated inventory. Агент обязан честно указать, какие форматы ему не удалось прочитать.

## Хранение и очистка

Исходная папка `project-ai-context/PROJECT-123` видима пользователю и не входит ни в один Git-репозиторий. Для каждой сессии launcher копирует её в `.ai-runtime/<task-time>/context`; snapshot-файлы доступны только для чтения, а Docker монтирует весь session runtime read-only.

`aiw finish PROJECT-123` удаляет session snapshots и evidence, но не удаляет исходные файлы автоматически. После проверки, что нужная specification сохранена в Jira, Confluence или утверждённом месте project repository, выполните:

```bash
aiw context-clean PROJECT-123 --approved
```

Команда удаляет только `project-ai-context/PROJECT-123`. Без `--approved` она показывает безопасную инструкцию и ничего не удаляет.

Session summary содержит только факт использования context, число файлов, общий размер и bundle digest. Содержимое, пути и имена файлов в summary не сохраняются.
