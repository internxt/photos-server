db.createUser({
    user: 'admin',
    pwd: 'password',
    roles: [
        {
            role: 'readWrite',
            db: 'photos',
        },
    ],
});

db.createCollection('photos');
db.createCollection('users');
db.createCollection('devices');
