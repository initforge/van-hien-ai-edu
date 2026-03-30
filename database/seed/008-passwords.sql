-- 008-passwords.sql — Password hashes (PBKDF2, 100k iterations)
-- admin: admin123 | teacher an: an123 | students mai, nam

-- Admin (admin123)
UPDATE users SET username = 'admin', password_hash = 'a09b00c5651f08edfce4bc058f43bb71:5de6735b185c81be09711baeeffefa7828177f17f18a53c9b96e805f2a81770fd241c42638be1e066f38e4ee2837e99b25544c2fd5d09336c83f868dbfe3a4c6' WHERE id = 'admin-1';

-- Teacher (an123)
UPDATE users SET username = 'an', password_hash = '726fde8fb284c3069dc1c809243ebca689d7647f91257885f8ba59a10da5ea47:694b7fa632fc8d8eccd1cd5c090d494169b0d0d8a890391f41cb1f3c5e5958c5668fd665445730efb9aeeff6b0dd3638eb46829cb40bc7ffc44a018942b1354b' WHERE id = 'teacher-1';

-- Students (mai123, nam123)
UPDATE users SET username = 'mai', password_hash = '56e9894c98fb020e32a91020bfdf9f9606e564158a5160ee5e611c8143387579:91c5abb8ae06a47b9975d8ca82cb956d45f63ef22a8b9bcefaf1f67ea10b6c67ce4daf4b11fdbfece2e596826acaaa60bcd0d0c5f4aa2da1cc0a99c75daa5087' WHERE id = 'student-1';
UPDATE users SET username = 'nam', password_hash = '75fe157e9cd2d635de96fb9450cac7f6dc6a3b59e96ea58d5a4a78dfcca1dd46:8079f00a57c159aa69ff5b9fa630619e310e41033da7662e01b2aa6405be2e9a4c52b7e8b09c05027a906a8e155d71b779da5398d589b0671acf01a13db70226' WHERE id = 'student-2';
