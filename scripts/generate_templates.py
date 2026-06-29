import json
import uuid

def wrap_page(content):
    return {
        'type': 'doc',
        'content': [
            {
                'type': 'page',
                'content': content
            }
        ]
    }

def h1(text): return {'type': 'heading', 'attrs': {'level': 1}, 'content': [{'type': 'text', 'text': text}]}
def h2(text): return {'type': 'heading', 'attrs': {'level': 2}, 'content': [{'type': 'text', 'text': text}]}
def p(text): return {'type': 'paragraph', 'content': [{'type': 'text', 'text': text}]}
def divider(variant='line'): return {'type': 'decorativeDivider', 'attrs': {'variant': variant, 'color': '#e5e7eb', 'thickness': 2}}
def kanban(cols): return {'type': 'kanbanBlock', 'attrs': {'columns': json.dumps(cols)}}
def timeline(entries): return {'type': 'timelineBlock', 'attrs': {'entries': json.dumps(entries)}}
def progress(val, label): return {'type': 'progressTracker', 'attrs': {'progress': val, 'label': label, 'variant': 'bar', 'color': '#6366f1'}}
def rating(label): return {'type': 'ratingBlock', 'attrs': {'value': 0, 'maxValue': 5, 'style': 'star', 'label': label}}
def counter(val, label, target=None): return {'type': 'counterBlock', 'attrs': {'value': val, 'label': label, 'target': target, 'color': '#6366f1'}}

def gen_kanban_cols(names):
    return [{'id': str(uuid.uuid4()), 'title': n, 'cards': []} for n in names]

def gen_timeline_entries(names):
    return [{'id': str(uuid.uuid4()), 'date': 'TBD', 'title': n, 'description': '', 'color': '#6366f1'} for n in names]

templates = []

# --- Language Learning (8) ---
templates.append({
    'name': 'Vocabulary Flashcard Deck', 'category': 'language_learning', 'desc': 'Flashcard blocks organized by difficulty',
    'blocks': ['flashcardBlock', 'decorativeDivider'],
    'content': [h1('Vocabulary Deck'), divider(), p('Add your flashcards below.')]
})
templates.append({
    'name': 'Grammar Rules Reference', 'category': 'language_learning', 'desc': 'Sections with callouts, color-coded',
    'blocks': ['calloutBlock', 'decorativeDivider'],
    'content': [h1('Grammar Rules'), divider(), h2('Present Tense'), p('Rule details here...')]
})
templates.append({
    'name': 'Reading Comprehension', 'category': 'language_learning', 'desc': 'Split layout: text on left, notes on right',
    'blocks': ['bentoGrid', 'calloutBlock'],
    'content': [h1('Reading Comprehension'), p('Add text and vocabulary analysis here.')]
})
templates.append({
    'name': 'Listening Practice Log', 'category': 'language_learning', 'desc': 'Audio blocks + transcripts',
    'blocks': ['audioTranscriptBlock', 'progressTracker'],
    'content': [h1('Listening Practice'), progress(0, 'Accuracy'), p('Upload audio and practice.')]
})
templates.append({
    'name': 'Writing Practice', 'category': 'language_learning', 'desc': 'Prompt section + writing area',
    'blocks': ['calloutBlock', 'ratingBlock'],
    'content': [h1('Writing Practice'), h2('Prompt'), p('Write about your day.'), divider(), h2('Self Review'), rating('Grammar Accuracy')]
})
templates.append({
    'name': 'Conversation Practice', 'category': 'language_learning', 'desc': 'Dialog format with role sections',
    'blocks': ['calloutBlock', 'timelineBlock'],
    'content': [h1('Conversation Script'), p('Role A: Hello'), p('Role B: Hi')]
})
templates.append({
    'name': 'Language Exchange Journal', 'category': 'language_learning', 'desc': 'Date entries with what I learned',
    'blocks': ['timelineBlock', 'decorativeDivider'],
    'content': [h1('Exchange Journal'), timeline(gen_timeline_entries(['Session 1', 'Session 2']))]
})
templates.append({
    'name': 'TOEFL/IELTS Prep', 'category': 'language_learning', 'desc': 'Study plan with timer widgets',
    'blocks': ['progressTracker', 'counterBlock', 'kanbanBlock'],
    'content': [h1('TOEFL/IELTS Plan'), progress(20, 'Overall Readiness'), kanban(gen_kanban_cols(['To Study', 'Practicing', 'Mastered']))]
})

# --- Academic Study (8) ---
templates.append({
    'name': 'Lecture Notes', 'category': 'academic', 'desc': 'Cornell layout with auto-TOC',
    'blocks': ['calloutBlock', 'decorativeDivider'],
    'content': [h1('Lecture Title'), h2('Cues'), p('...'), h2('Notes'), p('...'), h2('Summary'), p('...')]
})
templates.append({
    'name': 'Research Paper Outline', 'category': 'academic', 'desc': 'Structured academic sections',
    'blocks': ['kanbanBlock', 'progressTracker'],
    'content': [h1('Paper Outline'), progress(10, 'Draft Progress'), h2('Abstract'), p('...'), h2('Intro'), p('...')]
})
templates.append({
    'name': 'Study Guide Builder', 'category': 'academic', 'desc': 'Sections per topic with flashcard/quiz blocks',
    'blocks': ['flashcardBlock', 'ratingBlock'],
    'content': [h1('Study Guide'), h2('Topic 1'), rating('Confidence Level')]
})
templates.append({
    'name': 'Exam Prep Worksheet', 'category': 'academic', 'desc': 'Questions with toggle-reveal answers',
    'blocks': ['toggleBlock', 'progressTracker'],
    'content': [h1('Exam Prep'), progress(0, 'Questions Answered'), p('Q1: What is...?')]
})
templates.append({
    'name': 'Lab Report', 'category': 'academic', 'desc': 'Data table + chart blocks',
    'blocks': ['table', 'calloutBlock'],
    'content': [h1('Lab Report: [Title]'), h2('Objective'), p('...'), h2('Data'), p('[Table]')]
})
templates.append({
    'name': 'Literature Review Matrix', 'category': 'academic', 'desc': 'Table with comparison columns',
    'blocks': ['table', 'decorativeDivider'],
    'content': [h1('Lit Review Matrix'), p('Compare papers below.')]
})
templates.append({
    'name': 'Thesis Planner', 'category': 'academic', 'desc': 'Chapter outline with progress tracking',
    'blocks': ['progressTracker', 'timelineBlock'],
    'content': [h1('Thesis Planner'), progress(15, 'Total Progress'), timeline(gen_timeline_entries(['Ch1', 'Ch2', 'Ch3']))]
})
templates.append({
    'name': 'Group Project Planner', 'category': 'academic', 'desc': 'Task lists + assignments',
    'blocks': ['kanbanBlock', 'counterBlock'],
    'content': [h1('Group Project'), counter(0, 'Tasks Completed', 10), kanban(gen_kanban_cols(['To Do', 'Doing', 'Done']))]
})

# --- Research & Knowledge (6) ---
templates.append({'name': 'Research Log', 'category': 'research', 'desc': 'Daily entries with hypotheses', 'blocks': ['timelineBlock', 'calloutBlock'], 'content': [h1('Research Log'), timeline(gen_timeline_entries(['Day 1', 'Day 2']))]})
templates.append({'name': 'Zettelkasten Note', 'category': 'research', 'desc': 'Bidirectional link-focused', 'blocks': ['decorativeDivider'], 'content': [h1('Concept Name'), p('Connections: ...')]})
templates.append({'name': 'Literature Notes', 'category': 'research', 'desc': 'Citation format + key arguments', 'blocks': ['calloutBlock'], 'content': [h1('Paper Title'), h2('Key Arguments'), p('...')]})
templates.append({'name': 'Knowledge Base Article', 'category': 'research', 'desc': 'Wiki-style with TOC', 'blocks': ['calloutBlock'], 'content': [h1('Topic Overview'), h2('Details'), p('...')]})
templates.append({'name': 'Concept Map', 'category': 'research', 'desc': 'Bento grid with interconnected cards', 'blocks': ['bentoGrid'], 'content': [h1('Concept Map'), p('Map concepts here')]})
templates.append({'name': 'Annotated Bibliography', 'category': 'research', 'desc': 'Structured citation format', 'blocks': ['calloutBlock', 'ratingBlock'], 'content': [h1('Annotated Bib'), h2('Citation 1'), rating('Relevance'), p('Notes...')]})

# --- Project Management (6) ---
templates.append({'name': 'Project Dashboard', 'category': 'project_management', 'desc': 'Bento grid with status cards', 'blocks': ['bentoGrid', 'progressTracker', 'kanbanBlock'], 'content': [h1('Project Dashboard'), progress(40, 'Completion'), kanban(gen_kanban_cols(['Backlog', 'Active', 'Review']))]})
templates.append({'name': 'Sprint Planning', 'category': 'project_management', 'desc': 'Task lists grouped by priority', 'blocks': ['kanbanBlock', 'counterBlock'], 'content': [h1('Sprint 1'), counter(0, 'Points Burned', 50), kanban(gen_kanban_cols(['Todo', 'Doing', 'Done']))]})
templates.append({'name': 'Meeting Minutes', 'category': 'project_management', 'desc': 'Agenda + decisions', 'blocks': ['calloutBlock', 'decorativeDivider'], 'content': [h1('Weekly Sync'), h2('Agenda'), p('...'), h2('Action Items'), p('...') ]})
templates.append({'name': 'OKR Tracker', 'category': 'project_management', 'desc': 'Goal hierarchy with progress', 'blocks': ['progressTracker', 'timelineBlock'], 'content': [h1('Q3 OKRs'), h2('Objective 1'), progress(30, 'Key Result 1'), progress(60, 'Key Result 2')]})
templates.append({'name': 'Retrospective', 'category': 'project_management', 'desc': 'What went well / What to improve', 'blocks': ['kanbanBlock'], 'content': [h1('Sprint Retro'), kanban(gen_kanban_cols(['Went Well', 'Needs Improvement', 'Action Items']))]})
templates.append({'name': 'Product Requirements Doc', 'category': 'project_management', 'desc': 'Sections with requirement cards', 'blocks': ['calloutBlock', 'decorativeDivider'], 'content': [h1('PRD: Feature X'), h2('Background'), p('...'), h2('Requirements'), p('...')]})

# --- Content Creation (6) ---
templates.append({'name': 'Blog Post Draft', 'category': 'content_creation', 'desc': 'Hero image + structured sections', 'blocks': ['progressTracker', 'calloutBlock'], 'content': [h1('Blog Draft'), progress(50, 'Drafting Progress'), h2('Introduction'), p('...')]})
templates.append({'name': 'Social Media Planner', 'category': 'content_creation', 'desc': 'Calendar widget + content cards', 'blocks': ['kanbanBlock'], 'content': [h1('Social Media Pipeline'), kanban(gen_kanban_cols(['Ideas', 'Drafting', 'Scheduled', 'Published']))]})
templates.append({'name': 'YouTube Script', 'category': 'content_creation', 'desc': 'Scene-by-scene with timestamps', 'blocks': ['timelineBlock', 'calloutBlock'], 'content': [h1('Video Script'), timeline(gen_timeline_entries(['Intro', 'Main Point 1', 'Outro']))]})
templates.append({'name': 'Podcast Show Notes', 'category': 'content_creation', 'desc': 'Episode structure + links', 'blocks': ['decorativeDivider'], 'content': [h1('Ep 10: Topic'), h2('Timestamps'), p('0:00 Intro')]})
templates.append({'name': 'Newsletter Draft', 'category': 'content_creation', 'desc': 'Header + sections + CTA', 'blocks': ['calloutBlock', 'decorativeDivider'], 'content': [h1('Newsletter #42'), h2('Main Story'), p('...'), h2('Links'), p('...')]})
templates.append({'name': 'Portfolio Page', 'category': 'content_creation', 'desc': 'Profile card + project grid', 'blocks': ['bentoGrid', 'ratingBlock'], 'content': [h1('My Portfolio'), h2('Skills'), rating('React'), rating('Design')]})

# --- Personal (6) ---
templates.append({'name': 'Daily Journal', 'category': 'personal', 'desc': 'Date header + gratitude + reflection', 'blocks': ['ratingBlock', 'calloutBlock'], 'content': [h1('Daily Journal'), rating('Mood Today'), h2('Gratitude'), p('1. ...')]})
templates.append({'name': 'Weekly Review', 'category': 'personal', 'desc': 'Goals + accomplishments', 'blocks': ['kanbanBlock', 'progressTracker'], 'content': [h1('Weekly Review'), progress(80, 'Goal Completion'), p('What went well?')]})
templates.append({'name': 'Habit Tracker', 'category': 'personal', 'desc': 'Monthly grid with habit columns', 'blocks': ['counterBlock', 'table'], 'content': [h1('Habit Tracker'), counter(5, 'Days Active', 30), p('[Habit Table]')]})
templates.append({'name': 'Morning Routine', 'category': 'personal', 'desc': 'Visual step-by-step', 'blocks': ['timelineBlock'], 'content': [h1('Morning Routine'), timeline(gen_timeline_entries(['Wake up', 'Meditate', 'Exercise', 'Breakfast']))]})
templates.append({'name': 'Goal Setting', 'category': 'personal', 'desc': 'SMART goal sections', 'blocks': ['progressTracker', 'calloutBlock'], 'content': [h1('Yearly Goals'), h2('Goal 1'), progress(10, 'Progress')]})
templates.append({'name': 'Travel Planner', 'category': 'personal', 'desc': 'Itinerary sections + packing list', 'blocks': ['kanbanBlock', 'timelineBlock'], 'content': [h1('Trip to Paris'), timeline(gen_timeline_entries(['Day 1', 'Day 2'])), h2('Packing List'), kanban(gen_kanban_cols(['Clothes', 'Electronics', 'Docs']))]})

# --- Business (6) ---
templates.append({'name': 'Business Plan', 'category': 'business', 'desc': 'Exec summary + market analysis', 'blocks': ['calloutBlock', 'progressTracker'], 'content': [h1('Business Plan'), h2('Executive Summary'), p('...')]})
templates.append({'name': 'Competitive Analysis', 'category': 'business', 'desc': 'Comparison table + SWOT cards', 'blocks': ['bentoGrid', 'table'], 'content': [h1('Competitive Analysis'), h2('SWOT'), p('...')]})
templates.append({'name': 'Client Proposal', 'category': 'business', 'desc': 'Professional layout with pricing', 'blocks': ['decorativeDivider', 'table'], 'content': [h1('Proposal for [Client]'), p('We propose...')]})
templates.append({'name': 'Sales Pipeline', 'category': 'business', 'desc': 'Kanban-style deal tracking', 'blocks': ['kanbanBlock', 'counterBlock'], 'content': [h1('Q3 Sales Pipeline'), counter(15000, 'Pipeline Value', 50000), kanban(gen_kanban_cols(['Lead', 'Contacted', 'Proposal', 'Won']))]})
templates.append({'name': 'Marketing Campaign', 'category': 'business', 'desc': 'Campaign brief + metrics', 'blocks': ['progressTracker', 'timelineBlock'], 'content': [h1('Summer Campaign'), timeline(gen_timeline_entries(['Launch', 'Mid-point check', 'End']))]})
templates.append({'name': 'Invoice/Quote', 'category': 'business', 'desc': 'Professional formatted document', 'blocks': ['table', 'decorativeDivider'], 'content': [h1('Invoice #001'), divider(), p('Items...') ]})

# --- Creative (4) ---
templates.append({'name': 'Mood Board', 'category': 'creative', 'desc': 'Freeform with image blocks', 'blocks': ['bentoGrid'], 'content': [h1('Project Mood Board'), p('Add images here')]})
templates.append({'name': 'Design Brief', 'category': 'creative', 'desc': 'Requirements + references', 'blocks': ['calloutBlock', 'kanbanBlock'], 'content': [h1('Design Brief'), h2('Requirements'), p('...')]})
templates.append({'name': 'Story Outline', 'category': 'creative', 'desc': 'Act structure with scene cards', 'blocks': ['timelineBlock', 'kanbanBlock'], 'content': [h1('Story Outline'), timeline(gen_timeline_entries(['Act 1', 'Act 2', 'Act 3']))]})
templates.append({'name': 'Recipe Collection', 'category': 'creative', 'desc': 'Photo + ingredients + steps', 'blocks': ['ratingBlock', 'decorativeDivider'], 'content': [h1('Recipe Title'), rating('Difficulty'), h2('Ingredients'), p('...'), h2('Steps'), p('...')]})

ts_file_content = """import { NoteTemplate } from '../types/notes';

export const BUILT_IN_TEMPLATES: NoteTemplate[] = [
"""

import datetime
iso_date = datetime.datetime.now(datetime.timezone.utc).isoformat()

for i, t in enumerate(templates):
    json_str = json.dumps(wrap_page(t['content']))
    
    diff = ['beginner', 'intermediate', 'advanced'][i % 3]
    time_setup = ['1 min', '2 min', '5 min'][i % 3]
    tags = t['name'].lower().split(' ')[:2]
    
    ts_file_content += f"""  {{
    id: 'template-{i}',
    user_id: 'system',
    name: {repr(t['name'])},
    description: {repr(t['desc'])},
    mode: 'document',
    thumbnail: null,
    is_public: true,
    tags: {repr(tags)},
    category: {repr(t['category'])},
    usage_count: {100 + i * 17},
    created_at: {repr(iso_date)},
    updated_at: {repr(iso_date)},
    difficulty: '{diff}',
    estimated_setup_time: '{time_setup}',
    blocks_used: {repr(t['blocks'])},
    content_json: {json_str}
  }},
"""

ts_file_content += "];"

with open('frontend/src/lib/data/templates.ts', 'w', encoding='utf-8') as f:
    f.write(ts_file_content)

print('Generated templates.ts successfully!')
