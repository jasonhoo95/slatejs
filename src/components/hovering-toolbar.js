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


const HoveringMenuExample = ({ change, data, callback, focus, click, id, setDataCallback }) => {

  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const [clickKey, setClick] = useState(false);
  // const [value, setValue] = useState(text);
  let selection;
  const initialValue = [{
    type: 'paragraph', children: [
      {
        text: "a",
      },
    ],
  }];
  useEffect(() => {
    if (click) {
      ReactEditor.focus(editor);

      Transforms.select(editor, { path: [0, 0], offset: 0 })
    }


  }, [click])

  useEffect(() => {
    if (data.text && data.checkClick) {
      console.log(data.text.anchor.offset, "offset")

      ReactEditor.focus(editor);

      Transforms.select(editor, data.text)
    }


  }, [data])
  return (
    <>

      <Slate onChange={e => {
        selection = editor.selection;
        setDataCallback(selection, true)
        console.log(selection.anchor.offset, "offset");
      }} editor={editor} initialValue={initialValue}>
        <HoveringToolbar />
        <Editable
          style={{ padding: '8px' }}
          renderLeaf={props => <Leaf {...props} />}
          placeholder="Enter some text..."
          onFocus={e => {
            window.flutter_inappwebview?.callHandler("handlerFooWithArgs", "focus123");
          }}



          onKeyDown={e => {
            setClick(true)


            if (editor.selection.anchor.offset == 0 && (event.key == "ArrowLeft")) {
              ReactEditor.blur(editor);
              callback(editor.selection.anchor, id)
              console.log(editor.selection, "change anchor1");

            }

          }}

          onBlur={e => {
            if (clickKey) {
              setDataCallback(selection, false)

              setClick(false)
              console.log("offset", selection);

            }

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

export default HoveringMenuExample