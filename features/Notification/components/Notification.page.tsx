import { useState } from 'react';
import { getAllNotifications } from '../libs/notifications';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';

export async function getStaticProps() {
  const notifications = getAllNotifications();
  const serializedNotifications = await Promise.all(
    notifications.map(async (notification: any) => {
      const mdxSource = await serialize(notification.content);
      return {
        ...notification,
        mdxSource,
      };
    })
  );

  return {
    props: {
      notifications: serializedNotifications,
    },
  };
}

const Notification = ({ notifications }: any) => {
  const [selectedNotification, setSelectedNotification] = useState<MDXRemoteSerializeResult | null>(null);

  const handleNotificationClick = (mdxSource: MDXRemoteSerializeResult) => {
    console.log(mdxSource);
    setSelectedNotification(mdxSource);
  };

  const closeModal = () => {
    setSelectedNotification(null);
  };

  return (
    <div className="mx-auto pt-24 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mt-8">リリースノート</h1>
      <div className="mt-8 space-y-4">
        {notifications.map((notification: any) => (
          <div
            key={notification.id}
            className="bg-white p-4 rounded-md shadow-md cursor-pointer"
            onClick={() => handleNotificationClick(notification.mdxSource)}
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="ml-4">
                <p className="font-bold">{notification.title}</p>
                <p className="text-sm text-gray-500">{notification.date}</p>
              </div>
            </div>
            <p className="mt-4">{notification.description}</p>
          </div>
        ))}
      </div>
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <MDXRemote {...selectedNotification} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;