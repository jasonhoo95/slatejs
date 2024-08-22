"use client";

import isHotkey from "is-hotkey";
import { BaseEditor, Descendant, createEditor } from "slate";
import {
  Editable,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  useSlateSelection,
  useSlateStatic,
  withReact,
} from "slate-react";
import { FC, useCallback, useMemo, useState } from "react";
import { HistoryEditor, withHistory } from "slate-history";
import { TableCursor, TableEditor, withTable } from "slate-table";


declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: Text;
  }
}

interface Props {
  // onChange: (v: Descendant[]) => void;
}

const initialValue: Descendant[] = [
  {
    type: "paragraph",
    children: [
      {
        text: "Dive into ",
      },
      {
        text: "slate-table ",
        bold: true,
      },
      {
        text: "now to effortlessly modify tables. Easily merge, split cells, and insert rows or columns for more flexibility. 😸",
      },
    ],
  },
  {
    type: "table",
    children: [
      {
        type: "table-head",
        children: [
          {
            type: "table-row",
            children: [
              {
                type: "header-cell",
                children: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        text: "Time",
                      },
                    ],
                  },
                ],
              },
              {
                type: "header-cell",
                children: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        text: "🎨 Frontend team",
                      },
                    ],
                  },
                ],
              },
              {
                type: "header-cell",
                children: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        text: "👷 Backend team ",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "table-body",
        children: [
          {
            type: "table-row",
            children: [
              {
                type: "table-cell",
                children: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        text: "9:00 AM",
                        bold: true,
                      },
                    ],
                  },
                ],
              },
              {
                type: "table-cell",
                colSpan: 2,
                children: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        text: "Opening Keynote 🎉",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "table-row",
            children: [
              {
                type: "table-cell",
                rowSpan: 2,
                children: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        text: "10:30 AM",
                        bold: true,
                      },
                    ],
                  },
                ],
              },
              {
                type: "table-cell",
                children: [
                  {
                    type: "paragraph",
                    children: [{ text: "Introduction to 🅰️ngular" }],
                  },
                ],
              },
              {
                type: "table-cell",
                rowSpan: 2,
                children: [
                  {
                    type: "paragraph",
                    children: [
                      { text: "Introduction to Gradle and Java 11 ☕" },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "table-row",
            children: [
              {
                type: "table-cell",
                children: [
                  {
                    type: "paragraph",
                    children: [{ text: "Strictly typed forms in v14" }],
                  },
                ],
              },
            ],
          },
          {
            type: "table-row",
            children: [
              {
                type: "table-cell",
                children: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        text: "1:00 PM",
                        bold: true,
                      },
                    ],
                  },
                ],
              },
              {
                type: "table-cell",
                colSpan: 2,
                children: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        text: "Lunch Break",
                        underline: true,
                      },
                      {
                        text: " 🍱",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "paragraph",
    children: [
      {
        text: "Encountered a bug 🐞? Help improve slate-table by opening a GitHub issue!",
      },
    ],
  },
]
export const SlateTable: FC<Props> = () => {
  const [canMerge, setCanMerge] = useState(false);

  const editor = useMemo(
    () =>
      withTable(withReact(withHistory(createEditor())), {
        blocks: {
          table: "table",
          thead: "table-head",
          tbody: "table-body",
          tfoot: "table-footer",
          tr: "table-row",
          th: "header-cell",
          td: "table-cell",
          content: "paragraph",
        },
      }),
    []
  );

  const renderElement = useCallback((props: RenderElementProps) => {
    switch (props.element.type) {
      case "table":
        return (
          <Table
            className="table-fixed my-4 sm:w-1/2 w-full text-center"
            {...props}
          />
        );
      case "table-head":
        return (
          <thead
            className="border-b text-sm uppercase bg-slate-100"
            {...props.attributes}
          >
            {props.children}
          </thead>
        );
      case "table-body":
        return (
          <tbody className="border-b text-sm" {...props.attributes}>
            {props.children}
          </tbody>
        );
      case "table-footer":
        return (
          <tfoot className="" {...props.attributes}>
            {props.children}
          </tfoot>
        );
      case "table-row":
        return <tr {...props.attributes}>{props.children}</tr>;
      case "header-cell":
        return (
          <Th className="border border-gray-400 p-2 align-middle	" {...props} />
        );
      case "table-cell":
        return (
          <Td className="border border-gray-400 p-2 align-middle	" {...props} />
        );
      case "paragraph":
      default:
        return <p {...props.attributes}>{props.children}</p>;
    }
  }, []);

  const renderLeaf = useCallback(
    (props: RenderLeafProps) => <Text {...props} />,
    []
  );

  const HOTKEYS = useMemo(
    () => ({
      // Formatting
      BOLD: isHotkey("mod+b"),
      ITALIC: isHotkey("mod+i"),
      UNDERLINE: isHotkey("mod+u"),

      // Navigation
      ARROW_UP: isHotkey("up"),
      ARROW_DOWN: isHotkey("down"),
      ARROW_LEFT: isHotkey("left"),
      ARROW_RIGHT: isHotkey("right"),
      TAB: isHotkey("tab"),
      SHIFT_TAB: isHotkey("shift+tab"),
    }),
    []
  );

  return (
    <section className="mb-4 border border-gray-200 rounded-lg bg-gray-50">
      <Slate
        editor={editor}
        initialValue={initialValue}
        onSelectionChange={() => setCanMerge(TableEditor.canMerge(editor))}
      >
        <div className="prose lg:prose-lg max-w-none bg-white p-4 rounded-b-lg">
          <Editable
            placeholder="👷 Start by creating a table and play around..."
            className="focus:outline-none"
            onDragStart={() => {
              // mark onDragStart as handled if the selection is in a table
              if (TableCursor.isInTable(editor)) {
                return true;
              }
              return false;
            }}
            onKeyDown={(event) => {
              if (TableCursor.isInTable(editor)) {
                switch (true) {
                  case HOTKEYS.ARROW_DOWN(event) &&
                    TableCursor.isOnEdge(editor, "bottom"):
                    event.preventDefault();
                    return TableCursor.downward(editor);
                  case HOTKEYS.ARROW_UP(event) &&
                    TableCursor.isOnEdge(editor, "top"):
                    event.preventDefault();
                    return TableCursor.upward(editor);
                  case HOTKEYS.ARROW_RIGHT(event) &&
                    TableCursor.isOnEdge(editor, "end"):
                    event.preventDefault();
                    return TableCursor.forward(editor);
                  case HOTKEYS.ARROW_LEFT(event) &&
                    TableCursor.isOnEdge(editor, "start"):
                    event.preventDefault();
                    return TableCursor.backward(editor);
                  case HOTKEYS.TAB(event):
                    if (TableCursor.isInLastCell(editor)) {
                      TableEditor.insertRow(editor);
                    }
                    event.preventDefault();
                    return TableCursor.forward(editor, { mode: "all" });
                  case HOTKEYS.SHIFT_TAB(event):
                    event.preventDefault();
                    return TableCursor.backward(editor, { mode: "all" });
                }
              }

              // Formatting
         
            }}
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            spellCheck={false}
          />
        </div>
      </Slate>
    </section>
  );
};

type CustomElement =
  | Table
  | TableHead
  | TableBody
  | TableFooter
  | Tr
  | Th
  | Td
  | Paragraph;

interface Table {
  type: "table";
  children: Array<TableHead | TableBody | TableFooter>;
}

const Table: FC<RenderElementProps & { className: string }> = ({
  attributes,
  children,
  className,
}) => {
  const editor = useSlateStatic();

  return (
    <table
      {...attributes}
    >
      {children}
    </table>
  );
};

interface TableHead {
  type: "table-head";
  children: Tr[];
}

interface TableBody {
  type: "table-body";
  children: Tr[];
}

interface TableFooter {
  type: "table-footer";
  children: Tr[];
}

interface Tr {
  type: "table-row";
  children: Array<Td | Th>;
}

interface Th {
  type: "header-cell";
  rowSpan?: number;
  colSpan?: number;
  children: Array<CustomElement | Text>;
}

const Th: FC<RenderElementProps & { className: string }> = ({
  attributes,
  children,
  className,
  element,
}) => {
  if (element.type !== "header-cell") {
    throw new Error('Element "Th" must be of type "header-cell"');
  }

  useSlateSelection();
  const editor = useSlateStatic();
  const selected = TableCursor.isSelected(editor, element);

  return (
    <th
      className={`${selected ? "bg-sky-200" : ""} ${className}`}
      rowSpan={element.rowSpan}
      colSpan={element.colSpan}
      {...attributes}
    >
      {children}
    </th>
  );
};

interface Td {
  type: "table-cell";
  rowSpan?: number;
  colSpan?: number;
  children: Array<CustomElement | Text>;
}

const Td: FC<RenderElementProps & { className: string }> = ({
  attributes,
  children,
  className,
  element,
}) => {
  if (element.type !== "table-cell") {
    throw new Error('Element "Td" must be of type "table-cell"');
  }

  useSlateSelection();
  const editor = useSlateStatic();
  const selected = TableCursor.isSelected(editor, element);

  return (
    <td
      className={`${selected ? "bg-sky-200" : ""} ${className}`}
      rowSpan={element.rowSpan}
      colSpan={element.colSpan}
      {...attributes}
    >
      {children}
    </td>
  );
};

interface Paragraph {
  type: "paragraph";
  children: Array<CustomElement | Text>;
}

interface Text {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

const Text: FC<RenderLeafProps> = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};