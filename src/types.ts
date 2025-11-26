import { Timestamp } from 'firebase/firestore';

export interface ScheduleItem {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  startTime: Timestamp;
  durationSeconds: number;
}