import { useState, useEffect, useCallback } from "react";
import * as svc from "../services/tripsService";
import { uploadFile } from "../services/storageService";

const DEFAULT_DOCS = [
  "Passport",
  "Visa",
  "Travel Insurance",
  "Flight Tickets",
  "Hotel Booking",
  "Emergency Contacts",
];

export const useDocuments = (userId, tripId) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !tripId) return;
    svc.getDocs_(userId, tripId).then(async (data) => {
      if (data.length === 0) {
        const seeded = await Promise.all(
          DEFAULT_DOCS.map((name) =>
            svc
              .addDocument(userId, tripId, { name, isChecked: false, fileUrl: null })
              .then((ref) => ({ id: ref.id, name, isChecked: false, fileUrl: null })),
          ),
        );
        setDocs(seeded);
      } else {
        setDocs(data);
      }
      setLoading(false);
    });
  }, [userId, tripId]);

  const toggleCheck = useCallback(
    async (docId, current) => {
      await svc.updateDocument(userId, tripId, docId, { isChecked: !current });
      setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, isChecked: !current } : d)));
    },
    [userId, tripId],
  );

  const uploadDoc = useCallback(
    async (docId, file) => {
      const { url } = await uploadFile(userId, tripId, file);
      await svc.updateDocument(userId, tripId, docId, { fileUrl: url });
      setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, fileUrl: url } : d)));
    },
    [userId, tripId],
  );

  return { docs, loading, toggleCheck, uploadDoc };
};
