import re

content = """  if (!note) return null;

  const hasCover = !!ui.cover_image_url;
  const headerStyle = ui.header_style || 'default';

  const renderCoverAndIcon = () => {
    if (headerStyle === 'minimal') return null;
    
    if (headerStyle === 'banner') {
      return (
        <div className="w-full h-16 md:h-20 relative shrink-0">
          {ui.cover_image_url ? (
             <CoverImage
              coverUrl={ui.cover_image_url}
              positionY={ui.cover_position_y}
              onChangeCover={() => setShowCoverPicker(true)}
              onRemoveCover={handleRemoveCover}
              onRepositionY={handleRepositionY}
              isBanner={true}
            />
          ) : (
             <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-end px-4">
               <button onClick={() => setShowCoverPicker(true)} className="text-xs font-medium text-slate-500 hover:text-slate-800"><ImagePlus className="w-4 h-4 inline mr-1"/> Add Banner</button>
             </div>
          )}
        </div>
      );
    }

    if (headerStyle === 'hero') {
       return (
        <div className="w-full h-64 md:h-80 relative shrink-0">
          <CoverImage
            coverUrl={ui.cover_image_url || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}
            positionY={ui.cover_position_y}
            onChangeCover={() => setShowCoverPicker(true)}
            onRemoveCover={handleRemoveCover}
            onRepositionY={handleRepositionY}
            isHero={true}
          />
        </div>
       );
    }

    // Default & Split (Split handles cover differently, but we render it here to let flex do its job later if needed)
    return (
      <>
        <CoverImage
          coverUrl={ui.cover_image_url}
          positionY={ui.cover_position_y}
          onChangeCover={() => setShowCoverPicker(true)}
          onRemoveCover={handleRemoveCover}
          onRepositionY={handleRepositionY}
        />
        {(headerStyle === 'default') && (
          <PageIcon
            icon={ui.icon}
            subjectColor={linkedSubjects[0]?.color}
            onChangeIcon={handleChangeIcon}
            hasCover={hasCover}
          />
        )}
      </>
    );
  };

  const renderTitleRow = () => {
    return (
      <div className="flex items-start gap-3 w-full">
        {headerStyle === 'banner' && (
           <div className="shrink-0 mt-1">
              <PageIcon icon={ui.icon} subjectColor={linkedSubjects[0]?.color} onChangeIcon={handleChangeIcon} hasCover={false} isInline={true} />
           </div>
        )}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Note"
          readOnly={ui.is_locked}
          className={`flex-1 font-bold bg-transparent focus:outline-none leading-tight ${
            headerStyle === 'hero' ? 'text-4xl lg:text-5xl text-white drop-shadow-lg placeholder-white/50' : 
            headerStyle === 'minimal' ? 'text-2xl lg:text-3xl text-slate-800 dark:text-slate-100 placeholder-slate-300' :
            'text-3xl lg:text-4xl text-slate-800 dark:text-slate-100 placeholder-slate-350 dark:placeholder-slate-500'
          }`}
        />
        {headerStyle !== 'hero' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowHistory(!showHistory); setShowSettings(false); }}
              className={`mt-2 p-2 rounded-xl border transition-all shrink-0 ${
                showHistory
                  ? 'bg-violet-600/10 dark:bg-violet-500/15 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-300 font-semibold'
                  : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Version History"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowSettings(!showSettings); setShowHistory(false); }}
              className={`mt-2 p-2 rounded-xl border transition-all shrink-0 ${
                showSettings
                  ? 'bg-indigo-600/10 dark:bg-indigo-500/15 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 font-semibold'
                  : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Note settings"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`relative shrink-0 z-[60] flex ${headerStyle === 'split' ? 'flex-row-reverse items-stretch' : 'flex-col'}`}>
      {headerStyle === 'split' && hasCover && (
        <div className="w-1/3 min-w-[200px] shrink-0 border-l border-slate-200 dark:border-slate-800 relative">
          <CoverImage
            coverUrl={ui.cover_image_url}
            positionY={ui.cover_position_y}
            onChangeCover={() => setShowCoverPicker(true)}
            onRemoveCover={handleRemoveCover}
            onRepositionY={handleRepositionY}
            isSplit={true}
          />
        </div>
      )}

      <div className={`flex-1 relative ${headerStyle === 'hero' ? '-mb-12' : ''}`}>
        {headerStyle !== 'split' && renderCoverAndIcon()}
        
        {showCoverPicker && (
          <div className="px-6 md:px-16 lg:px-24 relative z-[130]">
            <CoverPickerModal
              onSelect={handleCoverSelect}
              onClose={() => setShowCoverPicker(false)}
            />
          </div>
        )}

        {headerStyle === 'split' && (
           <div className="px-6 md:px-16 lg:px-24 pt-8">
             <PageIcon icon={ui.icon} subjectColor={linkedSubjects[0]?.color} onChangeIcon={handleChangeIcon} hasCover={false} />
           </div>
        )}

        <div className={`px-6 md:px-16 lg:px-24 ${headerStyle === 'hero' ? 'absolute inset-0 flex flex-col justify-end pb-8' : 'pt-3 pb-4'}`}>
          {headerStyle !== 'hero' && headerStyle !== 'minimal' && headerStyle !== 'split' && (
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => setActiveNote(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-650 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-sm group"
              >
                <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition-transform" />
                Quay lại
              </button>
            </div>
          )}

          {!hasCover && headerStyle !== 'minimal' && headerStyle !== 'banner' && headerStyle !== 'split' && (
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setShowCoverPicker(true)}
                className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group font-semibold"
              >
                <ImagePlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Add cover</span>
              </button>
            </div>
          )}

          {renderTitleRow()}
          
          {headerStyle === 'hero' && (
             <div className="absolute top-4 left-4 md:left-16 lg:left-24">
                <button onClick={() => setActiveNote(null)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-black/30 hover:bg-black/50 text-white rounded-xl backdrop-blur-md transition-colors font-medium"><ArrowLeft className="w-4 h-4"/> Quay lại</button>
             </div>
          )}
          {headerStyle === 'hero' && (
             <div className="absolute top-4 right-4 md:right-16 lg:right-24 flex gap-2">
               <button onClick={() => { setShowHistory(!showHistory); setShowSettings(false); }} className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-xl backdrop-blur-md transition-colors"><History className="w-4 h-4"/></button>
               <button onClick={() => { setShowSettings(!showSettings); setShowHistory(false); }} className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-xl backdrop-blur-md transition-colors"><MoreHorizontal className="w-4 h-4"/></button>
             </div>
          )}

          {/* Property Bar */}
          <div className={`flex flex-wrap items-center gap-3 mt-4 py-2.5 border-t border-b ${headerStyle === 'hero' ? 'border-white/20 text-white/90' : 'border-slate-100 dark:border-slate-800 text-slate-500'} z-50 text-xs`}>
            {/* Status pill */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl shadow-sm transition-all cursor-pointer ${
                  headerStyle === 'hero' ? 'bg-black/20 border-white/20 text-white backdrop-blur-sm hover:bg-black/30' :
                  note.status === 'in_progress'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-750 dark:bg-indigo-950/40 dark:text-indigo-300 hover:bg-indigo-100'
                    : note.status === 'reviewed'
                    ? 'bg-emerald-55 border-emerald-200 text-emerald-750 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                    : note.status === 'archived'
                    ? 'bg-amber-55 border-amber-200 text-amber-750 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100'
                    : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <span className="font-semibold capitalize">Status: {note.status ? note.status.replace('_', ' ') : 'Draft'}</span>
              </button>
              {activeDropdown === 'status' && (
                <div ref={dropdownRef} className="absolute left-0 mt-1.5 w-40 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-[70]">
                  {['draft', 'in_progress', 'reviewed', 'archived'].map(st => (
                    <button
                      key={st}
                      onClick={() => handlePropertyUpdate('status', st)}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors capitalize ${note.status === st ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Type pill */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'note_type' ? null : 'note_type')}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl shadow-sm transition-all cursor-pointer ${headerStyle === 'hero' ? 'bg-black/20 border-white/20 text-white backdrop-blur-sm hover:bg-black/30' : 'bg-white border-slate-200 text-slate-750 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
              >
                <span className="font-semibold capitalize">Type: {note.note_type ? note.note_type.replace('_', ' ') : 'None'}</span>
              </button>
              {activeDropdown === 'note_type' && (
                <div ref={dropdownRef} className="absolute left-0 mt-1.5 w-44 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-[70]">
                  {['lecture', 'reading', 'problem_set', 'essay', 'lab_report'].map(nt => (
                    <button
                      key={nt}
                      onClick={() => handlePropertyUpdate('note_type', nt)}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors capitalize ${note.note_type === nt ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      {nt.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority pill */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'priority' ? null : 'priority')}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl shadow-sm transition-all cursor-pointer ${
                  headerStyle === 'hero' ? 'bg-black/20 border-white/20 text-white backdrop-blur-sm hover:bg-black/30' :
                  note.priority === 'high'
                    ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100'
                    : note.priority === 'medium'
                    ? 'bg-amber-50 border-amber-200 text-amber-755 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100'
                    : note.priority === 'low'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-755 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                    : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <span className="font-semibold capitalize">Priority: {note.priority || 'None'}</span>
              </button>
              {activeDropdown === 'priority' && (
                <div ref={dropdownRef} className="absolute left-0 mt-1.5 w-36 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-[70]">
                  {['low', 'medium', 'high'].map(pr => (
                    <button
                      key={pr}
                      onClick={() => handlePropertyUpdate('priority', pr)}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors capitalize ${note.priority === pr ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className={`w-px h-4 hidden sm:inline ${headerStyle === 'hero' ? 'bg-white/30' : 'bg-slate-200 dark:bg-slate-800'}`} />

            {/* Tags list */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {note.tags?.map(tag => (
                <span
                  key={tag.id}
                  style={{ backgroundColor: `${tag.color}15`, borderColor: `${tag.color}40`, color: headerStyle === 'hero' ? 'white' : tag.color }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border font-medium select-none"
                >
                  <span>{tag.name}</span>
                  <button
                    onClick={() => handleToggleTag(tag.id)}
                    className="hover:bg-black/10 rounded-full p-0.5 text-xs transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* Add tag dropdown */}
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'tags' ? null : 'tags')}
                  className={`flex items-center gap-1 px-2.5 py-1 border border-dashed rounded-full cursor-pointer font-medium ${headerStyle === 'hero' ? 'border-white/40 hover:bg-white/10 text-white' : 'border-slate-350 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                  <span>+ Add tag</span>
                </button>
                {activeDropdown === 'tags' && (
                  <div ref={dropdownRef} className="absolute left-0 mt-1.5 w-56 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl p-2 z-[70] space-y-2 text-slate-800 dark:text-slate-200">
                    <input
                      type="text"
                      placeholder="Search/Create tag..."
                      value={tagSearch}
                      onChange={e => setTagSearch(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-0.5">
                      {allTags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())).map(t => {
                        const isLinked = note.tags?.some(tag => tag.id === t.id);
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleToggleTag(t.id)}
                            className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-slate-750 dark:text-slate-300 font-medium"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                              {t.name}
                            </span>
                            {isLinked && <span className="text-indigo-650 font-bold">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    {tagSearch.trim() && !allTags.some(t => t.name.toLowerCase() === tagSearch.toLowerCase().trim()) && (
                      <button
                        onClick={handleCreateNewTag}
                        className="w-full text-center py-1.5 text-xs font-semibold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
                      >
                        Create tag "{tagSearch.trim()}"
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <MicroAnalyticsBar
            editor={editor ?? null}
            linkedSubjects={linkedSubjects}
            linkedTasks={linkedTasks}
          />
        </div>
      </div>

      {showSettings && (
        <NoteSettingsPanel
          noteId={noteId}
          onClose={() => setShowSettings(false)}
          onOpenCoverPicker={() => { setShowCoverPicker(true); setShowSettings(false); }}
          readingMode={readingMode}
          focusMode={focusMode}
          onToggleReadingMode={onToggleReadingMode}
          onToggleFocusMode={onToggleFocusMode}
          editor={editor}
        />
      )}

      {showHistory && (
        <VersionHistoryPanel
          noteId={noteId}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
});

EditorHeader.displayName = 'EditorHeader';
"""

with open(r"d:\Personal_Project\AI_StudyFlow\frontend\src\components\features\notes\EditorHeader.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = re.sub(r'  if \(\!note\) return null;.*$', content, text, flags=re.DOTALL)

with open(r"d:\Personal_Project\AI_StudyFlow\frontend\src\components\features\notes\EditorHeader.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("done")
