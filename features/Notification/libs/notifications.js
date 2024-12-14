import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const notificationsDirectory = path.join(process.cwd(), 'notifications');

export function getAllNotifications() {
  const fileNames = fs.readdirSync(notificationsDirectory);
  const allNotifications = fileNames.map((fileName) => {
    const id = fileName.replace(/\.mdx$/, '');
    const fullPath = path.join(notificationsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);

    return {
      id,
      ...data,
    };
  });

  return allNotifications;
}