export interface PinResult {
  collectionId?: string;
  historyId?: string;
  pinned: boolean;
  target: 'conversation' | 'project';
}
