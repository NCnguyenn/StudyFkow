export interface WorkspaceKitFolder {
  name: string;
  icon?: string;
  children?: WorkspaceKitFolder[];
}

export interface WorkspaceKitTemplate {
  title: string;
  templateId: string;
  folderId: string; // references a folder name or mapping key
}

export interface WorkspaceKit {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  previewImage?: string;
  folders: WorkspaceKitFolder[];
  templateNotes: WorkspaceKitTemplate[];
  suggestedTheme: string;
  suggestedBlocks: string[];
  tips: string[];
}

export const WORKSPACE_KITS: WorkspaceKit[] = [
  {
    id: "english-learning",
    name: "English Learning Workspace",
    description: "A complete workspace for mastering English vocabulary, grammar, and skills.",
    icon: "🇬🇧",
    category: "Languages",
    folders: [
      { name: "Vocabulary", icon: "📚" },
      { name: "Grammar", icon: "✍️" },
      { name: "Reading", icon: "📖" },
      { name: "Listening", icon: "🎧" },
      { name: "Writing", icon: "📝" },
      { name: "Speaking", icon: "🗣️" }
    ],
    templateNotes: [
      { title: "Vocabulary Log", templateId: "vocab-log", folderId: "Vocabulary" },
      { title: "Grammar Rule Template", templateId: "grammar-rule", folderId: "Grammar" }
    ],
    suggestedTheme: "default",
    suggestedBlocks: ["vocabulary", "flashcard"],
    tips: ["Review vocabulary daily", "Practice speaking out loud"]
  },
  {
    id: "university-course",
    name: "University Course",
    description: "Organize your lectures, assignments, and exam prep for a single course.",
    icon: "🎓",
    category: "Education",
    folders: [
      { name: "Lecture Notes", icon: "📓" },
      { name: "Assignments", icon: "📋" },
      { name: "Exam Prep", icon: "🎯" },
      { name: "Readings", icon: "📚" }
    ],
    templateNotes: [
      { title: "Lecture Note Template", templateId: "lecture-note", folderId: "Lecture Notes" },
      { title: "Exam Prep Guide", templateId: "exam-prep", folderId: "Exam Prep" }
    ],
    suggestedTheme: "default",
    suggestedBlocks: ["todo", "callout"],
    tips: ["Keep your lecture notes organized by week", "Create flashcards for exam prep"]
  },
  {
    id: "research-project",
    name: "Research Project",
    description: "A structured setup for conducting and organizing academic research.",
    icon: "🔬",
    category: "Research",
    folders: [
      { name: "Literature", icon: "📚" },
      { name: "Notes", icon: "📝" },
      { name: "Writing", icon: "✍️" },
      { name: "Data", icon: "📊" }
    ],
    templateNotes: [
      { title: "Literature Review", templateId: "literature-review", folderId: "Literature" },
      { title: "Experiment Notes", templateId: "experiment-notes", folderId: "Notes" }
    ],
    suggestedTheme: "dark",
    suggestedBlocks: ["code", "quote"],
    tips: ["Tag literature by topic", "Keep raw data separated from analysis"]
  },
  {
    id: "content-creator",
    name: "Content Creator Hub",
    description: "Manage your content pipeline from ideas to published pieces.",
    icon: "🎬",
    category: "Creative",
    folders: [
      { name: "Ideas", icon: "💡" },
      { name: "Drafts", icon: "📝" },
      { name: "Published", icon: "✅" }
    ],
    templateNotes: [
      { title: "Content Outline", templateId: "content-outline", folderId: "Drafts" },
      { title: "Idea Brainstorm", templateId: "idea-brainstorm", folderId: "Ideas" }
    ],
    suggestedTheme: "default",
    suggestedBlocks: ["image", "video"],
    tips: ["Move drafts to published when done", "Jot down ideas immediately"]
  },
  {
    id: "personal-productivity",
    name: "Personal Productivity",
    description: "Your personal operating system for goals and daily journaling.",
    icon: "⚡",
    category: "Personal",
    folders: [
      { name: "Goals", icon: "🎯" },
      { name: "Daily Journal", icon: "📔" },
      { name: "Weekly Review", icon: "📅" },
      { name: "Projects", icon: "🚀" }
    ],
    templateNotes: [
      { title: "Daily Entry", templateId: "daily-entry", folderId: "Daily Journal" },
      { title: "Weekly Review Template", templateId: "weekly-review", folderId: "Weekly Review" }
    ],
    suggestedTheme: "dark",
    suggestedBlocks: ["todo", "divider"],
    tips: ["Review your goals weekly", "Journal every morning or evening"]
  },
  {
    id: "business-planning",
    name: "Business Planning",
    description: "Organize market research, strategy, and operations.",
    icon: "💼",
    category: "Business",
    folders: [
      { name: "Market Research", icon: "🔍" },
      { name: "Strategy", icon: "♟️" },
      { name: "Finance", icon: "💰" },
      { name: "Operations", icon: "⚙️" }
    ],
    templateNotes: [
      { title: "Competitor Analysis", templateId: "competitor-analysis", folderId: "Market Research" },
      { title: "Business Strategy", templateId: "business-strategy", folderId: "Strategy" }
    ],
    suggestedTheme: "default",
    suggestedBlocks: ["table", "heading"],
    tips: ["Keep finances updated monthly", "Review strategy quarterly"]
  }
];
