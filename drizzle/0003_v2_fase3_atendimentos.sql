-- Liinc Mentorias v2 — Fase 3: atendimentos de especialistas e ajuste de etapa
-- Idempotente e compatível com o código anterior (só relaxa NOT NULL e acrescenta).

BEGIN;

ALTER TABLE mentoring_records ALTER COLUMN status   DROP NOT NULL;
ALTER TABLE mentoring_records ALTER COLUMN block_id DROP NOT NULL;
ALTER TABLE mentoring_records ADD COLUMN IF NOT EXISTS topic text;

CREATE TABLE IF NOT EXISTS team_step_changes (
  id          serial PRIMARY KEY,
  event_id    integer NOT NULL CONSTRAINT team_step_changes_event_id_events_id_fk REFERENCES events(id),
  team_id     uuid    NOT NULL CONSTRAINT team_step_changes_team_id_teams_id_fk REFERENCES teams(id),
  step_id     integer NOT NULL CONSTRAINT team_step_changes_step_id_event_steps_id_fk REFERENCES event_steps(id),
  changed_by  text             CONSTRAINT team_step_changes_changed_by_users_id_fk REFERENCES users(id),
  created_at  timestamp DEFAULT now()
);

COMMIT;
