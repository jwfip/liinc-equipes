-- Liinc Mentorias v2 — Fase 5: resumos por IA e transcrição de áudio
-- Idempotente e aditiva.

BEGIN;

ALTER TABLE mentoring_records ADD COLUMN IF NOT EXISTS audio_transcript text;

CREATE TABLE IF NOT EXISTS team_summaries (
  id                  serial PRIMARY KEY,
  event_id            integer NOT NULL CONSTRAINT team_summaries_event_id_events_id_fk REFERENCES events(id),
  team_id             uuid    NOT NULL CONSTRAINT team_summaries_team_id_teams_id_fk REFERENCES teams(id),
  kind                text    NOT NULL,
  content             text    NOT NULL,
  based_on_record_id  uuid,
  model               text,
  edited_by_admin     boolean NOT NULL DEFAULT false,
  created_at          timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS team_summaries_team_kind_idx ON team_summaries (team_id, kind);

COMMIT;
