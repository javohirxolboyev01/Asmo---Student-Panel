-- Dedicated teacher login: admin@gmail.com (role TEACHER).
-- Only the bcrypt hash is stored here; the password itself is not in the repo.
-- Idempotent and safe: an existing user with this email is left untouched.
INSERT INTO "User" ("id", "email", "passwordHash", "firstName", "lastName", "role", "status", "updatedAt")
VALUES (
  'user-teacher-admin-gmail',
  'admin@gmail.com',
  '$2b$12$yOXFOdg56.x8WzEc.G4wcubML9by1IOZy88QBpo8NC/ns0ugYWt06',
  'Asmo',
  'Ustoz',
  'TEACHER',
  'ACTIVE',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "Teacher" ("id", "fullName", "userId")
SELECT 'teacher-admin-gmail', 'Asmo Ustoz', u."id"
FROM "User" u
WHERE u."email" = 'admin@gmail.com' AND u."role" = 'TEACHER'
ON CONFLICT ("userId") DO NOTHING;
