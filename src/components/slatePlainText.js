import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { Editable, withReact, useSlate, Slate, ReactEditor, useSelected, useFocused } from 'slate-react';
import { Editor, Transforms, createEditor, Path, Descendant, Element as SlateElement, Node as SlateNode, Text, Range, Node, Point, setPoint } from 'slate';
import { withHistory, HistoryEditor, History } from 'slate-history';
import { useSelector, useDispatch } from 'react-redux';
import { setSlateCheck, setMobileFocus } from '@/globals/counterSlice';
import isHotkey from 'is-hotkey';
import { css } from '@emotion/css';
import { v4 } from 'uuid';
const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: 'This is editable plain text, just like a <textarea>!' }],
  },
];

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
};

const LIST_TYPES = ['numbered-list', 'bulleted-list', 'list-item', 'check-list-item'];
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];
const FORMAT_TYPES = ['bold', 'italic', 'underline'];

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
const SlatePlainText = ({ keyID, value, check, tableID, focusCheck, path, slateChange }) => {
  const slateObject = useSelector((state) => state.counter.slateObject);
  const dispatch = useDispatch();
  const [textChange, setText] = useState(false);
  const [nodes, setNodes] = useState();
  const [focus, setFocus] = useState(false);
  const [selected, setSelected] = useState(false);
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

  const onFocus = useCallback(() => {
    focusCheck(true);
    setFocus(true);

    ReactEditor.focus(editor);
    // Transforms.select(editor, savedSelection.current ?? Editor.end(editor, []));

    window.flutter_inappwebview?.callHandler('handlerFooWithArgs', 'tablevoid', keyID, tableID);
  }, [textChange]);

  const onBlur = useCallback(() => {
    Transforms.deselect(editor);
    setFocus(false);

    if (textChange) {
      slateChange(nodes, keyID);
      setText(false);
    }

    window.flutter_inappwebview?.callHandler('handlerFooWithArgs', 'blur');
  }, [nodes, textChange]);

  useEffect(() => {
    if (value) {
      setFocus(true);
      console.log('value is checj', value);
    }
  }, [value]);

  // useEffect(() => {
  //   const messageListener = window.addEventListener('message', function (event) {
  //     const data = JSON.parse(event.data);
  //     if (data && data.bold && data.id === keyID && data.tableid === tableID) {
  //       toggleMark(editor, 'bold');
  //     } else if (event.data == 'blur') {
  //       ReactEditor.blur(editor);
  //       // this.window.scrollTo(0, 0);
  //     } else if (event.data == 'katexinsert') {
  //       Transforms.insertText(editor, '\u200B'.toString(), {
  //         at: editor.selection.anchor,
  //       });
  //     } else if (event.data == 'katex') {
  //       ReactEditor.focus(editor);

  //       insertKatex(editor, 'flutter123');
  //     } else if (event.data == 'focus') {
  //       ReactEditor.focus(editor);
  //     } else {
  //       window.removeEventListener('message', messageListener);
  //     }
  //   });

  //   window.addEventListener('message', messageListener);

  //   return () => {
  //     window.removeEventListener('message', messageListener);
  //   };

  //   // Cleanup when the component unmounts or when the dependency changes
  // }, []);

  useEffect(() => {
    if (slateObject && slateObject.type === 'arrowLeft' && slateObject.tableId === tableID && keyID === slateObject.id - 1) {
      ReactEditor.focus(editor);
    } else if (slateObject && slateObject.type === 'arrowUp' && slateObject.tableId === tableID && keyID === slateObject.id - 2) {
      ReactEditor.focus(editor);
    } else {
      ReactEditor.blur(editor);
    }
  }, [slateObject]);

  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const { deleteFragment, deleteBackward, onChange, insertText, insertBreak } = editor;

  editor.insertText = (text) => {
    const { selection } = editor;
    const block = Editor.above(editor, {
      match: (n) => Editor.isVoid(editor, n),
    });

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

  return (
    <Slate
      editor={editor}
      key={JSON.stringify(value)}
      initialValue={value}
      onChange={(e) => {
        setNodes(e);
      }}>
      <Editable
        autoCapitalize='off'
        spellCheck={false}
        className='content-slate'
        onFocus={onFocus}
        style={{ padding: '10px', border: focus ? '2px solid red' : '' }}
        onDOMBeforeInput={handleDOMBeforeInput}
        onBlur={onBlur}
        autoFocus={false}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onKeyDown={(event) => {
          setText(true);
          for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event)) {
              event.preventDefault();
              const mark = HOTKEYS[hotkey];
              toggleMark(editor, mark);
            }
          }

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
  );
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

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
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

export default SlatePlainText;
