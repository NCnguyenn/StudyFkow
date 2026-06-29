// ─── Editor Mode ─────────────────────────────────────────────────────────────
export type NoteEditorMode = 'document' | 'freeform';

// ─── Freeform Block Types ────────────────────────────────────────────────────
export type FreeformBlockType = 'text' | 'shape' | 'image';

export interface BlockStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;      // 0 = sharp, 9999 = circle/pill
  opacity: number;           // 0–1
  shadow: boolean;
}

export interface BlockContent {
  // For 'text' blocks
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  lineHeight?: number;

  // For 'image' blocks
  imageUrl?: string;
  imageFit?: 'cover' | 'contain' | 'fill';

  // For 'shape' blocks
  shapeType?: 'rectangle' | 'circle' | 'rounded-rect' | 'diamond';
  label?: string; // optional text inside shape
  labelColor?: string;
}

export interface FreeformBlock {
  id: string;
  type: FreeformBlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees (Phase 2 — stored but not yet rendered)
  zIndex: number;
  locked: boolean;
  style: BlockStyle;
  content: BlockContent;
}

/** Serialized freeform canvas data — stored in `content_json` when mode='freeform' */
export interface FreeformCanvasData {
  version: 1;
  editorMode: 'freeform';
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  backgroundPattern: 'blank' | 'grid' | 'dot' | 'lines';
  blocks: FreeformBlock[];
}

// ─── Note Template ───────────────────────────────────────────────────────────
export interface NoteTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  mode: NoteEditorMode;
  content_json: Record<string, any>;
  thumbnail: string | null;
  is_public: boolean;
  tags: string[] | null;
  category: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
  // ── Phase 2 additions ──
  subcategory?: string;
  preview_image?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimated_setup_time?: string;
  blocks_used?: string[];
  theme_id?: string;
  ui_metadata_preset?: Partial<NoteUiMetadata>;
}

export type TemplateCategory = 'language_learning' | 'academic' | 'research' | 'project_management' | 'content_creation' | 'personal' | 'business' | 'creative';

// ─── Core Types ──────────────────────────────────────────────────────────────

export interface NoteFolder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  ui_metadata?: NoteUiMetadata;
}

export interface NoteUiMetadata {
  background: 'blank' | 'grid' | 'dot' | 'lines' | 'dark-code' | 'kraft' | string;
  font_family: 'Inter' | 'Merriweather' | 'Fira Code' | 'Noto Serif' | 'Caveat' | 'Lexend' | 'Playfair Display' | 'Plus Jakarta Sans';
  content_width: 'compact' | 'wide' | 'full';
  workspace_preset?: 'tech' | 'language' | 'research' | 'default';
  page_theme?: string;
  theme_id?: string;
  custom_theme?: any; // Partial<PageTheme>
  page_background_image?: string | null;
  header_style?: 'default' | 'hero' | 'minimal' | 'banner' | 'split';
  cover_image_url: string | null;
  cover_position_y: number; // 0–100 (percent)
  icon: string | null;      // emoji char
  is_pinned: boolean;
  is_locked: boolean;
  editor_mode?: NoteEditorMode; // defaults to 'document'
}

export interface NoteTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface NoteItem {
  id: string;
  user_id: string;
  folder_id: string | null;
  subject_ids: string[];
  task_ids: string[];
  title: string;
  content_json: Record<string, any>;
  content_markdown: string | null;
  ui_metadata: NoteUiMetadata;
  created_at: string;
  updated_at: string;
  status?: 'draft' | 'in_progress' | 'reviewed' | 'archived';
  note_type?: 'lecture' | 'reading' | 'problem_set' | 'essay' | 'lab_report';
  priority?: 'low' | 'medium' | 'high';
  tags: NoteTag[];
}

export interface WorkspaceData {
  folders: NoteFolder[];
  notes: NoteItem[];
}

export interface Theme {
  id: string;
  name: string;
  is_dark: boolean;
  css_variables: Record<string, string>;
}
