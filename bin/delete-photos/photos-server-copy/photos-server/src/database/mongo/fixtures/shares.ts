import { ObjectId } from 'mongodb';

import { ShareDocument } from '../models/Share';
import { users } from './users';
import { photos } from './photos';

const [userOne, userTwo] = users;
const [photoOne, photoTwo, photoThree, photoFour] = photos;

if (photoOne.userId !== userOne._id) {
  throw new Error('Check fixtures data');
}

if (photoTwo.userId !== userOne._id) {
  throw new Error('Check fixtures data');
}

if (photoThree.userId !== userTwo._id) {
  throw new Error('Check fixtures data');
}

if (photoFour.userId !== userTwo._id) {
  throw new Error('Check fixtures data');
}

const userOneShares: ShareDocument[] = [
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    bucket: '---',
    encryptedMnemonic: 'eoeoeoeeo',
    photoIds: [photoOne._id],
    token: 'aaaaa',
    views: 10,
  },
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaab'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    bucket: '---',
    encryptedMnemonic: 'eoeoeoeeo',
    photoIds: [photoTwo._id],
    token: 'aaaaa',
    views: 10,
  },
];

const userTwoShares: ShareDocument[] = [
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaac'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    bucket: '---',
    encryptedMnemonic: 'eoeoeoeeo',
    photoIds: [photoThree._id],
    token: 'aaaaa',
    views: 10,
  },
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaad'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    bucket: '---',
    encryptedMnemonic: 'eoeoeoeeo',
    photoIds: [photoFour._id],
    token: 'aaaaa',
    views: 10,
  },
];

function existsPhotosWithMoreThanOneShare(): boolean {
  const userOnePhotoIds = userOneShares.map((share) => share.photoIds);
  const userTwoPhotoIds = userTwoShares.map((share) => share.photoIds);

  const duplicatedUserOneShares = userOnePhotoIds.some((photoId, index) => {
    const foundDuplicatedPhoto = userOnePhotoIds.indexOf(photoId, index + 1) !== -1;

    return foundDuplicatedPhoto;
  });

  const duplicatedUserTwoShares = userTwoPhotoIds.some((photoId, index) => {
    const foundDuplicatedPhoto = userTwoPhotoIds.indexOf(photoId, index + 1) !== -1;

    return foundDuplicatedPhoto;
  });

  return duplicatedUserOneShares || duplicatedUserTwoShares;
}

if (existsPhotosWithMoreThanOneShare()) {
  throw new Error('Fixtures are wrong. A photo cannot have more than one share');
}

export const shares: Required<ShareDocument>[] = [...userOneShares, ...userTwoShares];
