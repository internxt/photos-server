import { config } from 'dotenv';
import { DriveDatabase, PhotosDatabase, PhotoWithTimes } from './drive-gateway';
import { CryptoService } from './crypto';
import { PhotoStatus } from '../models/Photo';
import { items } from '@internxt/lib';

config();

function replaceSingleQuotesIfExist(x: string): string {
  return x.replace(/'/g, '"');
}

const useTimers = true;

async function run() {
  let drive: DriveDatabase;
  let photos: PhotosDatabase;

  try {
    drive = new DriveDatabase();
    photos = new PhotosDatabase(process.env.DATABASE_URI!);

    await drive.connect();
    await photos.connect();

    const usersIterator = photos.getUsersIterator({
      lastId: '000000000000000000000000',
      pageSize: 1,
    });

    for await (const user of usersIterator) {
      console.time('migrate-user');

      console.log(`Migrating user ${user.uuid} (objectId: ${user.id.toString()})...`);

      if (user.migrated) {
        console.log(`User ${user.uuid} already migrated, skipping`);
        console.timeEnd('migrate-user');
        continue;
      }

      if (useTimers) console.time('get-user-info');

      const driveUser = await drive.getUserInfo(user);

      if (useTimers) console.timeEnd('get-user-info');

      if (!driveUser) {
        console.log(`Drive user not found for photos user ${user.uuid}`);
        console.timeEnd('migrate-user');
        continue;
      }

      const { rootFolderId, id: driveUserId, rootFolderUuid, sharedWorkspace } = driveUser;

      if (useTimers) console.time('create-photos-folder');

      const crypto = new CryptoService();

      const hasSharedWorkspace = driveUser.bridgeUser !== driveUser.username || sharedWorkspace;

      // When old shared workspace is set in place, multiple users share the same root folder id, so the index with parent_id and name 
      // can make the folder insert fail
      const folderName = 'Photos' + (hasSharedWorkspace ? `-${driveUser.username}` : '');

      const photosFolder = await drive.insertFolder({
        parentId: rootFolderId,
        name: crypto.encryptName(folderName, rootFolderId) as string,
        bucket: user.bucketId,
        userId: driveUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        encryptVersion: '03-aes',
        plainName: folderName,
        parentUuid: rootFolderUuid
      });

      console.log(`Using folder ${photosFolder.id} to store photos`);

      if (useTimers) console.timeEnd('create-photos-folder');

      const photosIterator = photos.getUserPhotosIterator({ 
        userId: user.id, 
        lastId: '000000000000000000000000',
        pageSize: 20 
      });

      let trashedCount = 0;
      let existsCount = 0;
      let photosCount = 0;

      const userPhotosMap: Map<string, PhotoWithTimes[]> = new Map();

      for await (const photos of photosIterator) {
        if (photos.length === 0) break;

        if (useTimers) console.time('photos-to-files');

        const photosCopy: PhotoWithTimes[] = [];

        console.log(`First photo id is ${photos[0].id}`);

        for (const photo of photos) {
          photo.name = replaceSingleQuotesIfExist(photo.name);
          photo.type = replaceSingleQuotesIfExist(photo.type);
        }

        for (const photo of photos) {
          // As we may edit the photo.name property, we do want to keep the original
          // for indexing purposes
          const originalName = photo.name;
          const photoCopy = { ...photo, type: photo.type.toLowerCase() };

          if (userPhotosMap.has(originalName)) {
            // Prevent same network file id
            const alreadyExistentPhotos = userPhotosMap.get(originalName);
            const sameNetworkFileIdUsed = alreadyExistentPhotos?.findIndex((p) => {
              return p.fileId === photo.fileId;
            }) !== -1;
            // same network file id -> same file -> we do not migrate, is a duplicated file
            if (sameNetworkFileIdUsed) {
              console.log(`Found duplicated network id for file ${photo.id}. Not migrating!`);
              continue;
            }

            let finalNewName = photoCopy.name;
            let duplicatedFound = true;

            do {
              // Prevent duplicated namings
              // NOTE: if the extension is different, renaming is not needed
              if (!userPhotosMap.has(finalNewName)) break;

              const [needed,, newName] = items.renameIfNeeded(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                userPhotosMap.get(finalNewName)!.map(p => {
                  return { name: p.name, type: p.type };
                }),
                finalNewName,
                photoCopy.type,
              );
              if (needed) { 
                console.log('Found duplicated name, renaming from', originalName, 'to', newName);
                finalNewName = newName;
              } else {
                duplicatedFound = false;
              }
            } while (duplicatedFound);

            if (finalNewName !== photoCopy.name) {
              photoCopy.name = finalNewName;
              userPhotosMap.set(finalNewName, [photoCopy]);
            }
          }
          photosCopy.push(photoCopy); 
          userPhotosMap.set(originalName, [...(userPhotosMap.get(originalName) || []), photoCopy]);
        }

        console.log('photos to insert', photosCopy.map(p => ({ name: p.name, id: p.id, networkId: p.fileId })));

        await drive.createPhotosAsFiles(
          photosFolder.id, 
          photosFolder.uuid,
          driveUserId, 
          photosCopy.map(p => {
            return {
              ...p,
              plainName: p.name, 
              name: crypto.encryptName(p.name, photosFolder.id) as string,
            };
          }), 
          user.bucketId
        ); 

        const currTrashCount = photosCopy.filter(p => p.status === PhotoStatus.Trashed).length;

        trashedCount += currTrashCount;
        existsCount += photosCopy.length - currTrashCount;
        photosCount += photosCopy.length;
        
        if (useTimers) console.timeEnd('photos-to-files');
      }

      console.timeEnd('migrate-user');
      console.log({ photosCount, trashedCount, existsCount, user: user.uuid });

      console.log(`Migrated ${photosCount} photos for user ${user.uuid}`);
    }
  } finally {
    console.log('Finally reached');
    drive! && await drive.disconnect().catch((err) => {
      console.error('Error while disconnecting from Drive', err);
    });

    photos! && await photos.disconnect().catch((err) => {
      console.error('Error while disconnecting from photos', err);
    });
  }
}

run().then(() => {
  console.log('Migration finished');
}).catch((err) => {
  console.error('Caught error while migrating', err);
});
