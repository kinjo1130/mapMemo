import { useState, useCallback } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/init/firebase';

const useDeleteDocument = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null | unknown>(null);

  const deleteDocument = useCallback(async (collectionPath: string, docId: string) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, collectionPath, docId);
      await deleteDoc(docRef);
      console.log('Document successfully deleted!');
    } catch (err) {
      console.error('Error deleting document: ', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteDocument, loading, error };
};

export default useDeleteDocument;
