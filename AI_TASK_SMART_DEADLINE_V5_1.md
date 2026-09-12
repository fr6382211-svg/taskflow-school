# v5.1 — AI Task + Smart Deadline

- Added `AITaskAssistant` inside the new-task form.
- Natural-language task draft extraction is deterministic and local; it does not send task text to a third-party API.
- Subject, date, time and priority can be inferred from the user's text.
- User must review/apply the draft before saving.
- Smart deadline no longer defaults to 23:59 when a related subject session is found.
- Automatic deadline is set to five minutes before the matching upcoming class session.
- Explicit date/time remains higher priority and manual override is preserved.
- Fathur tutoring schedule remains display-only and is not a source for task deadlines.
