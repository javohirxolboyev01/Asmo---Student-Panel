-- Data-only migration: preset avatars were saved with the site's origin
-- ("http://old-domain/avatars/boy-01.svg"), which breaks when the app moves
-- to another domain. Keep only the site-relative path. Touches nothing else.
UPDATE "User"
SET "avatar" = substring("avatar" from '(/avatars/(?:boy|girl)-[0-9]{2}\.svg)$')
WHERE "avatar" ~ '^https?://[^/]+/avatars/(boy|girl)-[0-9]{2}\.svg$';

UPDATE "Teacher"
SET "avatar" = substring("avatar" from '(/avatars/(?:boy|girl)-[0-9]{2}\.svg)$')
WHERE "avatar" ~ '^https?://[^/]+/avatars/(boy|girl)-[0-9]{2}\.svg$';
