import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import isUrl from 'is-url';

import isHotkey from 'is-hotkey';
import { useSelector, useDispatch } from 'react-redux';
import { css } from '@emotion/css';
import { v4 } from 'uuid';
import { Editable, withReact, useSlate, Slate, ReactEditor, useSelected, useFocused } from 'slate-react';
import { Editor, Transforms, createEditor, Path, Descendant, Element as SlateElement, Node as SlateNode, Text, Range, Node, Point, setPoint } from 'slate';
import { withHistory, HistoryEditor, History } from 'slate-history';
import { useBearStore, useAuthStore } from '@/globals/authStorage';
import PlainTextExample from './plainText';
import { useModalStore } from '@/globals/zustandGlobal';
import EditablePopup from './editablePopup';
import _, { keyBy } from 'lodash';
import next from 'next';
import SlateReact from './slateReact';
import { Transform } from 'stream';
import { setSlateCheck } from '@/globals/counterSlice';

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
};

const LIST_TYPES = ['numbered-list', 'bulleted-list', 'list-item'];
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];
const FORMAT_TYPES = ['bold', 'italic', 'underline'];
const FORMAT_NONE = ['numbered-list', 'paragraph'];
let backwardCheck = false;

let leftCheck = false;
let rightCheck = false;
let blurCheck = 'false';
let anchorPoint;
let editorNow;
// let focusCheck = false;
const initialValue = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'a',
      },
    ],
  },

  {
    type: 'paragraph',
    children: [
      {
        text: 'aasd ad asd asd a da',
      },
    ],
  },
];
function getCaretCoordinates() {
  let x = 0,
    y = 0;
  const isSupported = typeof window.getSelection !== 'undefined';
  if (isSupported) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      return;
    }
    const range = sel.getRangeAt(0);
    // we can still workaround the default behavior too
    const rects = range.getClientRects();
    if (!rects.length) {
      if (range.startContainer && range.collapsed) {
        range.selectNodeContents(range.startContainer);
      }
    }

    let position = range.getBoundingClientRect();
    const char_before = range.startContainer.textContent;

    x = position.x;
    y = position.y + window.scrollY - 100;
    anchorPoint = y;
    if (y > 0) {
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
  // return { x, y };
}
const SlateMobile = ({ keyID, tableID, focusCheck, path }) => {
  let id = v4();
  let updateAmount = useModalStore((state) => state.updateModal);
  const slateObject = useSelector((state) => state.counter.slateObject);
  const dispatch = useDispatch();

  const [focus, setFocus] = useState(true);
  const ModalProps = useModalStore((state) => state.amount);
  const contentEditableRef = useRef(null);

  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const editor = useMemo(() => withInlines(withReact(withHistory(createEditor()))), []);
  const { deleteFragment, deleteBackward, onChange, insertText } = editor;

  const { insertBreak } = editor;
  const savedSelection = React.useRef(editor.selection);


  const handleDOMBeforeInput = useCallback((e) => {
    queueMicrotask(() => {
      const pendingDiffs = ReactEditor.androidPendingDiffs(editor);

      const scheduleFlush = pendingDiffs?.some(({ diff, path }) => {
        const block = Editor.above(editor, {
          match: (n) => Editor.isVoid(editor, n),
        });
        const table = Editor.nodes(editor, {
          match: (n) => n.type === 'table-cell1',
        });
        const ua = navigator.userAgent;
        const [startPoint, endPoint] = Range.edges(editor.selection);
        const edges = [startPoint.path, endPoint.path];

        if (block) {
          return true;
        }

        if (table && (edges[0][1] != edges[1][1] || edges[0][0] != edges[1][0])) {
          // ReactEditor.blur(editor);
          return false;
        }

        if (!diff.text.endsWith(' ')) {
          return false;
        }

        const { text } = SlateNode.leaf(editor, path);

        const blockEntry = Editor.above(editor, {
          at: path,
          match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        });
        if (!blockEntry) {
          return false;
        }

        const [, blockPath] = blockEntry;
        return Editor.isStart(editor, Editor.start(editor, path), blockPath);
      });

      if (scheduleFlush) {
        ReactEditor.androidScheduleFlush(editor);
      }
    });
  }, []);



  useEffect(() => {
    window.addEventListener('message', function (event) {
      if (event.data == 'bold') {
        toggleMark(editor, 'bold');
      } else if (event.data == 'blur') {
        window.scrollTo(0, 0);
        ReactEditor.blur(editor);
        this.window.removeEventListener('message', this);
        window.flutter_inappwebview?.callHandler('handlerFooWithArgs', 'blur1');
      } else if (event.data == 'katex') {
        insertKatex(editor, 'kkasdl', updateAmount);
      } else if (event.data == 'focus') {
        const parentCheck = Editor.parent(editor, editor.selection.anchor.path, { match: (n) => n.type == 'katex' });
        if (parentCheck[0].type == 'katex') {
          Transforms.move(editor, { distance: 1, unit: 'offset' });
        }
        ReactEditor.focus(editor);
        window.removeEventListener('resize', getCaretCoordinates);
      }
    });
  }, [editor]);

  useEffect(() => {
    if (slateObject && slateObject.type === 'arrowLeft' && slateObject.tableId === tableID && keyID === slateObject.id - 1) {
      ReactEditor.focus(editor);
    } else if (slateObject && slateObject.type === 'arrowUp' && slateObject.tableId === tableID && keyID === slateObject.id - 2) {
      
      ReactEditor.focus(editor);
    } else {
      ReactEditor.blur(editor);
    }
  }, [slateObject]);

  const SHORTCUTS = {
    '1.': 'list-item',
    '-': 'list-item',
    '+': 'list-item',
    '>': 'block-quote',
    '#': 'heading-one',
    '##': 'heading-two',
    '###': 'heading-three',
    '####': 'heading-four',
    '#####': 'heading-five',
    '######': 'heading-six',
  };
  

  editor.insertText = (text) => {
    const { selection } = editor;
    const block = Editor.above(editor, {
      match: (n) => Editor.isVoid(editor, n),
    });

    console.log(selection, 'selection');
    const tableBlock = Editor.above(editor, {
      at: editor.selection.anchor.path,
      match: (n) => n.type === 'table-list',
    });

    const [tableCell] = Editor.nodes(editor, {
      match: (n) => n.type === 'table-list',
      at: editor.selection,
    });
    const ua = navigator.userAgent;
    const [startPoint, endPoint] = Range.edges(editor.selection);
    const edges = [startPoint.path, endPoint.path];
    if (block) {
      Transforms.move(editor, { distance: 1, unit: 'offset', reverse: false });
      return;
    } else if (text.endsWith(' ') && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection;
      const block = Editor.above(editor, {
        match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      });
      const path = block ? block[1] : [];
      const start = Editor.start(editor, path);
      const range = { anchor, focus: start };
      const beforeText = Editor.string(editor, range) + text.slice(0, -1);
      const type = SHORTCUTS[beforeText];
      let pattern = /\u200B1./;

      if (pattern.test(beforeText) || type) {
        Transforms.select(editor, range);

        if (!Range.isCollapsed(range)) {
          Transforms.delete(editor);
        }

        const newProperties = {
          type,
        };
        Transforms.setNodes <
          SlateElement >
          (editor,
          newProperties,
          {
            match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
          });

          toggleBlock(editor, 'numbered-list', 'number');

        return;
      }
    }

    insertText(text);

    // Transforms.insertText(editor, text);
  };

  editor.insertBreak = () => {
    const selectedLeaf = Node.leaf(editor, editor.selection.anchor.path);

    const listItems = Editor.nodes(editor, {
      at: editor.selection.anchor,
      match: (n) => n.type == 'list-item' || n.type == 'banner-red-wrapper' || n.type == 'katex' || n.type == 'check-list-item',
    });
    let currentParent, currentDescendant, previousParent;
    for (const listItem of listItems) {
      currentParent = Editor.node(editor, listItem[1]);
      currentDescendant = Node.descendant(editor, listItem[1], { match: (n) => n.type == 'paragraph' });
      previousParent = Editor.previous(editor, { at: listItem[1] });
    }
    const parentCheck = Editor.parent(editor, editor.selection.anchor.path, { match: (n) => n.type == 'paragraph' });

    if (currentParent && ['list-item'].includes(currentParent[0].type) && currentParent[0].children.length == 1 && !/\S/.test(selectedLeaf.text)) {
      toggleBlock(editor, currentParent[0].type);
    } else if (currentParent && ['banner-red-wrapper'].includes(currentParent[0].type) && parentCheck[0].children.length == 1 && !/\S/.test(selectedLeaf.text)) {
      toggleBlock(editor, currentParent[0].type);
    } else {
      insertBreak();
      const selectedLeaf1 = Node.leaf(editor, editor.selection.anchor.path);

      if (selectedLeaf1.text.length == 0) {
        const isActive = isBlockActive(editor, 'heading-one', TEXT_ALIGN_TYPES.includes('heading-one') ? 'align' : 'type');
        if (isActive) {
          Transforms.setNodes(editor, { type: 'paragraph' });
        }
        FORMAT_TYPES.map((o) => {
          Editor.removeMark(editor, o);
        });
      }
    }
  };

  editor.deleteBackward = (...args) => {
    let listItemParent;
    let previousParent;
    let previousVoid;
    let nextParent;
    let parentCheck;
    const [listItems] = Editor.nodes(editor, {
      at: editor.selection.anchor.path,
      match: (n) => ['span-txt', 'paragraph', 'input-component', 'table-list', 'list-item', 'editable-void', 'dropdown-content', 'check-list-item', 'katex'].includes(n.type),
    });

    const listItemCheck = Editor.above(editor, {
      match: (n) => n.type == 'list-item' || n.type == 'paragraph',
    });
    const stringText = Editor.string(editor, editor.selection.anchor.path);

    if (listItems) {
      listItemParent = Editor.node(editor, listItems[1]);

      previousParent = Editor.previous(editor, {
        at: listItems[1],
      });
      previousVoid = Editor.previous(editor, {
        at: listItems[1],
        match: (n) => ['katex', 'span-txt'].includes(n.type),
      });

      nextParent = Editor.next(editor, {
        at: listItems[1],
      });
    }

    if (nextParent && nextParent[0].type == 'banner-red-wrapper' && previousParent && previousParent[0].type == 'banner-red-wrapper') {
      Transforms.delete(editor, { distance: 1, unit: 'offset', reverse: true });

      const currentNode = Editor.node(editor, editor.selection.anchor.path);

      if (['katex', 'inline-bug'].includes(currentNode[0].type)) {
        Transforms.move(editor, { distance: 1, unit: 'offset' });
      }

      Transforms.mergeNodes(editor, {
        at: listItemParent[1],
        match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && ['banner-red-wrapper'].includes(n.type),
      });
      const [listItems] = Editor.nodes(editor, {
        at: editor.selection.anchor.path,
        match: (n) => ['numbered-list', 'bulleted-list'].includes(n.type),
      });

      if (listItems) {
        let nextnode;
        nextnode = Editor.next(editor, {
          at: listItems[1],
          match: (n) => ['paragraph', 'numbered-list', 'bulleted-list'].includes(n.type),
        });

        if (listItems[0].type == nextnode[0].type) {
          Transforms.mergeNodes(editor, {
            at: nextnode[1],
            match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && ['numbered-list', 'bulleted-list'].includes(n.type),
          });
        }
      }
    } else if (previousParent && previousParent[0].type == 'check-list-item' && editor.selection.anchor.offset == 0) {
      Transforms.delete(editor, { distance: 1, unit: 'offset', reverse: true });

      if (previousParent[0].children[0].text.length == 0) {
        Transforms.setNodes(editor, {
          type: 'check-list-item',
          checked: previousParent[0].checked,
        });
      }
    } else if (
      nextParent &&
      previousParent &&
      ['numbered-list', 'bulleted-list'].includes(previousParent[0].type) &&
      ['numbered-list', 'bulleted-list'].includes(nextParent[0].type) &&
      previousParent[0].type == nextParent[0].type
    ) {
      Transforms.delete(editor, { distance: 1, unit: 'offset', reverse: true });

      Transforms.mergeNodes(editor, {
        at: listItemParent[1],
        match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && ['numbered-list', 'bulleted-list'].includes(n.type),
      });
    } else if (
      listItemCheck &&
      (listItemCheck[0].type == 'list-item' || listItemCheck[0].type == 'check-list-item') &&
      listItemCheck[1][listItemCheck[1].length - 1] === 0 &&
      editor.selection.anchor.offset === 0
    ) {
      toggleBlock(editor, listItemCheck[0].type);
    } else if (previousParent && previousParent[0].type === 'table-list') {
      Transforms.move(editor, { distance: 1, reverse: true, offset: 1 });
    } else if (
      previousParent &&
      ['editable-void', 'ImageWrapper', 'input-component'].includes(previousParent[0].type) &&
      editor.selection.anchor.offset == 0 &&
      !['editable-void', 'ImageWrapper', 'input-component'].includes(listItemParent[0].type)
    ) {
      Transforms.setNodes(editor, { checked: true, selectNode: true }, { at: previousParent[1] });

      Transforms.move(editor, { distance: 1, reverse: true, offset: 1 });
      // Transforms.select(editor, previousVoid[1]);
    }

    // else if(listItemParent && ['editable-void', 'ImageWrapper'].includes(listItemParent[0].type)){
    //   Transforms.removeNodes(editor,{at:listItemParent[1]})
    // }
    else {
      Transforms.delete(editor, { distance: 1, unit: 'offset', reverse: true });

      const currentNode = Editor.parent(editor, editor.selection.anchor.path);
      if (/\u200B/.test(currentNode[0].children[0].text)) {
        Transforms.delete(editor, {
          distance: 1,
          unit: 'offset',
          reverse: true,
        });
      }
    }
  };


  editor.deleteFragment = (...args) => {
    const firstNode = Editor.fragment(editor, editor.selection.anchor);
    const lastNode = Editor.fragment(editor, editor.selection.focus);

    deleteFragment(...args);

    const listItems = Editor.nodes(editor, {
      match: (n) => n.type === 'list-item' || n.type == 'check-list-item',
    });

    const string = Node.leaf(editor, editor.selection.anchor.path);

    for (const listItem of listItems) {
      const parent = Editor.parent(editor, listItem[1]);

      if (parent && !['numbered-list', 'bulleted-list'].includes(parent[0].type)) {
        Transforms.setNodes(
          editor,
          { type: 'paragraph' },
          {
            at: listItem[1],
            match: (n) => n.type === 'list-item' || n.type == 'check-list-item',
          },
        );
      }
    }
  };
  const onFocus = useCallback(() => {
    setFocus(true);
    focusCheck(true);
    // Transforms.select(editor, savedSelection.current ?? Editor.end(editor, []));

    window.addEventListener('resize', getCaretCoordinates);
    window.flutter_inappwebview?.callHandler('handlerFooWithArgs', 'focus123');
  }, []);

  const onBlur = useCallback(() => {
    setFocus(false);
    focusCheck(false);

    // savedSelection.current = editor.selection;
    window.removeEventListener('resize', getCaretCoordinates);

    window.flutter_inappwebview?.callHandler('handlerFooWithArgs', 'blur');
  }, []);

  return (
    <div>
 
      <Slate
        editor={editor}
        onChange={(value) => {
          const ua = navigator.userAgent;

          if (editor.selection) {
            const [block] = Editor.nodes(editor, {
              match: (n) => n.type === 'table-list',
              at: editor.selection.anchor,
            });

            const parent = Editor.parent(editor, editor.selection.anchor.path);

            let markActive = isMarkActive(editor, 'bold');
            let pattern = /^\d+\. /; // \d+ matches one or more digits, followed by a literal period

            if (parent[0].type == 'link' && parent[0].children[0].text.length <= 0) {
              Transforms.removeNodes(editor, {
                at: parent[1],
              });
            }
          }
        }}
        initialValue={initialValue}>
        <Editable
          renderElement={renderElement}
          style={{ padding: '10px' }}
          ref={contentEditableRef}
          autoCapitalize='off'
          spellCheck={false}
          onFocus={onFocus}
          onDOMBeforeInput={handleDOMBeforeInput}
          onBlur={onBlur}
          autoFocus={false}
          id={id}
          renderLeaf={renderLeaf}
          onKeyDown={(event) => {
            for (const hotkey in HOTKEYS) {
              if (isHotkey(hotkey, event)) {
                event.preventDefault();
                const mark = HOTKEYS[hotkey];
                toggleMark(editor, mark);
              }
            }
            leftCheck = false;
            rightCheck = false;
            const [listItems] = Editor.nodes(editor, {
              match: (n) => n.type === 'list-item' || n.type == 'inline-bug',
            });
            // setState({ text: selectedLeaf.text });
            if (event.key == 'Enter' && event.shiftKey && listItems && listItems[0].type == 'list-item') {
              event.preventDefault();
              const nextNode = Editor.next(editor, {
                at: editor.selection.anchor.path,
              });
              Transforms.insertNodes(editor, {
                children: [{ text: '', type: 'inline-bug' }],
                type: 'inline-bug',
              });
              // const block = { type: "inline-bug", children: [] };
              // Transforms.wrapNodes(editor, block);
              Transforms.move(editor, { unit: 'offset', distance: 1 });
            } else if (event.key == 'ArrowLeft' && editor.selection.anchor.offset === 0) {
              event.preventDefault();
              dispatch(setSlateCheck({ id: keyID, type: 'arrowLeft', tableId: tableID, mainPath: path }));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              dispatch(setSlateCheck({ id: keyID, type: 'arrowUp', tableId: tableID }));
            } else if (event.key == 'ArrowRight') {
            } else if (event.metaKey && event.key === 'z' && !event.shiftKey) {
              event.preventDefault();
              HistoryEditor.undo(editor);

              // document.execCommand("undo");
            } else if (event.metaKey && event.shiftKey && event.key === 'z') {
              event.preventDefault();
              HistoryEditor.redo(editor);
            }
          }}
        />
      </Slate>
    </div>
  );
};

const wrapperCheck = (editor) => {
  const block = { type: 'banner-red-wrapper', children: [] };
  const isActive = isBlockActive(editor, 'banner-red-wrapper', TEXT_ALIGN_TYPES.includes('banner-red-wrapper') ? 'align' : 'type');

  const firstNode1 = Editor.parent(editor, editor.selection.anchor.path);
  const lastNode1 = Editor.parent(editor, editor.selection.focus.path);

  let anchorPath, focusPath;
  if (_.sum(firstNode1) <= _.sum(lastNode1)) {
    let lastnode = Editor.last(editor, lastNode1[1]);
    let firstnode = Editor.first(editor, firstNode1[1]);
    anchorPath = firstnode;
    focusPath = lastnode;
  } else {
    let lastnode = Editor.last(editor, firstNode1[1]);
    let firstnode = Editor.first(editor, lastNode1[1]);
    anchorPath = firstnode;
    focusPath = lastnode;
  }

  if (!isActive) {
    Transforms.wrapNodes(editor, block, {
      at: {
        anchor: { path: anchorPath[1], offset: 0 },
        focus: {
          path: focusPath[1],
          offset: focusPath[0].text.length,
        },
      },
      match: (n) => {
        return !Editor.isEditor(n) && SlateElement.isElement(n) && (n.type == 'numbered-list' || n.type == 'paragraph' || n.type == 'bulleted-list');
      },
      split: true,
    });
  } else {
    Transforms.unwrapNodes(editor, {
      match: (n) => {
        return !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == 'numbered-list';
      },
      split: true,
    });

    Transforms.setNodes(editor, { type: 'paragraph' });

    Transforms.unwrapNodes(editor, {
      match: (n) => {
        return !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == 'banner-red-wrapper';
      },
      split: true,
    });
  }

  // ReactEditor.focus(editor);
};

const wrapLink = (editor, url) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor);
  }

  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);
  const link = {
    type: 'link',
    url,
    children: isCollapsed ? [{ text: url, type: 'link' }] : [],
  };

  if (isCollapsed) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    ReactEditor.focus(editor);
  }
};

const insertLink = (editor, url) => {
  if (editor.selection) {
    wrapLink(editor, url);
  }
};

const insertKatex = (editor, url, updateAmount) => {
  let id = v4();
  const katex = {
    type: 'katex',
    url,
    id,
    children: [{ text: '', type: 'katex' }],
  };
  Transforms.insertNodes(editor, katex);

  Transforms.move(editor);

  Transforms.insertText(editor, '\u00a0'.toString(), {
    at: editor.selection.anchor,
  });
  updateAmount('katex');
};

const withInlines = (editor) => {
  const { insertData, insertText, isInline, markableVoid, isVoid } = editor;

  editor.isInline = (element) => ['link', 'button', 'katex', 'inline-bug', 'inline-wrapper-bug'].includes(element.type) || isInline(element);

  editor.isVoid = (element) => ['katex', 'inline-bug', 'link', 'editable-void'].includes(element.type) || isVoid(element);

  editor.markableVoid = (element) => {
    return element.type === 'katex' ? true : markableVoid(element);
  };

  return editor;
};

const LinkComponent = ({ attributes, children, element }) => {
  const selected = useSelected();
  const editor = useSlate();

  let updateModal = useModalStore((state) => state.updateModal);
  const focused = useFocused();
  return (
    <a
      {...attributes}
      className={
        selected
          ? css`
              box-shadow: 0 0 0 3px #ddd;
            `
          : ''
      }
      href={element.url}
      onClick={(e) => {
        e.preventDefault();
        let data = {
          element: element,
          editor: editor,
          click: true,
          type: 'link',
          edit: true,
          open: true,
          path: ReactEditor.findPath(editor, element),
        };
        updateModal(data);
      }}>
      <span>{element.children[0].text}</span>
      {children}
    </a>
  );
};

const InlineWrapperBug = ({ attributes, children }) => {
  return (
    <span contentEditable='false' {...attributes}>
      <span contentEditable='false' className='slite-line-break'></span>
      {children}
    </span>
  );
};

const InlineChromiumBugfix = ({ attributes, children, element }) => {
  const selected = useSelected();
  const editor = useSlate();
  const focused = useFocused();

  if (focused && selected && leftCheck) {
    Transforms.move(editor, { unit: 'offset', distance: 1, reverse: true });
    leftCheck = false;
  } else if (focused && selected && rightCheck) {
    Transforms.move(editor, { unit: 'offset', distance: 1 });
    rightCheck = false;
  }
  return (
    <span contentEditable='false' {...attributes}>
      <span contentEditable='false'>
        <span contentEditable='false' className='slite-line-break'></span>
      </span>
      {children}
    </span>
  );
};

const KatexComponent = ({ attributes, children, element }) => {
  const katextext = katex.renderToString(String.raw`${element.url}`);
  const selected = useSelected();
  const focused = useFocused();

  return (
    <span
      onClick={(e) => {
        if (focused) {
          window.flutter_inappwebview?.callHandler('handlerFooWithArgs', 'katex');
        }
      }}
      //
      style={{
        // userSelect: "none",
        background: selected ? 'red' : '',
      }}
      contentEditable='false'
      className='span-katex'
      {...attributes}>
      <span contentEditable='false' dangerouslySetInnerHTML={{ __html: katextext }}></span>
      {children}
      {/* <RenderModal /> */}
    </span>
  );
};

const isLinkActive = (editor) => {
  const [link] = Editor.nodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
  });
  return !!link;
};

const MarkButton = ({ format, icon }) => {
  const editor = useSlate();
  return (
    <div
      style={{ padding: '10px' }}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
        getCaretCoordinates();
      }}>
      {format}
    </div>
  );
};

const BlockButton = ({ format, icon }) => {
  const editor = useSlate();
  let updateAmount = useModalStore((state) => state.updateModal);
  if (format == 'numbered-list') {
    return (
      <div
        style={{ padding: '10px' }}
        onMouseDown={(event) => {
          event.preventDefault();
          toggleBlock(editor, 'numbered-list', 'number');
          getCaretCoordinates();
        }}>
        number list
      </div>
    );
  } else if (format == 'url-link') {
    return (
      <div
        style={{ padding: '10px' }}
        onMouseDown={(event) => {
          event.preventDefault();
          const url = window.prompt('Enter the URL of the link:');
          if (!url) return;
          insertLink(editor, url);
        }}>
        URL LINK
      </div>
    );
  } else if (format == 'focus') {
    return (
      <div
        onClick={(e) => {
          ReactEditor.focus(editor);
        }}>
        focus now
      </div>
    );
  } else if (format == 'banner-red') {
    return (
      <div
        style={{ padding: '10px' }}
        onMouseDown={(event) => {
          event.preventDefault();
          wrapperCheck(editor);
          getCaretCoordinates();
        }}>
        Banner red
      </div>
    );
  } else if (format == 'katex-link') {
    return (
      <div
        style={{ padding: '10px' }}
        onMouseDown={(event) => {
          event.preventDefault();
          ReactEditor.blur(editor);
          insertKatex(editor, 'jjk', updateAmount);
          // getCaretCoordinates();
        }}>
        Katex Link
      </div>
    );
  } else {
    return (
      <div
        onMouseDown={(event) => {
          getCaretCoordinates();

          toggleBlock(editor, format);
        }}>
        bullet list
      </div>
    );
  }
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
  ReactEditor.focus(editor);
};

const toggleBlock = (editor, format, type) => {
  const isActive = isBlockActive(editor, format, TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type');
  const isList = LIST_TYPES.includes(format) || format == 'banner-red-wrapper';
  let LIST_PARENT = ['numbered-list', 'bulleted-list', 'check-list', 'banner-red-wrapper', 'table-list'];
  let formatCheck;

  if (format == 'list-item' || format == 'check-list-item') {
    formatCheck = ['numbered-list', 'bulleted-list', 'check-list'];
  } else {
    formatCheck = [format];
  }

  Transforms.unwrapNodes(editor, {
    match: (n) => {
      return !Editor.isEditor(n) && SlateElement.isElement(n) && formatCheck.includes(n.type);
    },
    split: true,
  });

  let newProperties;
  if (TEXT_ALIGN_TYPES.includes(format)) {
    newProperties = {
      align: isActive ? undefined : format,
    };
  } else {
    newProperties = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : formatCheck,
      children: [{ text: '' }],
    };
  }

  Transforms.setNodes(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }

  const [currentNode] = Editor.nodes(editor, {
    mode: 'lowest',
    match: (n) => LIST_PARENT.includes(n.type),
  });

  let prevParent, nextParent;
  let parentCheck;
  if (currentNode) {
    parentCheck = Editor.above(editor, {
      at: currentNode[1],
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n.type === 'table-cell1' || n.type === 'banner-red-wrapper'),
    });
    prevParent = Editor.previous(editor, {
      at: currentNode[1],
      mode: parentCheck ? 'lowest' : 'highest',
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n.type === 'paragraph' || LIST_PARENT.includes(n.type)),
    });
    nextParent = Editor.next(editor, {
      at: currentNode[1],
      mode: parentCheck ? 'lowest' : 'highest',
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (LIST_PARENT.includes(n.type) || n.type === 'paragraph'),
    });
  }

  if (
    currentNode &&
    prevParent &&
    nextParent &&
    nextParent[0].type === prevParent[0].type &&
    currentNode[0].type == prevParent[0].type &&
    currentNode[0].type == nextParent[0].type &&
    currentNode[1][currentNode[1].length - 1] !== 0
  ) {
    const [parent, parentPath] = currentNode;

    // Merge current node with the one above
    Transforms.mergeNodes(editor, {
      at: parentPath,
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == currentNode[0].type,
    });

    // Merge the newly merged node with the one below
    Transforms.mergeNodes(editor, {
      at: parentPath,
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == currentNode[0].type,
    });

    // // Wrap the merged content into a new numbered list
    // const newList = { type: 'numbered-list', children: [] };
    // Transforms.wrapNodes(editor, newList, { at: parentPath });
  } else if (prevParent && currentNode && (!parentCheck || (parentCheck && currentNode[1][currentNode[1].length - 1] !== 0)) && currentNode[0].type === prevParent[0].type) {
    const [parent, parentPath] = currentNode;

    Transforms.mergeNodes(editor, {
      at: parentPath,
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == currentNode[0].type,
    });
  } else if (
    nextParent &&
    (!parentCheck ||
      (parentCheck &&
        parentCheck[0].children.filter((o) => {
          return o.type === 'numbered-list';
        }).length > 1)) &&
    currentNode &&
    currentNode[0].type === nextParent[0].type
  ) {
    Transforms.mergeNodes(editor, {
      at: nextParent[1],
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == currentNode[0].type,
    });
  }
};

const isBlockActive = (editor, format, blockType = 'type') => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n[blockType] === format,
    }),
  );

  return !!match;
};
const DropdownInner = ({ attributes, children, element }) => {
  const editor = useSlate();
  const selected = useSelected();
  const focused = useFocused();
  const path = ReactEditor.findPath(editor, element);
  if (!selected || !focused) {
  }

  return (
    <div {...attributes} style={{ background: 'green' }}>
      {children}
    </div>
  );
};

const DropDownList = ({ attributes, children, element }) => {
  const editor = useSlate();

  const addMore = () => {
    const path = ReactEditor.findPath(editor, element);
    const [nodes] = Editor.nodes(editor, {
      at: path,
      match: (n) => n.type == 'dropdown-content',
    });

    let object = {
      type: 'dropdown-inner',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              text: '',
            },
          ],
        },
      ],
    };
    let arraynow = [...nodes[0].children];
    arraynow.push(object);

    const block1 = {
      type: 'dropdown-content',
      children: arraynow,
    };

    Transforms.removeNodes(editor, { at: path });
    Transforms.insertNodes(editor, block1, { at: path });
    Transforms.select(editor, [path[0], arraynow.length - 1]);
  };
  return (
    <div {...attributes} style={{ border: '1px solid grey', borderRadius: '10px' }}>
      <button
        onClick={(e) => {
          addMore();
        }}>
        click me
      </button>
      {/* <div style={{ background: "red" }}>{children[0]}</div> */}
      <div className='flex justify-between'>
        {children.map((o, key) => {
          return children[key];
        })}
      </div>
    </div>
  );
};

const EditableVoid = ({ attributes, children, element }) => {
  const editor = useSlate();
  const { card } = element;
  const selected = useSelected();
  const focused = useFocused();
  let cardnow;
  let clickKey;
  const [objCopy, setObj] = useState();
  const path = ReactEditor.findPath(editor, element);
  const addCard = () => {
    let cardObj = { card: card.length + 1, id: 0, check: false };
    cardObj.id = card.length;
    cardnow = [...card, cardObj];

    
    setObj(cardnow);
    Transforms.setNodes(editor, { card: cardnow }, { at: path });
  };

  const checkInput = (text, key) => {
    let cardnow = [...objCopy];
    var index = _.findIndex(cardnow, { id: key });
    cardnow.splice(index, 1, { card: text, id: key, check: true });

    Transforms.setNodes(editor, { card: cardnow }, { at: path });
  };

  const setModal = useCallback((key, card1, check) => {
    let cardnow = [...card1];
    var index = _.findIndex(cardnow, { id: key });
    
    // cardnow.splice(index, 1, { ...cardnow[index], check: check });
    setObj(cardnow[index]);
    // Transforms.setNodes(editor, { card: cardnow }, { at: path });
  }, []);

  const setCheckValidate = useCallback((key, card1) => {
    let cardnow = [...card1];
    var index = _.findIndex(cardnow, { id: key });
    cardnow.splice(index, 1, { ...cardnow[index], check: false });

    setObj(cardnow);
  }, []);

  return (
    // Need contentEditable=false or Firefox has issues with certain input types.
    <div
      style={{
        border: '1px solid grey',
        background: 'green',
        height: '100px',
      }}
      {...attributes}
      contentEditable='false'
      // onBlur={(e) => {
      // 	let cardnow = [...card];
      // 	if (cardnow.length > 0) {
      // 		var result = cardnow.map((o, key) => {
      // 			if (key == clickKey) {
      // 				o.check = false;
      // 			}
      // 		});
      //
      // 		setObj(result);
      // 	}
      // }}
    >
      <button
        onClick={(e) => {
          alert('click');
          addCard();
        }}>
        click here
      </button>
      {children}

      {/* <EditablePopup
										value={o}
										open={true}
										setModal={setModal}
										card={objCopy}
										id={key}
										path={path}
										editor={editor}
									/> */}

      {/* <RenderPopup /> */}
      <div className='flex'>
        {card?.map((o, key) => {
          return (
            <div
              contentEditable='false'
              className='mx-3'
              // onClick={(e) => {
              // 	setModal(key, card, true);
              // }}
              style={{ height: '100%', width: '100%', background: 'red' }}
              key={key}>
              {o.card}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const removeFormats = (editor, format) => {
  Editor.removeMark(editor, format);
};

const Heading1Component = ({ attributes, children, element }) => {
  return (
    <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: 'red' }} {...attributes}>
      {children}
    </h1>
  );
};

const CheckListItemElement = ({ attributes, children, element }) => {
  const editor = useSlate();
  const { checked } = element;
  return (
    <div
      {...attributes}
      className={css`
        display: flex;
        flex-direction: row;
        align-items: center;

        & + & {
          margin-top: 0;
        }
      `}>
      <span
        contentEditable={false}
        className={css`
          margin-right: 0.75em;
          margin-bottom: auto;
        `}>
        <input
          type='checkbox'
          checked={checked}
          onChange={(event) => {
            const path = ReactEditor.findPath(editor, element);
            const newProperties = {
              checked: event.target.checked,
            };
            Transforms.setNodes(editor, newProperties, { at: path });
          }}></input>
      </span>
      <span
        contentEditable={true}
        className={css`
          flex: 1;
          opacity: ${checked ? 0.666 : 1};
          text-decoration: ${!checked ? 'none' : 'line-through'};

          &:focus {
            outline: none;
          }
        `}>
        {children}
      </span>
    </div>
  );
};

const BannerRed = ({ attributes, children, element }) => {
  return (
    <div className='banner-red' {...attributes}>
      {children}
    </div>
  );
};

const Element = (props) => {
  const { attributes, children, element } = props;

  const style = { textAlign: element.align };
  switch (element.type) {
    case 'block-quote':
      return (
        <blockquote style={style} {...attributes}>
          {children}
        </blockquote>
      );
    case 'bulleted-list':
      return (
        <ul style={style} {...attributes}>
          {children}
        </ul>
      );
    case 'link':
      return <LinkComponent {...props} />;
    case 'dropdown-inner':
      return <DropdownInner {...props} />;
    case 'katex':
      return <KatexComponent {...props} />;
    case 'inline-bug':
      return <InlineChromiumBugfix {...props} />;
    case 'inline-wrapper-bug':
      return <InlineWrapperBug {...props} />;
    case 'editable-void':
      return <EditableVoid {...props}></EditableVoid>;
    case 'check-list-item':
      return <CheckListItemElement {...props} />;
    case 'dropdown-content':
      return <DropDownList {...props} />;
    case 'heading-one':
      return <Heading1Component {...props}></Heading1Component>;
    case 'text-descrip':
      return (
        <div style={{ border: '1px solid black' }} {...attributes}>
          {children}
        </div>
      );
    case 'heading-two':
      return (
        <h2 style={style} {...attributes}>
          {children}
        </h2>
      );
    case 'list-item':
      return (
        <li style={style} className='list-item' {...attributes}>
          {children}
        </li>
      );

    case 'numbered-list':
      return (
        <ol style={style} {...attributes}>
          {children}
        </ol>
      );
    case 'banner-red':
      return (
        <p className='banner-red' style={{ marginTop: '10px' }} {...attributes}>
          {children}
        </p>
      );
    case 'banner-red-inline':
      return (
        <p className='banner-red' {...attributes}>
          {children}
        </p>
      );

    case 'banner-red-wrapper':
      return <BannerRed {...props} />;
    case 'paragraph-inline':
      return <p {...attributes}>{children}</p>;
    case 'paragraph':
      return (
        <p style={{ marginTop: '5px' }} {...attributes}>
          {children}
          {/* <ZeroWidthText /> */}
        </p>
      );
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.inline) {
    children = <span style={{ color: 'red' }}>{children}</span>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return (
    <span
      className={
        leaf.text === ''
          ? css`
              padding-left: 0.1px;
            `
          : null
      }
      {...attributes}>
      {children}
    </span>
  );
};

export default SlateMobile;
