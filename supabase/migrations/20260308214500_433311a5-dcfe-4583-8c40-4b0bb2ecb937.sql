-- GS-01: Add "Implement prompt_version in database" task, shorten decision
UPDATE gold_standards SET
  expected_tasks = (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'title' = 'Write commitment and non-commitment phrase list'
        THEN jsonb_set(elem, '{title}', '"Write commitment and non-commitment phrase list"')
        ELSE elem
      END
    )
    FROM jsonb_array_elements(expected_tasks) AS elem
  ) || '[{"title": "Implement prompt_version in database", "owner": "Priya", "due_date_text": "this week", "confidence": "high"}]'::jsonb,
  expected_decisions = (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'decision' LIKE 'If meeting date is missing%'
        THEN jsonb_build_object('decision', 'If meeting date is missing, preserve relative date text')
        ELSE elem
      END
    )
    FROM jsonb_array_elements(expected_decisions) AS elem
  )
WHERE id = 'e00ece64-f12e-4006-b981-42ee16a89bb4';

-- GS-02: Update confirms to simpler phrasing
UPDATE gold_standards SET
  expected_things_to_confirm = '[
    {"question": "Should edits be preserved on regenerate?", "directed_to": "Elena"},
    {"question": "Is the batch dashboard happening this weekend?", "directed_to": "Priya"},
    {"question": "Will transcripts be stored permanently?", "directed_to": "Priya"},
    {"question": "What is the UX when meeting date is missing and transcripts use relative dates?", "directed_to": "Elena"}
  ]'::jsonb
WHERE id = 'c5a69d0e-2cc7-42ef-835c-80e205f1321a';

-- GS-03: Update confirm question for Sentry
UPDATE gold_standards SET
  expected_things_to_confirm = '[{"directed_to": "Dev", "question": "Is Sentry error monitoring setup confirmed for next week?"}]'::jsonb
WHERE id = 'd6450938-d56b-4268-8cf9-7aa80e730ee0';

-- GS-05: Add "Build email templates" task, simplify Leo blocker confirm
UPDATE gold_standards SET
  expected_tasks = expected_tasks || '[{"title": "Build email templates", "owner": "Fatima", "due_date_text": "this week", "confidence": "high"}]'::jsonb,
  expected_things_to_confirm = '[
    {"directed_to": "Ben", "question": "Will Ben fix the login flow bug this week?"},
    {"directed_to": "Unassigned", "question": "What unblocks Leo on the deployment pipeline?"}
  ]'::jsonb
WHERE id = 'eb3c9962-8b21-4cbd-8f15-dbb68247cdc3';

-- GS-08: Ensure notification task title is exact
UPDATE gold_standards SET
  expected_tasks = (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'title' LIKE '%notification%'
        THEN jsonb_set(elem, '{title}', '"Deliver notification feature end to end"')
        ELSE elem
      END
    )
    FROM jsonb_array_elements(expected_tasks) AS elem
  )
WHERE id = 'ecc5c242-f5a8-46ba-82e7-4dc5a56c0d93';

-- GS-09: Update profile test task title
UPDATE gold_standards SET
  expected_tasks = (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'title' LIKE '%profile%' AND elem->>'title' LIKE '%test%'
        THEN jsonb_set(elem, '{title}', '"Test the profile page end to end"')
        WHEN elem->>'title' LIKE '%profile%' AND elem->>'title' LIKE '%Test%'
        THEN jsonb_set(elem, '{title}', '"Test the profile page end to end"')
        ELSE elem
      END
    )
    FROM jsonb_array_elements(expected_tasks) AS elem
  )
WHERE id = 'c0147c04-24f3-44b4-805a-0b62686293a2';