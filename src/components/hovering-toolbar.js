import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Slate, Editable, withReact, useSlate, useFocused, ReactEditor } from 'slate-react'
import {
  Editor,
  Transforms,
  Text,
  createEditor,
  Descendant,
  Range,
} from 'slate'
import { css } from '@emotion/css'
import { withHistory } from 'slate-history'


const HoveringMenuExample = ({ callback, focus, editor1, children, setFocusCallback }) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  // const [focusnow, setFocus] = useState(false);
  useEffect(() => {
    if (focus) {
      ReactEditor.focus(editor);
      Transforms.select(editor, { path: [0, 0], offset: 1 })
    }
    console.log("focus now", focus);


  }, [focus])
  let focusnow;
  return (
    <>
      {children}

      <Slate editor={editor} initialValue={initialValue}>
        <HoveringToolbar />
        <Editable
          style={{ padding: '8px' }}
          renderLeaf={props => <Leaf {...props} />}
          placeholder="Enter some text..."
          onFocus={e => {

            window.flutter_inappwebview?.callHandler("handlerFooWithArgs", "focus123");
          }}
          onKeyDown={e => {
            if (editor.selection.anchor.offset == 0 && (event.key == "ArrowLeft" || event.key == "ArrowRight")) {
              ReactEditor.blur(editor);
              callback(editor.selection.anchor)
              console.log(editor.selection, "change anchor1");

            }

          }}

          onBlur={e => {
            setFocusCallback(false)
          }}
          onDOMBeforeInput={(event) => {
            switch (event.inputType) {
              case 'formatBold':
                event.preventDefault()
                return toggleMark(editor, 'bold')
              case 'formatItalic':
                event.preventDefault()
                return toggleMark(editor, 'italic')
              case 'formatUnderline':
                event.preventDefault()
                return toggleMark(editor, 'underlined')
            }
          }}
        />

      </Slate>
    </>
  )
}

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underlined) {
    children = <u>{children}</u>
  }

  return <span {...attributes}>{children}</span>
}

const HoveringToolbar = () => {
  const ref = useRef()
  const editor = useSlate()
  const inFocus = useFocused()

  useEffect(() => {
    const el = ref.current
    const { selection } = editor

    if (!el) {
      return
    }

    if (
      !selection ||
      !inFocus ||
      Range.isCollapsed(selection) ||
      Editor.string(editor, selection) === ''
    ) {
      el.removeAttribute('style')
      return
    }

    const domSelection = window.getSelection()
    const domRange = domSelection.getRangeAt(0)
    const rect = domRange.getBoundingClientRect()
    el.style.opacity = '1'
    el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`
    el.style.left = `${rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
      }px`
  })

  return (
    <div
      ref={ref}
      className={css`
          padding: 8px 7px 6px;
          position: absolute;
          z-index: 1;
          top: -10000px;
          left: -10000px;
          margin-top: -6px;
          opacity: 0;
          background-color: #222;
          border-radius: 4px;
          transition: opacity 0.75s;
        `}
      onMouseDown={e => {
        // prevent toolbar from taking focus away from editor
        e.preventDefault()
      }}
    >
      <FormatButton format="bold" icon="format_bold" />
      <FormatButton format="italic" icon="format_italic" />
      <FormatButton format="underlined" icon="format_underlined" />
    </div>
  )
}

const FormatButton = ({ format, icon }) => {
  const editor = useSlate()
  return (
    <div
      onClick={() => toggleMark(editor, format)}
    >
      <span>{icon}</span>
    </div>
  )
}

const initialValue = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'asd',
      },

    ],
  },

]

export default HoveringMenuExample