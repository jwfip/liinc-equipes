-- Liinc Mentorias — Matching por IA: última sugestão de mentores por equipe
-- Idempotente e aditiva. Só facilitador e admin leem esta tabela (os motivos citam o perfil restrito).

BEGIN;

CREATE TABLE IF NOT EXISTS team_matchings (
  id            serial PRIMARY KEY,
  event_id      integer NOT NULL CONSTRAINT team_matchings_event_id_events_id_fk REFERENCES events(id),
  team_id       uuid    NOT NULL CONSTRAINT team_matchings_team_id_teams_id_fk REFERENCES teams(id) ON DELETE CASCADE,
  content       jsonb   NOT NULL,
  requested_by  uuid    CONSTRAINT team_matchings_requested_by_mentors_id_fk REFERENCES mentors(id),
  model         text,
  created_at    timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS team_matchings_team_idx ON team_matchings (team_id);

COMMIT;
