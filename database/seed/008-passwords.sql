-- 008-passwords.sql — Password hashes (PBKDF2, 100k iterations, sha512)
-- admin: admin123 | teacher an: an123 | students mai, nam

-- Admin (admin123)
UPDATE users SET username = 'admin', password_hash = 'd068b813efaaf5abbd0294f3e65257b8be0bd4a74b5bf82d78c89a9dc5c6c666:5be5c994fb45cffb52bfb5a5521993fac5a35b9aa92d2a8d0998d1e7068406558f8b06bd5017bc700ec5a1937d83f319017e35b2455e4d8206cde0b736311242' WHERE id = 'admin-1';

-- Teacher (an123)
UPDATE users SET username = 'an', password_hash = 'dee8701000936c139cb2d3aeffd8e73824726798c166cac1233d23c52e381115:c5f70d8a036b628bdca36446b5fc4e05a7018095a3493cb631dd2b52b545f49969c2b895f9ab2d30c3131f94cd5fd1ec26b28bb285085dda084745c95565fed6' WHERE id = 'teacher-1';

-- Students (mai123, nam123)
UPDATE users SET username = 'mai', password_hash = '7c6302dde90b5f6035074b37d12d500c7f1f2e7bdd57fb2201eb0e0c82c1aab9:73113838ed09589eaa2cb458959017a167014faae46551b6f9ff84ebde992017ea6238a8c58f10206a1e635a0e72ea96280f35d30bce2251bb4bb6003ae187e4' WHERE id = 'student-1';
UPDATE users SET username = 'nam', password_hash = 'd49a1ff8a7ec273d4780a1f29ee7dea28102f7c39b934a4f123cd39f64c35711:c35251d7d9d69155844f039e1d3ebf521c10a4b83264c4537d541b62156cce405cc5aba859aa6cfae205b6779a14b28b718e50141cfe88d21a45efa3c1f7e7f0' WHERE id = 'student-2';
