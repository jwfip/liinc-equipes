-- Liinc Mentorias — Acesso de facilitador (parte 1): projeto atual da equipe e pivôs
-- Idempotente e aditiva. O papel 'facilitator' usa a coluna de texto event_members.role (sem mudança de schema).

BEGIN;

CREATE TABLE IF NOT EXISTS team_projects (
  id           serial PRIMARY KEY,
  event_id     integer NOT NULL CONSTRAINT team_projects_event_id_events_id_fk REFERENCES events(id),
  team_id      uuid    NOT NULL CONSTRAINT team_projects_team_id_teams_id_fk REFERENCES teams(id) ON DELETE CASCADE,
  description  text    NOT NULL,
  kind         text    NOT NULL,
  record_id    uuid    CONSTRAINT team_projects_record_id_mentoring_records_id_fk REFERENCES mentoring_records(id),
  created_by   uuid    CONSTRAINT team_projects_created_by_mentors_id_fk REFERENCES mentors(id),
  created_at   timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_projects_team_idx ON team_projects (team_id, created_at);

COMMIT;
