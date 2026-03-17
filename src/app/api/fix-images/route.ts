import { NextResponse } from 'next/server';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';

export async function GET() {
  const db = getAdminFirestore();
  const bucket = getAdminStorage();

  const pages = await db.collection('lovepages').get();
  let fixed = 0;
  let errors = 0;

  for (const doc of pages.docs) {
      const data = doc.data();
      let updated: any = {};
      let hasChanges = false;

      const fixUrl = async (fileObj: any) => {
          if (!fileObj?.path || !fileObj?.url) return fileObj;
          if (fileObj.url.includes('storage.googleapis.com') && !fileObj.url.includes('token=')) return fileObj;
          try {
              await bucket.file(fileObj.path).makePublic();
              const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileObj.path}`;
              hasChanges = true;
              return { ...fileObj, url: publicUrl };
          } catch (e) {
              errors++;
              return fileObj;
          }
      };

      if (data.galleryImages?.length) {
          updated.galleryImages = await Promise.all(data.galleryImages.map(fixUrl));
      }
      if (data.puzzleImage) {
          updated.puzzleImage = await fixUrl(data.puzzleImage);
      }
      if (data.audioRecording) {
          updated.audioRecording = await fixUrl(data.audioRecording);
      }
      if (data.timelineEvents?.length) {
          updated.timelineEvents = await Promise.all(
              data.timelineEvents.map(async (e: any) => ({
                  ...e,
                  image: e.image ? await fixUrl(e.image) : e.image
              }))
          );
      }

      if (hasChanges) {
          await doc.ref.update(updated);
          fixed++;
      }
  }

  return NextResponse.json({ fixed, errors, total: pages.size });

}
