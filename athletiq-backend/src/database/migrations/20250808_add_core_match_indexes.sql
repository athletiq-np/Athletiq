CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
-- Core performance indexes for matches & team membership lookups (schema-aware)
DO $$
BEGIN
	-- Matches table conditional indexes
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='tournament_id') THEN
		EXECUTE 'CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id)';
	END IF;
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='sport_id') THEN
		EXECUTE 'CREATE INDEX IF NOT EXISTS idx_matches_sport_id ON matches(sport_id)';
	END IF;
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='event_category') THEN
		EXECUTE 'CREATE INDEX IF NOT EXISTS idx_matches_event_category ON matches(event_category)';
	END IF;
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='status') THEN
		EXECUTE 'CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status)';
	END IF;
	-- Team players indexes
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='team_players' AND column_name='team_id') THEN
		EXECUTE 'CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id)';
	END IF;
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='team_players' AND column_name='player_id') THEN
		EXECUTE 'CREATE INDEX IF NOT EXISTS idx_team_players_player_id ON team_players(player_id)';
	END IF;
END $$;

-- Optional: text search/trigram (uncomment if pg_trgm extension enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_players_full_name_trgm ON players USING gin(full_name gin_trgm_ops);
