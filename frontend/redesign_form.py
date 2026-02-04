import os

file_path = r"c:\ClickDev\ClickDev\frontend\components\employees\EmployeeDetails.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Target the General Details form block
# We look for the start and end of the block.
start_marker = "{(activeTab === 'general' && activeTable === '001') && ("
end_marker = "{/* End of max-w-xl container */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    # We want to replace everything inside the `&& (` ... `)`
    # actually the `end_marker` is OUTSIDE the block in my view file.
    # checking view file:
    # 764:                             )}
    # 765:                         </div>
    # 766:                         {/* End of max-w-xl container */}"
    
    # So we replace from `start_idx` to `end_idx` (exclusive of the comment).
    # But wait, we need to locate the closing `)}` before `</div>` before the comment.
    
    # Let's target the exact string of the OPENING line to be safe.
    
    # The replacement content:
    new_form_content = """{(activeTab === 'general' && activeTable === '001') && (
                                <div className="space-y-6 p-6 bg-[#fafafa] rounded shadow-sm border border-gray-100" dir="rtl">
                                    {(isEditing || isNew) && (
                                        <div className="mb-4 bg-yellow-50 p-2 border border-yellow-100 rounded">
                                            <ActionCodeSelector />
                                        </div>
                                    )}

                                    {/* GROUP 1: IDENTITY */}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">זיהוי עובד</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <DetailRow
                                                label="מספר עובד:"
                                                value={formData.employeeId}
                                                isEditMode={isNew}
                                                required
                                                onChange={(v) => handleInputChange('employeeId', v)}
                                            />
                                            <DetailRow
                                                label="מספר זהות:"
                                                value={formData.idNumber}
                                                isEditMode={isNew}
                                                required
                                                onChange={(v) => handleInputChange('idNumber', v)}
                                            />
                                            <DetailRow
                                                label="דרכון:"
                                                value={formData.passport}
                                                isEditMode={isNew}
                                                onChange={(v) => handleInputChange('passport', v)}
                                            />
                                        </div>
                                    </div>

                                    {/* GROUP 2: NAME INFO */}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">פרטי שם</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <DetailRow
                                                label="שם פרטי:"
                                                value={formData.firstName}
                                                isEditMode={isNew}
                                                required
                                                onChange={(v) => handleInputChange('firstName', v)}
                                            />
                                            <DetailRow
                                                label="שם משפחה:"
                                                value={formData.lastName}
                                                isEditMode={isNew}
                                                required
                                                onChange={(v) => handleInputChange('lastName', v)}
                                            />
                                            <DetailRow
                                                label="שם האב:"
                                                value={formData.fatherName}
                                                isEditMode={isEditing}
                                                onChange={(v) => handleInputChange('fatherName', v)}
                                            />
                                        </div>
                                    </div>

                                    {/* GROUP 3: PERSONAL DATES */}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">נתונים אישיים</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <DetailRow
                                                label="תאריך לידה:"
                                                value={formData.birthDate}
                                                info={calculateAge(formData.birthDate) ? `גיל: ${calculateAge(formData.birthDate)}` : undefined}
                                                isEditMode={isNew}
                                                required
                                                onChange={(v) => handleInputChange('birthDate', formatDate(v))}
                                            />
                                            {/* Future fields can go here without breaking grid */}
                                            <div className="hidden md:block col-span-2"></div>
                                        </div>
                                    </div>
                                </div>
                            )}"""

    # We replace the chunks.
    # Locate the closing tag logic is tricky.
    # I will look for `{(activeTab === 'general'` ... and replace until BEFORE `<div className="max-w-none">` closes?
    # Actually the replaced block is INSIDE `<div className="max-w-none">`.
    
    # Let's find exactly the chunk to replace.
    # It starts with `{(activeTab === 'general' && activeTable === '001') && (`
    # It ends with `)}` followed by `</div>` (closing the tab content wrapper? no, closing the if block).
    
    # We can use the start marker and just find the matching logic or approximate.
    # Since I know the content of the file from `view_file` (lines 707 to 764), I can construct the EXACT string to replace?
    # No, whitespace risk.
    
    # I'll rely on the `start_idx` and finding the next `)}` that closes it.
    # It's the first `)}` after the start marker that is followed by `</div>`.
    
    # Search for `)}` starting from start_idx inside the file.
    
    # Careful: there are nested `)}` potentially (e.g. `{(isEditing || isNew) && (...)`).
    # The valid closing `)}` for the block is at indentation level 28 (based on spaces).
    
    # Simpler: Search for the `</div>` that closes the container loop. Be careful.
    
    # Let's try to match the `end_marker` which is the comment `{/* End of max-w-xl container */}`.
    # The code BEFORE that is `</div>` then `)}` then `</div>`?
    
    # View file says:
    # 764:                             )}
    # 765:                         </div>
    # 766:                         {/* End of max-w-xl container */}"
    
    # So I want to replace everything from `start_marker` UP TO `end_marker`. 
    # But wait, `end_marker` is line 766.
    # `start_marker` is line 707.
    # The closing `</div>` (line 765) closes `<div className="max-w-none">` (line 705).
    # The `)}` (line 764) closes the block.
    
    # My replacement string INCLUDES the `start_marker` and the `)}`.
    # So I should verify if I can just confirm where `max-w-none` starts.
    
    # Logic: 
    # 1. content.replace(original_block, new_block)
    # But I don't have original block exact string.
    
    # 2. Slice replacement.
    # Start: `start_idx`
    # End: `content.find('</div>', start_idx)` (closes the inner div? There are many divs).
    
    # Let's use the comment `{/* End of max-w-xl container */}` as the Anchor for the END.
    # Count backwards from there.
    # 766: comment
    # 765: </div>
    # 764: )}
    
    # So `end_idx` = content.find(end_marker).
    # The text to replace ends at `end_idx` minus some whitespace and `</div>`.
    # Actually, I can just replace the whole inner part including `max-w-none` if I wanted, but that might be safer.
    
    pass

    # Safe strategy:
    # Find `start_marker`.
    # Find `end_marker`.
    # The text in between is what we want to replace... almost.
    # `start_marker` is inclusive.
    # `end_marker` is exclusive.
    # But `end_marker` is AFTER the `</div>` that closes the PARENT.
    # The parent is `max-w-none`.
    # The block `{(activeTab...)}` is INSIDE `max-w-none`.
    
    # So we want to replace `{(activeTab ... )}` block.
    # If I replace from `start_marker` to `end_marker` I will actully kill the `</div>` of `max-w-none`.
    # So I must RE-ADD the `</div>` in my replacement string if I overwrite it.
    
    # Let's do that. Replace from `start_marker` to `end_marker`.
    # New content will be `new_form_content` + `\n</div>`.
    
    final_replacement = new_form_content + "\n                        </div>"
    
    # The text to replace is content[start_idx : end_idx]
    # Check if `end_idx` starts with newline?
    
    original_chunk = content[start_idx:end_idx]
    
    # We replace it.
    content = content[:start_idx] + final_replacement + "\n                        " + content[end_idx:]
    
    print("Redesigned form successfully.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
