
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export type ItemType = 'folder' | 'note' | 'htmlView' | 'videoFolder';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  ownerId: string;
  parentId: string | null;
  contentId?: string;
  children?: Item[];
}

export interface Note {
    id: string;
    content: string; // HTML from Quill
}

export interface HtmlView {
    id: string;
    htmlContent: string;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  parentId: string | null;
}
