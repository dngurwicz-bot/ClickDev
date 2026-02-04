import os

file_path = r"c:\ClickDev\ClickDev\frontend\components\employees\EmployeeDetails.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix Title Color
old_title_style = 'text-[#1a237e]'
new_title_style = 'text-gray-900 font-bold' # Making it standard black/gray
if old_title_style in content:
    content = content.replace(old_title_style, new_title_style)
    print("Fixed title style")
else:
    print("Title style not found")

# 2. Remove Buttons
# We search for the block containing the buttons to remove.
# The block starts around line 576. 
# We can look for specific unique strings.

target_buttons_start = '{/* 2. ACTION TOOLBAR (Gray Strip) */}'
# We want to keep the "More Horizontal" button but remove the "Salary" and "Building" buttons.
# The buttons are: 
# <Button variant="ghost" ... > ... <span>נתוני שכר לעובד</span> ... </Button>
# <Button variant="ghost" ... > ... <span>שינוי חברה לעובד</span> ... </Button>
# <div className="h-4 w-px bg-gray-300 mx-1" />

# Let's try to locate the container logic.
container_start_marker = '<div className="flex items-center gap-2">'
# There are multiple of these. The one in ACTION TOOLBAR is inside the div with `{/* 2. ACTION TOOLBAR ... */}`

start_toolbar_idx = content.find(target_buttons_start)
if start_toolbar_idx != -1:
    # Look for the immediate next <div class="flex items-center gap-2">
    toolbar_inner_start = content.find(container_start_marker, start_toolbar_idx)
    if toolbar_inner_start != -1:
        # The content to REPLACE is everything inside this div UNTIL the "MoreHorizontal" button.
        # But wait, looking at the file (lines 575-591 in previous view), the buttons are INSIDE this div.
        # We want to KEEP the div, but replace its content.
        
        # Correct content should only be the "Actions" button.
        
        replacement_inner_html = """
                     {/* Standard Actions Only */}
                     <Button variant="ghost" className="h-7 px-2 text-gray-600 hover:bg-gray-100 gap-1 text-xs font-normal rounded-sm">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                        <span>פעולות</span>
                     </Button>
                """
        
        # We need to find where the "MoreHorizontal" button starts in the CURRENT content to verify we are replacing safely?
        # OR just identifying the start and end of the block to remove.
        
        # The block to remove starts after `gap-2">` and ends before `<Button variant="ghost" ...> <MoreHorizontal`.
        # Actually it also includes the divider.
        
        # Let's try replacing the entire block of buttons if we can match it string-wise.
        # It's risky with whitespace.
        
        # Strategy: matching the known unwanted strings and replacing them with empty strings?
        # <Button ...> ... <span>נתוני שכר לעובד</span> ... </Button>
        # This spans multiple lines.
        
        # Let's use specific unique anchor substrings to cut them out.
        
        salary_btn_snippet = '<span>נתוני שכר לעובד</span>'
        company_btn_snippet = '<span>שינוי חברה לעובד</span>'
        
        # Verify existence
        if salary_btn_snippet in content and company_btn_snippet in content:
            # We will reconstruct the toolbar section entirely. 
            # From `start_toolbar_idx` to `div className="flex items-center gap-2"` (right side actions)
            
            # Find the END of the left-side toolbar div.
            # It ends before `<div className="flex items-center gap-2">` (the printer icons).
            
            # This is hard to robustly parse without a parser.
            
            # Alternative: Just READ the file lines, identifying lines to skip?
            # LINES TO SKIP:
            # - The FileText (Salary) button block
            # - The Building2 (Company) button block
            # - The divider div
            
            # I'll re-read the file line by line and filter out lines containing specific unique keywords if they are within the expected range.
            
            lines = content.splitlines()
            new_lines = []
            skip_mode = False
            
            # Range approx 570-600
            # Keywords to trigger skip: '<span>נתוני שכר לעובד</span>' ? No, that's inside the button.
            # keyword: 'FileText' inside a Button? 
            
            for i, line in enumerate(lines):
                # Check for the start of the buttons we want to remove
                if '<span>נתוני שכר לעובד</span>' in line:
                    # We are INSIDE the first button. We need to have started skipping BEFORE this.
                    pass 
                
                # Logic: Build a new list of lines.
                # If a line contains specific unique unwanted content, don't add it?
                # The button is multiline.
                
                # Let's do a replace on the huge chunk if possible.
                pass
            
            # Let's try the replace string method which is safer if I can construct the string from the previous `view_file` output exactly.
            # I can copy paste the previous view output into this script as the "target".
            
            target_chunk = """                     <Button variant="ghost" className="h-7 px-2 text-[#1f497d] hover:bg-[#e3f2fd] gap-1.5 text-xs font-bold rounded-sm border border-transparent hover:border-[#bbdefb]">
                        <FileText className="w-3.5 h-3.5" />
                        <span>נתוני שכר לעובד</span>
                     </Button>
                     <Button variant="ghost" className="h-7 px-2 text-[#1f497d] hover:bg-[#e3f2fd] gap-1.5 text-xs font-bold rounded-sm border border-transparent hover:border-[#bbdefb]">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>שינוי חברה לעובד</span>
                     </Button>
                     
                     <div className="h-4 w-px bg-gray-300 mx-1" />
"""
            # We need to normalize whitespace/newlines to match.
            # Or just use the fact I have the full file content.
            
            # Let's simple-find the chunks.
            
            p1 = content.find('<span>נתוני שכר לעובד</span>')
            if p1 != -1:
                # Find start of that button
                # Search backwards for <Button from p1
                btn1_start = content.rfind('<Button', 0, p1)
                
                p2 = content.find('<span>שינוי חברה לעובד</span>')
                btn2_start = content.rfind('<Button', 0, p2)
                
                # We want to remove from btn1_start to... where?
                # The divider is after btn2.
                # `<div className="h-4 w-px bg-gray-300 mx-1" />`
                
                divider_txt = 'bg-gray-300 mx-1'
                div_loc = content.find(divider_txt)
                if div_loc != -1:
                    div_end = content.find('/>', div_loc) + 2
                    
                    # So we remove from btn1_start to div_end ? 
                    # And maybe some whitespace around it.
                    
                    # Let's verify order: btn1 < btn2 < div
                    if btn1_start < btn2_start < div_loc:
                        # Good.
                        # We remove content[btn1_start : div_end]
                        # And replace with empty string or comment.
                        
                        to_remove = content[btn1_start:div_end]
                        print(f"Removing chunk of length {len(to_remove)}")
                        content = content.replace(to_remove, "{/* Removed irrelevant actions */}")
                        print("Removed buttons and divider")
                    else:
                        print("Order check failed")
                else:
                    print("Divider not found")
            else:
                print("Button 1 not found")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated file")
