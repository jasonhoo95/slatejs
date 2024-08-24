import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';

import isHotkey, { isKeyHotkey } from 'is-hotkey';

import { css } from '@emotion/css';
import { v4 } from 'uuid';
import { Editable, withReact, useSlate, useSlateStatic, Slate, ReactEditor, useSelected, useFocused, useReadOnly } from 'slate-react';
import { Editor, Transforms, createEditor, Path, Descendant, Element as SlateElement, Node as SlateNode, Text, Range, Node, Point, setPoint } from 'slate';
import { withHistory, HistoryEditor, History } from 'slate-history';
import { useModalStore } from '@/globals/zustandGlobal';
import EditablePopup from './editablePopup';
import { before } from 'lodash';

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
};

const LIST_TYPES = ['numbered-list', 'bulleted-list', 'list-item', 'check-list-item'];
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];
const FORMAT_TYPES = ['bold', 'italic', 'underline'];
const FORMAT_NONE = ['numbered-list', 'paragraph'];

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
    type: 'check-list',
    children: [
      {
        type: 'check-list-item',
        checked: true,
        children: [{ text: 'asdasd' }],
      },
      { type: 'check-list-item', children: [{ text: 'asdasd' }] },
    ],
  },
  {
    type: 'numbered-list',
    checked: true,
    children: [
      { type: 'list-item', children: [{ text: 'asdasd asdasd' }] },
      { type: 'list-item', children: [{ text: 'asdasd asdasd' }] },
      { type: 'list-item', children: [{ text: '213 jason' }] },
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
function getCaretCoordinates(height) {
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

    // }

    if (y > 0) {
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
  // return { x, y };
}
const SlateReact = () => {
  let id = v4();
  let ModalProps = useModalStore((state) => state.display);
  let updateAmount = useModalStore((state) => state.updateModal);

  const [focus, setFocus] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const contentEditableRef = useRef(null);
  const [check, setCheck] = useState({ bold: false, color: false });
  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const editor = useMemo(() => withInlines(withReact(withHistory(createEditor()))), []);
  const { deleteFragment, deleteBackward, onChange, insertText } = editor;

  const { insertBreak } = editor;

  const handleDOMBeforeInput = useCallback((e) => {
    queueMicrotask(() => {
      const pendingDiffs = ReactEditor.androidPendingDiffs(editor);

      const scheduleFlush = pendingDiffs?.some(({ diff, path }) => {
        const block = Editor.above(editor, {
          match: (n) =>  Editor.isVoid(editor,n),
        });

        if(block){
          return true;
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
    const messageListener = (event) => {
      if (event.data == 'bold') {
        toggleMark(editor, 'bold');
      } else if (event.data == 'blur') {
        ReactEditor.blur(editor);
        // this.window.scrollTo(0, 0);
      } else if (event.data == 'katexinsert') {
        Transforms.insertText(editor, '\u200B'.toString(), {
          at: editor.selection.anchor,
        });
      } else if (event.data == 'katex') {
        ReactEditor.focus(editor);

        insertKatex(editor, 'flutter123');
      } else if (event.data == 'focus') {
        ReactEditor.focus(editor);
      } else {
        window.removeEventListener('message', messageListener);
      }
    };

    window.addEventListener('message', messageListener);

    return () => {
      window.removeEventListener('message', messageListener);
    };

    // Cleanup when the component unmounts or when the dependency changes
  }, []);

  editor.insertText = (text) => {
    const { selection } = editor;
    const block = Editor.above(editor, {
      match: (n) => Editor.isVoid(editor,n),
    });
    const ua = navigator.userAgent;

    if(block){
       Transforms.move(editor, {distance:1,unit:'offset',reverse:false})
        return;
      
    }else if (text.endsWith(' ') && selection && Range.isCollapsed(selection)) {
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

    // Transforms.insertText(editor, text);
    insertText(text);
  };

  editor.insertBreak = () => {
    const selectedLeaf = Node.leaf(editor, editor.selection.anchor.path);

    const listItems = Editor.nodes(editor, {
      at: editor.selection.anchor,
      match: (n) => ['list-item', 'banner-red-wrapper', 'table-list', 'katex', 'check-list-item', 'dropdown-inner', 'editable-void', 'ImageWrapper'].includes(n.type),
    });
    let currentParent, currentDescendant, previousParent, voidCheck;

    for (const listItem of listItems) {
      currentParent = Editor.node(editor, listItem[1]);
      voidCheck = Editor.node(editor, listItem[1], {
        match: (n) => n.type == 'dropdown-content',
      });
      currentDescendant = Node.descendant(editor, listItem[1], {
        match: (n) => n.type == 'paragraph',
      });
      previousParent = Editor.previous(editor, { at: listItem[1] });
    }

    const parentCheck = Editor.parent(editor, editor.selection.anchor.path, {
      match: (n) => n.type == 'paragraph',
    });

    if (currentParent && ['list-item', 'check-list-item'].includes(currentParent[0].type) && currentParent[0].children.length == 1 && !/\S/.test(selectedLeaf.text)) {
      toggleBlock(editor, currentParent[0].type);
    } else if (currentParent && ['banner-red-wrapper'].includes(currentParent[0].type) && parentCheck[0].children.length == 1 && !/\S/.test(selectedLeaf.text)) {
      toggleBlock(editor, currentParent[0].type);
    } else if (currentParent && ['check-list-item'].includes(currentParent[0].type)) {
      insertBreak();
      const parentCheck = Editor.parent(editor, editor.selection.anchor.path, {
        match: (n) => n.type == 'check-list-item',
      });

      const newProperties = {
        checked: false,
        type: 'check-list-item',
        children: [{ text: parentCheck[0].children[0].text }],
      };
      Transforms.setNodes(editor, newProperties, { at: parentCheck[1] });
    }
    //  else if (currentParent && ['editable-void', 'ImageWrapper'].includes(currentParent[0].type)) {
    //   Transforms.setNodes(editor, { checked: false, selectNode: true }, { at: currentParent[1] });

    //   Transforms.move(editor, { distance: 1, unit: 'offset' });
    // }
    
    else {
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
    } else if (listItemParent && ['dropdown-content', 'table-list'].includes(listItemParent[0].type)) {
      const parent = Editor.parent(editor, editor.selection.anchor.path);
      const [cell] = Editor.nodes(editor, {
        match: n =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          n.type === 'table-cell1',
      })

      if (cell) {
        const [, cellPath] = cell
        const start = Editor.start(editor, cellPath)

        if (Point.equals(editor.selection.anchor, start)) {
          return
        }else{
          Transforms.delete(editor, { distance: 1, unit: 'offset', reverse: true });

        }
      }
      // if (parent[1][parent[1].length - 1] == 0 && editor.selection.anchor.offset == 0 && parent[0].children.length == 1) {
      //   Transforms.insertText(editor, '\u200B'.toString(), {
      //     at: editor.selection.anchor,
      //   });
      // } else {
      //   Transforms.delete(editor, {
      //     distance: 1,
      //     unit: 'offset',
      //     reverse: true,
      //   });
      // }
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
    const [listItems] = Editor.nodes(editor, {
      match: (n) => n.type === 'list-item' || n.type == 'table-cell1' || n.type == 'check-list-item' || n.type == 'paragraph' || n.type == 'dropdown-content',
    });
    const string = Node.leaf(editor, editor.selection.anchor.path);

    const tableCheck =  Editor.above(editor, {
      match: (n) => n.type == 'table-cell1',
    });
    
    const checked = listItems;

    const [checkListItem] = Editor.nodes(editor, {
      at: listItems[1],
      match: (n) => n.type == 'list-item',
    });

    if (checkListItem && !['list-item', 'check-list-item'].includes(checkListItem[0].type)) {
      Transforms.setNodes(
        editor,
        { type: 'paragraph' },
        {
          at: checkListItem[1],
          match: (n) => n.type === 'list-item' || n.type == 'check-list-item',
        },
      );
    } else if (checked[0].type == 'check-list-item' && string.text.length > 0) {
      Transforms.setNodes(
        editor,
        { type: 'check-list-item', checked: checked[0].checked ? true : false },
        {
          at: checked[1],
        },
      );
    } else if (listItems && listItems[0].type === 'table-cell1') {
      const [startPoint, endPoint] = Range.edges(editor.selection);
      const edges = [startPoint.path, endPoint.path];
      let path1 = []
      
      Editor.withoutNormalizing(editor, () => {
        if(edges[0][1] === edges[1][1]){
          deleteFragment(...args)
        }else{
          
          
          

          for (const [parent, path] of Editor.nodes(editor, {
            match: (n)=> n.type === 'table-cell1',
            at: editor.selection,
            reverse:_.sum(editor.selection.anchor.path) <= _.sum(editor.selection.focus.path) ? false : true
          })) {
            let valuePath = [];
            for (const [value, childPath] of Editor.nodes(editor, {
              match: (n) => n.type === 'list-item' || n.type === 'paragraph',
              at: path,
              reverse:_.sum(editor.selection.anchor.path) <= _.sum(editor.selection.focus.path) ? false : true
            })) {
             
              
              if (_.sum(editor.selection.anchor.path) <= _.sum(editor.selection.focus.path)) {
                if(editor.selection.anchor.path[1] === path[1] && _.sum(editor.selection.anchor.path) <= _.sum(childPath)){
                  const [value] = Editor.nodes(editor, {
                    mode:'lowest',
                    at: childPath,

                  })
                  

                 if(parent.children.length == 1){
                    valuePath = []
                    valuePath.push({path:value[1], offset:editor.selection.anchor.offset},{path:value[1], offset:value[0].text.length});

                 }else if(valuePath.length == 0){

                    valuePath.push({...editor.selection.anchor});

                  }else{
                    valuePath.push({path:value[1], offset:value[0].text.length});

                  }


                }else if(editor.selection.anchor.path[1] !== path[1] && editor.selection.focus.path[1] !== path[1]){
                  const [value] = Editor.nodes(editor, {
                    mode:'lowest',
                    at: childPath,

                  })
                  

                  if(valuePath.length == 0){
                    
                    valuePath.push({path:value[1], offset:0});

                  }else{
                    valuePath.push({path:value[1], offset:value[0].text.length});

                  }

                  // Transforms.delete(editor, { at: childPath });

                }else if(editor.selection.focus.path[1] === path[1] && _.sum(childPath) <= _.sum(editor.selection.focus.path)){
                  const [value] = Editor.nodes(editor, {
                    mode:'lowest',
                    at: childPath,

                  })
                  

                  if(valuePath.length == 0){
                    if(parent.children.length > 0){
                      valuePath.push({path:value[1], offset:0});

                    }else{
                      valuePath.push([{path:value[1], offset:0}, {path:value[1], offset:value[0].text.length}]);

                    }
                    

                  }else{
                    valuePath.push({path:value[1], offset:value[0].text.length});

                  }
                }

             }else{
              if(editor.selection.anchor.path[1] === path[1] && _.sum(editor.selection.anchor.path) >= _.sum(childPath)){
                
                // Transforms.removeNodes(editor,{at:childPath});


              }
             }
 
            }

            

            if(valuePath.length > 0){
              
              Transforms.delete(editor,{at:{
                anchor:{...valuePath[0]},
                focus:{...valuePath[valuePath.length - 1]}
              }})
            }
         
  
        }
      
      }})
  
    
      // Transforms.delete(editor, {  at:[editor.selection.anchor.path[0], editor.selection.anchor.path[1]], reverse:true, unit:'offset', distance:editor.selection.anchor.offset})
      
    } else {
      deleteFragment(...args);
    }



  };
  const onFocus = useCallback((e) => {
    setFocus(true);
    window.addEventListener('resize', getCaretCoordinates);

    window.flutter_inappwebview?.callHandler('handlerFooWithArgs', 'focus123');
  }, []);

  const onBlur = useCallback((e) => {
    setFocus(false);

    // savedSelection.current = editor.selection;
    window.removeEventListener('resize', getCaretCoordinates);

    window.flutter_inappwebview?.callHandler('handlerFooWithArgs', 'blur');
  }, []);

  return (
    <div>
      <EditablePopup editor={editor} ModalProps={ModalProps} />
      <Slate
        editor={editor}
        onChange={(value) => {
          const ua = navigator.userAgent;
          if (editor.selection) {
            const string = Node.leaf(editor, editor.selection.anchor.path);
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
        <div
          onClick={(e) => {
            ReactEditor.focus(editor);

            const block1 = {
              type: 'dropdown-content',
              checked: true,

              children: [
                // {
                // 	type: "span-txt",
                // 	children: [
                // 		{
                // 			text: "",
                // 		},
                // 	],
                // },

                {
                  type: 'dropdown-inner',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          id: 1,
                          text: '',
                        },
                      ],
                    },
                  ],
                },
              ],
            };
            // Transforms.insertNodes(editor, block, { at: editor.selection.anchor.path });

            const [listItems] = Editor.nodes(editor, {
              match: (n) => n.type === 'paragraph' || n.type == 'list-item' || n.type == 'banner-red-wrapper',
            });

            if (Editor.isEmpty(editor, listItems[0])) {
              Transforms.insertNodes(editor, block1, {
                at: editor.selection.anchor.path,
              });
              Transforms.unwrapNodes(editor, { mode: 'highest' });
              Transforms.move(editor, {
                reverse: true,
                distance: 1,
                unit: 'offset',
              });
            } else {
              const nextNode = Editor.next(editor, {
                at: listItems[1],
              });

              if (!nextNode) {
                Editor.insertBreak(editor);

                Transforms.insertNodes(editor, block1, {
                  at: editor.selection.anchor.path,
                });
              } else {
                Transforms.insertNodes(editor, block1, { at: nextNode[1] });
              }
              const parentCheck = Editor.node(editor, editor.selection.anchor.path, {
                match: (n) => n.type == 'dropdown-content',
              });

              // Transforms.select(editor, [editor.selection.anchor.path, 0])
            }
          }}>
          insert voidnow123
        </div>
        <div
          onClick={(e) => {
            ReactEditor.focus(editor);
            toggleMark(editor, 'bold');
          }}
          style={{
            color: isBlockActive(editor, 'bold', TEXT_ALIGN_TYPES.includes('bold') ? 'align' : 'type') ? 'red' : 'black',
          }}>
          BOLD
        </div>
        <div
          onClick={(e) => {
            ReactEditor.focus(editor);
            const ua = navigator.userAgent;

            const block = {
              type: 'editable-void',
              checked: true,
              card: [{ card: 'asd' }],
              children: [{ text: '' }],
            };

            Transforms.insertNodes(editor, block, {
              at: editor.selection.anchor.path,
            });
            Transforms.unwrapNodes(editor, { mode: 'highest' });
          }}>
          insert banner void
        </div>

        <div
          onClick={(e) => {
            ReactEditor.focus(editor);
            toggleBlock(editor, 'numbered-list', 'number');
          }}>
          insert numbered list
        </div>

        <div
          onClick={(e) => {
            ReactEditor.focus(editor);

            wrapperCheck(editor);
          }}>
          insert banner red
        </div>

        <div
          onClick={(e) => {
            ReactEditor.focus(editor);

            Transforms.insertNodes(editor, { type: 'ImageWrapper', children: [{ text: '' }] }, { at: editor.selection.anchor.path });

            Transforms.unwrapNodes(editor, { mode: 'highest' });
          }}>
          insert image
        </div>

        <div
          onClick={(e) => {
            ReactEditor.focus(editor);
            // Transforms.insertText(editor, "\u200B".toString(), {
            // 	at: editor.selection.anchor,
            // });
            insertKatex(editor, 'flutter');
          }}>
          insert katex
        </div>

        <div
          onClick={(e) => {
            ReactEditor.focus(editor);

            const block = {
              type: 'input-component',
              inputTxt: 'ok',
              children: [{ text: '' }],
            };

            Transforms.insertNodes(editor, block, {
              at: editor.selection.anchor.path,
            });
            Transforms.unwrapNodes(editor, { mode: 'highest' });
          }}>
          insert input
        </div>

        <div
          onClick={(e) => {
            ReactEditor.focus(editor);
            const ua = navigator.userAgent;

            const block = {
              type: 'table-list',
              insert: true,
              checked: true,
              children: [
                // { type: 'span-txt', id: 'span-txt', children: [{ text: '' }] },
                {
                  type: 'table-cell1',
                  id: 1,
                  selected: true,
                  children: [{ type: 'paragraph', children: [{ text: '' }] }],
                },
                {
                  type: 'table-cell1',
                  id: 2,
                  selected: false,
                  children: [{ type: 'paragraph', children: [{ text: '' }] }],
                },
                {
                  type: 'table-cell1',
                  id: 3,
                  selected: false,
                  children: [{ type: 'paragraph', children: [{ text: '' }] }],
                },
                {
                  type: 'table-cell1',
                  id: 4,
                  selected: false,
                  children: [{ type: 'paragraph', children: [{ text: '' }] }],
                },
              ],
            };

            Transforms.insertNodes(editor, block, {
              at: editor.selection.anchor.path,
            });
            Transforms.unwrapNodes(editor, { mode: 'highest' });
            Transforms.select(editor, [editor.selection.anchor.path[0], 0]);
          }}>
          insert table now
        </div>

        <BlockButton format='numbered-list' icon='format_list_item' />

        {/*

			
				<BlockButton
					icon="format_list_item"
					format="bulleted-list"
				/>



				<div
					onClick={(e) => {
						const typeCheckList = { text: "", type: "check-list-item" };
						const block = { type: "check-list", children: [] };

						Transforms.wrapNodes(editor, block);

						Transforms.setNodes(editor, typeCheckList);
						ReactEditor.focus(editor);
					}}>
					check list
				</div>



				<div
					onClick={(e) => {
						const text = { text: "", type: "heading-one" };
						// const block = { type: "editable-void", children: [text] };
						Transforms.unwrapNodes(editor, {
							match: (n) => {
								return !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == "numbered-list";
							},
							split: true,
						});
						Transforms.setNodes(editor, text);
						ReactEditor.focus(editor);
					}}>
					heading one
				</div> */}

        <Editable
          renderElement={renderElement}
          style={{ padding: '10px' }}
          ref={contentEditableRef}
          autoCapitalize={false}
          onDOMBeforeInput={handleDOMBeforeInput}
          autoCorrect={false}
          spellCheck={false}
          onFocus={onFocus}
          onBlur={onBlur}
          autoFocus={false}
          className='editable-slate'
          id={'asd'}
          renderLeaf={renderLeaf}
          onKeyUp={(e) => {}}
          onKeyDown={(event) => {
            const ua = navigator.userAgent;
            for (const hotkey in HOTKEYS) {
              if (isHotkey(hotkey, event)) {
                event.preventDefault();
                const mark = HOTKEYS[hotkey];
                toggleMark(editor, mark);
              }
            }

            const [listItems] = Editor.nodes(editor, {
              match: (n) =>
                n.type === 'list-item' ||
                n.type === 'ImageWrapper' ||
                n.type == 'editable-void' ||
                n.type == 'span-txt' ||
                n.type == 'inline-bug' ||
                n.type == 'check-list-item' ||
                n.type == 'paragraph' ||
                n.type == 'table-list' ||
                n.type == 'dropdown-content',
            });
            const parentCheck = Editor.above(editor, {
              match: (n) => n.type == 'list-item' || n.type == 'paragraph',
            });
            const stringText = Editor.string(editor, editor.selection.anchor.path);

            let pattern = /^\d+\./; // \d+ matches one or more digits, followed by a literal period

            // setState({ text: selectedLeaf.text });
            if (event.key == 'Enter' && event.shiftKey && parentCheck) {
              event.preventDefault();

              Transforms.insertText(editor, '\n');
            } else if (event.metaKey && event.key === 'z' && !event.shiftKey) {
              event.preventDefault();
              HistoryEditor.undo(editor);
            } else if (event.metaKey && event.shiftKey && event.key === 'z') {
              event.preventDefault();
              HistoryEditor.redo(editor);
            }else if ((event.key == 'Enter') && listItems && ["editable-void", "ImageWrapper"].includes(listItems[0].type)) {
              event.preventDefault();
              Transforms.setNodes(editor, { checked: false, selectNode: true }, { at: listItems[1] });

              Transforms.move(editor, { distance: 1, unit: 'offset' });
              ReactEditor.focus(editor);
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

  // Transforms.wrapNodes(editor, block, { split: true });

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
        return !Editor.isEditor(n) && SlateElement.isElement(n) && (n.type == 'numbered-list' || n.type == 'paragraph' || n.type == 'bulleted-list' || n.type == 'check-list');
      },
      split: true,
    });
  } else {
    // Transforms.unwrapNodes(editor, {
    //   match: (n) => {
    //     return !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == 'numbered-list';
    //   },
    //   split: true,
    // });

    Transforms.unwrapNodes(editor, {
      match: (n) => {
        return !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == 'banner-red-wrapper';
      },
      split: true,
    });
    // Transforms.setNodes(editor, { type: 'list-item' });
    // const block = { type: 'numbered-list', children: [] };

    // Transforms.wrapNodes(editor, block);

    // toggleBlock(editor, "numbered-list", "number");
  }

  ReactEditor.focus(editor);
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
    Transforms.move(editor, { unit: 'offset', distance: 1 });
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    Transforms.move(editor, { unit: 'offset', distance: 1 });

    ReactEditor.focus(editor);
  }
};

const insertLink = (editor, url) => {
  if (editor.selection) {
    ReactEditor.focus(editor);
    wrapLink(editor, url);
  }
};

const insertKatex = (editor, url, updateAmount) => {
  const ua = navigator.userAgent;

  if (/android/i.test(ua)) {
    Transforms.insertText(editor, '\u200B'.toString(), {
      at: editor.selection.anchor,
    });
  }

  let id = v4();
  const katex = {
    type: 'katex',
    url,
    id,
    children: [{ text: '', type: 'katex', checked: true }],
  };

  Transforms.insertNodes(editor, katex);

  Transforms.move(editor);
};

const withInlines = (editor) => {
  const { insertData, insertText, isInline, markableVoid, isVoid } = editor;

  editor.isInline = (element) => ['button', 'link', 'katex', 'inline-bug', 'inline-wrapper-bug', 'inline-wrapper'].includes(element.type) || isInline(element);

  editor.isVoid = (element) => ['katex', 'inline-bug', 'span-txt',   'editable-void', 'input-component', 'ImageWrapper', 'inline-wrapper'].includes(element.type) || isVoid(element);

  editor.markableVoid = (element) => {
    return element.type === 'katex' || markableVoid(element);
  };

  return editor;
};

const ChromiumBugfix = () => (
  <span
    className={css`
      font-size: 0;
      padding-left: 0.1px;
    `}>
    {String.fromCodePoint(160) /* Non-breaking space */}
  </span>
);

const LinkComponent = ({ attributes, children, element }) => {
  const selected = useSelected();
  const editor = useSlate();

  const focused = useFocused();
  let updateAmount = useModalStore((state) => state.updateModal);

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
        window.flutter_inappwebview?.callHandler('handlerFooWithArgs', 'blur');

        let data = {
          element: element,
          editor: editor,
          click: true,
          type: 'link',
          edit: true,
          open: true,
          path: ReactEditor.findPath(editor, element),
        };
        updateAmount(data);
      }}>
      <ChromiumBugfix />
      {children}
      <ChromiumBugfix />
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

const SpanTxt = ({ attributes, children, element }) => {
  const selected = useSelected();
  const focused = useFocused();
  const ua = navigator.userAgent;

  return (
    <div contentEditable={false} {...attributes}>
      {children}
    </div>
  );
};

const KatexComponent = ({ attributes, children, element }) => {
  const katextext = katex.renderToString(String.raw`${element.url}`);
  const selected = useSelected();

  return (
    <span
      onClick={(e) => {
        window.flutter_inappwebview?.callHandler('handlerFooWithArgs', 'katex', { id: 1 });
      }}
      style={{
        background: selected ? 'red' : '',
      }}
      className='span-katex'
      {...attributes}>
      <span contentEditable='false' dangerouslySetInnerHTML={{ __html: katextext }}></span>
      <ChromiumBugfix />
      {children}
      &nbsp;
      <ChromiumBugfix />
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

  if (format == 'numbered-list') {
    return (
      <div
        style={{
          padding: '10px',
          color: isBlockActive(editor, format, TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type') ? 'red' : 'black',
        }}
        onMouseDown={(event) => {
          event.preventDefault();
          toggleBlock(editor, 'numbered-list', 'number');
        }}>
        number list
      </div>
    );
  } else if (format == 'url-link') {
    return (
      <div
        style={{ padding: '10px' }}
        onClick={(event) => {
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
        }}>
        Banner red
      </div>
    );
  } else {
    return (
      <div
        onClick={(event) => {
          HistoryEditor.undo(editor);
          ReactEditor.focus(editor);
        }}>
        undo
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
  const { checked, selectNode } = element;

  return (
    <div {...attributes} className='dropdown-content  mx-3'>
      {children}
    </div>
  );
};

const DropDownList = ({ attributes, children, element }) => {
  const selected = useSelected();
  const focused = useFocused();

  const editor = useSlate();
  const { checked, selectNode } = element;
  const path = ReactEditor.findPath(editor, element);
  const [open, setOpen] = useState(false);
  const [nodes] = Editor.nodes(editor, {
    at: path,
    match: (n) => n.type == 'dropdown-content',
  });

  function checknow(event) {
    if (event && typeof event.data == 'katexnow') {
      let value = JSON.parse(event.data);

      if (value && value.id == 'katex') {
        ReactEditor.focus(editor);
        var index = _.findIndex(cardnow, { id: value.key });
        Transforms.setNodes(editor, { card: [{ card: value.card, id: value.cardId, check: false }] }, { at: path });

        // if (cardnow[index].card != 'hello world') {
        // 	cardnow.splice(index, 1, { ...cardnow[index], card: 'hello world', check: false });

        // }
      }
    }
  }

  useEffect(() => {
    const messageListener = (e) => {
      if (selected) {
        checknow();
      }
    };

    if (selected) {
      window.addEventListener('message', messageListener);
    } else {
      window.removeEventListener('message', messageListener);
    }

    // Cleanup when the component unmounts or when the dependency changes
    return () => {
      window.removeEventListener('message', messageListener);
    };
  }, [selected]);

  const addMore = () => {
    ReactEditor.focus(editor);
    const path = ReactEditor.findPath(editor, element);

    let arraynow = [
      ...nodes[0].children.filter((o) => {
        return o.type == 'dropdown-inner';
      }),
    ];
    let object = {
      type: 'dropdown-inner',
      children: [
        {
          type: 'paragraph',
          id: arraynow.length + 1,
          children: [
            {
              text: '',
            },
          ],
        },
      ],
    };
    arraynow.push(object);

    const block1 = {
      type: 'dropdown-content',
      children: [...arraynow],
    };

    Transforms.removeNodes(editor, { at: path });
    Transforms.insertNodes(editor, block1, { at: path });
    // Transforms.select(editor, [path[0], arraynow.length - 1]);
  };
  return (
    <div
      {...attributes}
      className='p-[10px] w-full'
      style={{
        background: selected ? 'green' : '',
        border: '1px solid grey',
        borderRadius: '10px',
      }}>
      {/* <div>
				{children[0]}

			</div> */}
      {/* <button
				onClick={(e) => {
					// addMore();
					setOpen(true);
				}}>
				click me
			</button>

			<EditablePopup
				open={open}
				setOpenCallback={setOpen}
				editor={editor}
			/> */}
      <div
        // onClick={e => { Transforms.setNodes(editor, { checked: false }, { at: path }) }}
        className='grid-container'>
        {nodes[0].children.map((o, key) => {
          if (o.type == 'dropdown-inner') {
            return children[key];
          }
        })}
      </div>
    </div>
  );
};

const TableList = ({ attributes, children, element }) => {
  const selected = useSelected();
  const focused = useFocused();
  const editor = useSlate();

  function checknow(event) {
    if (event && typeof event.data == 'katexnow') {
      let value = JSON.parse(event.data);

      if (value && value.id == 'katex') {
        ReactEditor.focus(editor);
        var index = _.findIndex(cardnow, { id: value.key });
        Transforms.setNodes(editor, { card: [{ card: value.card, id: value.cardId, check: false }] }, { at: path });

        // if (cardnow[index].card != 'hello world') {
        // 	cardnow.splice(index, 1, { ...cardnow[index], card: 'hello world', check: false });

        // }
      }
    }
  }
  useEffect(() => {
    const messageListener = (e) => {
      if (selected) {
        checknow(e);
      }
    };

    if (selected) {
      window.addEventListener('message', messageListener);
    } else {
      window.removeEventListener('message', messageListener);
    }

    // Cleanup when the component unmounts or when the dependency changes
    return () => {
      window.removeEventListener('message', messageListener);
    };
  }, [selected]);

  return (
    <>
      <table style={{ background: selected ? 'green' : '' }} {...attributes}>
        <tr>
          {children.map((o, key) => {
            if (0 <= key && key <= 1) {
              return children[key];
            }
          })}
          {/* {card.map((o, key) => {
						return (
							<CellElement setCallback={arrayCheck} select={selectArray[key]} path={path} card={card} data={o} key={key} />

						)


					})} */}
        </tr>

        <tr>
          {children.map((o, key) => {
            if (2 <= key && key <= 3) {
              return children[key];
            }
          })}
        </tr>
      </table>
    </>
  );
};

const InputComponent = ({ attributes, children, element }) => {
  const editor = useSlate();
  const selected = useSelected();

  const [inputValue, setInputValue] = useState(null);
  const path = ReactEditor.findPath(editor, element);

  const { inputTxt } = element;

  const checkInput = (val) => {
    Transforms.setNodes(editor, { inputTxt: val }, { at: path });
  };

  return (
    <div style={{ width: '100%', height: '100px', border: selected? '1px solid red': '', background: 'green' }} {...attributes}>
      <input
        contentEditable='false'
        className='w-full h-[30px]'
        value={inputValue ? inputValue.txt : inputTxt}
        onChange={(e) => {
          e.preventDefault();
          setInputValue({ txt: e.target.value });
          checkInput(e.target.value);
        }}
        onFocus={(e) => {
          setInputValue({ txt: e.target.value });
        }}
        onBlur={(e) => {
          setInputValue(null);
        }}
        type='text'></input>
      <div>{children}</div>
    </div>
  );
};

const ImageWrapper = ({ attributes, children, element }) => {
  const editor = useSlate();
  const selected = useSelected();
  const ua = navigator.userAgent;

  return (
    <div style={{ border: selected ? '3px solid blue' : '' }} className='h-[100px] w-[100px] relative overflow-hidden' {...attributes}>
      <div className='w-full h-full absolute left-0 top-0 z-[2] overflow-hidden' contentEditable='false'>
        <img
          className='w-full h-full object-cover'
          src='https://media.istockphoto.com/id/1217649450/photo/chicken-or-hen-on-a-green-meadow.jpg?s=612x612&w=0&k=20&c=zRlZTkwoc-aWb3kI10OqlRLbiQw3R3_KUIchNVFgYgw='
        />
      </div>

     
        <div>
        {children}

        </div>
    </div>
  );
};

const EditableVoid = ({ attributes, children, element }) => {
  const editor = useSlate();
  const { card, checked } = element;
  const selected = useSelected();
  const focused = useFocused();
  let cardnow;
  let focusCheck;
  const [objCopy, setObj] = useState();
  const [open, setOpen] = useState(false);
  const path = ReactEditor.findPath(editor, element);
  const [disabled, setDisabled] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const ua = navigator.userAgent;

  // if (checked && undo) {
  // 	Transforms.select(editor, path);
  // 	undo = false;
  // } else if (!checked && selected && undo) {
  // 	Transforms.move(editor, { distance: 1, unit: 'offset' });
  // 	undo = false;
  // }

  const addCard = () => {
    let cardObj = { card: card.length + 1, id: 0, check: false };
    cardObj.id = card.length;
    cardnow = [...card, cardObj];

    setObj(cardnow);
    Transforms.setNodes(editor, { card: cardnow }, { at: path });
  };

  const checkInput = (text, key, card) => {
    let cardnow = [...card];
    var index = _.findIndex(cardnow, { id: key });
    cardnow.splice(index, 1, { card: text, id: key, check: true });

    setObj(cardnow);
    Transforms.setNodes(editor, { card: cardnow }, { at: path });
  };

  const setModal = useCallback((key, card1, check) => {
    let cardnow = [...card1];
    var index = _.findIndex(cardnow, { id: key });
    cardnow.splice(index, 1, { ...cardnow[index], check: check });

    setObj(cardnow);
    setOpen(true);
    // Transforms.setNodes(editor, { card: cardnow }, { at: path });
  }, []);

  function checknow(event) {
    if (event && typeof event.data == 'string') {
      let value = JSON.parse(event.data);

      if (value && value.id == 'katex') {
        ReactEditor.focus(editor);
        var index = _.findIndex(cardnow, { id: value.key });
        Transforms.setNodes(editor, { card: [{ card: value.card, id: value.cardId, check: false }] }, { at: path });

        // if (cardnow[index].card != 'hello world') {
        // 	cardnow.splice(index, 1, { ...cardnow[index], card: 'hello world', check: false });

        // }
      }
    }
  }

  useEffect(() => {
    const messageListener = (e) => {
      checknow(e);
    };

    // Add event listener when component mounts
    // window.addEventListener('keydown', handleKeyDown);

    // Remove event listener when component unmounts

    if (selected) {
      window.addEventListener('message', messageListener);
    } else {
      window.removeEventListener('message', messageListener);
    }

    // Cleanup when the component unmounts or when the dependency changes
    return () => {
      window.removeEventListener('message', messageListener);

      // window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selected]);

  const setCheckValidate = useCallback((key, card1, check) => {
    let cardnow = [...card1];
    var index = _.findIndex(cardnow, { id: key });
    cardnow.splice(index, 1, { ...cardnow[index], check: check });

    setObj(cardnow);
  }, []);

  return (
    // Need contentEditable=false or Firefox has issues with certain input types.
    <div
      style={{
        border: selected ? '1px solid red' : '1px solid grey',
        background: selected ? 'green' : '',
        caretColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
        height: '100px',
        width: '100%',
      }}
      className='shadow-box'
      {...attributes}>
      {/* <EditablePopup
					open={open}
					card={objCopy}
					setOpenCallback={setOpen}
					path={path}
					editor={editor}
				/> */}
      {/* <div className="flex h-full" contentEditable="false">
				{card?.map((o, key) => {
					return (
						<div
							className="m-3"
							onClick={(e) => {
								// setModal(key, card, true);
								// setCheckValidate(key, card, false)

							}}
							style={{ height: "40px", width: "50%", background: "red" }}
							key={key}>

							<div
								contentEditable="false"
								// onClick={(e) => {
								// 	setModal(key, card, true);
								// }}
								style={{ height: "100%", width: "100%", background: "red" }}
								key={key}>
								{o.card}
							</div>








						</div>
					);
				})}
			</div> */}
      <div contentEditable="false"  className='h-full w-full absolute left-0 top-0 z-[2]'>
        <button
        className=''
          onClick={(e) => {
            Transforms.removeNodes(editor, { at: path });
          }}>
          CLICK ME
        </button>

     
        <div className='flex'>
          {card?.map((o, key) => {
            return (
              <div
                // onClick={(e) => {
                // 	setModal(key, card, true);
                // }}
                style={{ height: '30px', width: '25%', background: 'red' }}
                key={key}>
                {o.card}
              </div>
            );
          })}


        </div>
      </div>
      

      <div className='overflow-hidden absolute z-[-1] w-[0px] h-[0px]'>{children}</div>
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

const TableCell1 = ({ attributes, children, element }) => {
  const editor = useSlate();
  const selected = useSelected();
  const focused = useFocused();
  const path = ReactEditor.findPath(editor, element);
  
  return <td {...attributes}>
    {children}
    </td>;
};

const CheckListItemElement = ({ attributes, children, element }) => {
  const editor = useSlate();
  const { checked } = element;
  const readOnly = useReadOnly();

  let timeoutRef = React.useRef();
  let workaroundIOSDblClickBug = () => {
    // Add touch-action: manipulation on click to workaround https://bugs.webkit.org/show_bug.cgi?id=216681,
    // and remove after a short delay to prevent double click.
    let root = document.getElementById('__next');
    root.style.touchAction = 'manipulation';
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      root.style.touchAction = '';
    }, 500);
  };
  return (
    <div
      {...attributes}
      className={css`
        display: flex;
        flex-direction: row;
        align-items: flex-start;
      `}>
      <span
        contentEditable={false}
        className={css`
          user-select: none;
          margin-right: 0.5em;
          margin-top: 0.1em;
          display: block;
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
          }}
        />
      </span>
      <span
        contentEditable={!readOnly}
        suppressContentEditableWarning
        className={css`
          opacity: ${checked ? 0.666 : 1};
          text-decoration: ${!checked ? 'none' : 'line-through'};
          word-wrap: break-word;
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

    case 'ImageWrapper':
      return <ImageWrapper {...props} />;

    case 'link':
      return <LinkComponent {...props} />;
    case 'dropdown-inner':
      return <DropdownInner {...props} />;
    case 'katex':
      return <KatexComponent {...props} />;
    case 'inline-wrapper':
      return (
        <span contentEditable='false' {...attributes}>
          {children}
        </span>
      );

    case 'inline-wrapper-bug':
      return <InlineWrapperBug {...props} />;
    case 'editable-void':
      return <EditableVoid {...props}></EditableVoid>;
    case 'check-list-item':
      return <CheckListItemElement {...props} />;
    case 'dropdown-content':
      return <DropDownList {...props} />;
    case 'input-component':
      return <InputComponent {...props} />;

    case 'table-list':
      return <TableList {...props} />;

    case 'table-cell1':
      return <TableCell1 {...props} />;
    case 'heading-one':
      return <Heading1Component {...props}></Heading1Component>;
    case 'span-txt':
      return <SpanTxt {...props}></SpanTxt>;
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

    case 'check-list':
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
    case 'paragraph':
      return (
        <div style={{ marginTop: '5px' }} {...attributes}>
          {children}
        </div>
      );
    default:
      return <div {...attributes}>{children}</div>;
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

export default SlateReact;
