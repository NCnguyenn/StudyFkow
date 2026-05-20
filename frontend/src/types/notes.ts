export interface NoteFolder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export interface NoteItem {
  id: string;
  user_id: string;
  folder_id: string | null;
  subject_id: string | null;
  task_id: string | null;
  title: string;
  content_json: Record<string, any>;
  content_markdown: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceData {
  folders: NoteFolder[];
  notes: NoteItem[];
}
