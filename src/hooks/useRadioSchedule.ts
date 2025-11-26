import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ScheduleItem } from '../types.ts';

interface RadioState {
  currentTrack: ScheduleItem | null;
  offset: number;
  isLive: boolean;
  nextShow: ScheduleItem | null;
  visibleSchedule: ScheduleItem[];
}
// ------------------------

export const useRadioSchedule = () => {
  // Store the raw full schedule from DB
  const [rawSchedule, setRawSchedule] = useState<ScheduleItem[]>([]);

  const [radioState, setRadioState] = useState<RadioState>({
    currentTrack: null,
    offset: 0,
    isLive: false,
    nextShow: null,
    visibleSchedule: [],
  });

  // 1. Fetch Schedule Real-time
  useEffect(() => {
    const q = query(collection(db, "schedule"), orderBy("startTime"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleItem));
      setRawSchedule(items);
    });
    return () => unsubscribe();
  }, []);

  // 2. The "Tick" Logic
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const nowSeconds = Math.floor(now.getTime() / 1000);

      const liveShow = rawSchedule.find(item => {
        const start = item.startTime.seconds;
        const end = start + item.durationSeconds;
        return nowSeconds >= start && nowSeconds < end;
      });

      const next = rawSchedule.find(item => item.startTime.seconds > nowSeconds) || null;

      const activeItems = rawSchedule.filter(item => {
        const endTime = item.startTime.seconds + item.durationSeconds;
        return endTime > nowSeconds;
      });

      if (liveShow) {
        setRadioState({
          currentTrack: liveShow,
          offset: nowSeconds - liveShow.startTime.seconds,
          isLive: true,
          nextShow: next,
          visibleSchedule: activeItems
        });
      } else {
        setRadioState({
          currentTrack: null,
          offset: 0,
          isLive: false,
          nextShow: next,
          visibleSchedule: activeItems
        });
      }
    };

    const timer = setInterval(checkSchedule, 1000);
    checkSchedule();
    return () => clearInterval(timer);
  }, [rawSchedule]);

  return {
    ...radioState,
    schedule: radioState.visibleSchedule
  };
};