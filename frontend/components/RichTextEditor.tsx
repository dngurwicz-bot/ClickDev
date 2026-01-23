'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import {
    Bold, Italic, List, ListOrdered, Quote, Undo, Redo,
    Code, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight,
    Heading1, Heading2, Strikethrough
} from 'lucide-react'
import FontFamily from '@tiptap/extension-font-family'
import Highlight from '@tiptap/extension-highlight'
import { ColorSelector } from './editor/ColorSelector'
import { ImageUploader } from './editor/ImageUploader'
import { FontSelector } from './editor/FontSelector'
import { HighlightSelector } from './editor/HighlightSelector'

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    placeholder?: string
}

export default function RichTextEditor({ content, onChange, placeholder = 'התחל לכתוב...' }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Image,
            Underline,
            TextStyle,
            Color,
            FontFamily,
            Highlight.configure({ multicolor: true }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm md:prose-base lg:prose-lg max-w-none focus:outline-none min-h-[200px] px-8 py-6',
            },
        },
    })

    if (!editor) {
        return null
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)

        if (url === null) {
            return
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            {/* Professional Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">

                {/* History Group */}
                <div className="flex items-center gap-0.5 border-l pl-2 ml-1 border-gray-300">
                    <MenuButton
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        icon={<Undo className="w-4 h-4" />}
                        title="בטל"
                    />
                    <MenuButton
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        icon={<Redo className="w-4 h-4" />}
                        title="בצע שוב"
                    />
                </div>

                {/* Font & Format Group */}
                <div className="flex items-center gap-2 border-l pl-2 ml-1 border-gray-300">
                    <FontSelector editor={editor} />
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        isActive={editor.isActive('heading', { level: 1 })}
                        icon={<Heading1 className="w-4 h-4" />}
                        title="כותרת 1"
                    />
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive('heading', { level: 2 })}
                        icon={<Heading2 className="w-4 h-4" />}
                        title="כותרת 2"
                    />
                </div>

                {/* Text Style Group */}
                <div className="flex items-center gap-0.5 border-l pl-2 ml-1 border-gray-300">
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        icon={<Bold className="w-4 h-4" />}
                        title="מודגש"
                    />
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        icon={<Italic className="w-4 h-4" />}
                        title="נטוי"
                    />
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        isActive={editor.isActive('underline')}
                        icon={<UnderlineIcon className="w-4 h-4" />}
                        title="קו תחתי"
                    />
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        isActive={editor.isActive('strike')}
                        icon={<Strikethrough className="w-4 h-4" />}
                        title="קו חוצה"
                    />
                </div>

                {/* Color & Highlight Group */}
                <div className="flex items-center gap-1 border-l pl-2 ml-1 border-gray-300">
                    <ColorSelector editor={editor} />
                    <HighlightSelector editor={editor} />
                </div>

                {/* Alignment Group */}
                <div className="flex items-center gap-0.5 border-l pl-2 ml-1 border-gray-300 text-gray-600">
                    <MenuButton
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        isActive={editor.isActive({ textAlign: 'right' })}
                        icon={<AlignRight className="w-4 h-4" />}
                        title="יישור לימין"
                    />
                    <MenuButton
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        isActive={editor.isActive({ textAlign: 'center' })}
                        icon={<AlignCenter className="w-4 h-4" />}
                        title="מרכז"
                    />
                    <MenuButton
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        isActive={editor.isActive({ textAlign: 'left' })}
                        icon={<AlignLeft className="w-4 h-4" />}
                        title="יישור לשמאל"
                    />
                </div>

                {/* Lists Group */}
                <div className="flex items-center gap-0.5 border-l pl-2 ml-1 border-gray-300">
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        icon={<List className="w-4 h-4" />}
                        title="רשימה"
                    />
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        icon={<ListOrdered className="w-4 h-4" />}
                        title="רשימה ממוספרת"
                    />
                </div>

                {/* Insert Group */}
                <div className="flex items-center gap-1">
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        isActive={editor.isActive('blockquote')}
                        icon={<Quote className="w-4 h-4" />}
                        title="ציטוט"
                    />
                    <MenuButton
                        onClick={setLink}
                        isActive={editor.isActive('link')}
                        icon={<LinkIcon className="w-4 h-4" />}
                        title="קישור"
                    />
                    <ImageUploader editor={editor} />
                </div>

            </div>

            <EditorContent editor={editor} />

            {/* Character Count */}
            <div className="bg-gray-50 border-t p-2 text-xs text-gray-500 flex justify-end">
                {editor.storage.characterCount?.characters() || 0} תווים
            </div>
        </div>
    )
}

const UnderlineIcon = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M6 4v6a6 6 0 0 0 12 0V4" />
        <line x1="4" x2="20" y1="20" y2="20" />
    </svg>
)

interface MenuButtonProps {
    onClick: () => void
    isActive?: boolean
    icon: React.ReactNode
    title?: string
    size?: 'sm' | 'md'
    disabled?: boolean
}

const MenuButton = ({ onClick, isActive, icon, title, size = 'md', disabled }: MenuButtonProps) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`
      rounded transition-all flex items-center justify-center
      ${size === 'sm' ? 'p-1' : 'p-2'}
      ${isActive
                ? 'bg-primary/10 text-primary'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
      ${disabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''}
    `}
        title={title}
        type="button"
    >
        {icon}
    </button>
)
