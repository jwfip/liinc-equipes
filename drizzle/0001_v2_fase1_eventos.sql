-- Liinc Mentorias v2 — Fase 1: eventos, etapas e participantes
-- Idempotente: pode ser executado mais de uma vez.
-- Uso: psql "$DATABASE_URL" -f drizzle/0001_v2_fase1_eventos.sql

BEGIN;

-- 1. Novas tabelas
CREATE TABLE IF NOT EXISTS events (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  company     text,
  start_date  date NOT NULL,
  end_date    date,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_steps (
  id        serial PRIMARY KEY,
  event_id  integer NOT NULL CONSTRAINT event_steps_event_id_events_id_fk REFERENCES events(id) ON DELETE CASCADE,
  position  integer NOT NULL,
  label     text NOT NULL
);

CREATE TABLE IF NOT EXISTS event_members (
  event_id   integer NOT NULL CONSTRAINT event_members_event_id_events_id_fk REFERENCES events(id) ON DELETE CASCADE,
  mentor_id  uuid NOT NULL CONSTRAINT event_members_mentor_id_mentors_id_fk REFERENCES mentors(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'mentor',
  created_at timestamp DEFAULT now(),
  CONSTRAINT event_members_event_id_mentor_id_pk PRIMARY KEY (event_id, mentor_id)
);

-- 2. Novas colunas
ALTER TABLE teams             ADD COLUMN IF NOT EXISTS event_id integer CONSTRAINT teams_event_id_events_id_fk REFERENCES events(id);
ALTER TABLE blocks            ADD COLUMN IF NOT EXISTS event_id integer CONSTRAINT blocks_event_id_events_id_fk REFERENCES events(id);
ALTER TABLE mentoring_records ADD COLUMN IF NOT EXISTS event_id integer CONSTRAINT mentoring_records_event_id_events_id_fk REFERENCES events(id);
ALTER TABLE mentoring_records ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'mentoring';
ALTER TABLE mentoring_records ADD COLUMN IF NOT EXISTS step_id integer CONSTRAINT mentoring_records_step_id_event_steps_id_fk REFERENCES event_steps(id);

-- 3..6. Evento de arquivo com os dados atuais
DO $$
DECLARE
  archive_id integer;
BEGIN
  SELECT id INTO archive_id FROM events WHERE name = 'Arquivo (antes da v2)' LIMIT 1;

  IF archive_id IS NULL THEN
    INSERT INTO events (name, start_date, active)
    VALUES ('Arquivo (antes da v2)', coalesce((SELECT min(date) FROM blocks), current_date), false)
    RETURNING id INTO archive_id;

    INSERT INTO event_steps (event_id, position, label) VALUES
      (archive_id, 1, 'Entendimento do problema'),
      (archive_id, 2, 'Explorando soluções'),
      (archive_id, 3, 'Escolha da solução'),
      (archive_id, 4, 'Protótipo'),
      (archive_id, 5, 'Testes'),
      (archive_id, 6, 'Pitch');
  END IF;

  UPDATE teams             SET event_id = archive_id WHERE event_id IS NULL;
  UPDATE blocks            SET event_id = archive_id WHERE event_id IS NULL;
  UPDATE mentoring_records SET event_id = archive_id WHERE event_id IS NULL;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mentoring_records' AND column_name = 'step'
  ) THEN
    EXECUTE $q$
      UPDATE mentoring_records r SET step_id = s.id
      FROM event_steps s
      WHERE s.event_id = r.event_id
        AND s.position = least(greatest(coalesce(r.step, 1), 1), 6)
        AND r.step_id IS NULL
    $q$;
    ALTER TABLE mentoring_records DROP COLUMN step;
  END IF;

  INSERT INTO event_members (event_id, mentor_id, role)
  SELECT archive_id, id, 'mentor' FROM mentors
  ON CONFLICT DO NOTHING;
END $$;

-- 7. event_id obrigatório
ALTER TABLE teams             ALTER COLUMN event_id SET NOT NULL;
ALTER TABLE blocks            ALTER COLUMN event_id SET NOT NULL;
ALTER TABLE mentoring_records ALTER COLUMN event_id SET NOT NULL;

-- 8. No máximo um bloco ativo por evento
CREATE UNIQUE INDEX IF NOT EXISTS blocks_one_active_per_event ON blocks (event_id) WHERE active;

COMMIT;
