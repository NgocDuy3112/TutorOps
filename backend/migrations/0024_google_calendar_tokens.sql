-- Google Calendar push sync: OAuth tokens (offline access) per teacher.
-- refresh_token is long-lived and only issued on first consent; access
-- tokens are refreshed transparently via google-auth-library.
CREATE TABLE google_calendar_tokens (
  user_id uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  refresh_token text NOT NULL,
  access_token text,
  token_expiry timestamptz,
  connected_at timestamptz NOT NULL DEFAULT now()
);
